import './styles.scss';
import StackPillShape from '../StackPillShape';
import type { RecentDomainSearchesProps } from './types';
import { newestSearches, searchSuffix } from './presentation';
import { Search, Trash2, History, AlertTriangle } from 'lucide-react';

const RecentDomainSearches = ({ error, records, loading, onClear, onSearch, inline = false, disabled = false }: RecentDomainSearchesProps) => {
  if (!records.length && !loading && !error) return null;

  return (
    <section
      aria-busy={loading}
      id={`recent-domain-searches`}
      className={`recent-domain-searches${inline ? ` recent-domain-searches-inline` : ``}`}
      aria-labelledby={`recent-domain-searches-title`}
    >
      <div id={`recent-domain-searches-heading`} className={`recent-domain-searches-heading`}>
        <h2 id={`recent-domain-searches-title`} className={`recent-domain-searches-title`}>
          <History size={14} aria-hidden id={`recent-domain-searches-icon`} className={`recent-domain-searches-icon`} />
          <span id={`recent-domain-searches-title-text`} className={`recent-domain-searches-title-text`}>{`Recent Searches`}</span>
        </h2>
        {(records.length > 0 || !!error) && (
          <button
            type={`button`}
            onClick={onClear}
            disabled={loading}
            id={`recent-domain-searches-clear`}
            className={`recent-domain-searches-clear`}
          >
            <Trash2 size={12} aria-hidden id={`recent-domain-searches-clear-icon`} className={`recent-domain-searches-clear-icon`} />
            <span id={`recent-domain-searches-clear-text`} className={`recent-domain-searches-clear-text`}>{`Clear History`}</span>
          </button>
        )}
      </div>
      {loading ? (
        <div aria-hidden id={`recent-domain-searches-loading`} className={`recent-domain-searches-row`}>
          {[0, 1, 2].map(index => (
            <span key={index} id={`recent-domain-searches-skeleton-${index}`} className={`recent-domain-searches-skeleton`}>
              <StackPillShape id={`recent-domain-searches-skeleton-shape-${index}`} />
            </span>
          ))}
        </div>
      ) : records.length > 0 && (
        <div
          tabIndex={inline ? 0 : undefined}
          id={`recent-domain-searches-row`}
          className={`recent-domain-searches-row`}
          role={inline ? `group` : undefined}
          aria-label={inline ? `Recent Domain Searches` : undefined}
        >
          {newestSearches(records).map((record, index) => {
            const suffix = searchSuffix(record.query, index);
            return (
              <button
                type={`button`}
                key={record.query}
                title={record.query}
                disabled={disabled}
                id={`recent-domain-search-pill-${suffix}`}
                data-tone={index % 2 ? `ink` : `accent`}
                className={`recent-domain-search-pill`}
                aria-label={`Search ${record.query} Again`}
                onClick={() => onSearch(record.query)}
              >
                <StackPillShape id={`recent-domain-search-pill-shape-${suffix}`} />
                <Search size={14} aria-hidden id={`recent-domain-search-pill-icon-${suffix}`} className={`recent-domain-search-pill-icon`} />
                <span id={`recent-domain-search-pill-label-${suffix}`} className={`recent-domain-search-pill-label`}>
                  {record.query}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {!!error && (
        <p role={`status`} id={`recent-domain-searches-warning`} className={`recent-domain-searches-warning`}>
          <AlertTriangle size={13} aria-hidden id={`recent-domain-searches-warning-icon`} className={`recent-domain-searches-warning-icon`} />
          <span id={`recent-domain-searches-warning-text`} className={`recent-domain-searches-warning-text`}>{error}</span>
        </p>
      )}
    </section>
  );
};

export default RecentDomainSearches;
