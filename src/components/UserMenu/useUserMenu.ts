import { Platform } from 'react-native';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import { capWords } from '../../shared/common/values';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getAccountBadgeColors } from '../../shared/common/badges';
import { hasUnlimitedPlanAccess } from '../../shared/accountPlans';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export const useUserMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { verifiedConnectionCount, connectionsCountLoading } = useConnectionAvailability();
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const [photoState, setPhotoState] = useState({ key: ``, attempt: 0, failed: false, loaded: false });
  const photoKey = `${auth.user?.id ?? ``}:${auth.user?.photoURL ?? ``}:${auth.loginRevision}`;
  const photoAttempt = photoState.key === photoKey ? photoState.attempt : 0;
  const photoFailed = photoState.key === photoKey && photoState.failed;
  const photoLoaded = photoState.key === photoKey && photoState.loaded;
  const photoRequestKey = `${photoKey}:${photoAttempt}`;
  const currentPhotoRequest = useRef(photoRequestKey);
  currentPhotoRequest.current = photoRequestKey;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const isSignInPage = pathname === routes.signin.href || routes.signin.redirects.some(alias => pathname === `/${alias}`);
  const isSignUpPage = pathname === routes.signup.href || routes.signup.redirects.some(alias => pathname === `/${alias}`);
  const guestAuth = isSignInPage ? routes.signup : isSignUpPage || auth.hasSavedAccount ? routes.signin : routes.signup;
  useEffect(() => setOpen(false), [pathname, auth.user?.id]);
  useEffect(() => {
    if (!photoFailed || photoAttempt >= 2) return;
    const timeout = setTimeout(() => setPhotoState(current => current.key === photoKey && current.attempt === photoAttempt && current.failed
      ? { key: photoKey, attempt: photoAttempt + 1, failed: false, loaded: false } : current), photoAttempt === 0 ? 5000 : 30000);
    return () => clearTimeout(timeout);
  }, [photoKey, photoFailed, photoAttempt]);
  useEffect(() => {
    if (!photoFailed || Platform.OS !== `web` || typeof window === `undefined`) return;
    const retry = () => setPhotoState(current => current.key === photoKey && current.failed
      ? { key: photoKey, attempt: current.attempt + 1, failed: false, loaded: false } : current);
    window.addEventListener(`online`, retry);
    return () => window.removeEventListener(`online`, retry);
  }, [photoKey, photoFailed]);
  useEffect(() => {
    if (!open || typeof document === `undefined`) return;
    const dismiss = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest(`#user-menu`)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === `Escape`) setOpen(false); };
    document.addEventListener(`mousedown`, dismiss);
    document.addEventListener(`keydown`, escape);
    return () => {
      document.removeEventListener(`mousedown`, dismiss);
      document.removeEventListener(`keydown`, escape);
    };
  }, [open]);
  const signOut = async () => {
    try {
      await auth.signOut();
      setOpen(false);
      router.replace(`/`);
    } catch {}
  };
  return {
    ...auth,
    open,
    styles,
    palette,
    signOut,
    guestAuth,
    photoLoaded,
    photoRequestKey,
    planLabel: hasUnlimitedPlanAccess(auth.user) ? `Unlimited` : capWords(auth.user?.plan?.trim()?.toLowerCase() || `free`),
    connectionsCountLoading,
    verifiedConnectionCount,
    photoURL: photoFailed ? undefined : auth.user?.photoURL,
    onPhotoLoad: () => {
      if (currentPhotoRequest.current === photoRequestKey) setPhotoState({ key: photoKey, attempt: photoAttempt, failed: false, loaded: true });
    },
    onPhotoError: () => {
      if (currentPhotoRequest.current === photoRequestKey) setPhotoState({ key: photoKey, attempt: photoAttempt, failed: true, loaded: false });
    },
    badgeColors: getAccountBadgeColors(auth.user),
    close: () => setOpen(false),
    toggle: () => setOpen(current => !current),
  };
};
