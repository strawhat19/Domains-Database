import './styles.scss';
import { Link } from 'expo-router';
import '../../styles/global.scss';
import type { PropsWithChildren } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useAppShell, navigation, footerLinks } from './useAppShell';

const AppShell = ({ children }: PropsWithChildren) => {
  const { pathname, year } = useAppShell();

  return (
    <div id={`app-shell`} className={`app-shell`}>
      <header id={`site-header`} className={`site-header`}>
        <div id={`header-inner`} className={`header-inner`}>
          <Link href={`/`} asChild>
            <a id={`header-brand`} className={`header-brand`} aria-label={`Domains Database Home`}>
              <img id={`header-logo`} className={`header-logo`} src={`/brand-logo.svg`} alt={`Domains Database — Every Address In Order`} width={240} height={70} />
            </a>
          </Link>
          <nav id={`header-navigation`} className={`header-navigation`} aria-label={`Main Navigation`}>
            {navigation.map(item => (
              <Link key={item.label} href={item.href} asChild>
                <a id={`header-link-${item.label.toLowerCase()}`} className={`header-link${pathname === item.href ? ` header-link-active` : ``}`} aria-current={pathname === item.href ? `page` : undefined}>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
          <Link href={`/domains`} asChild>
            <a id={`header-portfolio-action`} className={`header-portfolio-action`}>
              {`Your portfolio`}
              <ArrowRight id={`header-portfolio-icon`} className={`header-portfolio-icon`} size={16} aria-hidden />
            </a>
          </Link>
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
                <a id={`footer-link-${item.label.toLowerCase()}`} className={`footer-link`}>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
