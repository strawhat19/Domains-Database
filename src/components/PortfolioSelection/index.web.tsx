import './styles.scss';
import { CheckSquare, Square } from 'lucide-react';

interface PortfolioSelectionProps {
  count: number;
  total: number;
  disabled: boolean;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

const PortfolioSelection = ({ count, total, disabled, allSelected, onSelectAll }: PortfolioSelectionProps) => (
  <div id={`portfolio-selection-controls`} className={`portfolio-selection-controls`}>
    <span id={`portfolio-selection-count`} className={`portfolio-selection-count`} aria-live={`polite`}>
      {`${count} selected`}
    </span>
    <button
      type={`button`}
      id={`portfolio-check-all`}
      disabled={disabled || !total || allSelected}
      className={`portfolio-button portfolio-button-quiet`}
      onClick={() => onSelectAll(true)}
    >
      <CheckSquare size={14} aria-hidden={`true`} id={`portfolio-check-all-icon`} className={`portfolio-button-icon`} />
      <span id={`portfolio-check-all-text`} className={`portfolio-button-text`}>
        {`Check all`}
      </span>
    </button>
    <button
      type={`button`}
      id={`portfolio-uncheck-all`}
      disabled={disabled || !count}
      className={`portfolio-button portfolio-button-quiet`}
      onClick={() => onSelectAll(false)}
    >
      <Square size={14} aria-hidden={`true`} id={`portfolio-uncheck-all-icon`} className={`portfolio-button-icon`} />
      <span id={`portfolio-uncheck-all-text`} className={`portfolio-button-text`}>
        {`Uncheck all`}
      </span>
    </button>
  </div>
);

export default PortfolioSelection;
