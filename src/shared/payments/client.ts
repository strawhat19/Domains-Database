import { Platform } from 'react-native';
import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/client';
import { canViewPayments } from '../admin/permissions';
import { restoreSession } from '../authentication/service';
import type { PaymentReport, PaymentReportDays } from './types';

export type PaymentActor = { userId: string; firebaseUid: string };
export class PaymentRequestError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
const invalid = () => new PaymentRequestError(`payments_invalid_response`, `Payments Returned An Unexpected Response — Try Again`);
const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const isMetric = (value: unknown): value is number | null => value === null || isCount(value);
const isTime = (value: unknown): value is string => typeof value === `string` && value.length <= 40 && Number.isFinite(Date.parse(value));
const isText = (value: unknown, limit = 1000): value is string => typeof value === `string` && value.length <= limit;
const statuses = [`active`, `paused`, `unpaid`, `trialing`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`];
const readReport = (value: unknown, days: PaymentReportDays): PaymentReport => {
  const report = value as PaymentReport | null;
  if (!report || report.source !== `stripe` || report.mode !== `live` || report.currency !== `usd`
    || report.dataset !== `starter_subscriptions` || report.unitAmountCents !== 133
    || ![`available`, `partial`, `unavailable`].includes(report.availability)
    || !isTime(report.fetchedAt) || !isTime(report.subscriptionSnapshotAt)
    || report.range?.days !== days || report.range.timeZone !== `UTC` || report.range.includesPartialCurrentDay !== true
    || !isTime(report.range.start) || !isTime(report.range.end) || Date.parse(report.range.start) >= Date.parse(report.range.end)
    || !isCount(report.cache?.ageSeconds) || !isCount(report.cache?.ttlSeconds)
    || !Array.isArray(report.warnings) || report.warnings.length > 30 || report.warnings.some(item => !isText(item))
    || !report.summary || ![`newSubscriptions`, `paidInvoiceCount`, `endedSubscriptions`, `activeSubscriptions`, `pastDueSubscriptions`, `trialingSubscriptions`, `scheduledCancellations`, `monthlyPlanValueCents`, `paidInvoiceAmountCents`].every(key => isMetric(report.summary[key as keyof PaymentReport[`summary`]]))
    || !Array.isArray(report.trend) || report.trend.length > days
    || report.trend.some(point => !point || !/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !isTime(point.date)
      || !isMetric(point.paidInvoices) || !isMetric(point.newSubscriptions) || !isMetric(point.endedSubscriptions) || !isMetric(point.paidInvoiceAmountCents))
    || new Set(report.trend.map(point => point.date)).size !== report.trend.length
    || !Array.isArray(report.statuses) || report.statuses.length !== statuses.length
    || report.statuses.some(item => !item || !statuses.includes(item.status) || !isMetric(item.count))
    || new Set(report.statuses.map(item => item.status)).size !== statuses.length
    || ![`accounts`, `invoices`, `lifecycle`, `subscriptions`].every(key => {
      const coverage = report.coverage?.[key as keyof PaymentReport[`coverage`]];
      return coverage && [`complete`, `partial`, `unavailable`].includes(coverage.state) && isCount(coverage.scanned) && isCount(coverage.limit);
    }) || !isText(report.definitions?.paidInvoiceAmount) || !isText(report.definitions?.subscriptionSnapshot) || !isText(report.definitions?.monthlyPlanValue)) throw invalid();
  return {
    mode: report.mode, source: report.source, currency: report.currency, dataset: report.dataset,
    fetchedAt: report.fetchedAt, unitAmountCents: report.unitAmountCents, availability: report.availability,
    subscriptionSnapshotAt: report.subscriptionSnapshotAt, warnings: [...report.warnings],
    cache: { ageSeconds: report.cache.ageSeconds, ttlSeconds: report.cache.ttlSeconds },
    range: { end: report.range.end, start: report.range.start, days: report.range.days, timeZone: `UTC`, includesPartialCurrentDay: true },
    summary: {
      newSubscriptions: report.summary.newSubscriptions, paidInvoiceCount: report.summary.paidInvoiceCount,
      endedSubscriptions: report.summary.endedSubscriptions, activeSubscriptions: report.summary.activeSubscriptions,
      pastDueSubscriptions: report.summary.pastDueSubscriptions, trialingSubscriptions: report.summary.trialingSubscriptions,
      scheduledCancellations: report.summary.scheduledCancellations, monthlyPlanValueCents: report.summary.monthlyPlanValueCents,
      paidInvoiceAmountCents: report.summary.paidInvoiceAmountCents,
    },
    trend: report.trend.map(point => ({ date: point.date, paidInvoices: point.paidInvoices, newSubscriptions: point.newSubscriptions, endedSubscriptions: point.endedSubscriptions, paidInvoiceAmountCents: point.paidInvoiceAmountCents })),
    statuses: report.statuses.map(item => ({ count: item.count, status: item.status })),
    coverage: Object.fromEntries(Object.entries(report.coverage).filter(([key]) => [`accounts`, `invoices`, `lifecycle`, `subscriptions`].includes(key)).map(([key, item]) => [key, { state: item.state, scanned: item.scanned, limit: item.limit }])) as PaymentReport[`coverage`],
    definitions: { paidInvoiceAmount: report.definitions.paidInvoiceAmount, subscriptionSnapshot: report.definitions.subscriptionSnapshot, monthlyPlanValue: report.definitions.monthlyPlanValue },
  };
};
export const getPaymentReport = async (actor: PaymentActor, days: PaymentReportDays, signal?: AbortSignal): Promise<PaymentReport> => {
  if (useLocalStorage || !firebaseEnabled) throw new PaymentRequestError(`payments_disconnected`, `Connect Firebase To View Payment Reports`);
  if (![7, 30, 90].includes(days)) throw invalid();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  const timer = setTimeout(abort, 30_000);
  let rejectAbort: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(new PaymentRequestError(signal?.aborted ? `payments_cancelled` : `payments_timeout`, signal?.aborted ? `Payment Request Cancelled` : `Payment Report Took Too Long — Try Again`));
    controller.signal.addEventListener(`abort`, rejectAbort, { once: true });
  });
  const ensureActor = () => {
    const user = getFirebaseAuth().currentUser;
    if (!actor.userId || !actor.firebaseUid || !user || user.isAnonymous || user.uid !== actor.firebaseUid) throw new PaymentRequestError(`payments_session_changed`, `Your Account Changed — Sign In Again`);
    if (controller.signal.aborted) throw new PaymentRequestError(`payments_cancelled`, `Payment Request Cancelled`);
    return user;
  };
  try {
    if (signal?.aborted) abort();
    return await Promise.race([interrupted, (async () => {
      const user = ensureActor();
      const account = (await restoreSession())?.user;
      ensureActor();
      if (!canViewPayments(account) || account?.anonymous || account?.id !== actor.userId || account?.firebase_uid !== actor.firebaseUid) throw new PaymentRequestError(`payments_forbidden`, `Payment Reports Require An Active Owner Account`);
      const token = await user.getIdToken();
      ensureActor();
      const base = Platform.OS === `web` ? `` : `https://domaindatabases.com`;
      const response = await fetch(`${base}/api/admin/payments?days=${days}`, { signal: controller.signal, cache: `no-store`, method: `GET`, credentials: `omit`, headers: { Accept: `application/json`, Authorization: `Bearer ${token}` } });
      const result: unknown = await response.json().catch(() => null);
      ensureActor();
      if (!response.ok) {
        if (response.status === 401) throw new PaymentRequestError(`payments_unauthenticated`, `Sign In Again To View Payment Reports`);
        if (response.status === 403) throw new PaymentRequestError(`payments_forbidden`, `Payment Reports Require An Active Owner Account`);
        if (response.status === 503) throw new PaymentRequestError(`payments_unavailable`, `Payment Reporting Is Unavailable — Check The Server Connection And Try Again`);
        throw new PaymentRequestError(`payments_failed`, `Could Not Load Payment Reports — Try Again`);
      }
      return readReport(result, days);
    })()]);
  } catch (failure) {
    if (failure instanceof PaymentRequestError) throw failure;
    throw new PaymentRequestError(`payments_unavailable`, `Could Not Reach Payment Reporting — Check Your Connection And Try Again`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener(`abort`, abort);
    if (rejectAbort) controller.signal.removeEventListener(`abort`, rejectAbort);
  }
};
