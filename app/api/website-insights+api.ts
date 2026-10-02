import { handleWebsiteInsights } from '../../src/server/websiteInsights/http';

export const POST = (request: Request) => handleWebsiteInsights(request);
