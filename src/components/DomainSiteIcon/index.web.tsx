import './styles.scss';
import { Globe2 } from 'lucide-react';
import { useDomainSiteIcon } from './useDomainSiteIcon';

interface DomainSiteIconProps {
  id: string;
  domain: string;
  size?: number;
}

const SiteIconContent = ({ id, domain, size = 28 }: DomainSiteIconProps) => {
  const { failed, loaded, onLoad, onError } = useDomainSiteIcon();
  return (
    <span
      id={id}
      aria-hidden={`true`}
      className={`domain-site-icon`}
      style={{ width: size, height: size }}
    >
      {(!loaded || failed) && (
        <Globe2
          size={16}
          strokeWidth={1.4}
          id={`${id}-fallback`}
          className={`domain-site-icon-fallback`}
        />
      )}
      {!failed && (
        <img
          alt={``}
          width={20}
          height={20}
          loading={`lazy`}
          draggable={false}
          onLoad={onLoad}
          onError={onError}
          id={`${id}-image`}
          referrerPolicy={`no-referrer`}
          src={`https://${domain}/favicon.ico`}
          className={`domain-site-icon-image${loaded ? ` domain-site-icon-image-loaded` : ``}`}
        />
      )}
    </span>
  );
};

const DomainSiteIcon = (props: DomainSiteIconProps) => (
  <SiteIconContent key={props.domain} {...props} />
);

export default DomainSiteIcon;
