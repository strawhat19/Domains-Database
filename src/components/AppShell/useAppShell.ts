import { usePathname } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { routes, navigation } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { useWatching } from '../../shared/watching/useWatching';
import { useDomains } from '../../shared/domainContext/useDomains';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export { footerLinks } from '../../shared/routes';
export const useAppShell = () => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, loading } = useAuth();
  const { eligible, loading: connectionsLoading } = useConnectionAvailability();
  const { domains, loading: domainsLoading } = useDomains();
  const { records, loading: watchingLoading } = useWatching();
  const signedIn = !loading && Boolean(user?.id);
  const domainCount = domainsLoading ? undefined : domains.length;
  const watchingCount = watchingLoading ? undefined : records.filter(record => record.listName === `Watching`).length;
  const isBlogPage = pathname === routes.blog.href || pathname.startsWith(`${routes.blog.href}/`);
  const searchViewport = pathname === routes.search.href && width >= 1000;
  const publicPages = [routes.signin.href, routes.signup.href, routes.about.href, routes.terms.href, routes.contact.href, routes.privacy.href, `/api`] as string[];
  const fitViewport = publicPages.includes(pathname)
    || (!signedIn && !isBlogPage && pathname !== routes.home.href && pathname !== routes.domains.href && pathname !== routes.auction.href);
  const visibleNavigation = navigation.filter(item =>
    (item.href !== routes.search.href || eligible || connectionsLoading)
    && (item.href !== routes.community.href || signedIn)).map(item => {
      const count = item.href === routes.domains.href ? domainCount : item.href === routes.watching.href ? watchingCount : undefined;
      const countLoading = item.href === routes.domains.href ? domainsLoading : item.href === routes.watching.href && watchingLoading;
      const accessibilityLabel = count === undefined
        ? `${item.label}${`beta` in item && item.beta ? ` (Beta)` : ``}`
        : `${item.label}, ${count} Domain${count === 1 ? `` : `s`}${item.href === routes.watching.href ? ` in Watch List` : ` in Table`}`;
      return { ...item, count, countLoading, accessibilityLabel };
    });
  return { pathname, signedIn, fitViewport, searchViewport, year: new Date().getFullYear(), navigation: visibleNavigation };
};
