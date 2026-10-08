import type { DomainRecord } from './types';

export const normalizeDomainLink = (value: unknown, label: string): string => {
  if (value == null) return ``;
  if (typeof value !== `string`) throw new Error(`${label} Must Be Text`);
  const text = value.trim();
  if (!text) return ``;
  let url: URL;
  try { url = new URL(text); }
  catch { throw new Error(`Enter A Valid ${label}`); }
  if (!/^https?:\/\//i.test(text) || ![`http:`, `https:`].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Use An HTTP Or HTTPS ${label} Without Login Credentials`);
  }
  return url.href;
};

export const normalizeDomainLinks = (value: unknown, label: string): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(link => typeof link !== `string`)) {
    throw new Error(`${label} Must Be A List Of Links`);
  }
  return [...new Set(value.map(link => normalizeDomainLink(link, label)).filter(Boolean))];
};

export const getDomainPreviewLink = (domain: Pick<DomainRecord, `previewLinks`>): string => {
  if (!Array.isArray(domain.previewLinks)) return ``;
  try { return normalizeDomainLink(domain.previewLinks[0], `Preview Link`); }
  catch { return ``; }
};
