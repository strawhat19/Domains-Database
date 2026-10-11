import { Platform } from 'react-native';
import { getFirebaseAuth } from '../firebase/client';
import { firebaseEnabled } from '../firebase/config';
import type { TrafficPeriod, TrafficReport, AnalyticsFilters, ObservabilityPeriod, ObservabilityReport } from './types';

export class ReportRequestError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
const requestReport = async <T,>(path: string, firebaseUid: string, signal: AbortSignal): Promise<T> => {
  if (!firebaseEnabled) throw new ReportRequestError(`admin_auth_not_configured`, `Connect Firebase To View Admin Reports`);
  if (Platform.OS !== `web`) throw new ReportRequestError(`admin_web_reporting_required`, `Open The Web Admin Dashboard To View Vercel Reports`);
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user || user.uid !== firebaseUid) throw new ReportRequestError(`admin_session_changed`, `Sign In Again To View Admin Reports`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 30_000);
  try {
    const token = await user.getIdToken();
    if (auth.currentUser?.uid !== firebaseUid) throw new ReportRequestError(`admin_session_changed`, `Your Account Changed — Try Again`);
    const response = await fetch(path, { cache: `no-store`, credentials: `omit`, signal: controller.signal, headers: { Accept: `application/json`, Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => null);
    if (auth.currentUser?.uid !== firebaseUid) throw new ReportRequestError(`admin_session_changed`, `Your Account Changed — Try Again`);
    if (!response.ok) throw new ReportRequestError(typeof result?.code === `string` ? result.code : `admin_reports_unavailable`, typeof result?.message === `string` ? result.message : `Admin Reports Could Not Be Loaded`);
    if (!result || typeof result !== `object` || !Array.isArray(result?.trend) || typeof result?.fetchedAt !== `string`) throw new ReportRequestError(`admin_invalid_report`, `Admin Reporting Returned An Unexpected Response`);
    return result as T;
  } catch (failure) {
    if (failure instanceof ReportRequestError) throw failure;
    if (controller.signal.aborted) throw new ReportRequestError(`admin_report_timeout`, `Admin Reporting Took Too Long — Try Again`);
    throw new ReportRequestError(`admin_reports_unavailable`, `Admin Reports Could Not Be Loaded — Check The Server Connection`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
export const getTrafficReport = (filters: TrafficPeriod | AnalyticsFilters, firebaseUid: string, signal: AbortSignal) => {
  const parameters = new URLSearchParams(typeof filters === `number` ? { days: `${filters}` } : filters);
  return requestReport<TrafficReport>(`/api/admin/analytics?${parameters}`, firebaseUid, signal);
};
export const getObservabilityReport = (period: ObservabilityPeriod, firebaseUid: string, signal: AbortSignal) => requestReport<ObservabilityReport>(`/api/admin/observability?hours=${period}`, firebaseUid, signal);
