import './styles.scss';
import { FileUp, Pencil, RefreshCw } from 'lucide-react';
import { getDomainSourceBadge } from './domainSourceBadge';
import type { DomainSourceBadgeProps } from './domainSourceBadge';

const DomainSourceBadge = ({ id, domain }: DomainSourceBadgeProps) => {
  const { label, source } = getDomainSourceBadge(domain);
  const Icon = source === `registrar` ? RefreshCw : source === `csv` ? FileUp : Pencil;

  return (
    <span
      id={id}
      title={`Domain Source: ${label}`}
      className={`rowStatus domain-source-status domain-source-status-${source}`}
    >
      <Icon size={11} id={`${id}-icon`} aria-hidden={`true`} className={`domain-source-icon`} />
      <span id={`${id}-text`} className={`statusText`}>
        {label}
      </span>
    </span>
  );
};

export default DomainSourceBadge;
