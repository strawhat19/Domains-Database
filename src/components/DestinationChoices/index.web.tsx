import './styles.scss';
import type { RefObject } from 'react';
import type { LucideIcon } from 'lucide-react';

interface DestinationOption {
  id: string;
  label: string;
  count?: number;
  icon: LucideIcon;
  disabled?: boolean;
}

interface DestinationChoicesProps {
  id: string;
  value: string;
  labelId: string;
  mosaic?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
  options: DestinationOption[];
  onChange: (value: string) => void;
  choicesRef?: RefObject<HTMLDivElement | null>;
}

const DestinationChoices = ({ id, value, labelId, options, onChange, choicesRef, invalid, disabled, autoFocus, describedBy, mosaic = false }: DestinationChoicesProps) => (
  <div
    id={id}
    role={`group`}
    ref={choicesRef}
    aria-labelledby={labelId}
    aria-invalid={invalid || undefined}
    aria-describedby={describedBy}
    className={`destination-choices${mosaic ? ` destination-choices-mosaic` : ``}`}
  >
    {options.map(({ id: optionId, label, count, icon: Icon, disabled: unavailable }) => (
      <button
        key={optionId}
        type={`button`}
        aria-pressed={value === optionId}
        disabled={disabled || unavailable}
        id={`${id}-option-${optionId}`}
        className={`destination-choice`}
        onClick={() => onChange(optionId)}
        aria-label={count === undefined ? undefined : `${label}, ${count} Domain(s)`}
        data-autofocus={autoFocus && value === optionId || undefined}
      >
        <Icon size={15} aria-hidden={`true`} id={`${id}-option-${optionId}-icon`} className={`destination-choice-icon`} />
        <span id={`${id}-option-${optionId}-label`} className={`destination-choice-label`}>{label}</span>
        {count !== undefined && (
          <span
            title={`${count} Domain(s)`}
            className={`destination-choice-count`}
            id={`${id}-option-${optionId}-count`}
          >
            {count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default DestinationChoices;
