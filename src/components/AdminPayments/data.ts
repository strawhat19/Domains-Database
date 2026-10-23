import type { PaymentSeries } from './types';
import type { PaymentReport } from '../../shared/payments/types';

export const periods = [7, 30, 90] as const;
export const invoiceSeries: PaymentSeries[] = [{ key: `paidInvoiceAmountCents`, label: `Paid Invoice Amount · USD`, tone: `accent` }];
export const subscriptionSeries: PaymentSeries[] = [{ key: `newSubscriptions`, label: `New Subscriptions`, tone: `accent` }, { key: `endedSubscriptions`, label: `Ended Subscriptions`, tone: `warning` }];
export const count = (value: number | null | undefined) => value == null ? `—` : new Intl.NumberFormat().format(value);
export const money = (value: number | null | undefined) => value == null ? `—` : new Intl.NumberFormat(undefined, { style: `currency`, currency: `USD` }).format(value / 100);
export const dayLabel = (value: string, long = false) => new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: `UTC`, month: `short`, day: `numeric`, ...(long ? { year: `numeric` } : {}) });
export const timeLabel = (value: string) => `${new Date(value).toLocaleString(undefined, { timeZone: `UTC`, month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` })} UTC`;
export const statusLabel = (value: string) => value.split(`_`).map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join(` `);
export const metricValue = (key: string, value: number | null | undefined) => key === `paidInvoiceAmountCents` ? money(value) : count(value);
export const metricReading = (point: PaymentReport[`trend`][number] | undefined, series: PaymentSeries[]) => point ? series.map(item => `${item.label}: ${point[item.key] === null ? `Unavailable` : metricValue(item.key, point[item.key])}`).join(` · `) : `No Measurements`;
export const periodStats = (report: PaymentReport) => [
  { id: `invoice-amount`, label: `Paid Invoice Amount · USD`, value: money(report.summary.paidInvoiceAmountCents) },
  { id: `invoice-count`, label: `Paid Invoices`, value: count(report.summary.paidInvoiceCount) },
  { id: `new-subscriptions`, label: `New Subscriptions`, value: count(report.summary.newSubscriptions) },
  { id: `ended-subscriptions`, label: `Ended Subscriptions`, value: count(report.summary.endedSubscriptions) },
];
export const snapshotStats = (report: PaymentReport) => [
  { id: `active`, label: `Active`, value: count(report.summary.activeSubscriptions) },
  { id: `trialing`, label: `Trialing`, value: count(report.summary.trialingSubscriptions) },
  { id: `past-due`, label: `Past Due`, value: count(report.summary.pastDueSubscriptions) },
  { id: `scheduled-cancel`, label: `Scheduled Cancellation`, value: count(report.summary.scheduledCancellations) },
  { id: `plan-value`, label: `Monthly Base Plan Value · USD`, value: money(report.summary.monthlyPlanValueCents) },
];
export const trendGeometry = (points: PaymentReport[`trend`], series: PaymentSeries[], width: number, height: number) => {
  const plot = { left: Math.min(72, width * .22), right: Math.max(73, width - 16), top: 18, bottom: height - 30 };
  const values = points.flatMap(point => series.flatMap(item => point[item.key] === null ? [] : [point[item.key] as number]));
  const maximum = Math.max(2, ...values);
  const ceiling = Math.ceil(maximum / 2) * 2;
  const x = (index: number) => points.length > 1 ? plot.left + index / (points.length - 1) * (plot.right - plot.left) : (plot.left + plot.right) / 2;
  const y = (value: number) => plot.bottom - value / ceiling * (plot.bottom - plot.top);
  const lines = series.map(item => {
    let drawing = false;
    const coordinates = points.map((point, index) => ({ x: x(index), y: point[item.key] === null ? null : y(point[item.key] as number) }));
    const path = coordinates.map(point => {
      if (point.y === null) { drawing = false; return ``; }
      const command = `${drawing ? `L` : `M`}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      drawing = true;
      return command;
    }).filter(Boolean).join(` `);
    return { ...item, path, coordinates };
  });
  return { x, y, plot, lines, ceiling, measured: values.length > 0 };
};
