import { RegistrarRelayError } from '../registrars/errors';
import { AdminAuthError, requireAnalyticsAdmin } from './auth';
import { getGitHubAnalytics, GitHubServiceError } from './github';
import { getVercelAnalytics, AnalyticsServiceError } from './traffic';
import type { GitHubPeriod } from '../../shared/analytics/github.types';
import { getVercelObservability, ObservabilityServiceError } from './observability';
import type { TrafficPeriod, ObservabilityPeriod, AnalyticsFilters } from '../../shared/analytics/types';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'X-Content-Type-Options': `nosniff` };
let activeRequests = 0;
const getDateRange = (days: TrafficPeriod) => {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { to: end.toISOString().slice(0, 10), from: start.toISOString().slice(0, 10) };
};
export const handleAdminReport = async (request: Request, kind: `github` | `analytics` | `observability`): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 25_000);
  let admitted = false;
  try {
    const site = request.headers.get(`sec-fetch-site`);
    const origin = request.headers.get(`origin`);
    const url = new URL(request.url);
    if ((site && ![`same-origin`, `none`].includes(site)) || (origin && origin !== url.origin)) throw new AdminAuthError(403, `admin_origin_denied`, `Cross-Origin Admin Requests Are Not Allowed`);
    if (activeRequests >= 8) throw new AdminAuthError(429, `admin_reports_busy`, `Admin Reports Are Busy — Try Again Shortly`);
    admitted = true;
    activeRequests++;
    if (kind === `github`) {
      const value = url.searchParams.get(`days`) ?? `7`;
      if ([...url.searchParams.keys()].some(key => ![`days`, `refresh`].includes(key) || url.searchParams.getAll(key).length > 1)
        || ![`7`, `14`, `30`, `90`].includes(value) || url.searchParams.has(`refresh`) && url.searchParams.get(`refresh`) !== `1`) throw new AdminAuthError(400, `invalid_github_period`, `Choose A Supported GitHub Reporting Period`);
      await requireAnalyticsAdmin(request, controller.signal, true);
      return Response.json(await getGitHubAnalytics(Number(value) as GitHubPeriod, url.searchParams.get(`refresh`) === `1`), { headers });
    }
    const parameter = kind === `analytics` ? `days` : `hours`;
    const value = url.searchParams.get(parameter) ?? (kind === `analytics` ? `7` : `24`);
    const allowedParameters = kind === `analytics` ? [`days`, `from`, `to`, `country`, `device`, `path`, `referrer`] : [`hours`];
    if ([...url.searchParams.keys()].some(key => !allowedParameters.includes(key) || url.searchParams.getAll(key).length > 1)
      || !(kind === `analytics` ? [`7`, `30`, `90`] : [`24`, `168`, `720`]).includes(value)) throw new AdminAuthError(400, `invalid_reporting_period`, `Choose A Supported Reporting Period`);
    const customDates = url.searchParams.has(`from`) || url.searchParams.has(`to`);
    if (kind === `analytics` && customDates && (!url.searchParams.has(`from`) || !url.searchParams.has(`to`) || url.searchParams.has(`days`))) throw new AdminAuthError(400, `invalid_analytics_filters`, `Choose A Valid Date Range`);
    await requireAnalyticsAdmin(request, controller.signal);
    const period = Number(value);
    const filters: AnalyticsFilters = {
      ...(customDates ? { from: url.searchParams.get(`from`) ?? ``, to: url.searchParams.get(`to`) ?? `` } : getDateRange(period as TrafficPeriod)),
      path: url.searchParams.get(`path`) ?? ``, device: url.searchParams.get(`device`) ?? ``, country: url.searchParams.get(`country`) ?? ``, referrer: url.searchParams.get(`referrer`) ?? ``,
    };
    const report = kind === `analytics`
      ? { ...await getVercelAnalytics(filters), period: Math.round((Date.parse(filters.to) - Date.parse(filters.from)) / 86400000) + 1 }
      : await getVercelObservability(period as ObservabilityPeriod);
    return Response.json(report, { headers });
  } catch (failure) {
    if (failure instanceof AdminAuthError || failure instanceof GitHubServiceError || failure instanceof AnalyticsServiceError || failure instanceof ObservabilityServiceError) {
      return Response.json({ code: failure.code, message: failure.message }, { status: failure.status, headers });
    }
    if (failure instanceof RegistrarRelayError) {
      return Response.json({ code: failure.status === 401 ? `admin_sign_in_required` : `admin_verification_failed`, message: failure.status === 401 ? `Sign In Again To View Admin Reports` : `Admin Account Verification Failed — Check Your Account And Firestore Rules` }, { status: failure.status, headers });
    }
    return Response.json({ code: `admin_reports_unavailable`, message: `Admin Reports Are Unavailable — Try Again` }, { status: 503, headers });
  } finally {
    if (admitted) activeRequests--;
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
