import './styles.scss';
import type { CurrencyFieldProps } from './types';
import { useCurrencyField } from './useCurrencyField';

const CurrencyField = (props: CurrencyFieldProps) => {
  const { id, label, disabled = false } = props;
  const field = useCurrencyField(props);

  return (
    <div
      id={`${id}-field`}
      className={`currency-field${disabled ? ` currency-field-disabled` : ``}`}
    >
      <span id={`${id}-prefix`} className={`currency-field-prefix`} aria-hidden={`true`}>{`$`}</span>
      <input
        id={id}
        type={`text`}
        maxLength={24}
        value={field.draft}
        disabled={disabled}
        spellCheck={false}
        onBlur={field.blur}
        onFocus={field.focus}
        inputMode={`decimal`}
        placeholder={`0.00`}
        autoComplete={`off`}
        className={`currency-field-input`}
        aria-label={`${label} In USD`}
        onChange={event => field.change(event.target.value)}
      />
    </div>
  );
};

export type { CurrencyFieldProps } from './types';
export default CurrencyField;
