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
  fallback?: `app` | `link` | `globe` | `group`;
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
      {(!loaded || failed) && (fallback === `group` ? (
        <svg
          stroke={`none`}
          focusable={false}
          fill={`currentColor`}
          width={fallbackSize}
          height={fallbackSize}
          viewBox={`0 0 24 24`}
          aria-hidden={`true`}
          id={`${id}-fallback`}
          className={`domain-site-icon-fallback domain-site-icon-group-fallback`}
        >
          <path
            d={`M12 2 2 7l10 5 10-5-10-5Z`}
            id={`${id}-fallback-top-path`}
            className={`domain-site-icon-group-fallback-path`}
          />
          <path
            id={`${id}-fallback-middle-path`}
            className={`domain-site-icon-group-fallback-path`}
            d={`M2 10.5 12 15.5l10-5v2L12 17.5 2 12.5v-2Z`}
          />
          <path
            id={`${id}-fallback-bottom-path`}
            className={`domain-site-icon-group-fallback-path`}
            d={`M2 16 12 21l10-5v2.5L12 23.5 2 18.5V16Z`}
          />
        </svg>
      ) : fallback === `app` ? (
        <svg
          stroke={`none`}
          focusable={false}
          fill={`currentColor`}
          width={fallbackSize}
          height={fallbackSize}
          viewBox={`0 0 24 24`}
          aria-hidden={`true`}
          id={`${id}-fallback`}
          className={`domain-site-icon-fallback domain-site-icon-app-fallback`}
        >
          <path
            fillRule={`evenodd`}
            id={`${id}-fallback-window-path`}
            className={`domain-site-icon-app-fallback-path`}
            d={`M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0ZM5 10h14v8H5v-8Z`}
          />
        </svg>
      ) : (
        <FallbackIcon
          size={fallbackSize}
          strokeWidth={1.4}
          aria-hidden={`true`}
          id={`${id}-fallback`}
          className={`domain-site-icon-fallback`}
        />
      ))}
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
