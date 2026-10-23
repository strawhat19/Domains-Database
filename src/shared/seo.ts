import { routes } from './routes';

const defaultSiteUrl = `https://domaindatabases.com`;
const getSiteUrl = () => {
  try {
    const url = new URL(process.env.EXPO_PUBLIC_SITE_URL?.trim() || defaultSiteUrl);
    return url.protocol === `https:` && !url.username && !url.password ? url.origin : defaultSiteUrl;
  } catch { return defaultSiteUrl; }
};
export const SITE_URL = getSiteUrl();
export const publicSeoRoutes = [routes.home, routes.about, routes.blog, routes.contact, routes.terms, routes.privacy, routes.pricing];
export const getCanonicalSeoPath = (pathname: string) => {
  const path = pathname.split(/[?#]/)?.[0]?.replace(/\/+$/, ``) || `/`;
  return publicSeoRoutes.find(route => route.href === path || (`redirects` in route && route.redirects.some(alias => `/${alias}` === path)))?.href ?? path;
};
export const isIndexablePath = (pathname: string) => {
  const path = getCanonicalSeoPath(pathname);
  return publicSeoRoutes.some(route => route.href === path) || /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path);
};
export const absoluteSiteUrl = (path: string) => new URL(path, `${SITE_URL}/`).href;
