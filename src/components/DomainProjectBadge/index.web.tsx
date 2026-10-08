import './styles.scss';
import type { DomainProjectStatus } from '../../shared/domainProject';
import { Eye, Flag, Code2, Award, Sprout, ListTodo, Building2, Lightbulb, Briefcase, CircleCheck, ChevronDown, FlaskConical } from 'lucide-react';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';

interface DomainProjectBadgeProps {
  id: string;
  value?: string;
  disabled?: boolean;
  editLabel?: string;
  className?: string;
  field: `projectStatus` | `difficulty`;
  onChange?: (value: DomainProjectStatus) => void;
}

const icons: Record<string, typeof Eye> = { Eye, Flag, Code2, Award, Sprout, ListTodo, Building2, Lightbulb, Briefcase, CircleCheck, FlaskConical };

const DomainProjectBadge = ({ id, field, value, disabled, onChange, editLabel, className = `` }: DomainProjectBadgeProps) => {
  const editable = field === `projectStatus` && Boolean(onChange);
  const options = field === `projectStatus` ? DOMAIN_PROJECT_STATUSES : DOMAIN_DIFFICULTIES;
  const badgeValue = field === `projectStatus` ? normalizeDomainProjectStatus(value) : value;
  const option = options.find(item => item.value === badgeValue);
  const Icon = option ? icons[option.icon] : undefined;
  const label = option?.label ?? badgeValue ?? `—`;

  return (
    <span
      id={id}
      title={editable ? editLabel : label}
      style={editable ? { background: option?.color ?? `var(--muted)` } : undefined}
      className={`domain-project-badge rowStatus${editable ? ` domain-project-badge-pill${disabled ? ` domain-project-badge-disabled` : ``}` : ``}${className ? ` ${className}` : ``}`}
    >
      {Icon && (
        <span id={`${id}-icon-wrap`} className={`domain-project-badge-icon-wrap statusDotWrap`} aria-hidden={`true`}>
          <Icon size={13} color={editable ? `#fff` : option?.color ?? `var(--muted)`} id={`${id}-icon`} className={`domain-project-badge-icon`} />
        </span>
      )}
      <span id={`${id}-label`} className={`domain-project-badge-label statusText`}>
        {label}
      </span>
      {editable && (
        <>
          <ChevronDown
            size={13}
            aria-hidden={`true`}
            id={`${id}-chevron`}
            className={`domain-project-badge-chevron`}
          />
          <select
            disabled={disabled}
            value={badgeValue}
            draggable={false}
            id={`${id}-select`}
            className={`domain-project-badge-select`}
            aria-label={editLabel ?? `Change Project Status`}
            onChange={event => onChange?.(normalizeDomainProjectStatus(event.currentTarget.value))}
          >
            {DOMAIN_PROJECT_STATUSES.map(status => (
              <option
                key={status.value}
                value={status.value}
                className={`domain-project-badge-option`}
                id={`${id}-option-${status.value.toLowerCase().replaceAll(` `, `-`)}`}
              >
                {status.label}
              </option>
            ))}
          </select>
        </>
      )}
    </span>
  );
};

export default DomainProjectBadge;
