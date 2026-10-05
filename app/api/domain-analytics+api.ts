import { handleDomainAnalytics } from '../../src/server/domainAnalytics/http';

export const POST = (request: Request) => handleDomainAnalytics(request);
