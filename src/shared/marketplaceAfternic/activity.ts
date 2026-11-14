export const afternicActivityRanges = [30, 90, 365] as const;
export type AfternicActivityRange = typeof afternicActivityRanges[number];

export interface AfternicAccountStats {
  startDate: string;
  through: string;
  checkedAt: string;
  days: { date: string; leads: number | null; views: number | null }[];
}

export type AfternicDomainStats = AfternicAccountStats & { domain: string };

export interface AfternicSale {
  id: string;
  domain: string;
  soldAt: string | null;
  status: string | null;
  saleType: string | null;
  disbursedAt: string | null;
  salePriceCents: number | null;
  commissionCents: number | null;
  saleTotalCents: number | null;
  nextInstallmentDate: string | null;
  prevInstallmentDate: string | null;
  totalInstallments: number | null;
  installmentsPaid: number | null;
  installmentAmountCents: number | null;
  cancelReason: string | null;
}

export interface AfternicSalesPage {
  sales: AfternicSale[];
  skipped: number;
  through: string;
  checkedAt: string;
  total: number | null;
  domain: string | null;
  nextOffset: number | null;
}
