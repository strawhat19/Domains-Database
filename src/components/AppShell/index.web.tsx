import './styles.scss';
import '../../styles/global.scss';
import { Link } from 'expo-router';
import Toast from '../Toast';
import UserMenu from '../UserMenu';
import ThemeToggle from '../ThemeToggle';
import ScrollToTop from '../ScrollToTop';
import DomainMarquee from '../DomainMarquee';
import RouterAnchor from '../RouterAnchor';
import AuthFeedback from '../AuthFeedback';
import NotificationBell from '../NotificationBell';
import { routes } from '../../shared/routes';
import type { CSSProperties, PropsWithChildren } from 'react';
import { useShellScroll } from './useShellScroll.web';
import { useMobileNavigation } from './useMobileNavigation';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAppShell, footerLinks } from './useAppShell';
import { X, Eye, Menu, Info, Mail, Gavel, House, Search, Globe2, BookOpen, FileText, UsersRound, ArrowUpRight, ShieldCheck } from 'lucide-react';

const AppShell = ({ children, sticky = true }: PropsWithChildren<{ sticky?: boolean }>) => {
  const { pathname, year, signedIn, navigation, fitViewport, searchViewport } = useAppShell();
  const { isDark, error: themeError, clearError: clearThemeError } = useTheme();
  const mobileNavigation = useMobileNavigation(pathname);
  const scroll = useShellScroll(mobileNavigation.headerRef, pathname, sticky);
  const mobileSignIn = mobileNavigation.compact && !signedIn;
  const navigationLinks = navigation.filter(item => !mobileNavigation.compact || item.href !== routes.watching.href);
  const topRowCount = Math.ceil(navigationLinks.length / 2);
  const bottomRowCount = Math.max(1, navigationLinks.length - topRowCount);
  const MenuIcon = mobileNavigation.open ? X : Menu;

  return (
    <div
      id={`app-shell`}
      className={`app-shell`}
      data-fit-view={fitViewport || undefined}
      data-search-viewport={searchViewport || undefined}
      style={{
        [`--site-header-offset`]: `${scroll.headerHeight}px`,
        [`--site-footer-height`]: scroll.footerHeight ? `${scroll.footerHeight}px` : undefined,
        [`--shell-header-height`]: scroll.pageHeaderHeight ? `${scroll.pageHeaderHeight}px` : undefined,
      } as CSSProperties}
    >
      <header ref={mobileNavigation.headerRef} id={`site-header`} className={`site-header`} data-sticky={sticky} data-scrolled={scroll.scrolled || undefined}>
        <DomainMarquee />
        <div id={`header-inner`} className={`header-inner`}>
          <Link href={`/`} asChild>
            <RouterAnchor
              id={`header-brand`}
              onClick={mobileNavigation.close}
              className={`header-brand`}
              aria-label={`Domains Database Home`}
            >
              <img
                height={280}
                width={1080}
                id={`header-logo`}
                src={isDark ? `/brand-logo-dark.svg` : `/brand-logo.svg`}
                alt={`Domains Database`}
                className={`header-logo`}
              />
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
                style={{
                  [`--header-navigation-top-span`]: bottomRowCount,
                  [`--header-navigation-bottom-span`]: topRowCount,
                  [`--header-navigation-columns`]: topRowCount * bottomRowCount,
                } as CSSProperties}
              >
                {navigationLinks.map((item, index) => {
                  const Icon = { Eye, Info, Mail, Gavel, House, Search, Globe2, BookOpen, UsersRound }[item.icon];
                  const beta = `beta` in item && item.beta;
                  const active = pathname === item.href || (item.href === routes.blog.href && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link key={item.label} href={item.href} asChild>
                      <RouterAnchor
                        id={`header-link-${item.label.toLowerCase()}`}
                        className={`header-link${index >= topRowCount ? ` header-link-bottom-row` : ``}${active ? ` header-link-active` : ``}`}
                        aria-label={item.accessibilityLabel}
                        aria-current={active ? `page` : undefined}
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
                        {item.count !== undefined && (
                          <span
                            aria-hidden
                            className={`header-link-count`}
                            id={`header-link-count-${item.label.toLowerCase()}`}
                          >
                            {item.count}
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
            <NotificationBell />
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
      <ScrollToTop visible={scroll.showScrollTop} onPress={scroll.scrollToTop} bottomInset={scroll.bottomInset} />
      <footer id={`site-footer`} className={`site-footer`}>
        <div id={`footer-inner`} className={`footer-inner`}>
          <p id={`footer-copyright`} className={`footer-copyright`}>
            {`© ${year}`}
            <span id={`footer-copyright-name`} className={`footer-copyright-name`}>
              {` Domains Database.`}
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
