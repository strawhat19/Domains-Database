import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../shared/seo';
import { useLocalStorage } from '../shared/config';
import { firebaseEnabled } from '../shared/firebase/config';
import { getFirebaseAuth } from '../shared/firebase/client';
import { appraisalFailureStatuses, type DomainAppraisal, type DomainAppraisalResult } from '../shared/domainAppraisal/types';

export type { DomainAppraisal, DomainAppraisalResult } from '../shared/domainAppraisal/types';

const unavailable = (message = `Domain Appraisal Could Not Be Loaded — Try Again`): DomainAppraisalResult => ({ status: `unavailable`, message });
const isDate = (value: unknown) => typeof value === `string` && Number.isFinite(Date.parse(value));
const isAmount = (value: unknown) => typeof value === `number` && Number.isFinite(value) && value >= 0;

const readResult = (value: unknown, ok: boolean): DomainAppraisalResult => {
  if (!value || typeof value !== `object` || !(`status` in value)) return unavailable();
  if (ok && value.status === `available` && `appraisal` in value) {
    const appraisal = value.appraisal as Partial<DomainAppraisal> | null;
    if (appraisal?.source === `GoDaddy GoValue` && appraisal.currency === `USD` && isDate(appraisal.checkedAt)
      && isAmount(appraisal.amount) && [appraisal.minPrice, appraisal.maxPrice, appraisal.listPrice, appraisal.wholesalePrice].every(price => price === undefined || isAmount(price))) {
      return { status: `available`, appraisal: appraisal as DomainAppraisal };
    }
  }
  const status = appraisalFailureStatuses.find(option => option === value.status);
  if (status && `message` in value && typeof value.message === `string` && value.message.length <= 240) {
    const retryAt = `retryAt` in value && typeof value.retryAt === `string` && isDate(value.retryAt) ? value.retryAt : undefined;
    return { status, retryAt, message: value.message };
  }
  return unavailable();
};

export const fetchDomainAppraisal = async (domainId: string, signal?: AbortSignal): Promise<DomainAppraisalResult> => {
  if (!firebaseEnabled || useLocalStorage) return unavailable(`Connect Firebase To Check Domain Appraisals`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 25_000);
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const auth = getFirebaseAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return unavailable(`Sign In To Check Domain Appraisals`);
    const token = await user.getIdToken();
    if (auth.currentUser !== user) return unavailable(`Your Account Changed — Try Again`);
    const path = `/api/domain-appraisal`;
    const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
      method: `POST`, cache: `no-store`, redirect: `error`, credentials: `omit`, signal: controller.signal, body: JSON.stringify({ domainId }),
      headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
    });
    const result: unknown = await response.json().catch(() => null);
    return auth.currentUser === user ? readResult(result, response.ok) : unavailable(`Your Account Changed — Try Again`);
  } catch { return unavailable(); }
  finally { clearTimeout(timeout); signal?.removeEventListener(`abort`, abort); }
};
