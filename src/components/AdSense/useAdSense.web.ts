import { SITE_URL } from '../../shared/seo';
import { onIdTokenChanged } from 'firebase/auth';
import { useUnstableGlobalHref } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { getFirebaseAuth } from '../../shared/firebase/client';
import { firebaseEnabled } from '../../shared/firebase/config';
import { canLoadAdSense } from '../../shared/adsense/policy';
import { getAdSensePublisherId } from '../../shared/adsense/config';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { useRef, useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { createAdSenseRuntime, type AdSenseWindow, type AdSenseRuntime } from '../../shared/adsense/runtime.web';

const readFirebaseIdentity = () => {
  if (!firebaseEnabled) return `unavailable`;
  try {
    const user = getFirebaseAuth().currentUser;
    return user ? `${user.isAnonymous ? `anonymous` : `account`}:${user.uid}` : `guest`;
  } catch { return `unavailable`; }
};
const subscribeFirebaseIdentity = (listener: () => void) => {
  if (!firebaseEnabled) return () => undefined;
  try { return onIdTokenChanged(getFirebaseAuth(), listener, listener); }
  catch { return () => undefined; }
};
const readServerIdentity = () => `pending`;

export const useAdSense = () => {
  const auth = useAuth();
  const routeHref = useUnstableGlobalHref();
  const access = useStarterAccess();
  const features = useFeatureFlags();
  const publisherId = getAdSensePublisherId();
  const runtime = useRef<AdSenseRuntime | null>(null);
  const firebaseIdentity = useSyncExternalStore(subscribeFirebaseIdentity, readFirebaseIdentity, readServerIdentity);
  const identityConfirmed = auth.user ? auth.user.active === true && !auth.user.anonymous
    && firebaseIdentity === `account:${auth.user.firebase_uid}` : firebaseIdentity === `guest`;
  const canonicalHttpsOrigin = typeof window !== `undefined` && window.location.protocol === `https:`
    && window.location.origin === SITE_URL && !window.location.search && !window.location.hash;
  const identity = `${auth.user?.id ?? `guest`}:${firebaseIdentity}:${auth.user?.role ?? `guest`}:${auth.loginRevision}`;
  const settling = auth.loading || auth.busy;
  const eligible = canLoadAdSense({
    pathname: routeHref,
    paid: access.allowed,
    owner: access.owner,
    identityConfirmed,
    canonicalHttpsOrigin,
    authBusy: auth.busy,
    adsEnabled: features.flags.ads,
    authReady: !auth.loading,
    authErrorFree: !auth.error,
    connectedFirebase: firebaseEnabled,
    featuresReady: features.ready,
    billingLoading: access.loading,
    featuresLoading: features.loading,
    billingErrorFree: !access.error,
    featuresErrorFree: !features.error,
    publisherConfigured: !!publisherId,
    billingConfirmedFree: access.confirmedFree,
  });
  useLayoutEffect(() => {
    if (!runtime.current && eligible && publisherId) runtime.current = createAdSenseRuntime(window as AdSenseWindow, document, publisherId);
    runtime.current?.update({ eligible, identity, settling, path: routeHref });
  }, [eligible, identity, publisherId, routeHref, settling]);
  useEffect(() => () => runtime.current?.dispose(), []);
};
