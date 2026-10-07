import { usePathname } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { routes, navigation } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export { footerLinks } from '../../shared/routes';
export const useAppShell = () => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, loading } = useAuth();
  const { eligible } = useConnectionAvailability();
  const signedIn = !loading && Boolean(user?.id);
  const isBlogPage = pathname === routes.blog.href || pathname.startsWith(`${routes.blog.href}/`);
  const searchViewport = pathname === routes.search.href && width >= 1000;
  const publicPages = [routes.signin.href, routes.signup.href, routes.about.href, routes.terms.href, routes.contact.href, routes.privacy.href, `/api`] as string[];
  const fitViewport = publicPages.includes(pathname)
    || (!signedIn && !isBlogPage && pathname !== routes.home.href && pathname !== routes.domains.href && pathname !== routes.auction.href);
  const visibleNavigation = navigation.filter(item =>
    (item.href !== routes.search.href || eligible)
    && (item.href !== routes.community.href || signedIn));
  return { pathname, signedIn, fitViewport, searchViewport, year: new Date().getFullYear(), navigation: visibleNavigation };
};
