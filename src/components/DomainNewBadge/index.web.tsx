import './styles.scss';
import { Sparkles } from 'lucide-react';
import { useDomainNewBadge } from './useDomainNewBadge';
import type { DomainNewBadgeProps } from './useDomainNewBadge';

const DomainNewBadge = ({ id, domain, compact = false }: DomainNewBadgeProps) => {
  const recent = useDomainNewBadge(domain);
  if (!recent) return null;

  return (
    <span
      id={id}
      title={`Renewal Date In The Last 5 Days`}
      aria-label={`New Domain, Renewal Date In The Last 5 Days`}
      className={`domain-new-badge${compact ? ` domain-new-badge-compact` : ``}`}
    >
      <Sparkles size={9} aria-hidden={`true`} id={`${id}-icon`} className={`domain-new-badge-icon`} />
      <span id={`${id}-text`} className={`domain-new-badge-text`}>New</span>
    </span>
  );
};

export default DomainNewBadge;
