import { useState } from 'react';
import { usePathname } from 'expo-router';
import { routes } from '../../shared/routes';
import { useWindowDimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useWatching } from '../../shared/watching/useWatching';
import { canAccessAdmin, type AdminSection } from '../../shared/admin/permissions';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';
import { useAccountNavigationState } from '../../shared/accountNavigationContext/useAccountNavigationState';
import { Eye, Bell, Wallet, Globe2, PlugZap, Activity, FileText, UserRound, UsersRound, MessageCircle, LayoutDashboard, ChartNoAxesCombined } from 'lucide-react-native';

type RouteHref = (typeof routes)[keyof typeof routes][`href`];
export type AccountSidebarSection = `profile` | `connections` | AdminSection;
export type AccountSidebarProps = { section?: AccountSidebarSection; counts?: Partial<Record<AdminSection, number>>; countsLoading?: boolean };
export type SidebarLink = { id: string; label: string; href: RouteHref; Icon: LucideIcon; count?: number; countLoading?: boolean; section?: AdminSection; children?: readonly SidebarLink[] };

export const useAccountSidebar = ({ section, counts, countsLoading = false }: AccountSidebarProps = {}) => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { palette } = useTheme();
  const navigation = useAccountNavigationState();
  const { records, loading: watchingLoading, error: watchingError } = useWatching();
  const { verifiedConnectionCount, connectionsCountLoading, error: connectionError } = useConnectionAvailability();
  const [failedPhotoURL, setFailedPhotoURL] = useState(``);
  const profileLink: SidebarLink = { id: `profile`, Icon: UserRound, label: `Profile`, href: routes.profile.href };
  const accountLinks: SidebarLink[] = [
    profileLink,
    { id: `watching`, Icon: Eye, label: `Watching`, href: routes.watching.href, countLoading: watchingLoading, count: watchingError ? undefined : records.filter(record => record.listName === `Watching`).length },
    { id: `connections`, Icon: PlugZap, label: `Connections`, href: routes.connections.href, count: connectionError ? undefined : verifiedConnectionCount, countLoading: connectionsCountLoading },
  ];
  const adminCandidates: SidebarLink[] = [
    { id: `users`, Icon: UsersRound, ...routes.adminUsers, section: `users`, count: counts?.users, countLoading: countsLoading },
    { id: `domains`, Icon: Globe2, ...routes.adminDomains, section: `domains`, count: counts?.domains, countLoading: countsLoading },
    { id: `plans`, Icon: Wallet, ...routes.adminPlans, section: `plans` },
    { id: `notifications`, Icon: Bell, ...routes.adminNotifications, section: `notifications`, count: counts?.notifications, countLoading: countsLoading },
    { id: `requests`, Icon: MessageCircle, ...routes.adminRequests, section: `requests` },
    { id: `reports`, Icon: FileText, ...routes.adminReports, section: `reports` },
    { id: `analytics`, Icon: ChartNoAxesCombined, ...routes.adminAnalytics, section: `analytics` },
    { id: `observability`, Icon: Activity, ...routes.adminObservability, section: `observability` },
  ];
  const adminChildren = adminCandidates.filter(link => canAccessAdmin(user, link.section));
  const adminLinks: SidebarLink[] = canAccessAdmin(user) ? [{ id: `dashboard`, Icon: LayoutDashboard, ...routes.dashboard, label: `Dashboard`, section: `overview`, children: adminChildren }] : [];
  const visibleAccounts = navigation.collapsed ? accountLinks : accountLinks.filter(link => link.id !== `profile`);
  const groups = [
    ...(visibleAccounts.length ? [{ id: `account`, label: `ACCOUNT`, links: visibleAccounts }] : []),
    ...(adminLinks.length ? [{ id: `admin`, label: `ADMIN`, links: adminLinks }] : []),
  ];
  const isActive = (link: SidebarLink) => section ? (link.section ?? link.id) === section : pathname === link.href;
  const photoURL = user?.photoURL && user.photoURL !== failedPhotoURL ? user.photoURL : undefined;
  const getCountLabel = (link: SidebarLink) => link.countLoading ? `${link.label}, Loading Item Count` : link.count === undefined ? link.label : `${link.label}, ${link.count} Item(s)`;
  return {
    user, groups, palette, photoURL, profileLink, isActive, getCountLabel, ...navigation,
    compact: width <= 650,
    countError: connectionError || watchingError,
    initial: user?.name?.trim()?.[0]?.toUpperCase() || `U`,
    handlePhotoError: () => setFailedPhotoURL(photoURL ?? ``),
    isGroupActive: (link: SidebarLink) => isActive(link) || Boolean(link.children?.some(isActive)),
  };
};
