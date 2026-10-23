import { useState } from 'react';
import { usePathname } from 'expo-router';
import { routes } from '../../shared/routes';
import { useWindowDimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { canAccessAdmin, type AdminSection } from '../../shared/admin/permissions';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';
import { useAccountNavigationState } from '../../shared/accountNavigationContext/useAccountNavigationState';
import { Bot, Star, Bell, Wallet, PlugZap, Activity, FileText, UserRound, UsersRound, CalendarDays, ClipboardList, MessageCircle, MessagesSquare, LayoutDashboard, SlidersHorizontal, ChartNoAxesCombined } from 'lucide-react-native';

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
  const { verifiedConnectionCount, connectionsCountLoading, error: connectionError } = useConnectionAvailability();
  const [failedPhotoURL, setFailedPhotoURL] = useState(``);
  const profileLink: SidebarLink = { id: `profile`, Icon: UserRound, label: `Profile`, href: routes.profile.href };
  const accountLinks: SidebarLink[] = [
    profileLink,
    { id: `connections`, Icon: PlugZap, label: `Connections`, href: routes.connections.href, count: connectionError ? undefined : verifiedConnectionCount, countLoading: connectionsCountLoading },
  ];
  const feedbackCandidates: SidebarLink[] = [
    { id: `formSubmissions`, Icon: ClipboardList, ...routes.adminFormSubmissions, section: `formSubmissions` },
    { id: `reviews`, Icon: Star, ...routes.adminReviews, section: `reviews` },
    { id: `aiChats`, Icon: Bot, ...routes.adminAIChats, section: `aiChats` },
    { id: `messages`, Icon: MessagesSquare, ...routes.adminMessages, section: `messages` },
  ];
  const feedbackChildren = feedbackCandidates.filter(link => canAccessAdmin(user, link.section));
  const adminCandidates: SidebarLink[] = [
    { id: `users`, Icon: UsersRound, ...routes.adminUsers, section: `users`, count: counts?.users, countLoading: countsLoading },
    { id: `events`, Icon: CalendarDays, ...routes.adminEvents, section: `events` },
    { id: `notifications`, Icon: Bell, ...routes.adminNotifications, section: `notifications`, count: counts?.notifications, countLoading: countsLoading },
    { id: `reports`, Icon: FileText, ...routes.adminReports, section: `reports` },
    { id: `plans`, Icon: Wallet, ...routes.adminPlans, section: `plans` },
    { id: `payments`, Icon: Wallet, ...routes.adminPayments, section: `payments` },
    { id: `observability`, Icon: Activity, ...routes.adminObservability, section: `observability` },
    { id: `analytics`, Icon: ChartNoAxesCombined, ...routes.adminAnalytics, section: `analytics` },
    { id: `features`, Icon: SlidersHorizontal, ...routes.adminFeatures, section: `features` },
  ];
  const adminChildren = adminCandidates.filter(link => canAccessAdmin(user, link.section));
  const adminLinks: SidebarLink[] = [
    ...(canAccessAdmin(user) ? [{ id: `dashboard`, Icon: LayoutDashboard, ...routes.dashboard, label: `Dashboard`, section: `overview` as const, children: adminChildren }] : []),
    ...(canAccessAdmin(user, `feedback`) ? [{ id: `feedback`, Icon: MessageCircle, ...routes.adminFeedback, section: `feedback` as const, children: feedbackChildren }] : []),
  ];
  const groups = [
    { id: `account`, label: `ACCOUNT`, links: accountLinks },
    ...(adminLinks.length ? [{ id: `admin`, label: `ADMIN`, links: adminLinks }] : []),
  ];
  const isActive = (link: SidebarLink) => section ? (link.section ?? link.id) === section : pathname === link.href;
  const isGroupActive = (link: SidebarLink): boolean => isActive(link) || Boolean(link.children?.some(isGroupActive));
  const photoURL = user?.photoURL && user.photoURL !== failedPhotoURL ? user.photoURL : undefined;
  const getCountLabel = (link: SidebarLink) => link.countLoading ? `${link.label}, Loading Item Count` : link.count === undefined ? link.label : `${link.label}, ${link.count} Item(s)`;
  return {
    user, groups, palette, photoURL, profileLink, isActive, isGroupActive, getCountLabel, ...navigation,
    compact: width <= 650,
    countError: connectionError,
    initial: user?.name?.trim()?.[0]?.toUpperCase() || `U`,
    handlePhotoError: () => setFailedPhotoURL(photoURL ?? ``),
  };
};
