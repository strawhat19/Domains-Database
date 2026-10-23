import type { PaymentReport, PaymentReportDays } from '../../shared/payments/types';

const dayMilliseconds = 86_400_000;
export const createPaymentRange = (days: PaymentReportDays, now: number) => {
  const date = new Date(now);
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return { days, timeZone: `UTC` as const, end: date.toISOString(), includesPartialCurrentDay: true as const, start: new Date(midnight - (days - 1) * dayMilliseconds).toISOString() };
};
export const createPaymentTrend = (now: number): PaymentReport[`trend`] => {
  const start = Date.parse(createPaymentRange(90, now).start);
  return Array.from({ length: 90 }, (_, index) => ({ date: new Date(start + index * dayMilliseconds).toISOString().slice(0, 10), paidInvoices: 0, newSubscriptions: 0, endedSubscriptions: 0, paidInvoiceAmountCents: 0 }));
};
export const selectPaymentRange = (report: PaymentReport, days: PaymentReportDays): PaymentReport => {
  const trend = report.trend.slice(-days).map(point => ({ ...point }));
  const total = (key: keyof Omit<PaymentReport[`trend`][number], `date`>) => {
    if (trend.some(point => point[key] === null)) return null;
    const value = trend.reduce((sum, point) => sum + (point[key] ?? 0), 0);
    return Number.isSafeInteger(value) ? value : null;
  };
  return {
    ...report,
    trend,
    range: createPaymentRange(days, Date.parse(report.range.end)),
    cache: { ...report.cache, ageSeconds: Math.max(0, Math.floor((Date.now() - Date.parse(report.fetchedAt)) / 1000)) },
    summary: { ...report.summary, newSubscriptions: total(`newSubscriptions`), endedSubscriptions: total(`endedSubscriptions`), paidInvoiceCount: total(`paidInvoices`), paidInvoiceAmountCents: total(`paidInvoiceAmountCents`) },
  };
};
