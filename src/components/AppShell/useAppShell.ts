import { usePathname } from 'expo-router';
import { routes, navigation } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export { footerLinks } from '../../shared/routes';
export const useAppShell = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { eligible } = useConnectionAvailability();
  const signedIn = !loading && Boolean(user?.id);
  const publicPages = [routes.signin.href, routes.signup.href, routes.about.href, routes.terms.href, routes.contact.href, routes.privacy.href, `/api`] as string[];
  const fitViewport = publicPages.includes(pathname)
    || (!signedIn && pathname !== routes.home.href && pathname !== routes.domains.href);
  const visibleNavigation = navigation.filter(item =>
    (item.href !== routes.search.href || eligible)
    && (item.href !== routes.community.href || signedIn));
  return { pathname, signedIn, fitViewport, year: new Date().getFullYear(), navigation: visibleNavigation };
};
