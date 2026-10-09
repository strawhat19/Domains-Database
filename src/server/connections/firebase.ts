import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { firebaseConfig } from '../../shared/firebase/config';
import { getAppCollectionIDNumber } from '../../shared/common/ids';

export interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}
export interface FirestoreDocument {
  name: string;
  updateTime: string;
  fields: Record<string, FirestoreValue>;
}
type FirestorePrecondition = { exists: false } | { updateTime: string };
export type FirestoreWrite = {
  currentDocument: FirestorePrecondition;
} & ({ verify: string } | { update: { name: string; fields: Record<string, FirestoreValue> } });
export interface ImportFirebaseContext {
  token: string;
  signal: AbortSignal;
  readVersions: Map<string, FirestorePrecondition>;
}
const documentRoot = `projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const malformed = () => new RegistrarRelayError(409, `Saved Connections Could Not Be Read — Refresh And Try Again`);
const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw malformed();
  return value as Record<string, unknown>;
};

const requestFirebase = async (url: URL, context: ImportFirebaseContext, body?: unknown, missing = false): Promise<unknown> => {
  const response = await fetch(url, {
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    signal: context.signal,
    method: body === undefined ? `GET` : `POST`,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': `application/json`, Authorization: `Bearer ${context.token}` },
  });
  if (!response.ok) {
    let errorStatus = ``;
    if (response.status === 400) {
      const text = await readLimitedText(response.body, 128_000, context.signal,
        new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`));
      try { errorStatus = JSON.parse(text)?.error?.status ?? ``; } catch {}
    } else void response.body?.cancel().catch(() => undefined);
    if (missing && response.status === 404) return null;
    if (response.status === 401) throw new RegistrarRelayError(401, `Sign In Again To Import Connections`);
    if (response.status === 403) throw new RegistrarRelayError(403, `Firestore Access Denied — Check Your Account Permissions`);
    if ([409, 412].includes(response.status) || [`ABORTED`, `FAILED_PRECONDITION`].includes(errorStatus)) {
      throw new RegistrarRelayError(409, `Saved Connections Changed — Refresh And Try Again`);
    }
    throw new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`);
  }
  const text = await readLimitedText(response.body, 2_000_000, context.signal,
    new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`));
  try { return JSON.parse(text); }
  catch { throw new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`); }
};

const firestoreUrl = (suffix: string) => new URL(`https://firestore.googleapis.com/v1/${documentRoot}${suffix}`);
export const documentName = (segments: readonly string[]) => `${documentRoot}/${segments.join(`/`)}`;
export const readDocument = async (segments: readonly string[], context: ImportFirebaseContext): Promise<FirestoreDocument | null> => {
  const name = documentName(segments);
  const url = firestoreUrl(`/${segments.map(segment => encodeURIComponent(segment)).join(`/`)}`);
  const value = await requestFirebase(url, context, undefined, true);
  if (value === null) {
    context.readVersions.set(name, { exists: false });
    return null;
  }
  const record = asRecord(value);
  if (record.name !== name || typeof record.updateTime !== `string`) throw malformed();
  context.readVersions.set(name, { updateTime: record.updateTime });
  return { name: record.name, updateTime: record.updateTime, fields: asRecord(record.fields ?? {}) as Record<string, FirestoreValue> };
};
export const decodeField = (field: FirestoreValue | undefined): unknown => {
  if (!field || typeof field !== `object`) throw malformed();
  if (typeof field.stringValue === `string`) return field.stringValue;
  if (typeof field.booleanValue === `boolean`) return field.booleanValue;
  if (typeof field.integerValue === `string` && /^-?\d+$/.test(field.integerValue)) {
    const number = Number(field.integerValue);
    if (Number.isSafeInteger(number)) return number;
  }
  if (field.arrayValue) {
    const values = field.arrayValue.values ?? [];
    if (Array.isArray(values)) return values.map(decodeField);
  }
  if (field.mapValue) return Object.fromEntries(Object.entries(asRecord(field.mapValue.fields ?? {})).map(([key, value]) => [key, decodeField(value as FirestoreValue)]));
  throw malformed();
};
export const encodeField = (value: unknown): FirestoreValue => {
  if (typeof value === `string`) return { stringValue: value };
  if (typeof value === `boolean`) return { booleanValue: value };
  if (Number.isSafeInteger(value)) return { integerValue: String(value) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeField) } };
  return { mapValue: { fields: encodeFields(asRecord(value)) } };
};
export const encodeFields = (record: Record<string, unknown>): Record<string, FirestoreValue> => Object.fromEntries(
  Object.entries(record).map(([key, value]) => [key, encodeField(value)]),
);

export const verifyFirebaseToken = async (context: ImportFirebaseContext): Promise<string> => {
  const url = new URL(`https://identitytoolkit.googleapis.com/v1/accounts:lookup`);
  url.searchParams.set(`key`, firebaseConfig.apiKey);
  const response = await fetch(url, {
    method: `POST`,
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    signal: context.signal,
    body: JSON.stringify({ idToken: context.token }),
    headers: { 'Content-Type': `application/json` },
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    throw new RegistrarRelayError(response.status >= 500 || response.status === 429 ? 503 : 401,
      response.status >= 500 || response.status === 429 ? `Connection Import Is Temporarily Unavailable` : `Sign In Again To Import Connections`);
  }
  const text = await readLimitedText(response.body, 128_000, context.signal,
    new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`));
  let result: { users?: { localId?: string; disabled?: boolean }[] };
  try { result = JSON.parse(text); }
  catch { throw new RegistrarRelayError(503, `Connection Import Is Temporarily Unavailable`); }
  const actor = result?.users?.[0];
  if (result?.users?.length !== 1 || actor?.disabled || typeof actor?.localId !== `string`
    || !actor.localId || actor.localId.length > 128 || actor.localId.includes(`/`)) throw new RegistrarRelayError(401, `Sign In Again To Import Connections`);
  return actor.localId;
};
export const requireSignedInUser = async (firebaseUid: string, context: ImportFirebaseContext): Promise<string> => {
  const identity = await readDocument([`identities`, firebaseUid], context);
  if (!identity) throw new RegistrarRelayError(403, `Your Account Setup Is Incomplete — Sign In Again`);
  const userId = decodeField(identity.fields.id);
  const number = decodeField(identity.fields.number);
  if (typeof userId !== `string` || userId.includes(`/`) || typeof number !== `number` || number < 1 || getAppCollectionIDNumber(userId, `User`) !== number
    || decodeField(identity.fields.firebase_uid) !== firebaseUid) throw new RegistrarRelayError(403, `Your Account Identity Could Not Be Verified — Sign In Again`);
  const profile = await readDocument([`users`, userId], context);
  if (!profile) throw new RegistrarRelayError(403, `Your Account Profile Could Not Be Found — Sign In Again`);
  if (decodeField(profile.fields.id) !== userId || decodeField(profile.fields.number) !== number
    || decodeField(profile.fields.firebase_uid) !== firebaseUid) {
    throw new RegistrarRelayError(403, `Your Account Identity Could Not Be Verified — Sign In Again`);
  }
  if (decodeField(profile.fields.active) !== true) throw new RegistrarRelayError(403, `This Account Is Deactivated — Contact Support`);
  return userId;
};
export const commitDocuments = (context: ImportFirebaseContext, writes: FirestoreWrite[]) => {
  const written = new Set(writes.map(write => `update` in write ? write.update.name : write.verify));
  const assertions: FirestoreWrite[] = [...context.readVersions].filter(([name]) => !written.has(name)).map(([verify, currentDocument]) => ({ verify, currentDocument }));
  return requestFirebase(firestoreUrl(`:commit`), context, { writes: [...writes, ...assertions] });
};
