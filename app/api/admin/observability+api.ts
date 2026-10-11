import { handleAdminReport } from '../../../src/server/admin/http';

export const GET = (request: Request) => handleAdminReport(request, `observability`);
