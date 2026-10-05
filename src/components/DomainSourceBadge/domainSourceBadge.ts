import type { DomainRecord } from '../../shared/types';
import { getDomainSource } from '../../shared/domainUtils';

export interface DomainSourceBadgeProps {
  id: string;
  domain: DomainRecord;
}

const sourceLabels = {
  csv: `Imported`,
  manual: `Manual`,
  registrar: `Synced`,
};

export const getDomainSourceBadge = (domain: DomainRecord) => {
  const source = getDomainSource(domain);
  return { source, label: sourceLabels[source] };
};
