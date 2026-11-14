import { useMemo } from 'react';
import type { DomainRecord } from '../../shared/types';
import { normalizeDomainTags } from '../../shared/domainTags';
import { readPaidRenewal } from '../../shared/registrarSync/paidRenewal';
import { normalizeGoDaddyLifecycleActions } from '../../shared/registrarSync/godaddyActions';
import { getDomainWebsiteInsights, getPortfolioColumnValue, getPortfolioColumnDisplay, getRenewalEstimateDisplay, hasPortfolioColumnValue, type PortfolioColumn } from '../../shared/portfolioColumns';

export interface DomainMetadataProps {
  idPrefix?: string;
  domain: DomainRecord;
  hideProjectDetails?: boolean;
}

interface DomainMetadataField {
  label: string;
  wide?: boolean;
  field: PortfolioColumn;
}

interface DomainMetadataItem {
  key: string;
  label: string;
  value: string;
  wide?: boolean;
}

const registrarFields: DomainMetadataField[] = [
  { field: `registrar`, label: `Registrar` },
  { field: `providerId`, label: `Provider ID` },
  { field: `status`, label: `Provider Status` },
  { field: `tld`, label: `Extension` },
  { field: `estimatedValue`, label: `Estimated Value` },
  { field: `trancoRank`, label: `Tranco Rank` },
  { field: `internationalName`, label: `International Name` },
  { field: `autoRenew`, label: `Auto-Renew` },
  { field: `locked`, label: `Domain Lock` },
  { field: `privacy`, label: `Privacy` },
  { field: `dnssec`, label: `DNSSEC` },
  { field: `nameservers`, label: `Nameservers` },
  { field: `forwardingUrl`, label: `Forwarding URL` },
  { field: `protectionPlan`, label: `Protection Plan` },
  { field: `expiresAt`, label: `Renewal Date` },
  { field: `createdAt`, label: `Created` },
  { field: `updatedAt`, label: `Last Updated` },
  { field: `ownershipAt`, label: `Ownership Date` },
  { field: `firstImportedAt`, label: `First Imported` },
  { field: `firstExportedAt`, label: `First Exported` },
  { field: `owner`, label: `Owner` },
  { field: `registrantName`, label: `Registrant Name` },
  { field: `registrantEmail`, label: `Registrant Email` },
  { field: `organization`, label: `Organization` },
  { field: `country`, label: `Country` },
];

const registrarDetailFields = {
  verified: `Vercel Verified`,
  premium: `Premium Registration`,
  renewable: `Renewable`,
  usesProviderDns: `Uses Registrar DNS`,
  usesDefaultNameservers: `Uses Default Nameservers`,
  deletedAt: `Deletion Date`,
  registeredAt: `Registered`,
  holdRegistrar: `Registrar Hold`,
  renewDeadline: `Renewal Deadline`,
  boughtAt: `Purchased Through Vercel`,
  echMode: `Encrypted Client Hello`,
  exposeWhois: `Expose WHOIS Contact`,
  exposeRegistrantOrganization: `Expose Registrant Organization In WHOIS`,
  transferredAt: `Transfer Completed`,
  transferProtected: `Transfer Protection`,
  verificationType: `Pending Verification`,
  registrarCreatedAt: `Registrar Record Created`,
  transferStartedAt: `Transfer Started`,
  expirationProtected: `Expiration Protection`,
  transferLockSupported: `Transfer Lock Supported`,
  privacyProtectionAllowed: `Privacy Protection Available`,
  serviceType: `Vercel Domain Service`,
  registrationType: `Registration Type`,
  registryStatusCodes: `Registry Status Code(s)`,
  registeredHostnames: `Registrar Hostnames`,
  icannVerification: `ICANN Verification`,
  registrantEmailVerified: `Registrant Email Verified`,
  realNameVerification: `Real Name Verification`,
  domainNameVerification: `Domain Name Verification`,
  customNameservers: `Custom Nameservers`,
  intendedNameservers: `Intended Nameservers`,
  transferLockExpiresAt: `Transfer Lock Ends`,
  transferAwayEligibleAt: `Transfer Away Eligible`,
};

const projectFields: DomainMetadataField[] = [
  { field: `projectStatus`, label: `Project Status` },
  { field: `difficulty`, label: `Difficulty` },
  { wide: true, field: `mvp`, label: `MVP` },
  { wide: true, field: `future`, label: `Future` },
];

export const useDomainMetadata = ({ domain, idPrefix = `domain-metadata`, hideProjectDetails = false }: DomainMetadataProps) => {
  const items = useMemo(() => {
    const fields = hideProjectDetails ? registrarFields : [...registrarFields, ...projectFields];
    const values: DomainMetadataItem[] = fields.flatMap(({ field, label, wide }) => (
      hasPortfolioColumnValue(getPortfolioColumnValue(domain, field), field)
        ? [{ label, wide, key: field, value: getPortfolioColumnDisplay(domain, field) }] : []
    ));
    const estimate = getRenewalEstimateDisplay(domain);
    if (estimate !== `—`) values.push({ key: `renewalEstimate`, label: `Renewal Estimate`, value: estimate });
    const history = getDomainWebsiteInsights(domain)?.trancoHistory;
    if (history?.length) {
      const formatRank = new Intl.NumberFormat(`en-US`);
      const positions = history.map(({ date, rank }) => `${date}: ${rank === null ? `Unlisted` : formatRank.format(rank)}`);
      values.push({ key: `trancoHistory`, label: `Tranco Daily Rank History`, value: positions.join(` · `), wide: true });
    }
    const details = domain.meta?.registrarDetails;
    if (details && typeof details === `object` && !Array.isArray(details)) {
      const lifecycle = domain.registrar === `GoDaddy` ? normalizeGoDaddyLifecycleActions(details.lifecycleActions) : undefined;
      if (lifecycle?.length) {
        const text = (code: string) => code.toLowerCase().replace(/_/g, ` `).replace(/\b[a-z]/g, character => character.toUpperCase());
        const dates = new Intl.DateTimeFormat(`en-US`, { dateStyle: `medium`, timeZone: `UTC` });
        const actions = lifecycle.map(action => {
          const checked = action.modifiedAt ?? action.startedAt ?? action.createdAt;
          return `${text(action.type)} · ${text(action.status)}${checked ? ` · ${dates.format(new Date(checked))}` : ``}`;
        });
        values.push({ key: `lifecycleActions`, label: `GoDaddy Actions In Progress`, value: actions.join(`\n`), wide: true });
      }
      const paid = domain.registrar === `Porkbun` ? readPaidRenewal(details.lastPaidRenewal) : undefined;
      if (paid) {
        const amount = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: paid.currency, currencyDisplay: `code` }).format(paid.amount);
        const term = `${paid.years}-Year Term`;
        const expiry = paid.expiresAt ? ` · Resulting Expiry ${paid.expiresAt}` : ``;
        values.push({ key: `lastPaidRenewal`, label: `Last Confirmed Paid Renewal`, value: `${amount} · ${term} · ${paid.paidAt}${expiry} · Porkbun Invoice`, wide: true });
      }
      for (const [key, label] of Object.entries(registrarDetailFields)) {
        const entry = details[key];
        const value = typeof entry === `boolean` ? (entry ? `Yes` : `No`) : Array.isArray(entry) ? entry.filter(item => typeof item === `string`).join(`, `) : entry;
        if (typeof value === `string` && value) values.push({ key, label, value });
      }
      const checks = details.contactVerification;
      if (checks && typeof checks === `object` && !Array.isArray(checks)) {
        for (const [key, label] of [[`email`, `Email Verification`], [`phone`, `Phone Verification`], [`contactName`, `Contact Name Verification`]] as const) {
          const check = checks[key];
          if (check && typeof check === `object` && !Array.isArray(check) && typeof check.status === `string`) {
            const status = check.status.charAt(0).toUpperCase() + check.status.slice(1);
            const endsAt = typeof check.endsAt === `string` && Number.isFinite(Date.parse(check.endsAt)) ? check.endsAt.slice(0, 10) : undefined;
            values.push({ key: `${key}Verification`, label, value: endsAt ? `${status} · Ends ${endsAt}` : status });
          }
        }
      }
    }
    const hosting = domain.meta?.hostingDetails;
    if (hosting && typeof hosting === `object` && !Array.isArray(hosting)) {
      if (typeof hosting.websiteType === `string`) values.push({ key: `websiteType`, label: `Hostinger Website Type`, value: hosting.websiteType });
      if (typeof hosting.vhostType === `string`) values.push({ key: `vhostType`, label: `Hostinger Host Type`, value: hosting.vhostType });
      if (typeof hosting.enabled === `boolean`) values.push({ key: `hostingEnabled`, label: `Hostinger Website Enabled`, value: hosting.enabled ? `Yes` : `No` });
    }
    const connection = domain.meta?.registrarProvider;
    const synced = typeof domain.meta?.registrarConnectionId === `string` && Boolean(domain.meta.registrarConnectionId);
    const trafficSource = domain.meta?.hostingProvider === `Hostinger` ? `Hostinger hPanel`
      : synced && connection === `godaddy` ? `GoDaddy Hosting Dashboard For Eligible Hosted Sites`
      : synced && connection === `hostinger` ? `Hostinger hPanel For Hosted Sites` : undefined;
    if (trafficSource) values.push({ key: `websiteTraffic`, label: `Website Traffic`, value: `Unavailable In Domain Sync · ${trafficSource}` });
    const vercel = domain.meta?.vercelDomainConfiguration;
    if (vercel && typeof vercel === `object` && !Array.isArray(vercel)) {
      const dns = vercel.dnsService === `zeit.world` ? `Vercel DNS` : vercel.dnsService === `external` ? `External DNS` : `Unknown`;
      values.push({ key: `vercelDnsService`, label: `Vercel DNS Configuration`, value: dns });
      if (typeof vercel.verified === `boolean`) values.push({ key: `vercelDomainVerified`, label: `Vercel Domain Verification`, value: vercel.verified ? `Verified` : `Unverified` });
      for (const [key, label] of [[`observedNameservers`, `Vercel Observed Nameservers`], [`intendedNameservers`, `Vercel Intended Nameservers`]] as const) {
        const entry = vercel[key];
        if (Array.isArray(entry) && entry.length) values.push({ key, label, value: entry.join(`, `) });
      }
    }
    if (hideProjectDetails) return values;
    const textFields = [
      { key: `title`, label: `Title`, value: domain.title },
      { key: `tags`, label: `Tags`, value: normalizeDomainTags(domain.tags).join(`, `) },
      { wide: true, key: `description`, label: `Description`, value: domain.description },
      { wide: true, key: `notes`, label: `Notes`, value: domain.notes?.trim() === domain.description?.trim() ? undefined : domain.notes },
    ];
    return values.concat(textFields.flatMap(item => (
      hasPortfolioColumnValue(item.value) ? [{ ...item, value: item.value?.trim() ?? `` }] : []
    )));
  }, [domain, hideProjectDetails]);

  return { items, scope: `${idPrefix}-${domain.id}` };
};
