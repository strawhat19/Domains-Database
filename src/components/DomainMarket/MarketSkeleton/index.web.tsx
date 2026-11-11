import './styles.scss';
import type { MarketSkeletonProps } from './types';

type ShapeSize = `short` | `line` | `title` | `avatar` | `icon` | `button` | `input` | `textarea`;

const Shape = ({ size }: { size: ShapeSize }) => <span className={`market-skeleton-shape`} data-size={size} />;
const rows = [1, 2, 3];

const MarketSkeletonShapes = ({ kind }: Pick<MarketSkeletonProps, `kind`>) => {
  switch (kind) {
    case `browse`:
      return <div className={`market-skeleton-list`}>{rows.map(row => (
        <div key={row} id={`market-skeleton-domain-${row}`} className={`market-skeleton-listing`}>
          <Shape size={`icon`} />
          <div className={`market-skeleton-stack`}><Shape size={`title`} /><Shape size={`short`} /></div>
          <div className={`market-skeleton-stack market-skeleton-price`}><Shape size={`short`} /></div>
          <Shape size={`icon`} />
        </div>
      ))}</div>;
    case `sell`:
      return <div className={`market-skeleton-seller`}>
        <Shape size={`title`} />
        <div className={`market-skeleton-fields`}>
          {[1, 2].map(field => <div key={field} id={`market-skeleton-sell-field-${field}`} className={`market-skeleton-stack`}><Shape size={`short`} /><Shape size={`input`} /></div>)}
        </div>
        <Shape size={`textarea`} />
        <Shape size={`button`} />
      </div>;
    case `inbox`:
      return <div className={`market-skeleton-threads`}>{rows.map(row => (
        <div key={row} id={`market-skeleton-thread-${row}`} className={`market-skeleton-thread`}>
          <Shape size={`avatar`} />
          <div className={`market-skeleton-stack`}><Shape size={`title`} /><Shape size={`short`} /></div>
        </div>
      ))}</div>;
    case `orders`:
      return <div className={`market-skeleton-list`}>{rows.map(row => (
        <div key={row} id={`market-skeleton-order-${row}`} className={`market-skeleton-order`}>
          <div className={`market-skeleton-line-row`}><Shape size={`title`} /><Shape size={`short`} /></div>
          <Shape size={`line`} />
        </div>
      ))}</div>;
    case `listing`:
      return <div className={`market-skeleton-listing-detail`}>
        <div className={`market-skeleton-identity`}><Shape size={`icon`} /><Shape size={`title`} /></div>
        <div className={`market-skeleton-identity`}><Shape size={`avatar`} /><Shape size={`short`} /></div>
        <Shape size={`line`} />
        <Shape size={`short`} />
        <div className={`market-skeleton-buttons`}><Shape size={`button`} /><Shape size={`button`} /></div>
      </div>;
    case `messages`:
      return <div className={`market-skeleton-messages`}>{rows.map(row => (
        <div key={row} id={`market-skeleton-message-${row}`} className={`market-skeleton-message`} data-own={row === 2}>
          <Shape size={`short`} /><Shape size={`line`} />
        </div>
      ))}</div>;
    case `actions`:
      return <div className={`market-skeleton-buttons`}><Shape size={`button`} /><Shape size={`button`} /></div>;
    case `payouts`:
      return <Shape size={`title`} />;
  }
};

const MarketSkeleton = ({ kind, label }: MarketSkeletonProps) => (
  <div id={kind === `browse` ? `market-public-loading` : `market-skeleton-${kind}`} className={`market-skeleton`} role={`status`}>
    <span className={`market-skeleton-label`}>{label}</span>
    <div className={`market-skeleton-shapes`} aria-hidden><MarketSkeletonShapes kind={kind} /></div>
  </div>
);

export default MarketSkeleton;
