import './styles.scss';
import { Check, Circle, ChevronDown } from 'lucide-react';
import { useProjectSelect } from './useProjectSelect';
import type { ProjectSelectOption } from './useProjectSelect';
import DomainProjectBadge from '../../DomainProjectBadge/index.web';
import { normalizeDomainProjectStatus } from '../../../shared/domainProject';

interface ProjectSelectProps {
  id: string;
  label: string;
  value?: string;
  disabled?: boolean;
  placeholder: string;
  field: `projectStatus` | `difficulty`;
  options: readonly ProjectSelectOption[];
  onChange: (value: string | undefined) => void;
}

const ProjectSelect = ({ id, field, label, value, options, onChange, disabled, placeholder }: ProjectSelectProps) => {
  const allowUnset = field !== `projectStatus`;
  const selectedValue = allowUnset ? value : normalizeDomainProjectStatus(value);
  const select = useProjectSelect({ options, onChange, allowUnset, value: selectedValue });
  const selected = options.find(option => option.value === selectedValue);

  return (
    <div
      id={`${id}-select`}
      ref={select.rootRef}
      onBlur={select.onBlur}
      onKeyDown={select.onKeyDown}
      className={`domain-project-select`}
    >
      <button
        id={id}
        type={`button`}
        role={`combobox`}
        disabled={disabled}
        ref={select.triggerRef}
        aria-haspopup={`listbox`}
        aria-expanded={select.open}
        onClick={select.toggle}
        aria-controls={`${id}-options`}
        aria-labelledby={`${id}-label ${id}-value`}
        className={`domain-editor-input domain-project-select-trigger`}
      >
        <span id={`${id}-value`} className={`domain-project-select-value`}>
          {selected
            ? <DomainProjectBadge id={`${id}-badge`} field={field} value={selected.value} />
            : <span id={`${id}-placeholder`} className={`domain-project-select-placeholder`}>{placeholder}</span>}
        </span>
        <ChevronDown
          size={15}
          aria-hidden={`true`}
          id={`${id}-chevron`}
          className={`domain-project-select-chevron`}
        />
      </button>
      {select.open && (
        <div
          role={`listbox`}
          aria-label={label}
          id={`${id}-options`}
          className={`domain-project-select-options`}
        >
          {allowUnset && (
            <button
              type={`button`}
              tabIndex={-1}
              role={`option`}
              aria-selected={!selected}
              id={`${id}-option-unset`}
              onClick={() => select.choose(undefined)}
              ref={element => { select.optionRefs.current[0] = element; }}
              className={`domain-project-select-option${select.activeIndex === 0 ? ` domain-project-select-option-active` : ``}`}
            >
              <Circle size={15} aria-hidden={`true`} id={`${id}-option-unset-icon`} className={`domain-project-select-unset-icon`} />
              <span id={`${id}-option-unset-text`} className={`domain-project-select-option-label`}>{`Not Set`}</span>
              {!selected && <Check size={14} aria-hidden={`true`} id={`${id}-option-unset-check`} className={`domain-project-select-check`} />}
            </button>
          )}
          {options.map((option, index) => {
            const optionId = `${id}-option-${option.value.toLowerCase().replaceAll(` `, `-`)}`;
            return (
              <button
                key={option.value}
                type={`button`}
                id={optionId}
                tabIndex={-1}
                role={`option`}
                aria-selected={selectedValue === option.value}
                onClick={() => select.choose(option.value)}
                ref={element => { select.optionRefs.current[index + Number(allowUnset)] = element; }}
                className={`domain-project-select-option${select.activeIndex === index + Number(allowUnset) ? ` domain-project-select-option-active` : ``}`}
              >
                <DomainProjectBadge id={`${optionId}-badge`} field={field} value={option.value} />
                {selectedValue === option.value && <Check size={14} aria-hidden={`true`} id={`${optionId}-check`} className={`domain-project-select-check`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectSelect;
