import type { DomainAnalyticsSnapshot } from './types';

export const analyticsDomainName = (value: string) => {
  const domain = value?.trim()?.toLowerCase()?.replace(/\.$/, ``);
  const labels = domain?.split(`.`);
  if (!domain || domain.length > 253 || labels.length < 2 || /^\d+$/.test(labels.at(-1) ?? ``)
    || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new Error(`Enter A Valid Domain Name`);
  }
  return domain;
};

export const localDomainAnalytics = (value: string): DomainAnalyticsSnapshot => {
  const domain = analyticsDomainName(value);
  const [label, ...extensions] = domain.split(`.`);
  const keywords = [...new Set(label.split(/[\d-]+/).filter(Boolean))];
  const query = encodeURIComponent(keywords.join(` `) || label);
  return {
    domain,
    checkedAt: new Date().toISOString(),
    dns: { records: [] },
    registration: { status: `unknown` },
    name: {
      label,
      keywords,
      length: label.length,
      extension: extensions.join(`.`),
      hasDigits: /\d/.test(label),
      hasHyphens: label.includes(`-`),
    },
    links: [
      { label: `Google Trends`, url: `https://trends.google.com/trends/explore?q=${query}` },
      { label: `Keyword Planner`, url: `https://business.google.com/us/ad-tools/keyword-planner/` },
      { label: `ICANN Lookup`, url: `https://lookup.icann.org/en/lookup?name=${encodeURIComponent(domain)}` },
      { label: `Public DNS`, url: `https://dns.google/query?name=${encodeURIComponent(domain)}&type=A` },
    ],
  };
};
