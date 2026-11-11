import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import type { AfternicActions } from './types';
import { getFirebaseAuth } from '../firebase/client';
import { firebaseEnabled } from '../firebase/config';

export const afternicPortalUrl = `https://www.afternic.com/`;
const endpoint = `/api/marketplace/afternic`;

export class AfternicRequestError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export const requestMarketplaceAfternic = async <Action extends keyof AfternicActions>(action: Action, input: AfternicActions[Action][`input`], signal?: AbortSignal): Promise<AfternicActions[Action][`output`]> => {
  if (!firebaseEnabled) throw new Error(`Marketplace Requires A Connected Account`);
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error(`Sign In To Connect Afternic`);
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== user.uid) throw new Error(`Your Account Changed — Try Again`);
  const response = await fetch(Platform.OS === `web` ? endpoint : absoluteSiteUrl(endpoint), {
    signal,
    method: `POST`,
    cache: `no-store`,
    body: JSON.stringify({ ...input, action }),
    headers: { 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  if (auth.currentUser !== user) throw new Error(`Your Account Changed — Try Again`);
  if (!response.ok || !body) throw new AfternicRequestError(response.status, typeof body?.error === `string` ? body.error : `Afternic Could Not Be Reached`);
  return body as AfternicActions[Action][`output`];
};
