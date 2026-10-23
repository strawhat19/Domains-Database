import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { getFirebaseAuth } from '../firebase/client';

export const commitCloudPortfolio = async (input: object, expectedUid: string): Promise<number> => {
  const actor = getFirebaseAuth().currentUser;
  if (!actor || actor.uid !== expectedUid) throw new Error(`Your Account Changed — Try Again`);
  const token = await actor.getIdToken();
  const response = await fetch(Platform.OS === `web` ? `/api/portfolio/commit` : absoluteSiteUrl(`/api/portfolio/commit`), {
    method: `POST`,
    credentials: `omit`,
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(45_000),
    headers: { 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (getFirebaseAuth().currentUser?.uid !== expectedUid) throw new Error(`Your Account Changed — Try Again`);
  if (!response.ok) throw new Error(typeof result?.error === `string` ? result.error : `Portfolio Could Not Be Saved`);
  if (!Number.isSafeInteger(result?.revision) || result.revision < 1) throw new Error(`Saved Portfolio Could Not Be Confirmed`);
  return result.revision;
};
