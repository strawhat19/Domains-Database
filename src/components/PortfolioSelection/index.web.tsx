import './styles.scss';

interface PortfolioSelectionProps {
  count: number;
}

const PortfolioSelection = ({ count }: PortfolioSelectionProps) => (
  <div id={`portfolio-selection-controls`} className={`portfolio-selection-controls`}>
    <span id={`portfolio-selection-count`} className={`portfolio-selection-count`} aria-live={`polite`}>
      {`${count} selected`}
    </span>
  </div>
);

export default PortfolioSelection;
