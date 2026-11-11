import { handleDomainAppraisal } from '../../src/server/domainAppraisal/http';

export const POST = (request: Request) => handleDomainAppraisal(request);
