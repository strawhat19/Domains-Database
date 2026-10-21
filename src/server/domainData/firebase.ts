import { firebaseConfig } from '../../shared/firebase/config';
import { DomainDataError, readDomainDataText } from './request';

export interface DomainReadContext { token?: string; signal: AbortSignal }
export interface DomainDocument { id: string; data: Record<string, unknown> }
const root = `projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const malformed = () => new DomainDataError(502, `Saved Domain Data Could Not Be Read`);
const recordValue = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw malformed();
  return value as Record<string, unknown>;
};
const decodeValue = (value: unknown, depth = 0): unknown => {
  if (depth > 24) throw malformed();
  const field = recordValue(value);
  if (Object.keys(field).length !== 1) throw malformed();
  if (field.nullValue === null || field.nullValue === `NULL_VALUE`) return null;
  if (typeof field.stringValue === `string`) return field.stringValue;
  if (typeof field.booleanValue === `boolean`) return field.booleanValue;
  if (typeof field.timestampValue === `string` && Number.isFinite(Date.parse(field.timestampValue))) return field.timestampValue;
  if (typeof field.integerValue === `string` && /^-?\d+$/.test(field.integerValue)) {
    const number = Number(field.integerValue);
    if (Number.isSafeInteger(number)) return number;
    return field.integerValue;
  }
  if (typeof field.doubleValue === `number` && Number.isFinite(field.doubleValue)) return field.doubleValue;
  if (field.mapValue) return decodeFields(recordValue(field.mapValue).fields ?? {}, depth + 1);
  if (field.arrayValue) {
    const values = recordValue(field.arrayValue).values ?? [];
    if (!Array.isArray(values)) throw malformed();
    return values.map(item => decodeValue(item, depth + 1));
  }
  if (typeof field.referenceValue === `string`) return field.referenceValue;
  if (field.geoPointValue) {
    const point = recordValue(field.geoPointValue);
    if (typeof point.latitude === `number` && typeof point.longitude === `number` && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) return { latitude: point.latitude, longitude: point.longitude };
  }
  throw malformed();
};
const decodeFields = (value: unknown, depth = 0): Record<string, unknown> => Object.fromEntries(Object.entries(recordValue(value)).map(([key, field]) => [key, decodeValue(field, depth + 1)]));
const decodeDocument = (value: unknown, parent: string): DomainDocument => {
  const document = recordValue(value);
  if (typeof document.name !== `string` || !document.name.startsWith(`${parent}/`)) throw malformed();
  const id = document.name.slice(parent.length + 1);
  if (!id || id.includes(`/`)) throw malformed();
  return { id, data: decodeFields(document.fields ?? {}) };
};
const requestFirestore = async (segments: string[], context: DomainReadContext, body?: unknown): Promise<unknown | null> => {
  const path = segments.map(encodeURIComponent).join(`/`);
  const url = new URL(`https://firestore.googleapis.com/v1/${root}/${path}${body === undefined ? `` : `:runQuery`}`);
  url.searchParams.set(`key`, firebaseConfig.apiKey);
  const response = await fetch(url, {
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    signal: context.signal,
    method: body === undefined ? `GET` : `POST`,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { Accept: `application/json`, ...(body === undefined ? {} : { 'Content-Type': `application/json` }), ...(context.token ? { Authorization: `Bearer ${context.token}` } : {}) },
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    if (response.status === 404 && body === undefined) return null;
    if (response.status === 401) throw new DomainDataError(401, `Sign In Again To Fetch Domain Data`);
    if (response.status === 403) throw new DomainDataError(403, `Domain Data Access Was Denied — Check Sharing And Published Firestore Rules`);
    if (response.status === 429) throw new DomainDataError(429, `Domain Data Quota Reached — Try Again Later`);
    throw new DomainDataError(503, `Domain Data Is Temporarily Unavailable`);
  }
  try { return JSON.parse(await readDomainDataText(response, context.signal)); }
  catch (failure) { if (failure instanceof DomainDataError) throw failure; throw malformed(); }
};
export const readDomainDocument = async (segments: string[], context: DomainReadContext): Promise<DomainDocument | null> => {
  const document = await requestFirestore(segments, context);
  if (document === null) return null;
  const decoded = decodeDocument(document, `${root}/${segments.slice(0, -1).join(`/`)}`);
  if (decoded.id !== segments.at(-1)) throw malformed();
  return decoded;
};
const compareIds = (left: string, right: string) => {
  const encoder = new TextEncoder();
  const first = encoder.encode(left);
  const second = encoder.encode(right);
  for (let index = 0; index < Math.min(first.length, second.length); index += 1) if (first[index] !== second[index]) return first[index] - second[index];
  return first.length - second.length;
};
export const readDomainPage = async (parent: string[], collectionId: string, limit: number, cursor: string | undefined, context: DomainReadContext): Promise<DomainDocument[]> => {
  const collection = `${root}/${[...parent, collectionId].join(`/`)}`;
  const value = await requestFirestore(parent, context, { structuredQuery: {
    limit,
    from: [{ collectionId }],
    orderBy: [{ field: { fieldPath: `__name__` }, direction: `ASCENDING` }],
    ...(cursor ? { startAt: { before: false, values: [{ referenceValue: `${collection}/${cursor}` }] } } : {}),
  } });
  if (!Array.isArray(value) || value.length > limit + 1) throw malformed();
  const records = value.flatMap(item => {
    const record = recordValue(item);
    return record.document === undefined ? [] : [decodeDocument(record.document, collection)];
  });
  if (records.length > limit || new Set(records.map(record => record.id)).size !== records.length
    || records.some((record, index) => index > 0 && compareIds(records[index - 1].id, record.id) >= 0 || cursor && compareIds(record.id, cursor) <= 0)) throw malformed();
  return records;
};
