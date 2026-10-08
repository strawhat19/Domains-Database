import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { getLinkSiteIconUrl } from '../../shared/domainSiteIcon';

interface LinkSiteIconProps {
  id: string;
  url: string;
  size?: number;
}

const LinkSiteIcon = ({ id, url, size = 13 }: LinkSiteIconProps) => (
  <DomainSiteIcon
    compact
    id={id}
    size={size}
    domain={``}
    fallback={`link`}
    iconUrl={getLinkSiteIconUrl(url)}
  />
);

export default LinkSiteIcon;
