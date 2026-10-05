import './styles.scss';
import { useRef, useState } from 'react';
import '../DomainEditor/styles.scss';
import AccountConnections from '../AccountConnections';
import CsvDropZone from '../CsvDropZone/index.web';
import { getCsvFile } from '../../shared/csvFiles.web';
import { useRegistrarSetup } from './useRegistrarSetup';
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { useConnectRegistrar } from '../DomainEditor/ConnectRegistrar/useConnectRegistrar';
import { X, Check, Cable, LogIn, FileUp, UserPlus, Download, PencilLine, ShieldCheck } from 'lucide-react';

const entryTabs = [
  { id: `connect`, label: `Connect Registrar`, Icon: Cable },
  { id: `csv`, label: `Import / Export CSV`, Icon: FileUp },
] as const;

const RegistrarSetup = ({ onClose, onManual }: { onClose: () => void; onManual?: () => void }) => {
  const setup = useRegistrarSetup(onClose);
  const auth = useAuth();
  const readingFileRef = useRef(false);
  const [readingFile, setReadingFile] = useState(false);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = setup.saving || setup.exporting || readingFile || connectionBusy;
  const close = () => { if (!busy && !readingFileRef.current) setup.close(); };
  const connect = useConnectRegistrar(close, busy);
  const connecting = setup.entryTab === `connect`;
  useModalFocus(modalRef, true, close);

  const readCsv = async (files: File[]) => {
    if (setup.saving || readingFileRef.current) return;
    readingFileRef.current = true;
    setReadingFile(true);
    try {
      const file = getCsvFile(files);
      setup.loadCsv(await file.text(), file.name);
    } catch (caught) {
      setup.reportError(caught instanceof Error ? caught.message : `Unable to read that CSV file.`);
    } finally {
      readingFileRef.current = false;
      setReadingFile(false);
    }
  };

  return (
    <div
      role={`presentation`}
      id={`registrar-setup-backdrop`}
      className={`domain-dialog-backdrop registrar-setup-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-modal={`true`}
        id={`registrar-setup-dialog`}
        aria-labelledby={`registrar-setup-title`}
        aria-describedby={`registrar-setup-description`}
        className={`domain-dialog registrar-setup-dialog`}
      >
        <header id={`registrar-setup-header`} className={`domain-dialog-header`}>
          <div id={`registrar-setup-heading`} className={`domain-dialog-heading`}>
            <span id={`registrar-setup-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`YOUR REAL DOMAINS`}
            </span>
            <h2 id={`registrar-setup-title`} className={`domain-dialog-title`}>
              {connecting ? `Connect your registrars` : `Import or export CSV`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={close}
            disabled={busy}
            id={`registrar-setup-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Add Domain`}
          >
            <X size={19} aria-hidden={`true`} id={`registrar-setup-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <p id={`registrar-setup-description`} className={`domain-dialog-description`}>
          {`Connect your registrar accounts below to keep your domains synced. CSV import and export are available in the second tab.`}
        </p>
        <div id={`registrar-setup-entry-actions`} className={`registrar-setup-entry-actions`}>
          {onManual && (
            <button
              type={`button`}
              disabled={busy}
              id={`registrar-setup-manual-button`}
              className={`portfolio-button portfolio-button-quiet registrar-setup-manual-button`}
              onClick={() => { if (!busy) { close(); onManual(); } }}
            >
              <PencilLine size={14} aria-hidden={`true`} id={`registrar-setup-manual-icon`} className={`registrar-setup-manual-icon`} />
              <span id={`registrar-setup-manual-text`} className={`registrar-setup-manual-text`}>
                {`Enter Manually`}
              </span>
            </button>
          )}
        </div>
        <div
          id={`registrar-setup-form`}
          aria-busy={busy}
          className={`registrar-setup-form`}
        >
            <div role={`tablist`} id={`registrar-setup-tabs`} className={`registrar-setup-tabs`} aria-label={`Add Domain Method`}>
              {entryTabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  role={`tab`}
                  type={`button`}
                  disabled={busy}
                  id={`registrar-setup-tab-${id}`}
                  tabIndex={setup.entryTab === id ? 0 : -1}
                  aria-selected={setup.entryTab === id}
                  aria-controls={`registrar-setup-panel-${id}`}
                  onClick={() => setup.setEntryTab(id)}
                  className={`registrar-setup-tab${setup.entryTab === id ? ` registrar-setup-tab-active` : ``}`}
                  onKeyDown={event => {
                    if (![`ArrowLeft`, `ArrowRight`, `Home`, `End`].includes(event.key) || busy) return;
                    event.preventDefault();
                    const tab = event.key === `Home` ? `connect` : event.key === `End` ? `csv` : id === `connect` ? `csv` : `connect`;
                    setup.setEntryTab(tab);
                    document.getElementById(`registrar-setup-tab-${tab}`)?.focus();
                  }}
                >
                  <Icon size={15} aria-hidden={`true`} id={`registrar-setup-tab-icon-${id}`} className={`registrar-setup-tab-icon`} />
                  <span id={`registrar-setup-tab-label-${id}`} className={`registrar-setup-tab-label`}>{label}</span>
                  {id === `connect` && <span id={`registrar-setup-recommended`} className={`registrar-setup-recommended`}>{`Recommended`}</span>}
                </button>
              ))}
            </div>
          {connecting && (
            <div
              role={`tabpanel`}
              id={`registrar-setup-panel-connect`}
              aria-labelledby={`registrar-setup-tab-connect`}
              className={`registrar-setup-connection-panel`}
            >
              {auth.user ? (
                <AccountConnections
                  embedded
                  scope={`registrar-setup`}
                  onBusyChange={setConnectionBusy}
                />
              ) : (
                <div id={`registrar-setup-auth-prompt`} className={`registrar-setup-auth-prompt`}>
                  <Cable size={23} aria-hidden={`true`} id={`registrar-setup-auth-icon`} className={`registrar-setup-auth-icon`} />
                  <h3 id={`registrar-setup-auth-title`} className={`registrar-setup-section-title`}>{`Sign up to connect your registrars`}</h3>
                  <p id={`registrar-setup-auth-copy`} className={`registrar-setup-helper`}>
                    {auth.loading ? `Loading your account…` : `Create an account to connect GoDaddy, Hostinger, Namecheap, Porkbun, and NameSilo in one place. You can also sign in to an existing account.`}
                  </p>
                  <div id={`registrar-setup-auth-actions`} className={`registrar-setup-auth-actions`}>
                    <button type={`button`} disabled={connect.busy} id={`registrar-setup-signup`} className={`portfolio-button portfolio-button-primary`} onClick={() => connect.navigate(`/signup`)}>
                      <UserPlus size={15} aria-hidden={`true`} id={`registrar-setup-signup-icon`} className={`portfolio-button-icon`} />
                      <span id={`registrar-setup-signup-text`} className={`portfolio-button-text`}>{`Sign Up`}</span>
                    </button>
                    <button type={`button`} disabled={connect.busy} id={`registrar-setup-signin`} className={`portfolio-button portfolio-button-secondary`} onClick={() => connect.navigate(`/signin`)}>
                      <LogIn size={15} aria-hidden={`true`} id={`registrar-setup-signin-icon`} className={`portfolio-button-icon`} />
                      <span id={`registrar-setup-signin-text`} className={`portfolio-button-text`}>{`Sign In`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {setup.entryTab === `csv` && (
            <fieldset
              role={`tabpanel`}
              disabled={busy}
              id={`registrar-setup-panel-csv`}
              className={`registrar-setup-details`}
              aria-labelledby={`registrar-setup-tab-csv`}
            >
              <legend id={`registrar-setup-details-legend`} className={`portfolio-sr-only`}>
                {`Domain CSV Import And Export`}
              </legend>
              <p id={`registrar-setup-csv-guide`} className={`registrar-setup-helper`}>
                {`Import domains from any registrar using a CSV with domain, registrar, and expiry columns. Use the template below, then review the records before saving.`}
              </p>
              <div id={`registrar-setup-csv-tools`} className={`registrar-setup-csv-tools`}>
                <button type={`button`} disabled={busy} id={`registrar-setup-csv-template`} className={`portfolio-button portfolio-button-secondary`} onClick={() => { void setup.downloadTemplate(); }}>
                  <Download size={14} aria-hidden={`true`} id={`registrar-setup-template-icon`} className={`portfolio-button-icon`} />
                  <span id={`registrar-setup-template-text`} className={`portfolio-button-text`}>{`CSV Template`}</span>
                </button>
                <button type={`button`} disabled={busy || !setup.canExport} id={`registrar-setup-export-csv`} className={`portfolio-button portfolio-button-secondary`} onClick={() => { void setup.exportCsv(); }}>
                  <Download size={14} aria-hidden={`true`} id={`registrar-setup-export-icon`} className={`portfolio-button-icon`} />
                  <span id={`registrar-setup-export-text`} className={`portfolio-button-text`}>{setup.exporting ? `Exporting…` : `Export Portfolio CSV`}</span>
                </button>
              </div>
              <div id={`registrar-setup-csv-row`} className={`registrar-setup-csv-row`}>
                <CsvDropZone
                  disabled={busy}
                  importing={readingFile}
                  id={`registrar-setup-csv-dropzone`}
                  onFiles={files => { void readCsv(files); }}
                  onBrowse={() => {
                    if (!busy && !readingFileRef.current) fileRef.current?.click();
                  }}
                />
                <input
                  hidden
                  type={`file`}
                  ref={fileRef}
                  accept={`.csv,text/csv`}
                  id={`registrar-setup-csv-input`}
                  className={`registrar-setup-csv-input`}
                  aria-label={`Upload Domain CSV`}
                  onChange={event => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = ``;
                    if (files.length) void readCsv(files);
                  }}
                />
              </div>
              {setup.csvNotice && (
                <p role={`status`} id={`registrar-setup-csv-notice`} className={`registrar-setup-csv-notice`}>
                  {setup.csvNotice}
                </p>
              )}
              {setup.review.length > 0 && (
                <div id={`registrar-setup-review`} className={`registrar-setup-review`}>
                  <p id={`registrar-setup-review-summary`} className={`registrar-setup-review-summary`}>
                    {`${setup.review.length} ${setup.review.length === 1 ? `domain` : `domains`} ready to import`}
                  </p>
                  <ul id={`registrar-setup-review-list`} className={`registrar-setup-review-list`}>
                    {setup.review.map((domain, index) => {
                      const scope = `registrar-setup-review-domain-${index}`;
                      return (
                        <li key={domain.name} id={scope} className={`registrar-setup-review-domain`}>
                          <span id={`${scope}-name`} className={`registrar-setup-review-name`}>
                            {domain.name}
                          </span>
                          <span id={`${scope}-registrar`} className={`registrar-setup-review-detail`}>
                            {domain.registrar || `Registrar unknown`}
                          </span>
                          <span id={`${scope}-date`} className={`registrar-setup-review-detail`}>
                            {domain.expiresAt ? `Expires ${domain.expiresAt}` : `Expiry unknown`}
                          </span>
                          <span id={`${scope}-renew`} className={`registrar-setup-review-detail`}>
                            {`Auto-renew ${domain.autoRenew ? `on` : `off`}`}
                          </span>
                          <span id={`${scope}-price`} className={`registrar-setup-review-price`}>
                            {`${formatCurrency(domain.renewalPrice)} / year`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p id={`registrar-setup-review-note`} className={`registrar-setup-helper`}>
                    {`This imports a snapshot of your domains. Update these records when your account changes; renewals still happen with each domain's registrar.`}
                  </p>
                </div>
              )}
            </fieldset>
          )}
          {setup.error && (
            <p role={`alert`} id={`registrar-setup-error`} className={`domain-dialog-error`}>
              {setup.error}
            </p>
          )}
          <footer id={`registrar-setup-footer`} className={`domain-dialog-footer`}>
            <span id={`registrar-setup-storage-note`} className={`domain-dialog-storage-note`}>
              <ShieldCheck size={14} aria-hidden={`true`} id={`registrar-setup-storage-icon`} className={`domain-dialog-storage-icon`} />
              <span id={`registrar-setup-storage-text`} className={`domain-dialog-storage-text`}>
                {`Saved on this device`}
              </span>
            </span>
            <div id={`registrar-setup-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                disabled={busy}
                id={`registrar-setup-cancel`}
                className={`portfolio-button portfolio-button-secondary`}
                onClick={close}
              >
                <X size={15} aria-hidden={`true`} id={`registrar-setup-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`registrar-setup-cancel-text`} className={`portfolio-button-text`}>
                  {`Cancel`}
                </span>
              </button>
              <button
                type={`button`}
                id={`registrar-setup-submit`}
                className={`portfolio-button portfolio-button-primary`}
                onClick={() => {
                  if (busy || readingFileRef.current) return;
                  if (connecting) close();
                  else void setup.submit();
                }}
                disabled={busy || (!connecting && !setup.canReview)}
              >
                <Check size={16} aria-hidden={`true`} id={`registrar-setup-submit-icon`} className={`portfolio-button-icon`} />
                <span id={`registrar-setup-submit-text`} className={`portfolio-button-text`}>
                  {setup.saving ? `Saving…` : connecting ? `Done` : `Save Domains`}
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default RegistrarSetup;
