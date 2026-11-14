type PaidRenewal = { amount: number; currency: string; years: number; paidAt: string; expiresAt?: string };

const isDate = (value: unknown): value is string => typeof value === `string` && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const readPaidRenewal = (value: unknown): PaidRenewal | undefined => {
  if (!value || typeof value !== `object` || Array.isArray(value)) return undefined;
  const { amount, currency, years, paidAt, expiresAt } = value as Partial<PaidRenewal>;
  if (typeof amount !== `number` || !Number.isFinite(amount) || amount < 0 || amount > 10_000_000
    || typeof currency !== `string` || !/^[A-Z]{3}$/.test(currency) || typeof years !== `number` || !Number.isInteger(years) || years < 1 || years > 100
    || !isDate(paidAt) || (expiresAt !== undefined && (!isDate(expiresAt) || expiresAt < paidAt))) return undefined;
  return { amount, currency, years, paidAt, ...(expiresAt ? { expiresAt } : {}) };
};
