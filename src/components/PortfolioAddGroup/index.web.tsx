import './styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import { Plus, Database } from 'lucide-react';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { usePortfolioAddGroup, type PortfolioAddGroupProps } from './usePortfolioAddGroup';

const PortfolioAddGroup = (props: PortfolioAddGroupProps) => {
  const group = usePortfolioAddGroup(props);
  const scope = `${props.idPrefix}-add-group`;

  return (
    <div id={scope} className={`portfolio-add-group`}>
      <form
        noValidate
        id={`${scope}-row`}
        onSubmit={group.handleSubmit}
        onKeyDown={group.handleKeyDown}
        className={`portfolio-add-group-form portfolio-quick-add-row`}
      >
        <div id={`${scope}-trailing`} className={`portfolio-quick-add-trailing`}>
          <label
            id={`${scope}-label`}
            htmlFor={`${scope}-name`}
            className={`portfolio-add-group-label portfolio-quick-add-label`}
          >
            <Plus size={12} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-add-group-icon`} />
            <span id={`${scope}-text`} className={`portfolio-add-group-text`}>
              <span id={`${scope}-prefix`} className={`portfolio-add-group-prefix`}>{`Add Group to`}</span>
              {props.collectionId ? (
                <svg
                  width={14}
                  height={14}
                  stroke={`none`}
                  focusable={false}
                  aria-hidden={`true`}
                  fill={`currentColor`}
                  viewBox={`0 0 24 24`}
                  id={`${scope}-destination-icon`}
                  className={`portfolio-add-group-destination-icon portfolio-add-group-collection-icon`}
                >
                  <path
                    fillRule={`evenodd`}
                    id={`${scope}-destination-icon-path`}
                    className={`portfolio-add-group-destination-icon-path`}
                    d={`M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 9h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z`}
                  />
                </svg>
              ) : (
                <Database size={14} aria-hidden={`true`} id={`${scope}-destination-icon`} className={`portfolio-add-group-destination-icon portfolio-add-group-database-icon`} />
              )}
              <span id={`${scope}-destination-name`} className={`portfolio-add-group-destination-name`}>{group.destinationName}</span>
            </span>
          </label>
          <input
            type={`text`}
            maxLength={80}
            draggable={false}
            value={group.name}
            ref={group.inputRef}
            autoComplete={`off`}
            id={`${scope}-name`}
            placeholder={`Group name`}
            disabled={group.unavailable}
            title={`Press Enter To Add Group`}
            aria-invalid={Boolean(group.error)}
            aria-label={`Group Name For ${group.destinationName}`}
            className={`portfolio-add-group-input portfolio-quick-add-input`}
            aria-describedby={group.error ? `${scope}-error` : undefined}
            onClick={event => event.stopPropagation()}
            onMouseDown={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
            onChange={event => group.setName(event.target.value)}
            onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
          />
          {group.suggestions.length > 0 && (
            <div id={`${scope}-quick-add-pills`} className={`portfolio-quick-add-pills`}>
              {group.suggestions.map(suggestion => {
                const pillScope = `${scope}-quick-add-group-${suggestion.id}`;
                const label = `Add ${suggestion.name} to ${group.destinationName}`;
                return (
                  <button
                    key={suggestion.id}
                    type={`button`}
                    title={label}
                    aria-label={label}
                    draggable={false}
                    id={`${pillScope}-button`}
                    disabled={group.unavailable}
                    className={`portfolio-quick-add-pill`}
                    onMouseDown={event => event.stopPropagation()}
                    onPointerDown={event => event.stopPropagation()}
                    onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
                    onClick={event => { event.stopPropagation(); group.addSuggestedGroup(suggestion.id); }}
                  >
                    <DomainSiteIcon compact size={10} domain={``} fallback={suggestion.isApp ? `app` : `group`} id={`${pillScope}-symbol`} iconUrl={suggestion.siteIconUrl} />
                    <span id={`${pillScope}-label`} className={`portfolio-quick-add-pill-label`}>{suggestion.name}</span>
                    <Plus size={10} aria-hidden={`true`} id={`${pillScope}-plus`} className={`portfolio-quick-add-pill-icon`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </form>
      {group.error && typeof document !== `undefined` && createPortal(
        <div
          id={`${scope}-error`}
          className={`portfolio-add-group-error-toast`}
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
        >
          <Toast id={`${scope}-error-toast`} message={group.error} onDismiss={() => group.setName(group.name)} />
        </div>,
        document.body,
        `${scope}-error-portal`,
      )}
    </div>
  );
};

export default PortfolioAddGroup;
