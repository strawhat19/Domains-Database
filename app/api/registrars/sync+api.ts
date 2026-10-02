import { handleRegistrarSync } from '../../../src/server/registrars/http';

export const POST = (request: Request) => handleRegistrarSync(request);
