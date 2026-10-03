import { handleDomainSearch, handleDomainSearchProviders } from '../../../src/server/domainSearch/http';

export const GET = handleDomainSearchProviders;
export const POST = handleDomainSearch;
