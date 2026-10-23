import StatePanel from '../StatePanel';
import { Plus, RotateCcw } from 'lucide-react';

const PortfolioEmptyState = ({ hasFilters, onAction, idPrefix = `portfolio` }: { hasFilters: boolean; idPrefix?: string; onAction: () => void }) => (
  <div id={`${idPrefix}-empty-content`} className={`portfolio-empty-content`}>
    <StatePanel
      variant={`inline`}
      id={`${idPrefix}-empty`}
      icon={hasFilters ? `search` : `domains`}
      eyebrow={hasFilters ? `SEARCH RESULTS` : `YOUR PORTFOLIO`}
      title={hasFilters ? `No matching domains` : `Add your first domain`}
      description={hasFilters ? `Try another name or clear your filters to see your domains.` : `Keep your domains, renewal dates, and project notes in one place.`}
      detail={hasFilters ? undefined : `Start with manual entry, a CSV import, or a registrar connection.`}
    >
      <button
        type={`button`}
        onClick={onAction}
        id={`${idPrefix}-empty-action`}
        className={`portfolio-button portfolio-button-${hasFilters ? `secondary` : `primary`}`}
      >
        {hasFilters ? (
          <RotateCcw size={14} aria-hidden={`true`} id={`${idPrefix}-empty-action-icon`} className={`portfolio-button-icon`} />
        ) : (
          <Plus size={14} aria-hidden={`true`} id={`${idPrefix}-empty-action-icon`} className={`portfolio-button-icon`} />
        )}
        <span id={`${idPrefix}-empty-action-text`} className={`portfolio-button-text`}>
          {hasFilters ? `Clear Filters` : `Add Domain`}
        </span>
      </button>
    </StatePanel>
  </div>
);

export default PortfolioEmptyState;
