import './styles.scss';
import { Eye } from 'lucide-react';
import { getPortfolioGroupLinks } from './groupLinks';
import LinkSiteIcon from '../LinkSiteIcon/index.web';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';

interface PortfolioGroupLinksProps {
  id: string;
  group: CustomPortfolioGroup;
}

const PortfolioGroupLinks = ({ id, group }: PortfolioGroupLinksProps) => {
  const links = getPortfolioGroupLinks(group);
  if (!links.length) return null;

  return (
    <div id={id} role={`group`} className={`portfolio-group-links`} aria-label={`Links For ${group.name}`}>
      {links.map(link => (
        <a
          key={link.key}
          href={link.href}
          target={`_blank`}
          draggable={false}
          title={link.label}
          id={`${id}-${link.key}`}
          rel={`noopener noreferrer`}
          aria-label={`Open ${link.label} In A New Tab`}
          className={`portfolio-group-link${link.preview ? ` portfolio-group-preview-link` : ``}`}
        >
          {link.preview ? (
            <Eye size={14} aria-hidden={`true`} id={`${id}-${link.key}-icon`} className={`portfolio-group-preview-icon`} />
          ) : (
            <LinkSiteIcon size={14} url={link.href} id={`${id}-${link.key}-icon`} />
          )}
        </a>
      ))}
    </div>
  );
};

export default PortfolioGroupLinks;
