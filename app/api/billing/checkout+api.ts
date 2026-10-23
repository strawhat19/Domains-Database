import { handleBillingCheckout } from '../../../src/server/billing/http';

export const POST = (request: Request) => handleBillingCheckout(request);
