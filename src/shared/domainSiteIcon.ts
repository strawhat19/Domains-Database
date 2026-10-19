import type { DomainInput } from './types';

export const normalizeSiteIconUrl = (value: unknown): string => {
  if (value == null) return ``;
  if (typeof value !== `string`) throw new Error(`Site Icon URL Must Be Text`);
  const text = value.trim();
  if (!text) return ``;
  let url: URL;
  try { url = new URL(text); }
  catch { throw new Error(`Enter A Valid Site Icon Image URL`); }
  if (![`http:`, `https:`].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Use An HTTP Or HTTPS Site Icon URL Without Login Credentials`);
  }
  return url.toString();
};

export const getCustomSiteIconUrl = (domain: Pick<DomainInput, `meta`>): string => (
  typeof domain.meta?.siteIconUrl === `string` ? domain.meta.siteIconUrl : ``
);

export const getLinkSiteIconUrl = (value: string): string => {
  try {
    const url = normalizeSiteIconUrl(value);
    return url ? `${new URL(url).origin}/favicon.ico` : ``;
  } catch {
    return ``;
  }
};

export const getDomainSiteIconUrls = (domain: Pick<DomainInput, `name` | `meta`>): string[] => {
  const name = domain.name?.trim()?.toLowerCase()?.replace(/\.$/, ``);
  const labels = name?.split(`.`) ?? [];
  const hasValidName = name && name.length <= 253 && labels.length >= 2
    && !/^\d+$/.test(labels[labels.length - 1] ?? ``)
    && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  const defaults = hasValidName ? [`favicon.ico`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png`].map(file => `https://${name}/${file}`) : [];
  try {
    const customUrl = normalizeSiteIconUrl(getCustomSiteIconUrl(domain));
    return [...new Set([customUrl, ...defaults].filter(Boolean))];
  } catch { return defaults; }
};

export const getDomainSiteIconUrl = (domain: Pick<DomainInput, `name` | `meta`>): string => getDomainSiteIconUrls(domain)?.[0] ?? ``;
