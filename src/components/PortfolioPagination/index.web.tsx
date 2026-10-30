import './styles.scss';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PORTFOLIO_PAGE_SIZES, type usePortfolioPagination } from '../DomainPortfolio/usePortfolioPagination';

interface PortfolioPaginationProps {
  id: string;
  announce?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
  pagination: ReturnType<typeof usePortfolioPagination>;
}

const PortfolioPagination = ({ id, pagination, onNavigate, announce = false, disabled = false }: PortfolioPaginationProps) => {
  if (pagination.total <= PORTFOLIO_PAGE_SIZES[0]) return null;
  return (
    <nav id={id} tabIndex={-1} className={`portfolio-pagination`} aria-label={`Domain Pages`}>
      <label id={`${id}-size-label`} className={`portfolio-pagination-size-label`} htmlFor={`${id}-size`}>
        {`Per Page`}
        <select
          id={`${id}-size`}
          disabled={disabled}
          value={pagination.pageSize}
          className={`portfolio-pagination-size`}
          onChange={event => { pagination.setPageSize(Number(event.target.value)); onNavigate?.(); }}
        >
          {PORTFOLIO_PAGE_SIZES.map(size => <option key={size} id={`${id}-size-${size}`} value={size}>{size}</option>)}
        </select>
      </label>
      <span id={`${id}-range`} className={`portfolio-pagination-range`} role={announce ? `status` : undefined} aria-atomic={announce || undefined}>
        {`${pagination.start}–${pagination.end} Of ${pagination.total} Expanded Domains`}
      </span>
      <div id={`${id}-pages`} className={`portfolio-pagination-pages`}>
        <button
          type={`button`}
          id={`${id}-previous`}
          aria-label={`Previous Domain Page`}
          className={`portfolio-pagination-button`}
          disabled={disabled || pagination.page <= 1}
          onClick={() => { pagination.setPage(pagination.page - 1); onNavigate?.(); }}
        >
          <ChevronLeft size={16} aria-hidden={`true`} id={`${id}-previous-icon`} className={`portfolio-pagination-icon`} />
        </button>
        <span id={`${id}-page`} className={`portfolio-pagination-page`}>{`${pagination.page} / ${pagination.pageCount}`}</span>
        <button
          type={`button`}
          id={`${id}-next`}
          aria-label={`Next Domain Page`}
          className={`portfolio-pagination-button`}
          disabled={disabled || pagination.page >= pagination.pageCount}
          onClick={() => { pagination.setPage(pagination.page + 1); onNavigate?.(); }}
        >
          <ChevronRight size={16} aria-hidden={`true`} id={`${id}-next-icon`} className={`portfolio-pagination-icon`} />
        </button>
      </div>
    </nav>
  );
};

export default PortfolioPagination;
