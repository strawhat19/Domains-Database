import { handleDomainMarket } from '../../src/server/domainMarket/http';

export const POST = (request: Request) => handleDomainMarket(request);
