import './styles.scss';
import { Link2, Globe2, Pencil } from 'lucide-react';
import { useDomainSiteIcon } from './useDomainSiteIcon';
import { getDomainSiteIconUrl } from '../../shared/domainSiteIcon';

interface DomainSiteIconProps {
  id: string;
  size?: number;
  domain: string;
  iconUrl?: string;
  compact?: boolean;
  disabled?: boolean;
  editLabel?: string;
  onEdit?: () => void;
  fallback?: `globe` | `link`;
}

const SiteIconContent = ({
  id,
  onEdit,
  iconUrl,
  disabled,
  editLabel,
  size = 28,
  compact = false,
  fallback = `globe`,
}: DomainSiteIconProps) => {
  const { failed, loaded, onLoad, onError } = useDomainSiteIcon();
  const editable = Boolean(onEdit) && (!loaded || failed);
  const FallbackIcon = fallback === `link` ? Link2 : Globe2;
  const imageSize = compact ? size : Math.min(20, size);
  const fallbackSize = compact ? size : Math.min(16, size);
  const className = `domain-site-icon${compact ? ` domain-site-icon-compact` : ``}${editable ? ` domain-site-icon-editable` : ``}`;
  const content = (
    <>
      {(!loaded || failed) && (
        <FallbackIcon
          size={fallbackSize}
          strokeWidth={1.4}
          aria-hidden={`true`}
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
      {editable && (
        <Pencil
          size={fallbackSize}
          strokeWidth={1.4}
          aria-hidden={`true`}
          id={`${id}-edit-icon`}
          className={`domain-site-icon-edit-icon`}
        />
      )}
    </>
  );

  return editable ? (
    <button
      id={id}
      type={`button`}
      onClick={onEdit}
      disabled={disabled}
      draggable={false}
      className={className}
      title={editLabel ?? `Add A Logo Or Site Icon`}
      style={{ width: size, height: size }}
      aria-label={editLabel ?? `Add A Logo Or Site Icon`}
    >
      {content}
    </button>
  ) : (
    <span
      id={id}
      className={className}
      aria-hidden={`true`}
      style={{ width: size, height: size }}
    >
      {content}
    </span>
  );
};

const DomainSiteIcon = (props: DomainSiteIconProps) => {
  const source = getDomainSiteIconUrl({ name: props.domain, meta: { siteIconUrl: props.iconUrl ?? `` } });
  return <SiteIconContent {...props} key={source} iconUrl={source} />;
};

export default DomainSiteIcon;
