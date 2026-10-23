import { getPaymentReport } from './service';
import { BillingError } from '../billing/types';
import { requireBillingActor } from '../billing/firebase';
import type { PaymentReportDays } from '../../shared/payments/types';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'X-Content-Type-Options': `nosniff` };
export const handlePaymentReport = async (request: Request): Promise<Response> => {
  try {
    if (request.method !== `GET`) return Response.json({ code: `payments_method_invalid`, error: `Use GET To Read Payment Reports` }, { status: 405, headers: { ...headers, Allow: `GET` } });
    const actor = await requireBillingActor(request);
    if (actor.active !== true || actor.owner !== true || actor.role !== `Owner`) throw new BillingError(403, `payments_forbidden`, `Active Owner Access Is Required To View Payments`);
    const url = new URL(request.url);
    if (request.headers.get(`origin`) && request.headers.get(`origin`) !== url.origin) throw new BillingError(403, `payments_origin_invalid`, `Cross-Origin Payment Reports Are Not Allowed`);
    if (url.search.length > 64 || [...url.searchParams.keys()].some(key => key !== `days`) || url.searchParams.getAll(`days`).length > 1) throw new BillingError(400, `payments_query_invalid`, `Choose A Supported Payment Report Range`);
    const days = url.searchParams.get(`days`) ?? `7`;
    if (![`7`, `30`, `90`].includes(days)) throw new BillingError(400, `payments_range_invalid`, `Choose A Supported Payment Report Range`);
    return Response.json(await getPaymentReport(actor, Number(days) as PaymentReportDays), { headers });
  } catch (failure) {
    const error = failure instanceof BillingError ? failure : new BillingError(503, `payments_unavailable`, `Payment Reports Are Unavailable — Try Again Shortly`);
    return Response.json({ code: error.code, error: error.message }, { status: error.status, headers });
  }
};
