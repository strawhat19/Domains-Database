import { handleBillingWebhook } from '../../../src/server/billing/http';

export const POST = (request: Request) => handleBillingWebhook(request);
