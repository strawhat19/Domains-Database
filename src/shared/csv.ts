import { REGISTRARS } from './config';
import { validateDomainInput } from './domainUtils';
import type { DomainInput, DomainRecord } from './types';

const readCsvRows = (text: string) => {
  let field = ``;
  let quoted = false;
  let afterQuote = false;
  let row: string[] = [];
  const rows: string[][] = [];
  const source = text.replace(/^\uFEFF/, ``);
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === `"`) {
      if (quoted && source[index + 1] === `"`) { field += `"`; index += 1; }
      else if (quoted) { quoted = false; afterQuote = true; }
      else if (field.length || afterQuote) throw new Error(`CSV Has An Unexpected Quote`);
      else quoted = true;
    } else if (char === `,` && !quoted) {
      row.push(field); field = ``; afterQuote = false;
    } else if ((char === `\n` || char === `\r`) && !quoted) {
      if (char === `\r` && source[index + 1] === `\n`) index += 1;
      row.push(field); rows.push(row); row = []; field = ``; afterQuote = false;
    } else if (afterQuote) {
      throw new Error(`CSV Has Text After A Closing Quote`);
    } else field += char;
  }
  if (quoted) throw new Error(`CSV Has An Unclosed Quote`);
  if (field.length || row.length || afterQuote) { row.push(field); rows.push(row); }
  return rows.filter(fields => fields.some(value => value.trim()));
};

const headerKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, ``);
const parseAutoRenew = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if ([``, `0`, `no`, `off`, `false`, `disabled`].includes(normalized)) return false;
  if ([`1`, `yes`, `on`, `true`, `enabled`].includes(normalized)) return true;
  throw new Error(`Auto-Renew Must Be Yes Or No`);
};

export const parseDomainCsv = (text: string): DomainInput[] => {
  const rows = readCsvRows(text);
  const headers = rows[0]?.map(headerKey);
  if (!headers?.length || rows.length < 2) throw new Error(`Add A Header And At Least One Domain To The CSV`);
  const getIndex = (...aliases: string[]) => headers.findIndex(header => aliases.includes(header));
  const nameIndex = getIndex(`name`, `domain`, `domainname`);
  const dateIndex = getIndex(`expiry`, `expiration`, `expiresat`, `expirydate`, `expirationdate`);
  const registrarIndex = getIndex(`registrar`, `provider`);
  if ([nameIndex, dateIndex, registrarIndex].some(index => index < 0)) throw new Error(`CSV Needs Domain, Registrar, And Expiry Columns`);
  const ownerIndex = getIndex(`owner`, `registrant`, `registeredto`);
  const notesIndex = getIndex(`notes`, `note`);
  const autoRenewIndex = getIndex(`autorenew`, `autorenewal`);
  const priceIndex = getIndex(`renewalprice`, `renewalcost`, `price`, `cost`);
  return rows.slice(1).map((row, index) => {
    const get = (column: number) => row[column]?.trim() ?? ``;
    try {
      const registrar = REGISTRARS.find(value => value.toLowerCase() === get(registrarIndex).toLowerCase());
      if (!registrar) throw new Error(`Choose Hostinger, GoDaddy, GoDaddy Auctions, Or Namecheap`);
      const price = get(priceIndex).replace(/^\$/, ``).replace(/,/g, ``);
      if (price && !/^\d+(?:\.\d+)?$/.test(price)) throw new Error(`Enter A Valid Renewal Price`);
      return validateDomainInput({
        registrar,
        name: get(nameIndex),
        notes: get(notesIndex),
        expiresAt: get(dateIndex),
        renewalPrice: Number(price || 0),
        owner: get(ownerIndex) || `My Portfolio`,
        autoRenew: parseAutoRenew(get(autoRenewIndex)),
      });
    } catch (error) {
      throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : `Invalid Domain`}`);
    }
  });
};

const csvField = (value: string | number | boolean) => {
  let field = String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(field)) field = `'${field}`;
  return `"${field.replace(/"/g, `""`)}"`;
};

export const exportDomainCsv = (domains: DomainRecord[]) => {
  const headers = [`domain`, `registrar`, `expiry`, `owner`, `auto_renew`, `renewal_price`, `notes`];
  const rows = domains.map(domain => [domain.name, domain.registrar, domain.expiresAt, domain.owner, domain.autoRenew, domain.renewalPrice, domain.notes]);
  return [headers, ...rows].map(row => row.map(csvField).join(`,`)).join(`\r\n`);
};
