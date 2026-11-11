import { handleMarketplaceAfternic } from '../../../src/server/marketplaceAfternic/http';

export const POST = (request: Request) => handleMarketplaceAfternic(request);
