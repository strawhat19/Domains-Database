import './styles.scss';
import { X, Plus } from 'lucide-react';
import { usePortfolioAddGroup, type PortfolioAddGroupProps } from './usePortfolioAddGroup';

const PortfolioAddGroup = (props: PortfolioAddGroupProps) => {
  const group = usePortfolioAddGroup(props);
  const scope = `${props.idPrefix}-add-group`;

  return (
    <div id={scope} className={`portfolio-add-group`}>
      <button
        type={`button`}
        hidden={group.open}
        ref={group.buttonRef}
        id={`${scope}-button`}
        aria-expanded={group.open}
        disabled={group.unavailable}
        aria-controls={`${scope}-form`}
        className={`portfolio-add-group-button`}
        onClick={() => group.setOpen(true)}
      >
        <Plus size={12} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-add-group-icon`} />
        <span id={`${scope}-text`} className={`portfolio-add-group-text`}>{`Add Group`}</span>
      </button>
      {group.open && (
        <form
          noValidate
          id={`${scope}-form`}
          onSubmit={group.handleSubmit}
          className={`portfolio-add-group-form`}
          onKeyDown={group.handleKeyDown}
        >
          <label id={`${scope}-label`} htmlFor={`${scope}-name`} className={`portfolio-sr-only`}>{`Group Name`}</label>
          <input
            type={`text`}
            maxLength={80}
            value={group.name}
            ref={group.inputRef}
            autoComplete={`off`}
            id={`${scope}-name`}
            placeholder={`Group name`}
            disabled={group.unavailable}
            className={`portfolio-add-group-input`}
            aria-invalid={Boolean(group.error)}
            aria-describedby={group.error ? `${scope}-error` : undefined}
            onChange={event => group.setName(event.target.value)}
          />
          <button
            type={`submit`}
            id={`${scope}-submit`}
            className={`portfolio-add-group-action`}
            disabled={group.unavailable || !group.name.trim()}
          >
            <Plus size={12} aria-hidden={`true`} id={`${scope}-submit-icon`} className={`portfolio-add-group-icon`} />
            <span id={`${scope}-submit-text`} className={`portfolio-add-group-text`}>{`Add`}</span>
          </button>
          <button
            type={`button`}
            onClick={group.close}
            id={`${scope}-cancel`}
            className={`portfolio-add-group-action`}
          >
            <X size={12} aria-hidden={`true`} id={`${scope}-cancel-icon`} className={`portfolio-add-group-icon`} />
            <span id={`${scope}-cancel-text`} className={`portfolio-add-group-text`}>{`Cancel`}</span>
          </button>
          {group.error && <p role={`alert`} id={`${scope}-error`} className={`portfolio-add-group-error`}>{group.error}</p>}
        </form>
      )}
    </div>
  );
};

export default PortfolioAddGroup;
