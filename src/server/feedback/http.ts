import { readLimitedText } from '../registrars/request';
import { FeedbackError, requireFeedbackActor, submitSupportContact, submitFeedbackEntry, sendSupportMessage, submitGuestFeedbackEntry, updateFeedbackEntryStatus, markSupportThreadRead } from './service';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'X-Content-Type-Options': `nosniff` };
export const handleFeedback = async (request: Request) => {
  try {
    const origin = request.headers.get(`origin`);
    const site = request.headers.get(`sec-fetch-site`);
    if ((origin && origin !== new URL(request.url).origin) || (site && ![`same-origin`, `none`].includes(site))) throw new FeedbackError(403, `feedback_origin_forbidden`, `Use The App To Send Feedback`);
    if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim() !== `application/json`) throw new FeedbackError(415, `feedback_json_required`, `Send Feedback As JSON`);
    const raw = await readLimitedText(request.body, 32_000, request.signal, new FeedbackError(413, `feedback_request_too_large`, `Feedback Request Is Too Large`));
    let input: Record<string, unknown>;
    try { input = JSON.parse(raw); } catch { throw new FeedbackError(400, `feedback_input_invalid`, `Send A Valid Feedback Request`); }
    if (!input || typeof input !== `object` || Array.isArray(input) || Object.keys(input).some(key => ![`operation`, `input`, `attemptId`, `threadId`, `body`, `id`, `status`, `lastMessageNumber`].includes(key))) throw new FeedbackError(400, `feedback_input_invalid`, `Send A Valid Feedback Request`);
    const operationFields = input.operation === `contact` || input.operation === `review` || input.operation === `bug` ? [`operation`, `input`, `attemptId`]
      : input.operation === `message` ? [`operation`, `threadId`, `body`, `attemptId`]
        : input.operation === `status` ? [`operation`, `id`, `status`] : input.operation === `read` ? [`operation`, `threadId`, `lastMessageNumber`] : [];
    if (!operationFields.length || Object.keys(input).some(key => !operationFields.includes(key))) throw new FeedbackError(400, `feedback_input_invalid`, `Choose A Valid Feedback Action`);
    if (!request.headers.has(`authorization`) && (input.operation === `review` || input.operation === `bug`)) {
      const receipt = await submitGuestFeedbackEntry(request, input.operation, input.input, input.attemptId);
      return Response.json(receipt, { headers });
    }
    const actor = await requireFeedbackActor(request);
    let result: unknown;
    switch (input.operation) {
      case `contact`: result = await submitSupportContact(actor, input.input, input.attemptId); break;
      case `review`: result = await submitFeedbackEntry(actor, `review`, input.input, input.attemptId); break;
      case `bug`: result = await submitFeedbackEntry(actor, `bug`, input.input, input.attemptId); break;
      case `message`: result = await sendSupportMessage(actor, input.threadId, input.body, input.attemptId); break;
      case `status`: result = await updateFeedbackEntryStatus(actor, input.id, input.status); break;
      case `read`: result = await markSupportThreadRead(actor, input.threadId, input.lastMessageNumber); break;
      default: throw new FeedbackError(400, `feedback_operation_invalid`, `Choose A Valid Feedback Action`);
    }
    return Response.json(result, { headers });
  } catch (failure) {
    const error = failure instanceof FeedbackError ? failure : new FeedbackError(503, `feedback_unavailable`, `Feedback Is Temporarily Unavailable — Try Again`);
    return Response.json({ code: error.code, error: error.message }, { headers, status: error.status });
  }
};
