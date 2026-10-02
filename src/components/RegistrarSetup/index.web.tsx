import './styles.scss';
import { useRef, useState } from 'react';
import '../DomainEditor/styles.scss';
import CsvDropZone from '../CsvDropZone/index.web';
import { getCsvFile } from '../../shared/csvFiles.web';
import { useRegistrarSetup } from './useRegistrarSetup';
import { formatCurrency } from '../../shared/domainUtils';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { SETUP_REGISTRARS, registrarGuides } from '../../shared/registrars';
import { X, Check, Globe2, ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

const stepLabels = [`Choose registrar`, `Import details`, `Review & save`];

const RegistrarSetup = ({ onClose }: { onClose: () => void }) => {
  const setup = useRegistrarSetup(onClose, true);
  const readingFileRef = useRef(false);
  const [readingFile, setReadingFile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const guide = setup.registrar ? registrarGuides[setup.registrar] : null;
  const guideSteps = guide?.steps.map((instruction, index) => index === 2 ? guide.csvStep : instruction) ?? [];
  const busy = setup.saving || readingFile;
  const close = () => { if (!readingFileRef.current) setup.close(); };
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
              {setup.step === 0 ? `Add your domains` : setup.step === 1 ? `Bring in your details` : `Ready for your portfolio`}
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
          {setup.step === 0
            ? `Choose where your domains are registered. We'll guide you through importing your account's records.`
            : setup.step === 1
              ? `Upload your domain CSV export, then review the records before saving them on this device.`
              : `Check the details below. Save to add these domains to your table.`}
        </p>
        <ol id={`registrar-setup-progress`} className={`registrar-setup-progress`} aria-label={`Import progress`}>
          {stepLabels.map((label, index) => (
            <li
              key={label}
              id={`registrar-setup-step-${index}`}
              aria-current={setup.step === index ? `step` : undefined}
              className={`registrar-setup-step${setup.step === index ? ` registrar-setup-step-current` : ``}`}
            >
              <span id={`registrar-setup-step-number-${index}`} className={`registrar-setup-step-number`}>
                {index + 1}
              </span>
              <span id={`registrar-setup-step-label-${index}`} className={`registrar-setup-step-label`}>
                {label}
              </span>
            </li>
          ))}
        </ol>
        <form
          id={`registrar-setup-form`}
          aria-busy={busy}
          className={`registrar-setup-form`}
          onSubmit={event => {
            event.preventDefault();
            if (busy || readingFileRef.current) return;
            if (setup.step === 2) void setup.submit();
            else setup.next();
          }}
        >
          {setup.step === 0 && (
            <div id={`registrar-setup-options`} className={`registrar-setup-options`}>
              {SETUP_REGISTRARS.map(registrar => {
                const scope = `registrar-setup-option-${registrar.toLowerCase()}`;
                const selected = setup.registrar === registrar;
                return (
                  <button
                    type={`button`}
                    key={registrar}
                    id={scope}
                    aria-pressed={selected}
                    data-autofocus={registrar === SETUP_REGISTRARS[0] ? true : undefined}
                    onClick={() => setup.selectRegistrar(registrar)}
                    className={`registrar-setup-option${selected ? ` registrar-setup-option-selected` : ``}`}
                  >
                    <Globe2 size={21} aria-hidden={`true`} id={`${scope}-icon`} className={`registrar-setup-option-icon`} />
                    <span id={`${scope}-name`} className={`registrar-setup-option-name`}>
                      {registrar}
                    </span>
                    {selected && <Check size={17} aria-hidden={`true`} id={`${scope}-selected-icon`} className={`registrar-setup-option-check`} />}
                  </button>
                );
              })}
            </div>
          )}
          {setup.step === 1 && guide && (
            <fieldset disabled={busy} id={`registrar-setup-details`} className={`registrar-setup-details`}>
              <legend id={`registrar-setup-details-legend`} className={`portfolio-sr-only`}>
                {`${setup.registrar} domain details`}
              </legend>
              <div id={`registrar-setup-guide`} className={`registrar-setup-guide`}>
                <div id={`registrar-setup-guide-heading`} className={`registrar-setup-guide-heading`}>
                  <h3 id={`registrar-setup-guide-title`} className={`registrar-setup-section-title`}>
                    {`${setup.registrar} · get your records`}
                  </h3>
                  <a
                    target={`_blank`}
                    href={guide.url}
                    rel={`noopener noreferrer`}
                    id={`registrar-setup-account-link`}
                    className={`portfolio-button portfolio-button-secondary`}
                  >
                    <ExternalLink size={13} aria-hidden={`true`} id={`registrar-setup-account-icon`} className={`portfolio-button-icon`} />
                    <span id={`registrar-setup-account-text`} className={`portfolio-button-text`}>
                      {`Open ${guide.label}`}
                    </span>
                  </a>
                </div>
                <ol id={`registrar-setup-guide-steps`} className={`registrar-setup-guide-steps`}>
                  {guideSteps.map((instruction, index) => (
                    <li key={instruction} id={`registrar-setup-guide-step-${index}`} className={`registrar-setup-guide-step`}>
                      {instruction}
                    </li>
                  ))}
                </ol>
                <a
                  target={`_blank`}
                  href={guide.sourceUrl}
                  rel={`noopener noreferrer`}
                  id={`registrar-setup-help-link`}
                  className={`registrar-setup-help-link`}
                >
                  <ExternalLink size={12} aria-hidden={`true`} id={`registrar-setup-help-icon`} className={`registrar-setup-help-icon`} />
                  <span id={`registrar-setup-help-text`} className={`registrar-setup-help-text`}>
                    {`Official ${setup.registrar} instructions`}
                  </span>
                </a>
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
                  aria-label={`Upload ${setup.registrar} domain CSV`}
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
            </fieldset>
          )}
          {setup.step === 2 && (
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
                id={`registrar-setup-back`}
                className={`portfolio-button portfolio-button-secondary`}
                onClick={setup.step === 0 ? close : setup.back}
              >
                <ArrowLeft size={15} aria-hidden={`true`} id={`registrar-setup-back-icon`} className={`portfolio-button-icon`} />
                <span id={`registrar-setup-back-text`} className={`portfolio-button-text`}>
                  {setup.step === 0 ? `Cancel` : `Back`}
                </span>
              </button>
              <button
                type={`submit`}
                id={`registrar-setup-next`}
                className={`portfolio-button portfolio-button-primary`}
                disabled={busy || (setup.step === 0 && !setup.registrar) || (setup.step === 1 && !setup.canReview)}
              >
                {setup.step === 2
                  ? <Check size={16} aria-hidden={`true`} id={`registrar-setup-next-icon`} className={`portfolio-button-icon`} />
                  : <ArrowRight size={16} aria-hidden={`true`} id={`registrar-setup-next-icon`} className={`portfolio-button-icon`} />}
                <span id={`registrar-setup-next-text`} className={`portfolio-button-text`}>
                  {setup.saving ? `Saving…` : setup.step === 2 ? `Save domains` : setup.step === 1 ? `Review domains` : `Continue`}
                </span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default RegistrarSetup;
