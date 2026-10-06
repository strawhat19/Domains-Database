import { Trash2 } from 'lucide-react';
import type { RegistrarDraft, useRegistrarSetup } from './useRegistrarSetup';

interface RegistrarDomainFieldsProps {
  index: number;
  removable: boolean;
  draft: RegistrarDraft;
  onRemove: () => void;
  onChange: ReturnType<typeof useRegistrarSetup>[`updateDraft`];
}

const RegistrarDomainFields = ({ draft, index, removable, onChange, onRemove }: RegistrarDomainFieldsProps) => {
  const scope = `registrar-domain-${draft.id}`;
  return (
    <fieldset id={`${scope}-fieldset`} className={`registrar-domain-fields`}>
      <legend id={`${scope}-legend`} className={`registrar-domain-legend`}>
        {`Domain ${index + 1}`}
      </legend>
      <div id={`${scope}-name-field`} className={`registrar-setup-field registrar-setup-field-wide`}>
        <label id={`${scope}-name-label`} className={`registrar-setup-label`} htmlFor={`${scope}-name`}>
          {`Domain name`}
        </label>
        <input
          required
          type={`text`}
          maxLength={253}
          spellCheck={false}
          value={draft.name}
          autoComplete={`off`}
          id={`${scope}-name`}
          className={`registrar-setup-input`}
          onChange={event => onChange(draft.id, `name`, event.target.value)}
        />
      </div>
      <div id={`${scope}-date-field`} className={`registrar-setup-field`}>
        <label id={`${scope}-date-label`} className={`registrar-setup-label`} htmlFor={`${scope}-date`}>
          {`Expiration date`}
        </label>
        <input
          required
          type={`date`}
          value={draft.expiresAt}
          id={`${scope}-date`}
          className={`registrar-setup-input`}
          onChange={event => onChange(draft.id, `expiresAt`, event.target.value)}
        />
      </div>
      <div id={`${scope}-price-field`} className={`registrar-setup-field`}>
        <label id={`${scope}-price-label`} className={`registrar-setup-label`} htmlFor={`${scope}-price`}>
          {`Annual renewal · USD (optional)`}
        </label>
        <div id={`${scope}-price-control`} className={`registrar-setup-price-control`}>
          <span aria-hidden id={`${scope}-price-prefix`} className={`registrar-setup-price-prefix`}>{`$`}</span>
          <input
            min={0}
            step={0.01}
            type={`number`}
            inputMode={`decimal`}
            value={draft.renewalPrice}
            id={`${scope}-price`}
            className={`registrar-setup-input registrar-setup-price-input`}
            onChange={event => onChange(draft.id, `renewalPrice`, event.target.value)}
          />
        </div>
      </div>
      <label id={`${scope}-auto-renew-label`} className={`registrar-setup-checkbox-label registrar-setup-field-wide`} htmlFor={`${scope}-auto-renew`}>
        <input
          type={`checkbox`}
          checked={draft.autoRenew}
          id={`${scope}-auto-renew`}
          className={`registrar-setup-checkbox`}
          onChange={event => onChange(draft.id, `autoRenew`, event.target.checked)}
        />
        <span id={`${scope}-auto-renew-text`} className={`registrar-setup-checkbox-text`}>
          {`Auto-renew is enabled in my account`}
        </span>
      </label>
      <div id={`${scope}-notes-field`} className={`registrar-setup-field registrar-setup-field-wide`}>
        <label id={`${scope}-notes-label`} className={`registrar-setup-label`} htmlFor={`${scope}-notes`}>
          {`Notes (optional)`}
        </label>
        <textarea
          rows={2}
          maxLength={1000}
          value={draft.notes}
          id={`${scope}-notes`}
          className={`registrar-setup-input registrar-setup-notes`}
          onChange={event => onChange(draft.id, `notes`, event.target.value)}
        />
      </div>
      {removable && (
        <button
          type={`button`}
          onClick={onRemove}
          id={`${scope}-remove`}
          className={`portfolio-button portfolio-button-quiet registrar-domain-remove`}
          aria-label={`Remove domain ${index + 1} from this import`}
        >
          <Trash2 size={13} aria-hidden={`true`} id={`${scope}-remove-icon`} className={`portfolio-button-icon`} />
          <span id={`${scope}-remove-text`} className={`portfolio-button-text`}>
            {`Remove`}
          </span>
        </button>
      )}
    </fieldset>
  );
};

export default RegistrarDomainFields;
