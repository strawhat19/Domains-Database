import { localDomainAnalytics } from './values';
import { getImportedDomainAnalytics } from './inventory';
import type { DomainAnalyticsSnapshot } from './types';

const cancelled = () => new Error(`Domain Analytics Cancelled`);
const textValue = (value: unknown, maximum = 1200) => typeof value === `string`
  && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value) ? value : undefined;
const dateValue = (value: unknown) => {
  const text = textValue(value, 64);
  return text && /^\d{4}-\d{2}-\d{2}T/.test(text) && Number.isFinite(Date.parse(text)) ? text : undefined;
};

export const getDomainAnalytics = async (domain: string, signal: AbortSignal): Promise<DomainAnalyticsSnapshot> => {
  if (signal.aborted) throw cancelled();
  const snapshot = localDomainAnalytics(domain);
  const inventory = getImportedDomainAnalytics(snapshot.domain).catch(() => undefined);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 25_000);
  try {
    const response = await fetch(`/api/domain-analytics`, {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify({ domain: snapshot.domain }),
    });
    const result = await response.json().catch(() => null);
    if (signal.aborted) throw cancelled();
    if (!response.ok) throw new Error(textValue(result?.error) ?? `Public Domain Data Is Unavailable`);
    const registration = result?.registration;
    const dns = result?.dns;
    if (result?.domain !== snapshot.domain || !dateValue(result?.checkedAt)
      || ![`registered`, `unregistered`, `unknown`].includes(registration?.status)
      || !Array.isArray(dns?.records) || dns.records.length > 200
      || !dns.records.every((record: unknown) => record && typeof record === `object`
        && `type` in record && typeof record.type === `string` && /^[A-Z0-9]{1,12}$/.test(record.type)
        && `value` in record && textValue(record.value) !== undefined)) {
      throw new Error(`Public Domain Data Returned An Invalid Result`);
    }
    return {
      ...snapshot,
      inventory: await inventory,
      checkedAt: result.checkedAt,
      registration: {
        status: registration.status,
        error: textValue(registration.error),
        registrar: textValue(registration.registrar, 200),
        createdAt: dateValue(registration.createdAt),
        expiresAt: dateValue(registration.expiresAt),
      },
      dns: { records: dns.records, error: textValue(dns.error) },
    };
  } catch (failure) {
    if (signal.aborted) throw cancelled();
    const message = controller.signal.aborted ? `Public Domain Data Timed Out — Try Again`
      : failure instanceof Error && !(failure instanceof TypeError) ? failure.message
        : `Public Domain Data Needs The API Server — Name Analysis Is Available`;
    return {
      ...snapshot,
      inventory: await inventory,
      errors: [message],
      dns: { records: [], error: message },
      registration: { status: `unknown`, error: message },
    };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
