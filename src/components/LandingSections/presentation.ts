import { formatSearchPrice, getAvailableConnections } from '../DomainSearch/resultPresentation';
import type { DomainDiscoveryResult } from '../../shared/domainSearch/discovery';

export const getLandingDomainDetails = (result: DomainDiscoveryResult) => {
  const connection = getAvailableConnections(result)?.[0];
  const quote = formatSearchPrice(connection?.registration);
  return {
    registrar: connection?.label ?? `Registrar`,
    price: quote.amount === `—` ? `Price At Registrar` : quote.amount,
    term: quote.amount === `—` ? `Check The Latest Quote` : `${quote.term}${quote.currencyNote ? ` · ${quote.currencyNote}` : ``}`,
  };
};
