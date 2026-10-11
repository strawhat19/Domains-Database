import './styles.scss';
import { useRef } from 'react';
import { Plus } from 'lucide-react';
import type { RefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDestinationChoicesRows } from './useDestinationChoicesRows.web';

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
  initialRows?: number;
  describedBy?: string;
  options: DestinationOption[];
  onChange: (value: string) => void;
  choicesRef?: RefObject<HTMLDivElement | null>;
}

const DestinationChoices = ({ id, value, labelId, options, onChange, choicesRef, invalid, disabled, autoFocus, initialRows, describedBy, mosaic = false }: DestinationChoicesProps) => {
  const localChoicesRef = useRef<HTMLDivElement>(null);
  const elementRef = choicesRef ?? localChoicesRef;
  const layoutKey = initialRows ? JSON.stringify(options.map(({ id, label, count }) => [id, label, count])) : ``;
  const rows = useDestinationChoicesRows(elementRef, layoutKey, initialRows);

  return (
    <>
      <div
        id={id}
        role={`group`}
        ref={elementRef}
        aria-labelledby={labelId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        style={initialRows ? { maxHeight: rows.height } : undefined}
        className={`destination-choices${mosaic ? ` destination-choices-mosaic` : ``}${initialRows ? ` destination-choices-paged` : ``}`}
      >
        {options.map(({ id: optionId, label, count, icon: Icon, disabled: unavailable }, index) => (
          <button
            key={optionId}
            type={`button`}
            id={`${id}-option-${optionId}`}
            onClick={() => onChange(optionId)}
            aria-pressed={value === optionId}
            disabled={disabled || unavailable}
            aria-hidden={index >= rows.count || undefined}
            tabIndex={index >= rows.count ? -1 : undefined}
            aria-label={count === undefined ? undefined : `${label}, ${count} Domain(s)`}
            data-autofocus={autoFocus && value === optionId && index < rows.count || undefined}
            className={`destination-choice${index >= rows.count ? ` destination-choice-overflow` : ``}`}
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
      {rows.hasMore && (
        <button
          type={`button`}
          aria-controls={id}
          disabled={disabled}
          onClick={rows.loadMore}
          id={`${id}-load-more`}
          className={`destination-choice destination-choices-load-more`}
        >
          <Plus size={15} aria-hidden={`true`} id={`${id}-load-more-icon`} className={`destination-choice-icon`} />
          <span id={`${id}-load-more-label`} className={`destination-choice-label`}>{`Load More`}</span>
        </button>
      )}
    </>
  );
};

export default DestinationChoices;
