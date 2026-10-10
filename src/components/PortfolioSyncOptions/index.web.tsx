import './styles.scss';
import { useRef } from 'react';
import '../DomainEditor/styles.scss';
import { X, RefreshCw } from 'lucide-react';
import type { PortfolioSyncOptionsProps } from './types';
import { useModalFocus } from '../DomainEditor/useDomainEditor';

const PortfolioSyncOptions = ({ busy, choices, onSync, onClose, onSyncAll }: PortfolioSyncOptionsProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const close = () => { if (!busy) onClose(); };
  useModalFocus(modalRef, true, close);

  return (
    <div
      role={`presentation`}
      id={`portfolio-sync-options-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-busy={busy}
        aria-modal={`true`}
        id={`portfolio-sync-options-dialog`}
        aria-labelledby={`portfolio-sync-options-title`}
        className={`domain-dialog portfolio-sync-options`}
        aria-describedby={`portfolio-sync-options-description`}
      >
        <header id={`portfolio-sync-options-header`} className={`domain-dialog-header`}>
          <div id={`portfolio-sync-options-heading`} className={`domain-dialog-heading`}>
            <span id={`portfolio-sync-options-eyebrow`} className={`domain-dialog-eyebrow`}>{`CONNECTIONS`}</span>
            <h2 id={`portfolio-sync-options-title`} className={`domain-dialog-title`}>{`Sync Domains`}</h2>
          </div>
          <button
            type={`button`}
            onClick={close}
            disabled={busy}
            className={`domain-dialog-close`}
            id={`portfolio-sync-options-close`}
            aria-label={`Close Sync Options`}
          >
            <X size={19} aria-hidden={`true`} id={`portfolio-sync-options-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`portfolio-sync-options-form`} className={`domain-dialog-form`}>
          <div id={`portfolio-sync-options-body`} className={`domain-dialog-body`}>
            <p id={`portfolio-sync-options-description`} className={`domain-dialog-description`}>
              {`Choose a registrar connection or sync all listed connections.`}
            </p>
            <div id={`portfolio-sync-options-list`} className={`portfolio-sync-options-list`}>
              <button
                type={`button`}
                disabled={busy}
                data-autofocus
                onClick={onSyncAll}
                id={`portfolio-sync-option-all`}
                aria-label={`Sync Domains From All Listed Connections`}
                className={`portfolio-button portfolio-button-secondary portfolio-sync-option`}
              >
                <RefreshCw size={18} aria-hidden={`true`} id={`portfolio-sync-option-all-icon`} className={`portfolio-button-icon portfolio-sync-option-icon`} />
                <span id={`portfolio-sync-option-all-label`} className={`portfolio-sync-option-label`}>{`Sync All`}</span>
              </button>
              {choices.map(choice => {
                const scope = `portfolio-sync-option-${choice.id}`;
                return (
                  <button
                    key={choice.id}
                    type={`button`}
                    id={scope}
                    disabled={busy}
                    onClick={() => onSync(choice.id)}
                    aria-label={`Sync ${choice.label} Domains`}
                    className={`portfolio-button portfolio-button-secondary portfolio-sync-option`}
                  >
                    <RefreshCw size={18} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-button-icon portfolio-sync-option-icon`} />
                    <span id={`${scope}-label`} className={`portfolio-sync-option-label`}>{choice.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <footer id={`portfolio-sync-options-footer`} className={`domain-dialog-footer portfolio-sync-options-footer`}>
          <button
            type={`button`}
            onClick={close}
            disabled={busy}
            id={`portfolio-sync-options-cancel`}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <X size={15} aria-hidden={`true`} id={`portfolio-sync-options-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-sync-options-cancel-text`} className={`portfolio-button-text`}>{`Cancel`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioSyncOptions;
