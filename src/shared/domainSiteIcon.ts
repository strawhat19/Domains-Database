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

export const getDomainSiteIconUrl = (domain: Pick<DomainInput, `name` | `meta`>): string => {
  const name = domain.name?.trim()?.toLowerCase()?.replace(/\.$/, ``);
  const labels = name?.split(`.`) ?? [];
  const hasValidName = name && name.length <= 253 && labels.length >= 2
    && !/^\d+$/.test(labels[labels.length - 1] ?? ``)
    && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  const defaultUrl = hasValidName ? `https://${name}/favicon.ico` : ``;
  try { return normalizeSiteIconUrl(getCustomSiteIconUrl(domain)) || defaultUrl; }
  catch { return defaultUrl; }
};
