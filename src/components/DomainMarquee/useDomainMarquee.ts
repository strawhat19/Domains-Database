import { useMemo } from 'react';
import { routes } from '../../shared/routes';
import { useAppFonts } from '../../shared/useAppFonts';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import { useNotifications } from '../../shared/notifications/useNotifications';

export interface DomainMarqueeItem {
  id: string;
  href: string;
  label: string;
  title: string;
  domain?: string;
  iconUrl?: string;
  external: boolean;
  icon: `Globe2` | `Info` | `Sparkles`;
}

export const useDomainMarquee = () => {
  const [fontsLoaded, fontError] = useAppFonts();
  const { user, loading: authLoading } = useAuth();
  const { domains, loaded, loading: domainLoading } = useDomains();
  const { notifications, loading: notificationLoading } = useNotifications();
  const userDomains = useMemo(() => domains.filter(domain => !domain.isSample), [domains]);
  const showDomains = !authLoading && loaded && Boolean(user?.id) && userDomains.length > 10;

  const items = useMemo<DomainMarqueeItem[]>(() => {
    const values: DomainMarqueeItem[] = showDomains
      ? userDomains.map(domain => ({
        id: domain.id,
        icon: `Globe2`,
        external: true,
        label: domain.name,
        title: domain.name,
        domain: domain.name,
        href: `https://${domain.name}`,
        iconUrl: getCustomSiteIconUrl(domain),
      }))
      : notifications.map(notification => ({
        external: false,
        id: notification.id,
        icon: notification.icon,
        href: `${routes.notifications.href}/${encodeURIComponent(notification.id)}`,
        title: notification.title,
        label: notification.message ?? `${notification.before}sign up${notification.after}`,
      }));
    return values.sort((left, right) => left.label.localeCompare(right.label, `en`, { sensitivity: `base` }));
  }, [showDomains, userDomains, notifications]);

  return {
    items,
    showDomains,
    loading: authLoading || (!fontsLoaded && !fontError) || (Boolean(user?.id) && domainLoading) || (!items.length && notificationLoading),
  };
};
