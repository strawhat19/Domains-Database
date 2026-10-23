import { handleBillingReconcile } from '../../../src/server/billing/http';

export const POST = (request: Request) => handleBillingReconcile(request);
