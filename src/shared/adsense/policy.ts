import { blogArticles } from '../blog/articles';

export interface AdSenseEligibilityInput {
  paid: boolean;
  owner: boolean;
  pathname: string;
  authBusy: boolean;
  authReady: boolean;
  adsEnabled: boolean;
  authErrorFree: boolean;
  featuresReady: boolean;
  billingLoading: boolean;
  featuresLoading: boolean;
  connectedFirebase: boolean;
  identityConfirmed: boolean;
  billingErrorFree: boolean;
  featuresErrorFree: boolean;
  canonicalHttpsOrigin: boolean;
  publisherConfigured: boolean;
  billingConfirmedFree: boolean;
}
const articleSlugs = blogArticles.map(article => article.slug);
export const isAdSenseEditorialPath = (pathname: string, knownArticleSlugs: readonly string[] = articleSlugs) => {
  if (typeof pathname !== `string` || !pathname.startsWith(`/`) || pathname.includes(`//`) || /[?#]/.test(pathname)) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/$/, ``) : pathname;
  if ([`/`, `/about`, `/blog`].includes(path)) return true;
  const slug = /^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path)?.[1];
  return !!slug && knownArticleSlugs.includes(slug);
};
export const canLoadAdSense = (input: AdSenseEligibilityInput, knownArticleSlugs: readonly string[] = articleSlugs) => {
  if (!input || !isAdSenseEditorialPath(input.pathname, knownArticleSlugs)) return false;
  const confirmed = [input.authReady, input.adsEnabled, input.featuresReady, input.authErrorFree, input.connectedFirebase, input.billingErrorFree, input.identityConfirmed, input.featuresErrorFree, input.publisherConfigured, input.canonicalHttpsOrigin, input.billingConfirmedFree];
  const inactive = [input.paid, input.owner, input.authBusy, input.billingLoading, input.featuresLoading];
  return confirmed.every(value => value === true) && inactive.every(value => value === false);
};
