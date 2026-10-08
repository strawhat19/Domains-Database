import './styles.scss';
import type { TagPillsProps, TagPickerProps } from './types';
import { useWebTagPicker } from './useTagPicker.web';
import { DOMAIN_TAGS, normalizeDomainTags } from '../../shared/domainTags';

export const TagPills = ({ id, value }: TagPillsProps) => (
  <span id={id} className={`tag-picker-pills`}>
    {normalizeDomainTags(value).map(tag => (
      <span key={tag} id={`${id}-${tag.toLowerCase()}`} className={`tag-picker-pill`}>
        {tag}
      </span>
    ))}
  </span>
);

const TagPicker = (props: TagPickerProps) => {
  const { id, label, disabled = false } = props;
  const picker = useWebTagPicker(props);

  return (
    <div
      id={`${id}-picker`}
      ref={picker.rootRef}
      onBlur={picker.onBlur}
      onKeyDown={picker.onKeyDown}
      className={`tag-picker`}
      data-tag-picker-open={picker.open || undefined}
    >
      <button
        id={id}
        type={`button`}
        role={`combobox`}
        disabled={disabled}
        ref={picker.triggerRef}
        onClick={picker.toggle}
        aria-haspopup={`listbox`}
        aria-expanded={picker.open}
        aria-controls={`${id}-options`}
        className={`tag-picker-trigger`}
        aria-label={`${label}: ${picker.tags.length ? picker.tags.join(`, `) : `No Tags`}`}
      >
        {Boolean(picker.tags.length) && <TagPills id={`${id}-values`} value={picker.tags} />}
        <span id={`${id}-cue`} className={`tag-picker-cue`}>
          {picker.tags.length ? `Add Tags` : `Choose Tags`}
        </span>
      </button>
      {picker.open && (
        <div
          role={`listbox`}
          aria-label={label}
          id={`${id}-options`}
          aria-multiselectable={`true`}
          className={`tag-picker-options`}
        >
          {DOMAIN_TAGS.map((tag, index) => {
            const selected = picker.tags.includes(tag);
            const optionId = `${id}-option-${tag.toLowerCase()}`;
            return (
              <button
                key={tag}
                type={`button`}
                tabIndex={-1}
                role={`option`}
                id={optionId}
                aria-selected={selected}
                onClick={() => picker.choose(tag)}
                onFocus={() => picker.setActiveIndex(index)}
                ref={element => { picker.optionRefs.current[index] = element; }}
                className={`tag-picker-option${selected ? ` tag-picker-option-selected` : ``}${picker.activeIndex === index ? ` tag-picker-option-active` : ``}`}
              >
                <span id={`${optionId}-pill`} className={`tag-picker-pill`}>{tag}</span>
                {selected && <span id={`${optionId}-selected`} className={`tag-picker-option-selection`}>{`Selected`}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { TagPillsProps, TagPickerProps } from './types';
export default TagPicker;
