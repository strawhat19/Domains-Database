import './styles.scss';
import { useRef } from 'react';
import '../DomainEditor/styles.scss';
import type { DomainRecord } from '../../shared/types';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import type { useCollectionStars } from './useCollectionStars';
import PortfolioCopyOptions from '../PortfolioCopyOptions/index.web';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { X, Star, Copy, Check, Folder, ExternalLink } from 'lucide-react';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

interface PortfolioCollectionStarsProps {
  idPrefix?: string;
  collection: CustomPortfolioCollection;
  state: ReturnType<typeof useCollectionStars>;
}

const PortfolioCollectionStars = ({ collection, state, idPrefix = `portfolio` }: PortfolioCollectionStarsProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const scope = `${idPrefix}-collection-${collection.id}-stars`;
  const CopyIcon = state.copied ? Check : Copy;
  useModalFocus(modalRef, state.open && !state.copyOpen, state.closeStars, true);
  const domainItem = (domain: DomainRecord, domainScope: string) => (
    <li key={domain.id} id={domainScope} className={`portfolio-collection-stars-domain`}>
      <a
        target={`_blank`}
        rel={`noreferrer noopener`}
        draggable={false}
        id={`${domainScope}-link`}
        href={`https://${domain.name}`}
        aria-label={`Open ${domain.name}`}
        className={`portfolio-collection-stars-domain-link`}
      >
        <DomainSiteIcon id={`${domainScope}-site-icon`} domain={domain.name} iconUrl={typeof domain.meta?.siteIconUrl === `string` ? domain.meta.siteIconUrl : undefined} />
        <span id={`${domainScope}-name`} className={`portfolio-collection-stars-domain-name`}>{domain.name}</span>
        <Star size={13} fill={`currentColor`} aria-hidden={`true`} id={`${domainScope}-star-icon`} className={`portfolio-collection-stars-star-icon`} />
        <ExternalLink size={13} aria-hidden={`true`} id={`${domainScope}-open-icon`} className={`portfolio-collection-stars-open-icon`} />
      </a>
    </li>
  );

  if (!state.open) return null;
  if (state.copyOpen) return (
    <PortfolioCopyOptions
      kind={`stars`}
      treeAvailable
      busy={state.copying}
      idPrefix={`${scope}-copy`}
      count={state.copySummary.count}
      onCopy={state.copyStars}
      onClose={state.closeCopyOptions}
      error={state.copyError ? state.copyMessage : undefined}
      hiddenOptions={state.showHiddenOptions ? { included: state.includeHidden, onChange: state.setIncludeHidden } : undefined}
    />
  );

  return (
    <div
      role={`presentation`}
      id={`${scope}-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) state.closeStars(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-modal={`true`}
        id={`${scope}-dialog`}
        aria-busy={state.loading || state.copying}
        aria-labelledby={`${scope}-title`}
        aria-describedby={`${scope}-description`}
        className={`domain-dialog portfolio-collection-stars-dialog`}
      >
        <header id={`${scope}-header`} className={`domain-dialog-header`}>
          <div id={`${scope}-heading`} className={`domain-dialog-heading`}>
            <span id={`${scope}-eyebrow`} className={`domain-dialog-eyebrow`}>{`COLLECTION STARS`}</span>
            <h2 id={`${scope}-title`} className={`domain-dialog-title`}>{`Stars`}</h2>
          </div>
          <button
            type={`button`}
            disabled={state.copying}
            id={`${scope}-close`}
            onClick={state.closeStars}
            aria-label={`Close Collection Stars`}
            className={`domain-dialog-close`}
          >
            <X size={19} aria-hidden={`true`} id={`${scope}-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`${scope}-body`} className={`domain-dialog-body portfolio-collection-stars-body`}>
          <p id={`${scope}-description`} className={`domain-dialog-description`}>
            {`${state.summary.groupCount} starred ${state.summary.groupCount === 1 ? `group` : `groups`} and ${state.summary.domainCount} starred ${state.summary.domainCount === 1 ? `domain` : `domains`} in ${collection.name}.`}
          </p>
          {state.loading ? (
            <p role={`status`} id={`${scope}-loading`} className={`portfolio-collection-stars-empty`}>{`Loading Stars…`}</p>
          ) : state.summary.count ? (
            <div id={`${scope}-tree`} className={`portfolio-collection-stars-tree`}>
              <div id={`${scope}-collection`} className={`portfolio-collection-stars-collection`}>
                <span id={`${scope}-collection-symbol`} className={`portfolio-collection-stars-symbol`}>
                  <Folder size={17} aria-hidden={`true`} id={`${scope}-collection-icon`} className={`portfolio-collection-stars-tree-icon`} />
                </span>
                <div id={`${scope}-collection-copy`} className={`portfolio-collection-stars-copy`}>
                  <h3 id={`${scope}-collection-name`} className={`portfolio-collection-stars-name`}>{collection.name}</h3>
                  {collection.description && <p id={`${scope}-collection-description`} className={`portfolio-collection-stars-description`}>{collection.description}</p>}
                </div>
                <span id={`${scope}-count`} className={`portfolio-collection-stars-total`} aria-label={`${state.summary.count} Starred Item(s)`}>{state.summary.count}</span>
              </div>
              <ul id={`${scope}-groups`} className={`portfolio-collection-stars-groups`}>
                {state.summary.directDomains.map(domain => domainItem(domain, `${scope}-domain-${domain.id}`))}
                {state.summary.groups.map(({ group, domains }) => {
                  const groupScope = `${scope}-group-${group.id}`;
                  return (
                    <li key={group.id} id={groupScope} className={`portfolio-collection-stars-group`}>
                      <div id={`${groupScope}-heading`} className={`portfolio-collection-stars-group-heading`}>
                        <DomainSiteIcon
                          size={28}
                          domain={``}
                          fallback={group.isApp ? `app` : `group`}
                          id={`${groupScope}-symbol`}
                          iconUrl={group.siteIconUrl}
                        />
                        <div id={`${groupScope}-copy`} className={`portfolio-collection-stars-copy`}>
                          <span id={`${groupScope}-name`} className={`portfolio-collection-stars-name`}>{group.name}</span>
                          {group.description && <p id={`${groupScope}-description`} className={`portfolio-collection-stars-description`}>{group.description}</p>}
                        </div>
                        {group.starred && (
                          <span id={`${groupScope}-star`} className={`portfolio-collection-stars-mark`} role={`img`} aria-label={`Starred Group`}>
                            <Star size={15} fill={`currentColor`} aria-hidden={`true`} id={`${groupScope}-star-icon`} className={`portfolio-collection-stars-star-icon`} />
                          </span>
                        )}
                      </div>
                      {!!domains.length && (
                        <ul id={`${groupScope}-domains`} className={`portfolio-collection-stars-domains`}>
                          {domains.map(domain => domainItem(domain, `${groupScope}-domain-${domain.id}`))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div id={`${scope}-empty`} className={`portfolio-collection-stars-empty`}>
              <Star size={24} aria-hidden={`true`} id={`${scope}-empty-icon`} className={`portfolio-collection-stars-empty-icon`} />
              <p id={`${scope}-empty-title`} className={`portfolio-collection-stars-empty-title`}>{`No Stars In This Collection`}</p>
              <p id={`${scope}-empty-help`} className={`portfolio-collection-stars-empty-help`}>{`Star a group or domain to see it here.`}</p>
            </div>
          )}
          {state.copyMessage && (
            <p
              id={`${scope}-feedback`}
              role={state.copyError ? `alert` : `status`}
              className={state.copyError ? `domain-dialog-error` : `portfolio-collection-stars-feedback`}
            >
              {state.copyMessage}
            </p>
          )}
        </div>
        <footer id={`${scope}-footer`} className={`domain-dialog-footer portfolio-collection-stars-footer`}>
          <button
            type={`button`}
            disabled={state.copying}
            id={`${scope}-cancel`}
            onClick={state.closeStars}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <X size={15} aria-hidden={`true`} id={`${scope}-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`${scope}-cancel-text`} className={`portfolio-button-text`}>{`Close`}</span>
          </button>
          <button
            type={`button`}
            id={`${scope}-copy`}
            onClick={state.openCopyOptions}
            data-autofocus={!!state.summary.count || undefined}
            disabled={state.loading || state.copying || !state.summary.count}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <CopyIcon size={16} aria-hidden={`true`} id={`${scope}-copy-icon`} className={`portfolio-button-icon`} />
            <span id={`${scope}-copy-text`} className={`portfolio-button-text`}>{state.copied ? `Copied` : `Copy`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioCollectionStars;
