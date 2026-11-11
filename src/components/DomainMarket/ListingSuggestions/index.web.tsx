import './styles.scss';
import { useRef, useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Globe2, Plus, Tag } from 'lucide-react';
import { useListingSuggestions, type ListingSuggestionsProps } from './useListingSuggestions';

const ListingSuggestions = ({ onSelect, onDismiss, dismissedIds, excludedDomains, disabled, variant = `browse` }: ListingSuggestionsProps) => {
  const { suggestions, loading, failed, retry, hasDismissedSuggestions } = useListingSuggestions(excludedDomains, dismissedIds);
  const list = useRef<HTMLUListElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const dismissFocus = useRef<number | null>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const updateEdges = useCallback(() => {
    const rail = list.current;
    if (!rail) return;
    const previous = rail.scrollLeft > 1;
    const next = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1;
    setEdges(current => current.previous === previous && current.next === next ? current : { previous, next });
  }, []);
  useEffect(() => {
    const rail = list.current;
    if (!rail || variant !== `browse`) return;
    updateEdges();
    if (typeof ResizeObserver === `undefined`) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [variant, updateEdges, suggestions.length]);
  useEffect(() => {
    const index = dismissFocus.current;
    if (index === null) return;
    dismissFocus.current = null;
    if (document.activeElement !== document.body) return;
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>(`.market-listing-suggestions__dismiss`);
    const target = buttons?.[index] ?? buttons?.[index - 1] ?? heading.current;
    target?.focus({ preventScroll: true });
  }, [suggestions]);
  const move = (direction: number) => {
    const rail = list.current;
    if (!rail) return;
    const behavior = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches ? `instant` : `smooth`;
    rail.scrollBy({ left: direction * rail.clientWidth * .8, behavior });
  };
  const dismissButton = (id: string, name: string, index: number) => (
    <button
      type={`button`}
      disabled={disabled}
      title={`Dismiss Suggestion`}
      aria-label={`Dismiss suggestion for ${name}`}
      id={`market-listing-suggestion-dismiss-${id}`}
      className={`market-listing-suggestions__dismiss`}
      onClick={event => {
        if (document.activeElement === event.currentTarget) dismissFocus.current = index;
        onDismiss(id);
      }}
    ><X size={15} aria-hidden /></button>
  );
  if (variant === `sell`) return (
    <section id={`market-listing-suggestions`} className={`market-listing-suggestions`} aria-labelledby={`market-listing-suggestions-heading`}>
      <h3 ref={heading} tabIndex={-1} id={`market-listing-suggestions-heading`} className={`market-listing-suggestions__heading`}><Tag size={16} aria-hidden />{`Suggested Domains To List`}</h3>
      {loading ? (
        <div id={`market-listing-suggestions-loading`} className={`market-listing-suggestions__grid`} role={`status`} aria-label={`Loading Your Domains`}>
          {[1, 2, 3, 4].map(index => <div key={index} id={`market-listing-suggestion-skeleton-${index}`} className={`market-listing-suggestions__card market-listing-suggestions__skeleton`} aria-hidden><span /><span /></div>)}
        </div>
      ) : failed ? (
        <div id={`market-listing-suggestions-error`} className={`market-listing-suggestions__status`} role={`status`}>
          <p className={`market-muted`}>{`Could not load your domains.`}</p>
          <button id={`market-listing-suggestions-retry`} className={`market-button`} type={`button`} onClick={retry}>{`Try Again`}</button>
        </div>
      ) : suggestions.length ? (
        <ul ref={list} id={`market-listing-suggestions-list`} className={`market-listing-suggestions__grid`}>
          {suggestions.map(({ id, name, estimateLabel, fields }, index) => (
            <li key={id} id={`market-listing-suggestion-${id}`} className={`market-listing-suggestions__item`}>
              <button
                type={`button`}
                disabled={disabled}
                id={`market-listing-suggestion-select-${id}`}
                aria-label={`Use ${name} In Listing`}
                onClick={() => onSelect(name, fields)}
                className={`market-listing-suggestions__card market-listing-suggestions__pick`}
              >
                <span className={`market-listing-suggestions__domain`}><Globe2 size={16} aria-hidden />{name}</span>
                <span className={`market-listing-suggestions__estimate`}>{estimateLabel ? <>{`Saved Estimate `}<strong>{estimateLabel}</strong></> : `No Saved Estimate`}</span>
                <span className={`market-listing-suggestions__pick-action`}><Plus size={13} aria-hidden />{`Use in Listing`}</span>
              </button>
              {dismissButton(id, name, index)}
            </li>
          ))}
        </ul>
      ) : <p id={`market-listing-suggestions-empty`} className={`market-muted`}>{hasDismissedSuggestions ? `No more domain suggestions.` : `No eligible domains in your portfolio.`}</p>}
    </section>
  );
  if (!suggestions.length && !hasDismissedSuggestions) return null;

  return <section id={`market-listing-suggestions`} className={`market-listing-suggestions`} aria-labelledby={`market-listing-suggestions-heading`}>
    <div id={`market-listing-suggestions-header`} className={`market-listing-suggestions__header`}>
      <h2 ref={heading} tabIndex={-1} id={`market-listing-suggestions-heading`} className={`market-listing-suggestions__heading`}><Tag size={16} aria-hidden />Suggested Domains To List</h2>
      {suggestions.length && (edges.previous || edges.next) ? <div id={`market-listing-suggestions-controls`} className={`market-listing-suggestions__controls`}>
        <button type={`button`} id={`market-listing-suggestions-previous`} className={`market-button market-icon-button`} aria-label={`Previous Domain Suggestions`} aria-controls={`market-listing-suggestions-list`} disabled={!edges.previous} onClick={() => move(-1)}><ChevronLeft size={16} aria-hidden /></button>
        <button type={`button`} id={`market-listing-suggestions-next`} className={`market-button market-icon-button`} aria-label={`Next Domain Suggestions`} aria-controls={`market-listing-suggestions-list`} disabled={!edges.next} onClick={() => move(1)}><ChevronRight size={16} aria-hidden /></button>
      </div> : null}
    </div>
    {suggestions.length ? <ul ref={list} id={`market-listing-suggestions-list`} className={`market-listing-suggestions__list`} onScroll={updateEdges}>
      {suggestions.map(({ id, name, estimateLabel, fields }, index) => <li key={id} id={`market-listing-suggestion-${id}`} className={`market-listing-suggestions__card market-listing-suggestions__item`}>
        <div id={`market-listing-suggestion-domain-${id}`} className={`market-listing-suggestions__domain`}><Globe2 size={16} aria-hidden />{name}</div>
        <div id={`market-listing-suggestion-estimate-${id}`} className={`market-listing-suggestions__estimate`}>
          {estimateLabel ? <>{`Saved Estimate `}<strong>{estimateLabel}</strong></> : `No Saved Estimate`}
        </div>
        <button type={`button`} id={`market-listing-suggestion-select-${id}`} className={`market-button market-listing-suggestions__action`} aria-label={`List ${name} For Sale`} onClick={() => onSelect(name, fields)}>
          <Plus size={14} aria-hidden />{`List For Sale`}
        </button>
        {dismissButton(id, name, index)}
      </li>)}
    </ul> : <p id={`market-listing-suggestions-empty`} className={`market-muted`}>{`No more domain suggestions.`}</p>}
  </section>;
};

export default ListingSuggestions;
