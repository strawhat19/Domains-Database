import './styles.scss';
import { useEffect, useRef } from 'react';
import type { PortfolioSettingsActionsProps } from './types';
import BooleanSetting from '../SegmentedControl/BooleanSetting.web';
import { usePortfolioRowCopy } from '../PortfolioRowCopy/usePortfolioRowCopy';
import { X, Eye, Copy, Check, EyeOff, FileJson, FileText, FolderTree, ListOrdered } from 'lucide-react';

const COPY_OPTIONS = [
  {
    format: `list`,
    Icon: ListOrdered,
    label: `Alphabetical List`,
    description: `A–Z domain names in a numbered list`,
  },
  {
    format: `tree`,
    Icon: FolderTree,
    label: `Tree`,
    description: `Collections and groups with sequentially numbered domains`,
  },
  {
    Icon: FileText,
    format: `detail-tree`,
    label: `Detailed Tree`,
    description: `The same tree with collection and group descriptions`,
  },
  {
    Icon: FileJson,
    format: `json`,
    label: `Copy JSON`,
    description: `Domain records, collections and groups in the API response format`,
  },
] as const;

const PortfolioSettingsActions = ({ id, label, hidden, sections, onToggleVisibility, disabled = false, treeAvailable = true }: PortfolioSettingsActionsProps) => {
  const copyId = `${id}-copy`;
  const state = usePortfolioRowCopy({ label, sections, disabled, treeAvailable, id: copyId });
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const VisibilityIcon = hidden ? Eye : EyeOff;
  const CopyIcon = state.copied ? Check : Copy;
  const visibilityLabel = `${hidden ? `Show` : `Hide`} ${label}`;
  const copyLabel = state.copying ? `Copying ${label}…` : state.copied ? `Copied ${label}` : `Copy ${label}`;

  useEffect(() => {
    if (!state.open) return;
    const frame = window.requestAnimationFrame(() => firstOptionRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [state.open]);

  return (
    <div
      id={id}
      className={`portfolio-settings-actions`}
      onKeyDown={event => {
        if (event.key !== `Escape` || !state.open) return;
        event.preventDefault();
        event.stopPropagation();
        state.closeCopyOptions();
      }}
    >
      <div role={`group`} aria-label={`Actions For ${label}`} id={`${id}-buttons`} className={`portfolio-settings-action-buttons`}>
        <button
          type={`button`}
          title={visibilityLabel}
          aria-label={visibilityLabel}
          onClick={onToggleVisibility}
          id={`${id}-visibility`}
          disabled={disabled || state.copying}
          className={`portfolio-button portfolio-button-secondary portfolio-settings-action`}
        >
          <VisibilityIcon size={16} aria-hidden={`true`} id={`${id}-visibility-icon`} className={`portfolio-button-icon`} />
          <span id={`${id}-visibility-text`} className={`portfolio-button-text`}>{hidden ? `Show` : `Hide`}</span>
        </button>
        <button
          id={copyId}
          type={`button`}
          title={copyLabel}
          aria-label={copyLabel}
          ref={state.buttonRef}
          aria-busy={state.copying}
          aria-expanded={state.open}
          aria-controls={`${id}-copy-options`}
          disabled={state.unavailable || state.copying}
          onClick={state.open ? state.closeCopyOptions : state.openCopyOptions}
          className={`portfolio-button portfolio-button-secondary portfolio-settings-action${state.copied ? ` portfolio-settings-action-copied` : ``}`}
        >
          <CopyIcon size={16} aria-hidden={`true`} id={`${copyId}-icon`} className={`portfolio-button-icon`} />
          <span id={`${copyId}-text`} className={`portfolio-button-text`}>{state.copying ? `Copying…` : state.copied ? `Copied` : `Copy`}</span>
        </button>
      </div>
      <span role={`status`} aria-live={`polite`} aria-atomic={`true`} id={`${id}-status`} className={`portfolio-settings-actions-status`}>
        {state.copied ? state.copyMessage : ``}
      </span>
      {state.open && (
        <section
          aria-busy={state.copying}
          id={`${id}-copy-options`}
          className={`portfolio-settings-copy-options`}
          aria-labelledby={`${id}-copy-options-title`}
        >
          <div id={`${id}-copy-options-heading`} className={`portfolio-settings-copy-heading`}>
            <h3 id={`${id}-copy-options-title`} className={`portfolio-settings-copy-title`}>{`Copy ${label}`}</h3>
            <button
              type={`button`}
              disabled={state.copying}
              onClick={state.closeCopyOptions}
              id={`${id}-copy-options-close`}
              aria-label={`Close Copy Options`}
              className={`portfolio-settings-copy-close`}
            >
              <X size={16} aria-hidden={`true`} id={`${id}-copy-options-close-icon`} className={`portfolio-settings-copy-close-icon`} />
            </button>
          </div>
          <p id={`${id}-copy-description`} className={`portfolio-settings-copy-description`}>
            {state.count ? `Choose a format for ${state.count} ${state.count === 1 ? `domain` : `domains`}.`
              : state.allowEmptyJson ? `Copy collection and group details as JSON.` : `No domains to copy with the current options.`}
          </p>
          {state.showHiddenOptions && (
            <div id={`${id}-copy-hidden-field`} className={`portfolio-settings-copy-hidden-field`}>
              <span id={`${id}-copy-hidden-label`} className={`portfolio-settings-copy-hidden-label`}>{`Include Hidden`}</span>
              <BooleanSetting
                value={state.includeHidden}
                id={`${id}-copy-hidden`}
                disabled={disabled || state.copying}
                onChange={state.changeIncludeHidden}
                className={`portfolio-settings-copy-hidden-control`}
                labelledBy={`${id}-copy-hidden-label`}
              />
            </div>
          )}
          <div id={`${id}-copy-formats`} className={`portfolio-settings-copy-formats`}>
            {COPY_OPTIONS.filter(option => treeAvailable || option.format === `list` || option.format === `json`).map(({ Icon, label: formatLabel, format, description }) => {
              const optionId = `${id}-copy-${format}`;
              return (
                <button
                  key={format}
                  id={optionId}
                  type={`button`}
                  onClick={() => state.copyDomains(format)}
                  aria-describedby={`${optionId}-description`}
                  ref={format === (state.count ? `list` : `json`) ? firstOptionRef : undefined}
                  disabled={state.unavailable || state.copying || !state.count && (format !== `json` || !state.allowEmptyJson)}
                  className={`portfolio-button portfolio-button-secondary portfolio-settings-copy-format`}
                >
                  <Icon size={17} aria-hidden={`true`} id={`${optionId}-icon`} className={`portfolio-button-icon`} />
                  <span id={`${optionId}-content`} className={`portfolio-settings-copy-format-content`}>
                    <span id={`${optionId}-label`} className={`portfolio-settings-copy-format-label`}>{formatLabel}</span>
                    <span id={`${optionId}-description`} className={`portfolio-settings-copy-format-description`}>{description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {state.copyError && <p role={`alert`} id={`${id}-copy-error`} className={`portfolio-settings-copy-error`}>{state.copyMessage}</p>}
          <button
            type={`button`}
            disabled={state.copying}
            onClick={state.closeCopyOptions}
            id={`${id}-copy-options-cancel`}
            className={`portfolio-button portfolio-button-secondary portfolio-settings-copy-cancel`}
          >
            <X size={15} aria-hidden={`true`} id={`${id}-copy-options-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`${id}-copy-options-cancel-text`} className={`portfolio-button-text`}>{state.copying ? `Copying…` : `Cancel`}</span>
          </button>
        </section>
      )}
    </div>
  );
};

export default PortfolioSettingsActions;
