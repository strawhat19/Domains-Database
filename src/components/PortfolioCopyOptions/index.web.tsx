import './styles.scss';
import { useRef } from 'react';
import '../DomainEditor/styles.scss';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { X, Eye, EyeOff, FileText, FolderTree, ListOrdered } from 'lucide-react';
import type { PortfolioCopyFormat } from '../DomainPortfolio/copyFormats';

interface PortfolioCopyOptionsProps {
  busy: boolean;
  count: number;
  error?: string;
  label?: string;
  idPrefix?: string;
  allowEmptyTree?: boolean;
  kind?: `domains` | `stars`;
  onClose: () => void;
  treeAvailable: boolean;
  onCopy: (format: PortfolioCopyFormat) => void;
  hiddenOptions?: { included: boolean; onChange: (included: boolean) => void };
}

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
    description: `The same tree with descriptions beside collection and group names`,
  },
] as const;

const PortfolioCopyOptions = ({ busy, count, error, label, onCopy, onClose, treeAvailable, hiddenOptions, kind = `domains`, allowEmptyTree = false, idPrefix = `portfolio-copy` }: PortfolioCopyOptionsProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const close = () => { if (!busy) onClose(); };
  const scopeLabel = label?.trim();
  const HiddenIcon = hiddenOptions?.included ? Eye : EyeOff;
  useModalFocus(modalRef, true, close, !!scopeLabel);

  return (
    <div
      role={`presentation`}
      id={`${idPrefix}-options-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-busy={busy}
        aria-modal={`true`}
        id={`${idPrefix}-options-dialog`}
        aria-labelledby={`${idPrefix}-options-title`}
        className={`domain-dialog portfolio-copy-options`}
        aria-describedby={`${idPrefix}-options-description`}
      >
        <header id={`${idPrefix}-options-header`} className={`domain-dialog-header`}>
          <div id={`${idPrefix}-options-heading`} className={`domain-dialog-heading`}>
            <span id={`${idPrefix}-options-eyebrow`} className={`domain-dialog-eyebrow`}>{kind === `stars` ? `COLLECTION STARS` : `ACTIONS`}</span>
            <h2 id={`${idPrefix}-options-title`} className={`domain-dialog-title`}>{kind === `stars` ? `Copy Stars` : scopeLabel ? `Copy ${scopeLabel}` : `Copy Domains`}</h2>
          </div>
          <button
            type={`button`}
            disabled={busy}
            onClick={close}
            className={`domain-dialog-close`}
            id={`${idPrefix}-options-close`}
            aria-label={`Close Copy Options`}
          >
            <X size={19} aria-hidden={`true`} id={`${idPrefix}-options-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`${idPrefix}-options-body`} className={`domain-dialog-body`}>
        <p id={`${idPrefix}-options-description`} className={`domain-dialog-description`}>
          {kind === `stars`
            ? count ? `Choose a numbered format for the ${count} starred ${count === 1 ? `item` : `items`} in this collection.` : `No starred items to copy with the current options.`
            : !count && (!treeAvailable || !allowEmptyTree) ? `No items to copy with the current options.`
              : !count && allowEmptyTree ? `Choose a tree format for the collections and groups currently displayed.`
              : `Choose a numbered format for the ${count} ${count === 1 ? `domain` : `domains`} ${scopeLabel ? `in ${scopeLabel}` : `currently displayed`}.`}
        </p>
        {hiddenOptions && (
          <label htmlFor={`${idPrefix}-include-hidden`} id={`${idPrefix}-include-hidden-label`} className={`portfolio-copy-hidden-option`}>
            <input
              type={`checkbox`}
              disabled={busy}
              checked={hiddenOptions.included}
              id={`${idPrefix}-include-hidden`}
              className={`portfolio-copy-hidden-checkbox`}
              onChange={event => hiddenOptions.onChange(event.target.checked)}
            />
            <HiddenIcon size={15} aria-hidden={`true`} id={`${idPrefix}-include-hidden-icon`} className={`portfolio-copy-hidden-icon`} />
            <span id={`${idPrefix}-include-hidden-text`} className={`portfolio-copy-hidden-text`}>{`Include Hidden`}</span>
          </label>
        )}
        <div id={`${idPrefix}-options-list`} className={`portfolio-copy-options-list`}>
          {COPY_OPTIONS.map(({ Icon, label, format, description }) => {
            const scope = `${idPrefix}-option-${format}`;
            const treeDisabled = format !== `list` && !treeAvailable;
            const emptyDisabled = !count && (format === `list` || !allowEmptyTree);
            return (
              <button
                key={format}
                type={`button`}
                id={scope}
                onClick={() => onCopy(format)}
                disabled={busy || emptyDisabled || treeDisabled}
                data-autofocus={!busy && !emptyDisabled && !treeDisabled && format === (count ? `list` : `tree`) || undefined}
                className={`portfolio-button portfolio-button-secondary portfolio-copy-option`}
                aria-describedby={`${scope}-description${treeDisabled ? ` ${idPrefix}-tree-help` : ``}`}
              >
                <Icon size={20} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-button-icon portfolio-copy-option-icon`} />
                <span id={`${scope}-content`} className={`portfolio-copy-option-content`}>
                  <span id={`${scope}-label`} className={`portfolio-copy-option-label`}>{label}</span>
                  <span id={`${scope}-description`} className={`portfolio-copy-option-description`}>{kind === `stars` && format === `list` ? `A–Z group and domain names in a numbered list` : description}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!treeAvailable && (
          <p id={`${idPrefix}-tree-help`} className={`portfolio-copy-tree-help`}>
            {scopeLabel ? `Tree formats are available when copying a group or collection` : `Add a group or collection to use the tree formats`}
          </p>
        )}
        {error && <p role={`alert`} id={`${idPrefix}-options-error`} className={`domain-dialog-error`}>{error}</p>}
        </div>
        <footer id={`${idPrefix}-options-footer`} className={`domain-dialog-footer portfolio-copy-options-footer`}>
          <button
            type={`button`}
            disabled={busy}
            onClick={close}
            id={`${idPrefix}-options-cancel`}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <X size={15} aria-hidden={`true`} id={`${idPrefix}-options-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`${idPrefix}-options-cancel-text`} className={`portfolio-button-text`}>{busy ? `Copying…` : `Cancel`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioCopyOptions;
