import '../AccountSidebar/styles.scss';
import './styles.scss';
import { usePathname } from 'expo-router';
import { routes, isAdminPath } from '../../shared/routes';
import ProfileSkeleton from './ProfileSkeleton.web';
import AdminSkeleton from '../AdminAnalytics/Skeleton';
import DashboardSkeleton from './DashboardSkeleton.web';
import { Wallet, PlugZap, UserRound, ChevronLeft, LayoutDashboard, ChartNoAxesCombined } from 'lucide-react';
import { useAccountNavigationState } from '../../shared/accountNavigationContext/useAccountNavigationState';

const navigation = [
  { id: `profile`, Icon: UserRound },
  { id: `connections`, Icon: PlugZap },
  { id: `dashboard`, Icon: LayoutDashboard },
];

const AccountLoadingSkeleton = () => {
  const pathname = usePathname();
  const { collapsed } = useAccountNavigationState();
  const connections = pathname === routes.connections.href;
  const dashboard = pathname === routes.dashboard.href || pathname === `/admin`;
  const analytics = [routes.adminPayments.href, routes.adminAnalytics.href, routes.adminObservability.href].some(href => href === pathname);
  const admin = isAdminPath(pathname);
  const title = dashboard ? `Dashboard` : admin ? Object.values(routes).find(route => route.href === pathname)?.label ?? `Dashboard` : connections ? `Connections` : `Profile`;
  const selected = admin ? `dashboard` : connections ? `connections` : `profile`;
  const TitleIcon = pathname === routes.adminPayments.href ? Wallet : analytics ? ChartNoAxesCombined : LayoutDashboard;

  return <section id={`account-loading-skeleton`} role={`status`} aria-busy={`true`} aria-label={`Loading ${title}`} className={`account-layout account-loading-skeleton`}>
    <span id={`account-loading-status`} className={`account-loading-status`}>Loading Your {title}…</span>
    <aside id={`account-loading-sidebar`} aria-hidden={`true`} className={`account-sidebar account-loading-sidebar${collapsed ? ` is-collapsed` : ``}`}>
      <div id={`account-loading-sidebar-links`} className={`account-loading-sidebar-links`}>
        <span id={`account-loading-sidebar-account-label`} className={`account-loading-sidebar-title`}>ACCOUNT</span>
        <div id={`account-loading-navigation`} className={`account-loading-navigation`}>
          {navigation.map(({ id, Icon }) => <div key={id} id={`account-loading-navigation-${id}`} className={`account-loading-navigation-item${selected === id ? ` is-selected` : ``}`}>
            <Icon size={15} id={`account-loading-navigation-icon-${id}`} />
            <span id={`account-loading-navigation-label-${id}`} className={`account-loading-placeholder account-loading-navigation-line`} />
          </div>)}
        </div>
        <div id={`account-loading-sidebar-submenu`} className={`account-loading-sidebar-submenu`}>
          {[0, 1, 2, 3].map(index => <div key={index} id={`account-loading-sidebar-child-${index}`} className={`account-loading-navigation-item`}>
            <span id={`account-loading-sidebar-child-icon-${index}`} className={`account-loading-placeholder is-icon`} />
            <span id={`account-loading-sidebar-child-label-${index}`} className={`account-loading-placeholder account-loading-navigation-line`} />
          </div>)}
        </div>
      </div>
      <div id={`account-loading-sidebar-footer`} className={`account-loading-sidebar-footer`}>
        <span id={`account-loading-sidebar-avatar`} className={`account-loading-sidebar-avatar`}><UserRound size={16} id={`account-loading-sidebar-avatar-icon`} /></span>
        <span id={`account-loading-sidebar-profile`} className={`account-loading-placeholder account-loading-navigation-line`} />
        <ChevronLeft size={19} id={`account-loading-sidebar-collapse`} />
      </div>
    </aside>
    <div id={`account-loading-content`} aria-hidden={`true`} className={`account-loading-content`}>
      {admin && <div id={`account-loading-heading`} className={`account-loading-heading`}>
        <span id={`account-loading-eyebrow`} className={`account-loading-eyebrow`}>ADMIN · DASHBOARD</span>
        <h1 id={`account-loading-title`} className={`account-loading-title`}><TitleIcon size={28} id={`account-loading-title-icon`} />{title}</h1>
      </div>}
      {dashboard || analytics ? <DashboardSkeleton /> : admin ? <AdminSkeleton id={`account-loading-records`} label={`Loading ${title}`} variant={`table`} /> : <ProfileSkeleton connections={connections} />}
    </div>
  </section>;
};

export default AccountLoadingSkeleton;
