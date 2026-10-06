import { routes } from '../../shared/routes';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useAppFonts } from '../../shared/useAppFonts';
import { notificationsAPI } from '../../api/notifications';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import type { HeaderNotification } from '../../shared/sampleNotifications';

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
  const { domains, loading: domainsLoading } = useDomains();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const userDomains = useMemo(() => domains.filter(domain => !domain.isSample), [domains]);
  const showDomains = !authLoading && !domainsLoading && Boolean(user?.id) && userDomains.length > 10;

  useEffect(() => {
    let mounted = true;
    void notificationsAPI.getSampleNotifications().then(items => {
      if (!mounted) return;
      setNotifications(items);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

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
        href: routes.signup.href,
        title: notification.title,
        label: `${notification.before}sign up${notification.after}`,
      }));
    return values.sort((left, right) => left.label.localeCompare(right.label, `en`, { sensitivity: `base` }));
  }, [showDomains, userDomains, notifications]);

  return {
    items,
    showDomains,
    loading: authLoading || (Boolean(user?.id) && domainsLoading) || (!fontsLoaded && !fontError) || (!showDomains && loading),
  };
};
