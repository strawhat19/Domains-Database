export type PaymentReportDays = 7 | 30 | 90;
export type PaymentCoverageState = `complete` | `partial` | `unavailable`;
export type PaymentSubscriptionStatus = `active` | `paused` | `unpaid` | `trialing` | `past_due` | `canceled` | `incomplete` | `incomplete_expired`;

export interface PaymentCoverage {
  limit: number;
  scanned: number;
  state: PaymentCoverageState;
}

export interface PaymentReport {
  mode: `live`;
  source: `stripe`;
  currency: `usd`;
  fetchedAt: string;
  unitAmountCents: 133;
  warnings: string[];
  dataset: `starter_subscriptions`;
  subscriptionSnapshotAt: string;
  cache: { ageSeconds: number; ttlSeconds: number };
  availability: `available` | `partial` | `unavailable`;
  range: {
    end: string;
    start: string;
    timeZone: `UTC`;
    days: PaymentReportDays;
    includesPartialCurrentDay: true;
  };
  summary: {
    newSubscriptions: number | null;
    paidInvoiceCount: number | null;
    endedSubscriptions: number | null;
    activeSubscriptions: number | null;
    pastDueSubscriptions: number | null;
    trialingSubscriptions: number | null;
    scheduledCancellations: number | null;
    monthlyPlanValueCents: number | null;
    paidInvoiceAmountCents: number | null;
  };
  trend: {
    date: string;
    paidInvoices: number | null;
    newSubscriptions: number | null;
    endedSubscriptions: number | null;
    paidInvoiceAmountCents: number | null;
  }[];
  statuses: { count: number | null; status: PaymentSubscriptionStatus }[];
  coverage: {
    accounts: PaymentCoverage;
    invoices: PaymentCoverage;
    lifecycle: PaymentCoverage;
    subscriptions: PaymentCoverage;
  };
  definitions: {
    paidInvoiceAmount: string;
    monthlyPlanValue: string;
    subscriptionSnapshot: string;
  };
}
