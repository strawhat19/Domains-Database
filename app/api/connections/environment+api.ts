import { handleEnvironmentConnectionImport } from '../../../src/server/connections/http';

export const POST = (request: Request) => handleEnvironmentConnectionImport(request);
