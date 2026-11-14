import { afternicStatusLabel } from '../../shared/marketplaceAfternic/display';
import type { AfternicSale, AfternicAccountStats, AfternicSalesPage } from '../../shared/marketplaceAfternic/activity';

const integer = new Intl.NumberFormat(`en-US`);
const usd = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD` });
const utc = new Intl.DateTimeFormat(undefined, { month: `short`, day: `numeric`, year: `numeric`, timeZone: `UTC` });
const local = new Intl.DateTimeFormat(undefined, { month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` });
const date = (value: string) => utc.format(new Date(value));
export const activityCheckedAt = (value: string) => `Checked ${local.format(new Date(value))}`;

export const activitySalesCoverage = (sales: AfternicSalesPage) => {
  const matched = `${integer.format(sales.sales.length)} ${sales.domain ? `Exact Match(es) Shown For ${sales.domain}` : `Sale(s) Shown`}`;
  if (!sales.domain && sales.total !== null) return `${matched} Of ${integer.format(sales.total)}`;
  if (sales.domain && sales.nextOffset !== null) return `${matched} · More Afternic Results Available`;
  return sales.domain ? `${matched} · End Of Afternic Results For This Range` : matched;
};

export const activityStatsPresentation = (stats: AfternicAccountStats) => {
  const totals = stats.days.reduce((total, day) => ({
    leads: total.leads + (day.leads ?? 0), views: total.views + (day.views ?? 0),
    leadDays: total.leadDays + Number(day.leads !== null), viewDays: total.viewDays + Number(day.views !== null),
  }), { leads: 0, views: 0, leadDays: 0, viewDays: 0 });
  const rows = stats.days.map(row => ({ ...row, label: date(row.date), viewsLabel: row.views === null ? `—` : integer.format(row.views), leadsLabel: row.leads === null ? `—` : integer.format(row.leads) }));
  return {
    rows,
    range: `${date(stats.startDate)}–${date(stats.through)} UTC`,
    views: totals.viewDays ? `${integer.format(totals.views)} Reported Views` : `Views Unavailable`,
    leads: totals.leadDays ? `${integer.format(totals.leads)} Reported Leads` : `Leads Unavailable`,
    reported: `${rows.length} Day(s) Reported`,
  };
};

export const activitySaleDetails = (sale: AfternicSale) => {
  const { status, saleType, soldAt, salePriceCents, saleTotalCents, commissionCents, disbursedAt, cancelReason } = sale;
  const { totalInstallments, installmentsPaid, installmentAmountCents, nextInstallmentDate, prevInstallmentDate } = sale;
  return [
    { id: `type`, label: saleType === `BUYNOW` ? `Buy Now` : saleType === `LEASED` ? `Lease To Own` : saleType ? afternicStatusLabel(saleType) : `` },
    { id: `status`, label: status ? afternicStatusLabel(status) : `` },
    { id: `date`, label: soldAt ? `Sold ${date(soldAt)}` : `` },
    { id: `price`, label: salePriceCents === null ? `` : `Sale Price ${usd.format(salePriceCents / 100)}` },
    { id: `commission`, label: commissionCents === null ? `` : `Commission ${usd.format(commissionCents / 100)}` },
    { id: `total`, label: saleTotalCents === null ? `` : `Sale Total With Tax ${usd.format(saleTotalCents / 100)}` },
    { id: `payout`, label: disbursedAt ? `Disbursed ${date(disbursedAt)}` : `` },
    { id: `cancel`, label: cancelReason ? `Cancellation · ${afternicStatusLabel(cancelReason)}` : `` },
    { id: `paid`, label: installmentsPaid !== null && totalInstallments !== null ? `${installmentsPaid}/${totalInstallments} Installments Paid` : `` },
    { id: `installment`, label: installmentAmountCents === null ? `` : `Installment ${usd.format(installmentAmountCents / 100)}` },
    { id: `next`, label: nextInstallmentDate ? `Next Installment ${date(nextInstallmentDate)}` : `` },
    { id: `previous`, label: prevInstallmentDate ? `Previous Installment ${date(prevInstallmentDate)}` : `` },
  ].filter(detail => !!detail.label);
};
