import './styles.scss';
import '../../styles/global.scss';
import { Link } from 'expo-router';
import UserMenu from '../UserMenu';
import ThemeToggle from '../ThemeToggle';
import RouterAnchor from '../RouterAnchor';
import AuthFeedback from '../AuthFeedback';
import NotificationBell from '../NotificationBell';
import type { PropsWithChildren } from 'react';
import { useMobileNavigation } from './useMobileNavigation';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAppShell, footerLinks } from './useAppShell';
import { X, Menu, Info, Mail, House, Search, Globe2, FileText, UsersRound, ArrowUpRight, ShieldCheck } from 'lucide-react';

const AppShell = ({ children }: PropsWithChildren) => {
  const { pathname, year, navigation } = useAppShell();
  const { isDark } = useTheme();
  const mobileNavigation = useMobileNavigation(pathname);
  const MenuIcon = mobileNavigation.open ? X : Menu;

  return (
    <div id={`app-shell`} className={`app-shell`}>
      <header ref={mobileNavigation.headerRef} id={`site-header`} className={`site-header`}>
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
              <div id={`header-navigation-links`} className={`header-navigation-links`}>
                {navigation.map(item => {
                  const Icon = { Info, Mail, House, Search, Globe2, UsersRound }[item.icon];
                  return (
                    <Link key={item.label} href={item.href} asChild>
                      <RouterAnchor
                        id={`header-link-${item.label.toLowerCase()}`}
                        className={`header-link${pathname === item.href ? ` header-link-active` : ``}`}
                        aria-current={pathname === item.href ? `page` : undefined}
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
                      </RouterAnchor>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
          <div id={`header-actions`} className={`header-actions`}>
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
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
              <span id={`header-menu-text`} className={`header-menu-text`}>
                {mobileNavigation.open ? `Close` : `Menu`}
              </span>
            </button>
          </div>
        </div>
      </header>
      <main id={`main-content`} className={`main-content`}>
        {children}
      </main>
      <AuthFeedback />
      <footer id={`site-footer`} className={`site-footer`}>
        <div id={`footer-inner`} className={`footer-inner`}>
          <p id={`footer-copyright`} className={`footer-copyright`}>
            {`© ${year} Domains Database. Crafted by `}
            <a id={`footer-piratechs`} className={`footer-piratechs`} href={`https://piratechs.com/`} target={`_blank`} rel={`noopener noreferrer`}>
              {`Piratechs`}
              <ArrowUpRight id={`footer-piratechs-icon`} className={`footer-piratechs-icon`} size={12} aria-hidden />
            </a>
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
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
