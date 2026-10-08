import './styles.scss';
import { Eye, Flag, Code2, Award, Sprout, ListTodo, Building2, Lightbulb, Briefcase, CircleCheck, FlaskConical } from 'lucide-react';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';

interface DomainProjectBadgeProps {
  id: string;
  value?: string;
  className?: string;
  field: `projectStatus` | `difficulty`;
}

const icons: Record<string, typeof Eye> = { Eye, Flag, Code2, Award, Sprout, ListTodo, Building2, Lightbulb, Briefcase, CircleCheck, FlaskConical };

const DomainProjectBadge = ({ id, field, value, className = `` }: DomainProjectBadgeProps) => {
  const options = field === `projectStatus` ? DOMAIN_PROJECT_STATUSES : DOMAIN_DIFFICULTIES;
  const badgeValue = field === `projectStatus` ? normalizeDomainProjectStatus(value) : value;
  const option = options.find(item => item.value === badgeValue);
  const Icon = option ? icons[option.icon] : undefined;
  const label = option?.label ?? badgeValue ?? `—`;

  return (
    <span id={id} title={label} className={`domain-project-badge rowStatus${className ? ` ${className}` : ``}`}>
      {Icon && (
        <span id={`${id}-icon-wrap`} className={`domain-project-badge-icon-wrap statusDotWrap`} aria-hidden={`true`}>
          <Icon size={13} color={option?.color ?? `var(--muted)`} id={`${id}-icon`} className={`domain-project-badge-icon`} />
        </span>
      )}
      <span id={`${id}-label`} className={`domain-project-badge-label statusText`}>
        {label}
      </span>
    </span>
  );
};

export default DomainProjectBadge;
