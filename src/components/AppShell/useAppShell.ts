import { usePathname } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { routes, navigation } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { useWatching } from '../../shared/watching/useWatching';
import { getAccountBadgeColors } from '../../shared/common/badges';
import { useDomains } from '../../shared/domainContext/useDomains';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export { footerLinks } from '../../shared/routes';
const marketSubmenuPaths: readonly string[] = [routes.auction.href, routes.domainers.href];

export const useAppShell = () => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, loading } = useAuth();
  const { allowed: starterAllowed } = useStarterAccess();
  const { name: appName } = useAppBrand();
  const { flags, ready: featuresReady } = useFeatureFlags();
  const { eligible, loading: connectionsLoading } = useConnectionAvailability();
  const { domains, loaded: domainsLoaded, loading: domainsLoading } = useDomains();
  const { records, loading: watchingLoading } = useWatching();
  const signedIn = !loading && Boolean(user?.id);
  const domainCount = domainsLoaded && !domainsLoading ? domains.length : undefined;
  const watchingCount = watchingLoading ? undefined : records.filter(record => record.listName === `Watching`).length;
  const isBlogPage = pathname === routes.blog.href || pathname.startsWith(`${routes.blog.href}/`);
  const isDomainerPage = pathname === routes.domainers.href || pathname.startsWith(`${routes.domainers.href}/`);
  const marketActive = pathname === routes.market.href || pathname === routes.auction.href || isDomainerPage;
  const searchViewport = pathname === routes.search.href && width >= 1000;
  const publicPages = [routes.signin.href, routes.signup.href, routes.terms.href, routes.contact.href, routes.privacy.href, `/api`] as string[];
  const fitViewport = pathname !== routes.about.href && (publicPages.includes(pathname)
    || (!signedIn && !isBlogPage && !marketActive && pathname !== routes.pricing.href && pathname !== routes.subscription.href && pathname !== routes.home.href && pathname !== routes.domains.href && pathname !== routes.community.href && pathname !== `/discover`));
  const visibleNavigation = navigation.filter(item =>
    (item.href !== routes.contact.href || (featuresReady && flags.contact))
    && (!(`minPlan` in item) || starterAllowed)
    && (item.href !== routes.watching.href || (signedIn && (watchingCount ?? 0) > 0))
    && (item.href !== routes.search.href || eligible || connectionsLoading)).map(item => {
      const count = item.href === routes.domains.href ? domainCount : item.href === routes.watching.href ? watchingCount : undefined;
      const countLoading = item.href === routes.domains.href ? domainsLoading : item.href === routes.watching.href && watchingLoading;
      const accessibilityLabel = count === undefined
        ? `${item.label}${`beta` in item && item.beta ? ` (Beta)` : ``}`
        : `${item.label}, ${count} Domain${count === 1 ? `` : `s`}${item.href === routes.watching.href ? ` in Watch List` : ` in Table`}`;
      return { ...item, count, countLoading, accessibilityLabel };
    });
  const marketNavigation = visibleNavigation.filter(item => marketSubmenuPaths.includes(item.href));
  return {
    appName, pathname, signedIn, fitViewport, marketActive, searchViewport, marketNavigation,
    authLoading: loading, year: new Date().getFullYear(), badgeColors: getAccountBadgeColors(user),
    navigation: visibleNavigation.filter(item => !marketSubmenuPaths.includes(item.href)),
  };
};
