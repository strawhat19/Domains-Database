import { handleFeedback } from '../../src/server/feedback/http';

export const POST = (request: Request) => handleFeedback(request);
