import './styles.scss';
import { useRef } from 'react';
import '../DomainEditor/styles.scss';
import { X, FileText, FolderTree, ListOrdered } from 'lucide-react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { PortfolioCopyFormat } from '../DomainPortfolio/copyFormats';

interface PortfolioCopyOptionsProps {
  busy: boolean;
  count: number;
  error?: string;
  onClose: () => void;
  treeAvailable: boolean;
  onCopy: (format: PortfolioCopyFormat) => void;
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

const PortfolioCopyOptions = ({ busy, count, error, onCopy, onClose, treeAvailable }: PortfolioCopyOptionsProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, true, onClose);

  return (
    <div
      role={`presentation`}
      id={`portfolio-copy-options-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-busy={busy}
        aria-modal={`true`}
        id={`portfolio-copy-options-dialog`}
        aria-labelledby={`portfolio-copy-options-title`}
        className={`domain-dialog portfolio-copy-options`}
        aria-describedby={`portfolio-copy-options-description`}
      >
        <header id={`portfolio-copy-options-header`} className={`domain-dialog-header`}>
          <div id={`portfolio-copy-options-heading`} className={`domain-dialog-heading`}>
            <span id={`portfolio-copy-options-eyebrow`} className={`domain-dialog-eyebrow`}>{`YOUR PORTFOLIO`}</span>
            <h2 id={`portfolio-copy-options-title`} className={`domain-dialog-title`}>{`Copy domains`}</h2>
          </div>
          <button
            type={`button`}
            disabled={busy}
            onClick={onClose}
            className={`domain-dialog-close`}
            id={`portfolio-copy-options-close`}
            aria-label={`Close Copy Options`}
          >
            <X size={19} aria-hidden={`true`} id={`portfolio-copy-options-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`portfolio-copy-options-body`} className={`domain-dialog-body`}>
        <p id={`portfolio-copy-options-description`} className={`domain-dialog-description`}>
          {`Choose a numbered format for the ${count} ${count === 1 ? `domain` : `domains`} currently displayed.`}
        </p>
        <div id={`portfolio-copy-options-list`} className={`portfolio-copy-options-list`}>
          {COPY_OPTIONS.map(({ Icon, label, format, description }) => {
            const scope = `portfolio-copy-option-${format}`;
            const treeDisabled = format !== `list` && !treeAvailable;
            return (
              <button
                key={format}
                type={`button`}
                id={scope}
                onClick={() => onCopy(format)}
                disabled={busy || !count || treeDisabled}
                data-autofocus={format === `list` || undefined}
                className={`portfolio-button portfolio-button-secondary portfolio-copy-option`}
                aria-describedby={`${scope}-description${treeDisabled ? ` portfolio-copy-tree-help` : ``}`}
              >
                <Icon size={20} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-button-icon portfolio-copy-option-icon`} />
                <span id={`${scope}-content`} className={`portfolio-copy-option-content`}>
                  <span id={`${scope}-label`} className={`portfolio-copy-option-label`}>{label}</span>
                  <span id={`${scope}-description`} className={`portfolio-copy-option-description`}>{description}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!treeAvailable && (
          <p id={`portfolio-copy-tree-help`} className={`portfolio-copy-tree-help`}>
            {`Add a group or collection to use the tree formats`}
          </p>
        )}
        {error && <p role={`alert`} id={`portfolio-copy-options-error`} className={`domain-dialog-error`}>{error}</p>}
        </div>
        <footer id={`portfolio-copy-options-footer`} className={`domain-dialog-footer portfolio-copy-options-footer`}>
          <button
            type={`button`}
            disabled={busy}
            onClick={onClose}
            id={`portfolio-copy-options-cancel`}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <X size={15} aria-hidden={`true`} id={`portfolio-copy-options-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-copy-options-cancel-text`} className={`portfolio-button-text`}>{busy ? `Copying…` : `Cancel`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioCopyOptions;
