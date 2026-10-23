import type { PaymentReport } from '../../shared/payments/types';

export type AdminPaymentsProps = { compact?: boolean; headingActionsTarget?: HTMLElement | null };
export type PaymentMetric = `paidInvoiceAmountCents` | `newSubscriptions` | `endedSubscriptions`;
export type PaymentSeries = { key: PaymentMetric; label: string; tone: `accent` | `warning` };
export type PaymentTrendProps = { id: string; points: PaymentReport[`trend`]; series: PaymentSeries[] };
