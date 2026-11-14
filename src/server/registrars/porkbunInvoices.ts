import { invalidResponse } from './errors';
import type { RegistrarDomain } from '../../shared/registrarSync/types';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import { asRecord, parseJson, providerDate, providerId, providerName, providerInteger } from './validation';

const PAGE_SIZE = 50;
const PAGE_LIMIT = 2;
const DETAIL_LIMIT = 20;
const INVOICE_TIME_LIMIT = 12_000;
const PORKBUN_ACCOUNT = `https://api.porkbun.com/api/json/v3/account`;

type PaidRenewal = { amount: number; currency: string; paidAt: string; years: number; expiresAt?: string };

const invoiceDate = (value: unknown) => {
  if (typeof value !== `string` || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalidResponse(`porkbun`);
  const date = providerDate(value, `porkbun`, true);
  if (!date) throw invalidResponse(`porkbun`);
  return date;
};

const readPaidRenewals = (value: unknown, id: string, date: string, owned: ReadonlyMap<string, RegistrarDomain>) => {
  const invoice = asRecord(value, `porkbun`);
  if (providerId(invoice.id, `porkbun`) !== id || invoiceDate(invoice.date) !== date) throw invalidResponse(`porkbun`);
  const { currency } = invoice;
  if (invoice.state !== `PAID` || invoice.refunded_cents !== 0 || typeof currency !== `string` || !/^[A-Z]{3}$/.test(currency)) return;
  const total = providerInteger(invoice.total_cents, `porkbun`);
  if (total === 0 || total !== invoice.gross_cents || !Array.isArray(invoice.items)) return;
  const renewals = new Map<string, PaidRenewal | undefined>();
  let lineTotal = 0;
  for (const value of invoice.items) {
    const item = asRecord(value, `porkbun`);
    if (item.status !== `SUCCESS` || item.discount_cents !== 0) return;
    const cents = providerInteger(item.price_cents, `porkbun`);
    lineTotal += cents;
    if (lineTotal > total) return;
    if (item.product !== `Domain Renewal`) continue;
    const name = providerName(item.domain, `porkbun`);
    if (!owned.has(name)) continue;
    const years = providerInteger(item.years, `porkbun`);
    if (!cents || !years || years > 100 || renewals.has(name)) { renewals.set(name, undefined); continue; }
    renewals.set(name, {
      years,
      currency,
      paidAt: date,
      amount: cents / 100,
      ...(item.expires != null ? { expiresAt: invoiceDate(item.expires) } : {}),
    });
  }
  return lineTotal === total ? renewals : undefined;
};

export const enrichPorkbunPaidRenewals = async (domains: readonly RegistrarDomain[], headers: Record<string, string>, context: RegistrarRequestContext, warnings: string[]) => {
  if (!domains.length || context.signal.aborted || Date.now() >= context.deadline) return;
  const deadline = Math.min(context.deadline, Date.now() + INVOICE_TIME_LIMIT);
  const owned = new Map(domains.map(domain => [domain.name, domain] as const));
  const seen = new Set<string>();
  let details = 0;
  const read = async (url: URL) => {
    const payload = asRecord(parseJson(await requestRegistrar(url, headers, { ...context, deadline }), `porkbun`), `porkbun`);
    if (payload.status !== `SUCCESS` || payload.sandbox === true) throw invalidResponse(`porkbun`);
    return payload;
  };
  try {
    for (let page = 0; page < PAGE_LIMIT && details < DETAIL_LIMIT; page++) {
      const response = await read(new URL(`${PORKBUN_ACCOUNT}/invoices?start=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`));
      if (!Array.isArray(response.invoices) || response.invoices.length > PAGE_SIZE) throw invalidResponse(`porkbun`);
      for (const value of response.invoices) {
        const summary = asRecord(value, `porkbun`);
        if (summary.state !== `PAID` || !Array.isArray(summary.domains) || !summary.domains.some(value => {
          if (typeof value !== `string`) return false;
          try { return owned.has(providerName(value, `porkbun`)); } catch { return false; }
        })) continue;
        const id = providerId(summary.id, `porkbun`);
        if (seen.has(id)) continue;
        seen.add(id);
        details++;
        const receipt = await read(new URL(`${PORKBUN_ACCOUNT}/invoice/${id}`));
        const renewals = readPaidRenewals(receipt.invoice, id, invoiceDate(summary.date), owned);
        for (const [name, renewal] of renewals ?? []) {
          const domain = owned.get(name);
          if (!domain || !renewal) continue;
          domain.meta = { ...domain.meta, lastPaidRenewal: renewal };
          owned.delete(name);
        }
        if (!owned.size || details === DETAIL_LIMIT) return;
      }
      if (response.invoices.length < PAGE_SIZE || (page + 1) * PAGE_SIZE >= providerInteger(response.total, `porkbun`)) return;
    }
  } catch {
    warnings.push(`Porkbun Paid Renewal History Unavailable Or Incomplete This Sync`);
  }
};
