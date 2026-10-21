import { handleDomainData } from '../../src/server/domainData/http';

export const GET = (request: Request) => handleDomainData(request);
