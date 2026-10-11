import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import SidebarTooltip from './SidebarTooltip.web';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useSidebarTooltip } from './useSidebarTooltip';
import { useAccountSidebar, type AccountSidebarProps, type SidebarLink } from './useAccountSidebar';

const AccountSidebar = (props: AccountSidebarProps) => {
  const state = useAccountSidebar(props);
  const { tooltip, tooltipEvents, keepTooltip, leaveTooltip, getTooltipProps } = useSidebarTooltip();
  const badge = (link: SidebarLink, id: string) => link.countLoading
    ? <span aria-hidden id={id} className={`account-sidebar-badge account-sidebar-count-skeleton`} />
    : link.count && link.count > 0 ? <span aria-hidden id={id} className={`account-sidebar-badge`}>{link.count.toLocaleString(`en-US`)}</span> : null;
  return (
    <nav
      {...tooltipEvents}
      id={`account-sidebar`}
      aria-label={`Account Navigation`}
      className={`account-sidebar${state.collapsed ? ` is-collapsed` : ``}`}
    >
      {state.countError && <p role={`status`} id={`account-sidebar-count-error`} className={`account-sidebar-count-error`} aria-label={`Menu Counts Unavailable: ${state.countError}`}>{`Menu Counts Unavailable`}</p>}
      {state.preferenceError && <p role={`status`} id={`account-sidebar-preference-error`} className={`account-sidebar-preference-error`} aria-label={state.preferenceError}>{state.preferenceError}</p>}
      <div id={`account-sidebar-links`} className={`account-sidebar-links`}>
        {state.groups.map(group => (
          <div key={group.id} id={`account-sidebar-${group.id}`} className={`account-sidebar-group`}>
            <h2 id={`account-sidebar-${group.id}-title`} className={`account-sidebar-title`}>{group.label}</h2>
            {group.links.map(link => {
              const Icon = link.Icon;
              const expanded = state.collapsed || state.expandedRoutes.includes(link.id);
              const id = `account-sidebar-${group.id}-${link.id}`;
              const hasChildren = Boolean(link.children?.length);
              return (
                <div key={link.id} id={id} className={`account-sidebar-item`}>
                  <div id={`${id}-heading`} className={`account-sidebar-heading${hasChildren ? ` has-submenu` : ``}${state.isGroupActive(link) ? ` is-current` : ``}`}>
                    <Link href={link.href} asChild>
                      <RouterAnchor
                        id={`${id}-link`}
                        aria-label={state.getCountLabel(link)}
                        className={`account-sidebar-link`}
                        aria-current={state.isActive(link) ? `page` : undefined}
                        {...getTooltipProps(`${id}-link`, state.collapsed ? state.getCountLabel(link) : undefined)}
                      >
                        <Icon size={17} aria-hidden id={`${id}-icon`} className={`account-sidebar-link-icon`} />
                        <span id={`${id}-label`} className={`account-sidebar-link-label`}>{link.label}</span>
                        {badge(link, `${id}-count`)}
                      </RouterAnchor>
                    </Link>
                    {hasChildren && !state.collapsed && (
                      <button
                        type={`button`}
                        id={`${id}-toggle`}
                        aria-expanded={expanded}
                        aria-controls={`${id}-submenu`}
                        className={`account-sidebar-toggle`}
                        onClick={() => state.toggleSubmenu(link.id)}
                        aria-label={`${expanded ? `Collapse` : `Expand`} ${link.label} Submenu`}
                        {...getTooltipProps(`${id}-toggle`, `${expanded ? `Collapse` : `Expand`} ${link.label}`)}
                      >
                        <ChevronDown size={16} aria-hidden id={`${id}-toggle-icon`} className={`account-sidebar-toggle-icon`} />
                      </button>
                    )}
                  </div>
                  {hasChildren && (
                    <div role={`group`} inert={!expanded} aria-hidden={!expanded} aria-labelledby={`${id}-link`} id={`${id}-submenu`} className={`account-sidebar-submenu${expanded ? ` is-open` : ``}`}>
                      <div id={`${id}-submenu-inner`} className={`account-sidebar-submenu-inner`}>
                        <div id={`${id}-submenu-links`} className={`account-sidebar-submenu-links`}>
                          {link.children?.map(child => {
                            const ChildIcon = child.Icon;
                            const childId = `${id}-${child.id}`;
                            return <Link key={child.id} href={child.href} asChild><RouterAnchor
                              id={childId}
                              aria-label={state.getCountLabel(child)}
                              className={`account-sidebar-link account-sidebar-child-link`}
                              aria-current={state.isActive(child) ? `page` : undefined}
                              {...getTooltipProps(childId, state.collapsed ? state.getCountLabel(child) : undefined)}
                            ><ChildIcon size={15} aria-hidden id={`${childId}-icon`} className={`account-sidebar-link-icon`} /><span id={`${childId}-label`} className={`account-sidebar-link-label`}>{child.label}</span>{badge(child, `${childId}-count`)}</RouterAnchor></Link>;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div id={`account-sidebar-footer`} className={`account-sidebar-footer`}>
        {!state.collapsed && <Link href={state.profileLink.href} asChild><RouterAnchor id={`account-sidebar-profile-link`} aria-label={`Profile`} aria-current={state.isActive(state.profileLink) ? `page` : undefined} className={`account-sidebar-link account-sidebar-profile-link`}>
          <span aria-hidden id={`account-sidebar-profile-avatar`} className={`account-sidebar-profile-avatar`}>
            <span id={`account-sidebar-profile-initial`} className={`account-sidebar-profile-initial`}>{state.initial}</span>
            {state.photoURL && <img alt={``} src={state.photoURL} key={state.photoURL} referrerPolicy={`no-referrer`} onError={state.handlePhotoError} id={`account-sidebar-profile-photo`} className={`account-sidebar-profile-photo`} />}
          </span>
          <span id={`account-sidebar-profile-label`} className={`account-sidebar-link-label`}>{`Profile`}</span>
        </RouterAnchor></Link>}
        <button {...getTooltipProps(`account-sidebar-collapse-toggle`, `${state.collapsed ? `Expand` : `Collapse`} Sidebar`)} type={`button`} onClick={state.toggleCollapsed} aria-expanded={!state.collapsed} id={`account-sidebar-collapse-toggle`} aria-controls={`account-sidebar-links`} className={`account-sidebar-link account-sidebar-collapse-toggle`} aria-label={`${state.collapsed ? `Expand` : `Collapse`} Sidebar`}><ChevronLeft size={19} strokeWidth={1.8} aria-hidden id={`account-sidebar-collapse-icon`} className={`account-sidebar-collapse-icon`} /></button>
      </div>
      <SidebarTooltip tooltip={tooltip} onPointerEnter={keepTooltip} onPointerLeave={leaveTooltip} />
    </nav>
  );
};

export default AccountSidebar;
