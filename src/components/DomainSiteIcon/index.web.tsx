import './styles.scss';
import { Globe2 } from 'lucide-react';
import { useDomainSiteIcon } from './useDomainSiteIcon';
import { getDomainSiteIconUrl } from '../../shared/domainSiteIcon';

interface DomainSiteIconProps {
  id: string;
  size?: number;
  domain: string;
  iconUrl?: string;
  compact?: boolean;
}

const SiteIconContent = ({ id, iconUrl, size = 28, compact = false }: DomainSiteIconProps) => {
  const { failed, loaded, onLoad, onError } = useDomainSiteIcon();
  const imageSize = compact ? size : Math.min(20, size);
  const fallbackSize = compact ? size : Math.min(16, size);
  return (
    <span
      id={id}
      aria-hidden={`true`}
      className={`domain-site-icon${compact ? ` domain-site-icon-compact` : ``}`}
      style={{ width: size, height: size }}
    >
      {(!loaded || failed) && (
        <Globe2
          size={fallbackSize}
          strokeWidth={1.4}
          id={`${id}-fallback`}
          className={`domain-site-icon-fallback`}
        />
      )}
      {!!iconUrl && !failed && (
        <img
          alt={``}
          width={imageSize}
          height={imageSize}
          loading={`lazy`}
          draggable={false}
          onLoad={onLoad}
          onError={onError}
          id={`${id}-image`}
          referrerPolicy={`no-referrer`}
          src={iconUrl}
          className={`domain-site-icon-image${loaded ? ` domain-site-icon-image-loaded` : ``}`}
        />
      )}
    </span>
  );
};

const DomainSiteIcon = (props: DomainSiteIconProps) => {
  const source = getDomainSiteIconUrl({ name: props.domain, meta: { siteIconUrl: props.iconUrl ?? `` } });
  return <SiteIconContent {...props} key={source} iconUrl={source} />;
};

export default DomainSiteIcon;
