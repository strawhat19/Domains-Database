import { REGISTRARS } from './config';
import { validateDomainInput } from './domainUtils';
import { normalizeDomainDifficulty, normalizeDomainProjectStatus } from './domainProject';
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

const normalizeCsvDate = (value: string, preserveTime = false) => {
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
  if (iso) return preserveTime ? value : iso[1];
  const date = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!date) return value;
  const [, month, day, year] = date;
  return `${year}-${month.padStart(2, `0`)}-${day.padStart(2, `0`)}`;
};

const parseOptionalBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if ([``, `unknown`, `n/a`, `-`].includes(normalized)) return undefined;
  if ([`locked`, `protected`, `private`, `full`, `active`, `purchased`].includes(normalized)) return true;
  if ([`unlocked`, `unprotected`, `public`, `none`, `not purchased`, `no protection`].includes(normalized)) return false;
  return parseAutoRenew(value);
};

const parseOptionalPrice = (value: string) => {
  if (!value) return undefined;
  const price = value.replace(/^\$\s*/, ``).replace(/,/g, ``);
  if (!/^\d+(?:\.\d+)?$/.test(price)) throw new Error(`Enter A Valid Price`);
  return Number(price);
};

interface CsvDefaults {
  owner?: string;
  allowMixedRegistrars?: boolean;
  registrar?: DomainInput[`registrar`];
}

export const parseDomainCsv = (text: string, defaults: CsvDefaults = {}): DomainInput[] => {
  const rows = readCsvRows(text);
  const headers = rows[0]?.map(headerKey);
  if (!headers?.length || rows.length < 2) throw new Error(`Add A Header And At Least One Domain To The CSV`);
  const isPortfolioExport = [`id`, `number`, `uuid`].every(header => headers.includes(header));
  const isGoDaddyExport = [`internationaldomainname`, `expirationprotection`, `foldermemberships`].every(header => headers.includes(header));
  const detectedRegistrar = isGoDaddyExport ? `GoDaddy` : undefined;
  const registrarDefault = detectedRegistrar ?? defaults.registrar;
  if (detectedRegistrar && defaults.registrar && detectedRegistrar !== defaults.registrar && !defaults.allowMixedRegistrars) throw new Error(`Choose A CSV From ${defaults.registrar}`);
  const getIndex = (...aliases: string[]) => headers.findIndex(header => aliases.includes(header));
  const nameIndex = getIndex(`name`, `domain`, `domainname`);
  const dateIndex = getIndex(`expiry`, `expires`, `expiration`, `expiresat`, `expirydate`, `expireson`, `expirationdate`, `renewaldate`);
  const registrarIndex = getIndex(`registrar`, `provider`);
  if (nameIndex < 0 || dateIndex < 0 || (registrarIndex < 0 && !registrarDefault)) {
    throw new Error(registrarDefault ? `CSV Needs Domain And Expiry Columns` : `CSV Needs Domain, Registrar, And Expiry Columns`);
  }
  const ownerIndex = getIndex(`owner`, `registrant`, `registeredto`);
  const notesIndex = getIndex(`notes`, `note`);
  const autoRenewIndex = getIndex(`autorenew`, `autorenewal`, `automaticrenewal`);
  const priceIndex = getIndex(`renewalprice`, `renewalcost`, `price`, `cost`);
  return rows.slice(1).map((row, index) => {
    const get = (column: number) => row[column]?.trim() ?? ``;
    const optional = (...aliases: string[]) => get(getIndex(...aliases)) || undefined;
    const optionalDate = (...aliases: string[]) => {
      const value = optional(...aliases);
      return value ? normalizeCsvDate(value, true) : undefined;
    };
    try {
      const registrarName = get(registrarIndex);
      const registrar = registrarName
        ? REGISTRARS.find(value => value.toLowerCase() === registrarName.toLowerCase())
        : registrarIndex >= 0 ? `` : registrarDefault ?? ``;
      if (registrar === undefined) throw new Error(`Choose A Supported Registrar Or Leave It Blank If Unknown`);
      if (defaults.registrar && registrar && registrar !== defaults.registrar && !defaults.allowMixedRegistrars) throw new Error(`Choose A CSV From ${defaults.registrar}`);
      const price = get(priceIndex).replace(/^\$\s*/, ``).replace(/,/g, ``);
      if (price && !/^\d+(?:\.\d+)?$/.test(price)) throw new Error(`Enter A Valid Renewal Price`);
      const metaText = get(getIndex(`meta`));
      const savedMeta = metaText ? JSON.parse(metaText) : {};
      if (!savedMeta || typeof savedMeta !== `object` || Array.isArray(savedMeta)) throw new Error(`Meta Must Be A JSON Object`);
      const savedCsv = savedMeta.csv && typeof savedMeta.csv === `object` && !Array.isArray(savedMeta.csv) ? savedMeta.csv : {};
      const commonColumns = [`id`, `number`, `uuid`, `type`, `created`, `updated`];
      const commonInfo = Object.fromEntries(rows[0].flatMap((header, column) => commonColumns.includes(headerKey(header)) ? [[header, get(column)]] : []));
      const csvInfo = !metaText ? Object.fromEntries(rows[0].map((header, column) => [header, get(column)])) : {};
      const colorText = optional(`color`);
      let color: DomainInput[`color`];
      if (colorText) {
        try { color = JSON.parse(colorText) as DomainInput[`color`]; }
        catch { throw new Error(`Color Must Be A JSON Object`); }
      }
      const normalizedMeta = savedMeta.normalized && typeof savedMeta.normalized === `object` && !Array.isArray(savedMeta.normalized) ? savedMeta.normalized : {};
      const forwardingUrl = optional(`forwardingurl`, `forwarding`);
      const protectionPlan = optional(`protectionplan`, `protection`);
      const estimatedValue = parseOptionalPrice(get(getIndex(`estimatedvalue`)));
      const wholesaleValue = parseOptionalPrice(get(getIndex(`valuationwholesaleamount`, `wholesalevalue`)));
      const registrantName = optional(`registrantname`, `contactname`) || [optional(`registrantfirstname`), optional(`registrantlastname`)].filter(Boolean).join(` `) || undefined;
      const nameservers = optional(`nameservers`, `dnsnameservers`);
      const input = validateDomainInput({
        registrar,
        name: get(nameIndex),
        title: optional(`title`),
        color,
        description: optional(`description`),
        ...(getIndex(`mvp`, `minimumviableproduct`) >= 0 ? { mvp: get(getIndex(`mvp`, `minimumviableproduct`)) } : {}),
        ...(getIndex(`future`, `futureplans`) >= 0 ? { future: get(getIndex(`future`, `futureplans`)) } : {}),
        ...(getIndex(`difficulty`, `difficultylevel`) >= 0 ? { difficulty: normalizeDomainDifficulty(optional(`difficulty`, `difficultylevel`)) } : {}),
        ...(getIndex(`projectstatus`, `developmentstatus`) >= 0 ? { projectStatus: normalizeDomainProjectStatus(optional(`projectstatus`, `developmentstatus`)) } : {}),
        notes: get(notesIndex),
        expiresAt: normalizeCsvDate(get(dateIndex)),
        renewalPrice: Number(price || 0),
        owner: get(ownerIndex) || defaults.owner || `My Portfolio`,
        autoRenew: parseAutoRenew(get(autoRenewIndex)),
        providerId: optional(`providerid`, `domainid`, ...(!isPortfolioExport ? [`id`] : [])),
        internationalName: optional(`internationalname`, `internationaldomainname`, `unicodename`),
        tld: optional(`tld`, `extension`),
        status: optional(`status`, `domainstatus`),
        createdAt: optionalDate(`createdat`, ...(!isPortfolioExport ? [`created`] : []), `createdate`, `creationdate`, `registrationdate`),
        updatedAt: optionalDate(`updatedat`, `updateddate`, `modifiedat`, `modifieddate`),
        ownershipAt: optionalDate(`ownershipat`, `ownershipdate`),
        firstImportedAt: optional(`firstimportedat`),
        firstExportedAt: optional(`firstexportedat`),
        locked: parseOptionalBoolean(get(getIndex(`locked`, `lock`, `islocked`, `transferprotected`))),
        privacy: parseOptionalBoolean(get(getIndex(`privacy`, `isprivacyprotected`, `whoisguard`))),
        dnssec: parseOptionalBoolean(get(getIndex(`dnssec`, `dnssecenabled`))),
        nameservers: nameservers ? nameservers.split(/[\s,;|]+/).filter(Boolean) : undefined,
        currency: optional(`currency`, `currencycode`),
        registrant: {
          name: registrantName,
          email: optional(`registrantemail`, `contactemail`),
          organization: optional(`registrantorganization`, `organization`),
          country: optional(`registrantcountry`, `country`),
        },
        meta: {
          ...savedMeta,
          ...(!metaText || Object.keys(commonInfo).length ? { csv: { ...savedCsv, ...csvInfo, ...commonInfo } } : {}),
          normalized: {
            ...normalizedMeta,
            ...(forwardingUrl ? { forwardingUrl } : {}),
            ...(protectionPlan ? { protectionPlan } : {}),
            ...(estimatedValue !== undefined ? { estimatedValue } : {}),
            ...(wholesaleValue !== undefined ? { wholesaleValue } : {}),
          },
        },
      });
      // Preserve existing progress when a registrar CSV omits project status.
      if (getIndex(`projectstatus`, `developmentstatus`) < 0) delete input.projectStatus;
      return input;
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
  const headers = [`domain`, `registrar`, `expiry`, `owner`, `auto_renew`, `renewal_price`, `notes`, `provider_id`, `international_name`, `tld`, `status`, `created_at`, `updated_at`, `ownership_at`, `first_imported_at`, `first_exported_at`, `locked`, `privacy`, `dnssec`, `nameservers`, `currency`, `registrant_name`, `registrant_email`, `registrant_organization`, `registrant_country`, `meta`, `title`, `description`, `color`, `id`, `number`, `uuid`, `type`, `created`, `updated`, `project_status`, `difficulty`, `mvp`, `future`];
  const rows = domains.map(domain => [
    domain.name, domain.registrar, domain.expiresAt, domain.owner, domain.autoRenew, domain.renewalPrice, domain.notes,
    domain.providerId ?? ``, domain.internationalName ?? ``, domain.tld ?? ``, domain.status ?? ``,
    domain.createdAt ?? ``, domain.updatedAt ?? ``, domain.ownershipAt ?? ``,
    domain.firstImportedAt ?? ``, domain.firstExportedAt ?? ``,
    domain.locked ?? ``, domain.privacy ?? ``, domain.dnssec ?? ``, (domain.nameservers ?? []).join(` `), domain.currency ?? ``,
    domain.registrant?.name ?? ``, domain.registrant?.email ?? ``, domain.registrant?.organization ?? ``, domain.registrant?.country ?? ``,
    JSON.stringify(domain.meta ?? {}),
    domain.title, domain.description, JSON.stringify(domain.color),
    domain.id, domain.number, domain.uuid, domain.type, domain.created, domain.updated,
    normalizeDomainProjectStatus(domain.projectStatus), domain.difficulty ?? ``, domain.mvp ?? ``, domain.future ?? ``,
  ]);
  return [headers, ...rows].map(row => row.map(csvField).join(`,`)).join(`\r\n`);
};
