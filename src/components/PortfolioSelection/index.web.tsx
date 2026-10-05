import './styles.scss';

interface PortfolioSelectionProps {
  count: number;
  visibleCount: number;
}

const PortfolioSelection = ({ count, visibleCount }: PortfolioSelectionProps) => (
  <div id={`portfolio-selection-controls`} className={`portfolio-selection-controls`}>
    <span id={`portfolio-selection-count`} className={`portfolio-selection-count`} aria-live={`polite`} aria-atomic={`true`}>
      {`${count} selected${count > visibleCount ? ` (${count - visibleCount} hidden)` : ``}`}
    </span>
  </div>
);

export default PortfolioSelection;
