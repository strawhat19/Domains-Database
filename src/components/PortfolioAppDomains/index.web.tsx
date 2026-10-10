import './styles.scss';
import { Star } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { DomainRecord } from '../../shared/types';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { readDomainDrag } from '../PortfolioRecords/dragData';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import type { useDomainReorder } from '../PortfolioRecords/useDomainReorder';
import type { PortfolioGroup } from '../../shared/portfolioPreferences/types';

interface PortfolioAppDomainsProps {
  id: string;
  busy?: boolean;
  group: PortfolioGroup;
  getDragHandlers: ReturnType<typeof useDomainReorder>[`handlers`];
  onContextMenu?: (event: MouseEvent<HTMLElement>, domain: DomainRecord) => void;
}

const PortfolioAppDomains = ({ id, group, getDragHandlers, onContextMenu, busy = false }: PortfolioAppDomainsProps) => {
  const visibleIds = group.domains.map(domain => domain.id);
  if (!visibleIds.length) return null;

  return (
    <ul
      id={id}
      className={`portfolio-app-domains`}
      aria-label={`Domains In ${group.label}`}
      onDrop={event => {
        if (readDomainDrag(event.dataTransfer)?.groupKey !== group.key) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {group.domains.map(domain => {
        const scope = `${id}-domain-${encodeURIComponent(domain.id)}`;
        const handlers = getDragHandlers(group.key, domain.id, visibleIds, `horizontal`);
        const reorderable = !busy && handlers.reorderable;
        const title = `${domain.name} — ${reorderable ? `Drag Or Use Alt+Arrow Left/Right To Reorder` : `Choose Manual Order To Reorder`}`;
        return (
          <li key={domain.id} id={`${scope}-item`} className={`portfolio-app-domain-item`}>
            <a
              id={scope}
              title={title}
              target={`_blank`}
              rel={`noopener noreferrer`}
              href={`https://${domain.name}`}
              onDrop={handlers.onDrop}
              onDragEnd={handlers.onDragEnd}
              onDragOver={handlers.onDragOver}
              onDragLeave={handlers.onDragLeave}
              draggable={!busy && handlers.draggable}
              data-portfolio-app-domain-id={domain.id}
              aria-keyshortcuts={reorderable ? `Alt+ArrowLeft Alt+ArrowRight` : undefined}
              aria-label={`Open ${domain.name} In A New Tab${domain.starred ? `, Starred Domain` : ``}${reorderable ? `, Alt+Arrow Left Or Right To Reorder` : ``}`}
              onClick={event => event.stopPropagation()}
              onMouseDown={event => event.stopPropagation()}
              onPointerDown={event => event.stopPropagation()}
              onDragStart={event => {
                event.stopPropagation();
                if (busy) event.preventDefault();
                else handlers.onDragStart(event);
              }}
              onContextMenu={event => {
                event.stopPropagation();
                if (!onContextMenu || busy) return;
                event.preventDefault();
                onContextMenu(event, domain);
              }}
              onKeyDown={event => {
                if (!event.altKey || event.ctrlKey || event.metaKey || ![`ArrowLeft`, `ArrowRight`].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                if (!reorderable) return;
                const move = event.key === `ArrowLeft` ? handlers.onMoveUp : handlers.onMoveDown;
                move?.();
                const pill = event.currentTarget;
                window.requestAnimationFrame(() => {
                  if (!pill.isConnected || pill.closest(`[hidden], [inert], [aria-hidden='true']`)) return;
                  pill.focus({ preventScroll: true });
                  pill.scrollIntoView({ block: `nearest`, inline: `nearest` });
                });
              }}
              className={`portfolio-app-domain${handlers.dragging ? ` portfolio-app-domain-dragging` : ``}${handlers.dropTarget ? ` portfolio-app-domain-drop-target` : ``}${!busy && handlers.draggable ? ` portfolio-app-domain-draggable` : ``}`}
            >
              <span aria-hidden={`true`} id={`${scope}-icon-wrap`} className={`portfolio-app-domain-icon-wrap`}>
                <DomainSiteIcon
                  compact
                  size={12}
                  fallback={`link`}
                  domain={domain.name}
                  id={`${scope}-site-icon`}
                  iconUrl={getCustomSiteIconUrl(domain)}
                />
              </span>
              <span id={`${scope}-name`} className={`portfolio-app-domain-name`}>{domain.name}</span>
              {domain.starred && <Star size={10} fill={`currentColor`} aria-hidden={`true`} id={`${scope}-star-icon`} className={`portfolio-app-domain-star-icon`} />}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default PortfolioAppDomains;
