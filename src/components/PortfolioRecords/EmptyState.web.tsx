import { Plus, Search, RotateCcw } from 'lucide-react';

const PortfolioEmptyState = ({ hasFilters, onAction }: { hasFilters: boolean; onAction: () => void }) => (
  <div id={`portfolio-empty-content`} className={`portfolio-empty-content`}>
    <Search size={23} strokeWidth={1.4} aria-hidden={`true`} id={`portfolio-empty-icon`} className={`portfolio-empty-icon`} />
    <h3 id={`portfolio-empty-title`} className={`portfolio-empty-title`}>
      {hasFilters ? `No domains found` : `Your registry is empty`}
    </h3>
    <p id={`portfolio-empty-description`} className={`portfolio-empty-description`}>
      {hasFilters ? `Try another name or a different registrar.` : `Bring your GoDaddy, Namecheap, or Hostinger domains into one place.`}
    </p>
    <button
      type={`button`}
      onClick={onAction}
      id={`portfolio-empty-action`}
      className={`portfolio-button portfolio-button-secondary`}
    >
      {hasFilters ? (
        <RotateCcw size={14} aria-hidden={`true`} id={`portfolio-empty-action-icon`} className={`portfolio-button-icon`} />
      ) : (
        <Plus size={14} aria-hidden={`true`} id={`portfolio-empty-action-icon`} className={`portfolio-button-icon`} />
      )}
      <span id={`portfolio-empty-action-text`} className={`portfolio-button-text`}>
        {hasFilters ? `Clear Filters` : `Add Domain`}
      </span>
    </button>
  </div>
);

export default PortfolioEmptyState;
