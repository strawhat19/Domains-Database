import './styles.scss';

interface PortfolioSelectionProps {
  count: number;
  totalCount: number;
  visibleCount: number;
}

const PortfolioSelection = ({ count, totalCount, visibleCount }: PortfolioSelectionProps) => (
  <div id={`portfolio-selection-controls`} className={`portfolio-selection-controls`}>
    <span id={`portfolio-selection-count`} className={`portfolio-selection-count`} aria-live={`polite`} aria-atomic={`true`}>
      {count > 0 ? `${count} SELECTED` : ``}
      <span
        id={`portfolio-selection-total`}
        className={`portfolio-selection-total${count > 0 ? `` : ` portfolio-selection-total-only`}`}
      >
        {`${count > 0 ? ` / ` : ``}${totalCount} TOTAL`}
      </span>
      {count > visibleCount ? ` (${count - visibleCount} hidden)` : ``}
    </span>
  </div>
);

export default PortfolioSelection;
