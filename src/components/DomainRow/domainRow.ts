import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';

export const getDomainRow = (domain: DomainRecord) => {
  const status = getDomainStatus(domain.expiresAt);
  return {
    status,
    scope: `domain-row-${domain.id}`,
    lastDot: domain.name.lastIndexOf(`.`),
    statusKey: status.toLowerCase().replaceAll(` `, `-`),
    registrarKey: domain.registrar.toLowerCase().replaceAll(` `, `-`),
  };
};
