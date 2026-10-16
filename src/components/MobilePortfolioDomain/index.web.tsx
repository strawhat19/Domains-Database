import './styles.scss';
import { MoreHorizontal } from 'lucide-react';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import { getDomainStatus } from '../../shared/domainUtils';
import { boardEntityProps } from '../MobilePortfolioBoard/types';
import type { MobilePortfolioBoardProps } from '../MobilePortfolioBoard/types';

interface MobilePortfolioDomainProps extends Pick<MobilePortfolioBoardProps,
  `busy` | `onEdit` | `onSelect` | `onChangeDescription` | `onChangeProjectStatus`> {
  selected: boolean;
  position: number;
  groupKey: string;
  collectionId?: string;
  domain: MobilePortfolioBoardProps[`allDomains`][number];
  onActions: (element: HTMLElement) => void;
}

const MobilePortfolioDomain = ({
  busy,
  domain,
  onEdit,
  selected,
  position,
  groupKey,
  onSelect,
  onActions,
  collectionId,
  onChangeProjectStatus,
}: MobilePortfolioDomainProps) => {
  const id = `mobile-domain-${domain.id}`;
  const status = getDomainStatus(domain);
  const hasProjectStatus = Boolean(domain.projectStatus && domain.projectStatus !== `Future`);

  return (
    <article
      id={id}
      tabIndex={0}
      data-position={position}
      className={`mobile-domain-task`}
      aria-label={`${domain.name}, ${status}`}
      {...boardEntityProps({
        groupKey,
        collectionId,
        id: domain.id,
        kind: `domain`,
        label: domain.name,
      })}
      onKeyDown={event => {
        if (event.target !== event.currentTarget
          || !(event.key === `ContextMenu` || event.shiftKey && event.key === `F10`)) return;
        event.preventDefault();
        onActions(event.currentTarget);
      }}
    >
      <div id={`${id}-heading`} className={`mobile-domain-heading`}>
        <span
          id={`${id}-position`}
          aria-label={`Position ${position}`}
          className={`domain-row-position mobile-domain-position`}
        >
          {position}
        </span>
        <label
          htmlFor={`${id}-selection`}
          id={`${id}-selection-target`}
          className={`mobile-domain-selection-target`}
        >
          <input
            type={`checkbox`}
            disabled={busy}
            checked={selected}
            id={`${id}-selection`}
            className={`mobile-domain-selection`}
            aria-label={`Select ${domain.name}`}
            onChange={event => onSelect(domain.id, event.target.checked)}
          />
        </label>
        <span id={`${id}-identity`} className={`mobile-domain-identity`}>
          <DomainSiteIcon id={`${id}-site-icon`} domain={domain.name} size={18} />
          <span
            title={status}
            id={`${id}-status`}
            className={`rowStatus mobile-domain-status`}
            data-status={status === `Active` ? `active` : `warning`}
          >
            <span id={`${id}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden={`true`}>
              <span id={`${id}-status-dot`} className={`statusDot`} />
            </span>
            <span id={`${id}-status-text`} className={`statusText mobile-domain-status-text`}>
              {status}
            </span>
          </span>
        </span>
        <button
          type={`button`}
          disabled={busy}
          id={`${id}-name`}
          title={domain.name}
          onClick={() => onEdit(domain)}
          aria-label={`Edit ${domain.name}`}
          className={`mobile-domain-name`}
        >
          {domain.name}
        </button>
        {hasProjectStatus && (
          <DomainProjectBadge
            disabled={busy}
            id={`${id}-project`}
            field={`projectStatus`}
            value={domain.projectStatus}
            className={`mobile-domain-project-status`}
            editLabel={`Change Status For ${domain.name}: ${domain.projectStatus}`}
            onChange={value => onChangeProjectStatus(domain, value)}
          />
        )}
        <button
          type={`button`}
          disabled={busy}
          id={`${id}-actions`}
          aria-haspopup={`dialog`}
          aria-label={`Actions For ${domain.name}`}
          className={`mobile-board-icon mobile-domain-actions`}
          onClick={event => onActions(event.currentTarget)}
        >
          <MoreHorizontal
            size={18}
            aria-hidden={`true`}
            id={`${id}-actions-icon`}
            className={`mobile-domain-actions-icon`}
          />
        </button>
      </div>
    </article>
  );
};

export default MobilePortfolioDomain;
