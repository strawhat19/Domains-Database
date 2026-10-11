import './styles.scss';
import type { SegmentedControlProps } from './types';

const SegmentedControl = <Value extends string,>({ id, value, label, options, onChange, disabled = false, labelledBy, describedBy, className = `` }: SegmentedControlProps<Value>) => (
  <div
    id={id}
    role={`group`}
    aria-labelledby={labelledBy}
    aria-describedby={describedBy}
    aria-label={labelledBy ? undefined : label}
    className={`segmented-control${className ? ` ${className}` : ``}`}
  >
    {options.map(({ value: optionValue, label: optionLabel, Icon, disabled: optionDisabled }) => (
      <button
        type={`button`}
        key={optionValue}
        id={`${id}-${optionValue}`}
        aria-pressed={value === optionValue}
        disabled={disabled || optionDisabled}
        onClick={() => { if (value !== optionValue) onChange(optionValue); }}
        className={`segmented-control-option`}
      >
        {Icon && <Icon size={15} aria-hidden={`true`} id={`${id}-${optionValue}-icon`} className={`segmented-control-icon`} />}
        <span id={`${id}-${optionValue}-text`} className={`segmented-control-text`}>{optionLabel}</span>
      </button>
    ))}
  </div>
);

export default SegmentedControl;
