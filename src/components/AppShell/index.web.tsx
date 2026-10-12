import './styles.scss';
import Toast from '../Toast';
import BrandLogo from '../BrandLogo';
import './account-shell.scss';
import '../../styles/global.scss';
import { Link } from 'expo-router';
import UserMenu from '../UserMenu';
import ThemeToggle from '../ThemeToggle';
import ScrollToTop from '../ScrollToTop';
import RouterAnchor from '../RouterAnchor';
import AuthFeedback from '../AuthFeedback';
import DomainMarquee from '../DomainMarquee';
import AccountBackdrop from '../AccountBackdrop';
import { routes, isAdminPath } from '../../shared/routes';
import { useDomainsMenu } from './useDomainsMenu';
import NotificationBell from '../NotificationBell';
import { useShellScroll } from './useShellScroll.web';
import { useAppShell, footerLinks } from './useAppShell';
import { useMobileNavigation } from './useMobileNavigation';
import type { CSSProperties, PropsWithChildren } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { X, Eye, Menu, Info, Mail, Gavel, House, Wallet, Search, Globe2, BookOpen, FileText, UsersRound, ChevronDown, ArrowUpRight, ShieldCheck } from 'lucide-react';

const domainSubmenuPaths: string[] = [routes.search.href, routes.watching.href, routes.auction.href, routes.community.href];

const AppShell = ({ children, sticky = true }: PropsWithChildren<{ sticky?: boolean }>) => {
  const { pathname, year, appName, signedIn, navigation, badgeColors, fitViewport, searchViewport, authLoading } = useAppShell();
  const { error: themeError, clearError: clearThemeError } = useTheme();
  const { flags, ready: featuresReady } = useFeatureFlags();
  const domainsMenu = useDomainsMenu(pathname);
  const mobileNavigation = useMobileNavigation(pathname);
  const scroll = useShellScroll(mobileNavigation.headerRef, pathname, sticky);
  const mobileSignIn = mobileNavigation.compact && !signedIn && !authLoading;
  const accountShell = isAdminPath(pathname) || pathname === routes.profile.href || pathname.startsWith(`${routes.profile.href}/`);
  const navigationLinks = navigation.filter(item => !mobileNavigation.compact || item.href !== routes.watching.href);
  const MenuIcon = mobileNavigation.open ? X : Menu;
  const domainSubmenuLinks = navigationLinks.filter(item => domainSubmenuPaths.includes(item.href));
  const headerLinks = navigationLinks.filter(item => !domainsMenu.grouped || !domainSubmenuPaths.includes(item.href));
  const renderNavigationLink = (item: (typeof navigation)[number]) => {
    const Icon = { Eye, Info, Mail, Gavel, House, Wallet, Search, Globe2, BookOpen, UsersRound }[item.icon];
    const beta = `beta` in item && item.beta;
    const active = pathname === item.href || (item.href === routes.blog.href && pathname.startsWith(`${item.href}/`));
    return (
      <Link key={item.label} href={item.href} asChild>
        <RouterAnchor
          onClick={domainsMenu.close}
          id={`header-link-${item.label.toLowerCase()}`}
          aria-label={item.accessibilityLabel}
          aria-busy={item.countLoading || undefined}
          aria-current={active ? `page` : undefined}
          className={`header-link${active ? ` header-link-active` : ``}`}
        >
          <Icon
            size={14}
            aria-hidden={`true`}
            className={`header-link-icon`}
            id={`header-link-icon-${item.label.toLowerCase()}`}
          />
          <span
            className={`header-link-text`}
            id={`header-link-text-${item.label.toLowerCase()}`}
          >
            {item.label}
          </span>
          {(item.countLoading || (item.count ?? 0) > 0) && (
            <span
              aria-hidden
              className={`header-link-count${item.countLoading ? ` header-link-count-skeleton` : ``}`}
              id={`header-link-count-${item.label.toLowerCase()}`}
            >
              {item.countLoading ? null : item.count}
            </span>
          )}
          {beta && (
            <span
              aria-hidden
              className={`header-link-beta`}
              id={`header-link-beta-${item.label.toLowerCase()}`}
            >
              {`Beta`}
            </span>
          )}
        </RouterAnchor>
      </Link>
    );
  };

  return (
    <div
      id={`app-shell`}
      className={`app-shell`}
      data-account-shell={accountShell || undefined}
      data-landing={pathname === routes.home.href || undefined}
      data-fit-view={fitViewport || undefined}
      data-auth-page={pathname === routes.signin.href || pathname === routes.signup.href || undefined}
      data-profile-page={pathname === routes.profile.href || undefined}
      data-connections-page={pathname === routes.connections.href || undefined}
      data-search-viewport={searchViewport || undefined}
      style={{
        [`--account-badge-color`]: badgeColors.color,
        [`--account-badge-background`]: badgeColors.backgroundColor,
        [`--site-header-offset`]: `${scroll.headerHeight}px`,
        [`--site-footer-height`]: scroll.footerHeight ? `${scroll.footerHeight}px` : undefined,
        [`--shell-header-height`]: scroll.pageHeaderHeight ? `${scroll.pageHeaderHeight}px` : undefined,
      } as CSSProperties}
    >
      {accountShell ? <AccountBackdrop /> : null}
      <header ref={mobileNavigation.headerRef} id={`site-header`} className={`site-header`} data-sticky={sticky} data-scrolled={scroll.scrolled || undefined}>
        {featuresReady && flags.domainMarquee && <DomainMarquee />}
        <div id={`header-inner`} className={`header-inner`}>
          <Link href={`/`} asChild>
            <RouterAnchor
              id={`header-brand`}
              onClick={mobileNavigation.close}
              className={`header-brand`}
              aria-label={`${appName} Home`}
            >
              <BrandLogo id={`header-logo`} className={`header-logo`} />
            </RouterAnchor>
          </Link>
          <nav
            id={`header-navigation`}
            aria-label={`Main Navigation`}
            onClick={mobileNavigation.close}
            ref={mobileNavigation.navigationRef}
            inert={mobileNavigation.compact && !mobileNavigation.open}
            aria-hidden={mobileNavigation.compact && !mobileNavigation.open ? true : undefined}
            className={`header-navigation${mobileNavigation.open ? ` header-navigation-open` : ``}`}
          >
            <div id={`header-navigation-content`} className={`header-navigation-content`}>
              <div
                id={`header-navigation-links`}
                className={`header-navigation-links`}
              >
                {headerLinks.map(item => {
                  if (item.href !== routes.domains.href || !domainsMenu.grouped || !domainSubmenuLinks.length) return renderNavigationLink(item);
                  return (
                    <div
                      key={item.label}
                      ref={domainsMenu.rootRef}
                      id={`header-domains-menu`}
                      className={`header-domains-menu`}
                      data-open={domainsMenu.open || undefined}
                      data-active={pathname === item.href || domainSubmenuLinks.some(link => pathname === link.href) || undefined}
                      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) domainsMenu.close(); }}
                      onPointerEnter={event => { if (event.pointerType === `mouse`) domainsMenu.expand(); }}
                      onPointerLeave={event => { if (!event.currentTarget.querySelector(`#header-domains-submenu`)?.contains(document.activeElement)) domainsMenu.close(); }}
                    >
                      <div id={`header-domains-parent`} className={`header-domains-parent`}>
                        {renderNavigationLink(item)}
                        <button
                          type={`button`}
                          ref={domainsMenu.toggleRef}
                          onClick={domainsMenu.toggle}
                          id={`header-domains-toggle`}
                          className={`header-domains-toggle`}
                          aria-expanded={domainsMenu.open}
                          aria-controls={`header-domains-submenu`}
                          aria-label={domainsMenu.open ? `Collapse Domains Submenu` : `Expand Domains Submenu`}
                        >
                          <ChevronDown size={14} aria-hidden id={`header-domains-chevron`} className={`header-domains-chevron`} />
                        </button>
                      </div>
                      <div
                        role={`group`}
                        inert={!domainsMenu.open}
                        id={`header-domains-submenu`}
                        className={`header-domains-submenu`}
                        aria-hidden={!domainsMenu.open}
                        aria-label={`Domains Submenu`}
                      >
                        {domainSubmenuLinks.map(renderNavigationLink)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {mobileSignIn && (
                <div id={`header-mobile-signin`} className={`header-mobile-signin`}>
                  <UserMenu />
                </div>
              )}
            </div>
          </nav>
          <div id={`header-actions`} className={`header-actions`}>
            <ThemeToggle />
            {featuresReady && flags.notifications && <NotificationBell />}
            {!mobileSignIn && <UserMenu />}
            <button
              type={`button`}
              id={`header-menu-toggle`}
              className={`header-menu-toggle`}
              ref={mobileNavigation.toggleRef}
              onClick={mobileNavigation.toggle}
              aria-controls={`header-navigation`}
              aria-expanded={mobileNavigation.open}
              aria-label={mobileNavigation.open ? `Collapse Navigation Menu` : `Expand Navigation Menu`}
            >
              <MenuIcon size={18} aria-hidden={`true`} id={`header-menu-icon`} className={`header-menu-icon`} />
            </button>
          </div>
        </div>
      </header>
      <main id={`main-content`} className={`main-content`}>
        {children}
      </main>
      <AuthFeedback />
      <Toast id={`theme-preference-error`} message={themeError} onDismiss={clearThemeError} />
      <ScrollToTop
        visible={scroll.showScrollTop}
        onPress={scroll.scrollToTop}
        bottomInset={scroll.bottomInset}
        rightInset={scroll.scrollTopRightInset}
      />
      <footer id={`site-footer`} className={`site-footer`}>
        <div id={`footer-inner`} className={`footer-inner`}>
          <p id={`footer-copyright`} className={`footer-copyright`}>
            {`© ${year}`}
            <span id={`footer-copyright-name`} className={`footer-copyright-name`}>
              {` ${appName}.`}
            </span>
          </p>
          <nav id={`footer-navigation`} className={`footer-navigation`} aria-label={`Footer Navigation`}>
            {footerLinks.map(item => {
              const Icon = { FileText, ShieldCheck }[item.icon];
              return (
                <Link key={item.label} href={item.href} asChild>
                  <RouterAnchor
                    className={`footer-link`}
                    id={`footer-link-${item.label.toLowerCase()}`}
                    aria-current={pathname === item.href ? `page` : undefined}
                  >
                    <Icon id={`footer-link-icon-${item.label.toLowerCase()}`} className={`footer-link-icon`} size={12} aria-hidden />
                    {item.label}
                  </RouterAnchor>
                </Link>
              );
            })}
          </nav>
          <p id={`footer-credit`} className={`footer-credit`}>
            <span id={`footer-credit-label`} className={`footer-credit-label`}>
              {`Crafted by `}
            </span>
            <a id={`footer-piratechs`} className={`footer-piratechs`} href={`https://piratechs.com/`} target={`_blank`} rel={`noopener noreferrer`}>
              {`Piratechs`}
              <ArrowUpRight id={`footer-piratechs-icon`} className={`footer-piratechs-icon`} size={12} aria-hidden />
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
