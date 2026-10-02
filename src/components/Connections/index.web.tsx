import './styles.scss';
import { useConnections } from './useConnections';
import { REGISTRARS } from '../../shared/config';
import { connectionFields } from '../../shared/connections/types';
import { X, Upload, Download, ArrowUpRight, LockKeyhole } from 'lucide-react';

interface ConnectionsProps {
  onClose: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
}

const Connections = ({ onClose, onImport, onDownloadTemplate }: ConnectionsProps) => {
  const { modalRef, registrarLinks } = useConnections(onClose);
  return (
    <div
      role={`presentation`}
      id={`connections-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        ref={modalRef}
        role={`dialog`}
        aria-modal={`true`}
        id={`connections-dialog`}
        className={`domain-dialog connections-dialog`}
        aria-labelledby={`connections-title`}
        aria-describedby={`connections-description`}
      >
        <header id={`connections-header`} className={`domain-dialog-header`}>
          <div id={`connections-heading`} className={`domain-dialog-heading`}>
            <span id={`connections-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`ONE COLLECTION, YOUR REGISTRARS`}
            </span>
            <h2 id={`connections-title`} className={`domain-dialog-title`}>
              {`Bring them together`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`connections-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Registrar Connections`}
          >
            <X size={19} aria-hidden={`true`} id={`connections-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <p id={`connections-description`} className={`domain-dialog-description`}>
          {`Gather the domains from each account. Connect supported registrars from your account, add records by hand, or import them with our CSV template.`}
        </p>
        <ul id={`connections-registrar-list`} className={`connections-registrar-list`}>
          {REGISTRARS.map(registrar => {
            const scope = `connections-${registrar.toLowerCase().replaceAll(` `, `-`)}`;
            const registrarKey = registrar.toLowerCase().replaceAll(` `, `-`);
            const supportsConnection = connectionFields.some(field => field.label === registrar);
            return (
              <li id={scope} key={registrar} className={`connections-registrar-row`}>
                <span id={`${scope}-mark`} className={`registrar-mark connections-registrar-mark registrar-mark-${registrarKey}`} aria-hidden={`true`}>
                  {registrar.charAt(0)}
                </span>
                <div id={`${scope}-copy`} className={`connections-registrar-copy`}>
                  <span id={`${scope}-name`} className={`connections-registrar-name`}>
                    {registrar}
                  </span>
                  <span id={`${scope}-status`} className={`connections-registrar-status`}>
                    {supportsConnection ? `API Connection, Manual Entry & CSV` : `Manual Entry & CSV Import`}
                  </span>
                </div>
                <a
                  target={`_blank`}
                  href={registrarLinks[registrar]}
                  rel={`noopener noreferrer`}
                  id={`${scope}-open-account`}
                  className={`connections-registrar-link`}
                  aria-label={`Open ${registrar} In A New Tab`}
                >
                  <span id={`${scope}-link-text`} className={`connections-registrar-link-text`}>
                    {`Open`}
                  </span>
                  <ArrowUpRight size={14} aria-hidden={`true`} id={`${scope}-link-icon`} className={`connections-registrar-link-icon`} />
                </a>
              </li>
            );
          })}
        </ul>
        <div id={`connections-private-note`} className={`connections-private-note`}>
          <LockKeyhole size={18} aria-hidden={`true`} id={`connections-private-icon`} className={`connections-private-icon`} />
          <div id={`connections-private-copy`} className={`connections-private-copy`}>
            <span id={`connections-private-title`} className={`connections-private-title`}>
              {`Your portfolio stays on this device`}
            </span>
            <p id={`connections-private-description`} className={`connections-private-description`}>
              {`Manual entry and CSV import need no API keys. Save supported registrar connections in your private account settings for read-only domain checks. Portfolio edits do not change registrar settings.`}
            </p>
          </div>
        </div>
        <footer id={`connections-footer`} className={`domain-dialog-footer connections-footer`}>
          <button
            type={`button`}
            onClick={onDownloadTemplate}
            id={`connections-download-template`}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <Download size={15} aria-hidden={`true`} id={`connections-template-icon`} className={`portfolio-button-icon`} />
            <span id={`connections-template-text`} className={`portfolio-button-text`}>
              {`CSV Template`}
            </span>
          </button>
          <button
            type={`button`}
            onClick={onImport}
            id={`connections-import-csv`}
            className={`portfolio-button portfolio-button-primary`}
          >
            <Upload size={15} aria-hidden={`true`} id={`connections-import-icon`} className={`portfolio-button-icon`} />
            <span id={`connections-import-text`} className={`portfolio-button-text`}>
              {`Import CSV`}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Connections;
