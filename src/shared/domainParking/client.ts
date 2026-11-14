import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { getFirebaseAuth } from '../firebase/client';
import type { DomainParkingMetrics } from './types';
import { readDomainParkingMetrics } from './values';

export const fetchDomainParking = async (domainId: string, connectionId: string, domain: string, signal: AbortSignal): Promise<DomainParkingMetrics> => {
  const auth = getFirebaseAuth();
  const actor = auth.currentUser;
  if (!actor || actor.isAnonymous) throw new Error(`Sign In To Check GoDaddy Parking Metrics`);
  const token = await actor.getIdToken();
  if (auth.currentUser !== actor || signal.aborted) throw new Error(`Parking Metrics Request Cancelled`);
  const path = `/api/domain-parking`;
  const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
    signal,
    method: `POST`,
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    body: JSON.stringify({ domainId, connectionId }),
    headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
  });
  const result: unknown = await response.json().catch(() => null);
  if (auth.currentUser !== actor || signal.aborted) throw new Error(`Parking Metrics Request Cancelled`);
  if (!response.ok) {
    const error = (result as { error?: unknown } | null)?.error;
    throw new Error(typeof error === `string` && error.length <= 240 ? error : `GoDaddy Parking Metrics Could Not Be Loaded`);
  }
  const report = readDomainParkingMetrics(result, domain);
  if (!report) throw new Error(`GoDaddy Parking Metrics Could Not Be Read`);
  return report;
};
