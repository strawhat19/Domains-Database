import './styles.scss';
import { useCollectionProgress } from './useCollectionProgress';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

interface PortfolioCollectionProgressProps {
  id: string;
  collection: CustomPortfolioCollection;
}

const PortfolioCollectionProgress = ({ id, collection }: PortfolioCollectionProgressProps) => {
  const progress = useCollectionProgress(collection.id);
  const summary = progress.loading ? `Loading Group And App Progress For ${collection.name}`
    : progress.total ? `${collection.name}: ${progress.completed} of ${progress.total} groups/apps marked Done (${progress.percentage}%)\n${progress.segments.map(segment => `${segment.label}: ${segment.count}`).join(` · `)}`
      : `${collection.name}: No Groups Or Apps`;

  return (
    <span
      id={id}
      role={`img`}
      title={summary}
      draggable={false}
      aria-label={summary}
      aria-busy={progress.loading}
      className={`portfolio-collection-progress`}
    >
      <span
        id={`${id}-track`}
        aria-hidden={`true`}
        className={`portfolio-collection-progress-track`}
      >
        {!progress.loading && progress.segments.map(segment => (
          <span
            key={segment.value}
            data-status={segment.value}
            style={{ width: `${segment.length}%` }}
            id={`${id}-segment-${segment.value.toLowerCase().replaceAll(` `, `-`).replaceAll(`/`, `-`)}`}
            className={`portfolio-collection-progress-segment portfolio-collection-progress-segment-${segment.tone}`}
          />
        ))}
      </span>
      <span id={`${id}-percentage`} aria-hidden={`true`} className={`portfolio-collection-progress-percentage`}>
        {progress.loading || !progress.total ? `—` : `${progress.percentage}%`}
      </span>
    </span>
  );
};

export default PortfolioCollectionProgress;
