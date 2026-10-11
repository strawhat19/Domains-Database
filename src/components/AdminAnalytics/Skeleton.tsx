import './skeleton.scss';
import type { CSSProperties } from 'react';

type AdminSkeletonProps = {
  id: string;
  label: string;
  rows?: number;
  cards?: number;
  columns?: number;
  variant?: `table` | `summary` | `cards` | `counts` | `chart` | `gallery` | `inline`;
};

const AdminSkeleton = ({ id, label, rows = 5, cards = 3, columns = 6, variant = `table` }: AdminSkeletonProps) => {
  const isCards = [`cards`, `counts`, `summary`].includes(variant);
  const blocks = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => <span key={index} id={`${id}-${prefix}-${index}`} className={`dd-admin-skeleton-block`} />);

  return (
    <div
      id={id}
      role={`status`}
      aria-label={label}
      className={`dd-admin-skeleton is-${variant}`}
      style={{ '--dd-skeleton-detail-columns': Math.max(1, columns - 1) } as CSSProperties}
    >
      <span id={`${id}-status`} className={`dd-admin-skeleton-status`}>{label}</span>
      <div id={`${id}-content`} className={`dd-admin-skeleton-content`} aria-hidden={`true`}>
        {isCards && Array.from({ length: cards }, (_, index) => <div key={index} id={`${id}-card-${index}`} className={`dd-admin-skeleton-card`}>{blocks(`card-${index}-line`, variant === `summary` ? 2 : 3)}</div>)}
        {variant === `inline` && blocks(`line`, rows)}
        {variant === `table` && <>
          <div id={`${id}-filters`} className={`dd-admin-skeleton-filters`}>{blocks(`filter`, 3)}</div>
          <div id={`${id}-table-wrap`} className={`dd-admin-skeleton-table-wrap`}>
            <div id={`${id}-table`} className={`dd-admin-skeleton-table`}>
              <div id={`${id}-table-heading`} className={`dd-admin-skeleton-row is-heading`}>{blocks(`column`, columns)}</div>
              {Array.from({ length: rows }, (_, index) => <div key={index} id={`${id}-row-${index}`} className={`dd-admin-skeleton-row`}>{blocks(`row-${index}-cell`, columns)}</div>)}
              <div id={`${id}-pagination`} className={`dd-admin-skeleton-pagination`}>{blocks(`pagination`, 2)}</div>
            </div>
          </div>
        </>}
        {variant === `chart` && <>
          <div id={`${id}-chart-heading`} className={`dd-admin-skeleton-chart-heading`}>{blocks(`heading`, 2)}</div>
          <div id={`${id}-chart-legend`} className={`dd-admin-skeleton-chart-legend`}>{blocks(`legend`, 4)}</div>
          <div id={`${id}-chart`} className={`dd-admin-skeleton-chart`}>{blocks(`bar`, 6)}</div>
          {blocks(`chart-caption`, 1)}
        </>}
        {variant === `gallery` && <>
          <div id={`${id}-toolbar`} className={`dd-admin-skeleton-filters`}>{blocks(`filter`, 3)}</div>
          <div id={`${id}-gallery`} className={`dd-admin-skeleton-gallery`}>{blocks(`photo`, 7)}</div>
        </>}
      </div>
    </div>
  );
};

export default AdminSkeleton;
