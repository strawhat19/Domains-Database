import './styles.scss';
import { Link } from 'expo-router';
import '../../styles/global.scss';
import RouterAnchor from '../RouterAnchor';
import ThemeToggle from '../ThemeToggle';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Layers3, Grid2X2, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAppShell, navigation, footerLinks } from './useAppShell';

const AppShell = ({ children }: PropsWithChildren) => {
  const { pathname, year } = useAppShell();
  const { isDark } = useTheme();

  return (
    <div id={`app-shell`} className={`app-shell`}>
      <header id={`site-header`} className={`site-header`}>
        <div id={`header-inner`} className={`header-inner`}>
          <Link href={`/`} asChild>
            <RouterAnchor
              id={`header-brand`}
              className={`header-brand`}
              aria-label={`Domains Database Home`}
            >
              <img
                height={70}
                width={240}
                id={`header-logo`}
                src={isDark ? `/brand-logo-dark.svg` : `/brand-logo.svg`}
                alt={`Domains Database`}
                className={`header-logo`}
              />
            </RouterAnchor>
          </Link>
          <nav id={`header-navigation`} className={`header-navigation`} aria-label={`Main Navigation`}>
            {navigation.map(item => (
              <Link key={item.label} href={item.href} asChild>
                <RouterAnchor
                  id={`header-link-${item.label.toLowerCase()}`}
                  className={`header-link${pathname === item.href ? ` header-link-active` : ``}`}
                  aria-current={pathname === item.href ? `page` : undefined}
                >
                  {item.href === `/` ? (
                    <Grid2X2
                      size={14}
                      aria-hidden={`true`}
                      className={`header-link-icon`}
                      id={`header-link-icon-${item.label.toLowerCase()}`}
                    />
                  ) : (
                    <Layers3
                      size={14}
                      aria-hidden={`true`}
                      className={`header-link-icon`}
                      id={`header-link-icon-${item.label.toLowerCase()}`}
                    />
                  )}
                  <span
                    className={`header-link-text`}
                    id={`header-link-text-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </span>
                </RouterAnchor>
              </Link>
            ))}
          </nav>
          <div id={`header-actions`} className={`header-actions`}>
            <Link href={`/domains`} asChild>
              <RouterAnchor
                id={`header-portfolio-action`}
                className={`header-portfolio-action`}
              >
                {`Your portfolio`}
                <ArrowRight id={`header-portfolio-icon`} className={`header-portfolio-icon`} size={16} aria-hidden />
              </RouterAnchor>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id={`main-content`} className={`main-content`}>
        {children}
      </main>
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
            {footerLinks.map(item => (
              <Link key={item.label} href={item.href} asChild>
                <RouterAnchor
                  className={`footer-link`}
                  id={`footer-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </RouterAnchor>
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
