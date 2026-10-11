export const accountDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: `numeric`, month: `short`, year: `numeric` }) : `—`;
};

export const renewalCost = (value: number, currency = `USD`) => {
  try { return new Intl.NumberFormat(undefined, { currency, style: `currency` }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
};
