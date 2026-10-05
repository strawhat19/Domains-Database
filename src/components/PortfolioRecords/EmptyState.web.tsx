import { Plus, Search, RotateCcw } from 'lucide-react';

const PortfolioEmptyState = ({ hasFilters, onAction, idPrefix = `portfolio` }: { hasFilters: boolean; idPrefix?: string; onAction: () => void }) => (
  <div id={`${idPrefix}-empty-content`} className={`portfolio-empty-content`}>
    <Search size={23} strokeWidth={1.4} aria-hidden={`true`} id={`${idPrefix}-empty-icon`} className={`portfolio-empty-icon`} />
    <h3 id={`${idPrefix}-empty-title`} className={`portfolio-empty-title`}>
      {hasFilters ? `No domains found` : `Your registry is empty`}
    </h3>
    <p id={`${idPrefix}-empty-description`} className={`portfolio-empty-description`}>
      {hasFilters ? `Try another name or a different registrar.` : `Bring your GoDaddy, Namecheap, or Hostinger domains into one place.`}
    </p>
    <button
      type={`button`}
      onClick={onAction}
      id={`${idPrefix}-empty-action`}
      className={`portfolio-button portfolio-button-secondary`}
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
  </div>
);

export default PortfolioEmptyState;
