import { handleBillingPortal } from '../../../src/server/billing/http';

export const POST = (request: Request) => handleBillingPortal(request);
