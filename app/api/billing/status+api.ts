import { handleBillingStatus } from '../../../src/server/billing/http';

export const GET = (request: Request) => handleBillingStatus(request);
