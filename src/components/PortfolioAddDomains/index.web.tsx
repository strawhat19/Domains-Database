import './styles.scss';
import '../DomainEditor/styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import { X, Plus, Search } from 'lucide-react';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { usePortfolioAddDomains, type PortfolioAddDomainsProps } from './usePortfolioAddDomains';

const PortfolioAddDomains = (props: PortfolioAddDomainsProps) => {
  const picker = usePortfolioAddDomains(props);
  const scope = `${props.idPrefix}-add-domains`;
  const destinationName = picker.destinationName;
  const destinationIcon = (size: number, id: string) => picker.isCollection ? (
    <svg
      id={id}
      width={size}
      height={size}
      stroke={`none`}
      focusable={false}
      aria-hidden={`true`}
      fill={`currentColor`}
      viewBox={`0 0 24 24`}
      className={`portfolio-add-domains-destination-icon portfolio-add-domains-collection-icon`}
    >
      <path fillRule={`evenodd`} id={`${id}-path`} className={`portfolio-add-domains-collection-icon-path`} d={`M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 9h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z`} />
    </svg>
  ) : <DomainSiteIcon compact size={size} domain={``} fallback={picker.isApp ? `app` : `group`} id={id} />;

  return (
    <div id={scope} className={`portfolio-add-domains`}>
      <div
        id={`${scope}-row`}
        className={`portfolio-quick-add-row`}
        onMouseDown={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
      >
        <div id={`${scope}-trailing`} className={`portfolio-quick-add-trailing`}>
          <label
            id={`${scope}-inline-label`}
            htmlFor={`${scope}-inline-name`}
            className={`portfolio-quick-add-label`}
            onClick={event => event.stopPropagation()}
          >
            <Plus size={12} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-add-domains-icon`} />
            <span id={`${scope}-text`} className={`portfolio-add-domains-text`}>
              <span id={`${scope}-prefix`} className={`portfolio-add-domains-prefix`}>{`Add Domain to`}</span>
              {destinationIcon(14, `${scope}-destination-icon`)}
              <span id={`${scope}-destination-name`} className={`portfolio-add-domains-destination-name`}>{destinationName}</span>
            </span>
          </label>
          <input
            type={`text`}
            draggable={false}
            autoComplete={`off`}
            ref={picker.inlineInputRef}
            value={picker.inlineQuery}
            id={`${scope}-inline-name`}
            placeholder={`Domain name…`}
            title={`Press Enter To Add A Database Domain`}
            disabled={picker.unavailable || picker.open}
            aria-invalid={Boolean(picker.quickError)}
            className={`portfolio-quick-add-input`}
            aria-label={`Database Domain Name to Add to ${destinationName}`}
            aria-describedby={picker.quickError ? `${scope}-quick-error` : undefined}
            onChange={event => picker.setInlineQuery(event.target.value)}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => { event.stopPropagation(); picker.handleInlineKeyDown(event); }}
            onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
          />
          <button
            type={`button`}
            draggable={false}
            ref={picker.buttonRef}
            id={`${scope}-button`}
            aria-expanded={picker.open}
            disabled={picker.unavailable}
            aria-controls={`${scope}-dialog`}
            aria-haspopup={`dialog`}
            title={`Choose Domains for ${destinationName}`}
            aria-label={`Choose Domains for ${destinationName}`}
            data-focus-fallback={props.focusFallbackId}
            className={`portfolio-add-domains-button portfolio-add-domains-picker-button`}
            onMouseDown={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
            onClick={event => { event.stopPropagation(); picker.openPicker(); }}
            onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
          >
            <Search size={12} aria-hidden={`true`} id={`${scope}-picker-icon`} className={`portfolio-add-domains-icon`} />
          </button>
          {!!picker.quickSuggestions.length && (
            <div id={`${scope}-quick-add-pills`} className={`portfolio-quick-add-pills`}>
              {picker.quickSuggestions.map(domain => {
                const domainScope = `${scope}-quick-add-domain-${domain.id}`;
                const label = `Add ${domain.name} to ${destinationName}`;
                return (
                  <button
                    key={domain.id}
                    type={`button`}
                    title={label}
                    id={domainScope}
                    draggable={false}
                    aria-label={label}
                    disabled={picker.unavailable}
                    className={`portfolio-quick-add-pill`}
                    onMouseDown={event => event.stopPropagation()}
                    onPointerDown={event => event.stopPropagation()}
                    onClick={event => { event.stopPropagation(); picker.addQuickDomain(domain.id); }}
                    onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
                  >
                    <DomainSiteIcon
                      compact
                      size={10}
                      domain={domain.name}
                      id={`${domainScope}-site-icon`}
                      iconUrl={typeof domain.meta?.siteIconUrl === `string` ? domain.meta.siteIconUrl : undefined}
                    />
                    <span id={`${domainScope}-label`} className={`portfolio-quick-add-pill-label`}>{domain.name}</span>
                    <Plus size={10} aria-hidden={`true`} id={`${domainScope}-icon`} className={`portfolio-quick-add-pill-icon`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {picker.quickError && typeof document !== `undefined` && createPortal(
        <div
          id={`${scope}-quick-error`}
          className={`portfolio-add-domains-quick-error-toast`}
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
        >
          <Toast id={`${scope}-quick-error-toast`} message={picker.quickError} onDismiss={() => picker.setInlineQuery(picker.inlineQuery)} />
        </div>,
        document.body,
        `${scope}-quick-error-portal`,
      )}
      {picker.open && typeof document !== `undefined` && createPortal(
        <div
          role={`presentation`}
          id={`${scope}-backdrop`}
          className={`domain-dialog-backdrop`}
          onClick={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
          onMouseDown={event => {
            event.stopPropagation();
            if (event.target === event.currentTarget) picker.closePicker();
          }}
        >
          <div
            tabIndex={-1}
            role={`dialog`}
            ref={picker.modalRef}
            aria-modal={`true`}
            id={`${scope}-dialog`}
            aria-busy={picker.loading}
            aria-labelledby={`${scope}-title`}
            aria-describedby={`${scope}-description`}
            className={`domain-dialog portfolio-add-domains-dialog`}
          >
            <header id={`${scope}-header`} className={`domain-dialog-header`}>
              <div id={`${scope}-heading`} className={`domain-dialog-heading`}>
                <span id={`${scope}-eyebrow`} className={`domain-dialog-eyebrow`}>{`DATABASE DOMAINS`}</span>
                <h2 id={`${scope}-title`} className={`domain-dialog-title`}>{`Add Domains`}</h2>
                <div id={`${scope}-destination`} className={`portfolio-add-domains-destination`}>
                  <span id={`${scope}-destination-label`} className={`portfolio-add-domains-destination-label`}>{`To`}</span>
                  {destinationIcon(16, `${scope}-dialog-destination-icon`)}
                  <span id={`${scope}-dialog-destination-name`} className={`portfolio-add-domains-destination-name`}>{destinationName}</span>
                </div>
              </div>
              <button
                type={`button`}
                id={`${scope}-close`}
                onClick={picker.closePicker}
                aria-label={`Close Add Domains`}
                className={`domain-dialog-close`}
              >
                <X size={19} aria-hidden={`true`} id={`${scope}-close-icon`} className={`domain-dialog-close-icon`} />
              </button>
            </header>
            <form noValidate id={`${scope}-form`} className={`domain-dialog-form`} onSubmit={picker.handleSubmit}>
              <div id={`${scope}-body`} className={`domain-dialog-body portfolio-add-domains-body`}>
                <p id={`${scope}-description`} className={`domain-dialog-description`}>{`Search and select domains from Database to add to this ${picker.targetKind}.`}</p>
                <div id={`${scope}-search-field`} className={`portfolio-add-domains-search-field`}>
                  <label htmlFor={`${scope}-search`} id={`${scope}-search-label`} className={`portfolio-sr-only`}>{`Search Database Domains`}</label>
                  <Search size={16} aria-hidden={`true`} id={`${scope}-search-icon`} className={`portfolio-add-domains-search-icon`} />
                  <input
                    type={`search`}
                    autoComplete={`off`}
                    id={`${scope}-search`}
                    ref={picker.inputRef}
                    value={picker.query}
                    data-autofocus={!picker.unavailable || undefined}
                    disabled={picker.unavailable}
                    placeholder={`Search domains…`}
                    aria-controls={`${scope}-suggestions`}
                    aria-describedby={`${scope}-selection${picker.error ? ` ${scope}-error` : ``}`}
                    onChange={event => picker.setQuery(event.target.value)}
                    className={`domain-editor-input portfolio-add-domains-search`}
                  />
                </div>
                <div id={`${scope}-summary`} className={`portfolio-add-domains-summary`}>
                  <span id={`${scope}-suggestions-label`} className={`portfolio-add-domains-suggestions-label`}>{`Database Domains`}</span>
                  <span role={`status`} id={`${scope}-selection`} className={`portfolio-add-domains-selection`}>{`${picker.selectedCount} Selected`}</span>
                </div>
                {picker.loading ? (
                  <p role={`status`} id={`${scope}-loading`} className={`portfolio-add-domains-empty`}>{`Loading Database Domains…`}</p>
                ) : !picker.currentTarget ? (
                  <p role={`alert`} id={`${scope}-unavailable`} className={`portfolio-add-domains-empty`}>{`This ${picker.isCollection ? `Collection` : `Group`} Is No Longer Available`}</p>
                ) : picker.suggestions.length ? (
                  <ul id={`${scope}-suggestions`} aria-labelledby={`${scope}-suggestions-label`} className={`portfolio-add-domains-suggestions`}>
                    {picker.suggestions.map(domain => {
                      const domainScope = `${scope}-domain-${domain.id}`;
                      const selected = picker.selectedIds.has(domain.id);
                      return (
                        <li key={domain.id} id={domainScope} className={`portfolio-add-domains-suggestion-item`}>
                          <label
                            id={`${domainScope}-label`}
                            htmlFor={`${domainScope}-checkbox`}
                            className={`portfolio-add-domains-suggestion${selected ? ` portfolio-add-domains-suggestion-selected` : ``}`}
                          >
                            <input
                              type={`checkbox`}
                              checked={selected}
                              id={`${domainScope}-checkbox`}
                              disabled={picker.unavailable}
                              className={`portfolio-add-domains-checkbox`}
                              onChange={() => picker.toggleDomain(domain.id)}
                            />
                            <DomainSiteIcon
                              size={26}
                              domain={domain.name}
                              id={`${domainScope}-site-icon`}
                              iconUrl={typeof domain.meta?.siteIconUrl === `string` ? domain.meta.siteIconUrl : undefined}
                            />
                            <span id={`${domainScope}-name`} className={`portfolio-add-domains-domain-name`}>{domain.name}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div id={`${scope}-empty`} className={`portfolio-add-domains-empty`}>
                    <p id={`${scope}-empty-title`} className={`portfolio-add-domains-empty-title`}>{picker.ungroupedCount ? `No Matching Domains` : `No Available Database Domains`}</p>
                    <p id={`${scope}-empty-help`} className={`portfolio-add-domains-empty-help`}>{picker.ungroupedCount ? `Try a different search.` : `All visible domains already belong to a group or collection.`}</p>
                  </div>
                )}
                {!picker.loading && picker.matchingCount > picker.suggestions.length && (
                  <p id={`${scope}-limit`} className={`portfolio-add-domains-help`}>{`Showing ${picker.suggestions.length} of ${picker.matchingCount} matches. Refine your search to find more.`}</p>
                )}
                {picker.error && <p role={`alert`} id={`${scope}-error`} className={`domain-dialog-error`}>{picker.error}</p>}
              </div>
              <footer id={`${scope}-footer`} className={`domain-dialog-footer portfolio-add-domains-footer`}>
                <button
                  type={`button`}
                  id={`${scope}-cancel`}
                  onClick={picker.closePicker}
                  className={`portfolio-button portfolio-button-secondary`}
                >
                  <X size={15} aria-hidden={`true`} id={`${scope}-cancel-icon`} className={`portfolio-button-icon`} />
                  <span id={`${scope}-cancel-text`} className={`portfolio-button-text`}>{`Cancel`}</span>
                </button>
                <button
                  type={`submit`}
                  id={`${scope}-submit`}
                  disabled={picker.unavailable || !picker.selectedCount}
                  className={`portfolio-button portfolio-button-primary`}
                >
                  <Plus size={15} aria-hidden={`true`} id={`${scope}-submit-icon`} className={`portfolio-button-icon`} />
                  <span id={`${scope}-submit-text`} className={`portfolio-button-text`}>{`Add Selected`}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>,
        document.body,
        `${scope}-portal`,
      )}
    </div>
  );
};

export default PortfolioAddDomains;
