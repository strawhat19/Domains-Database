import flagCodes from './codes.json';
import { routes } from '../../../shared/routes';
import { formatTrafficSegment, isOtherTrafficSegment, type TrafficSegment } from '../data';

export type TrafficSegmentIconName = (typeof routes)[keyof typeof routes][`icon`] | `Globe` | `Link2` | `MapPin` | `Laptop` | `Tablet` | `Monitor` | `Smartphone` | `MonitorSmartphone`;
export type TrafficSegmentDetails = { label: string; icon: TrafficSegmentIconName; caption?: string; hostname?: string; pathname?: string; countryCode?: string; brand?: { key: string; color: string } };

const countryCodes = new Set(flagCodes);
const deviceIcons: Record<string, TrafficSegmentIconName> = { laptop: `Laptop`, tablet: `Tablet`, desktop: `Monitor`, mobile: `Smartphone` };
const getPageName = (path: string) => path === `/` ? `Home` : path.split(`/`).filter(Boolean).map(part => part.replace(/[-_]/g, ` `)).join(` / `).replace(/\b\w/g, character => character.toUpperCase());
const pageRoutes = Object.values(routes).flatMap(route => [route.href, ...(`redirects` in route ? route.redirects.map(alias => `/${alias}`) : [])].map(path => ({ path, route }))).sort((first, second) => second.path.length - first.path.length);
const sourceBrands = [
  { key: `x`, label: `X / Twitter`, color: `currentColor`, hosts: [`x.com`, `t.co`, `twitter.com`] },
  { key: `bing`, label: `Bing`, color: `#008373`, hosts: [`bing.com`] },
  { key: `vercel`, label: `Vercel`, color: `currentColor`, hosts: [`vercel.app`, `vercel.com`] },
  { key: `github`, label: `GitHub`, color: `currentColor`, hosts: [`github.com`] },
  { key: `tiktok`, label: `TikTok`, color: `currentColor`, hosts: [`tiktok.com`] },
  { key: `reddit`, label: `Reddit`, color: `#ff4500`, hosts: [`reddit.com`, `redd.it`] },
  { key: `youtube`, label: `YouTube`, color: `#ff0000`, hosts: [`youtube.com`, `youtu.be`] },
  { key: `linkedin`, label: `LinkedIn`, color: `#0a66c2`, hosts: [`linkedin.com`, `lnkd.in`] },
  { key: `facebook`, label: `Facebook`, color: `#1877f2`, hosts: [`facebook.com`, `fb.com`, `fb.me`] },
  { key: `instagram`, label: `Instagram`, color: `#e4405f`, hosts: [`instagram.com`, `instagr.am`] },
  { key: `whatsapp`, label: `WhatsApp`, color: `#128c7e`, hosts: [`whatsapp.com`, `wa.me`] },
  { key: `duckduckgo`, label: `DuckDuckGo`, color: `#de5833`, hosts: [`duckduckgo.com`] },
  { key: `pinterest`, label: `Pinterest`, color: `#bd081c`, hosts: [`pinterest.com`, `pinterest.co.uk`, `pin.it`] },
  { key: `google`, label: `Google`, color: `#4285f4`, hosts: [`google.com`, `google.ca`, `google.de`, `google.fr`, `google.co.uk`, `google.co.in`, `google.com.bd`, `google.com.au`] },
] as const;

const getTrafficURL = (value: string) => {
  const raw = value.trim();
  if (!/^(https?:\/\/|\/\/|[\w-]+(?:\.[\w-]+)+(?:[:/?#]|$))/i.test(raw)) return null;
  try {
    const url = new URL(raw.startsWith(`//`) ? `https:${raw}` : /^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return [`https:`, `http:`].includes(url.protocol) ? url : null;
  } catch { return null; }
};

export const getTrafficSegmentDetails = (segment: TrafficSegment, value: string): TrafficSegmentDetails => {
  const normalized = value.trim().toLowerCase();
  const icon: TrafficSegmentIconName = segment === `country` ? `MapPin` : segment === `path` ? `FileText` : segment === `device` ? deviceIcons[normalized] ?? `MonitorSmartphone` : `Globe`;
  if (isOtherTrafficSegment(normalized)) return { icon, label: `Other` };
  if (segment === `country`) return countryCodes.has(normalized)
    ? { icon, countryCode: normalized, label: formatTrafficSegment(segment, normalized.toUpperCase()) }
    : { icon, label: formatTrafficSegment(segment, value) };
  if (segment === `path`) {
    const url = getTrafficURL(value);
    const path = url?.pathname ?? value.split(/[?#]/)?.[0] ?? `/`;
    const pathname = path.replace(/\/+$/, ``) || `/`;
    const route = pageRoutes.find(({ path }) => pathname === path || path !== `/` && pathname.startsWith(`${path}/`))?.route;
    return { caption: value || `/`, ...(url?.hostname ? { hostname: url.hostname, pathname: url.pathname } : {}), label: route?.label ?? getPageName(pathname), icon: route?.icon ?? `FileText` };
  }
  if (segment === `referrer`) {
    if (!normalized || [`__direct__`, `__unknown__`, `direct`, `(direct)`].includes(normalized)) return { icon: `Link2`, label: `Direct / Unknown` };
    const host = getTrafficURL(value)?.hostname.toLowerCase() ?? ``;
    const brand = sourceBrands.find(({ key, label, hosts }) => normalized === key || label.toLowerCase().split(`/`).some(name => normalized === name.trim()) || hosts.some(domain => host === domain || host.endsWith(`.${domain}`)));
    return { icon, caption: value, label: brand?.label ?? (host ? host.replace(/^www\./, ``) : formatTrafficSegment(segment, value)), ...(brand ? { brand: { key: brand.key, color: brand.color } } : {}) };
  }
  return { icon, label: formatTrafficSegment(segment, value.trim()) };
};
