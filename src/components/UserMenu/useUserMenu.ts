import { Platform } from 'react-native';
import { createStyles } from './styles.native';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useWatching } from '../../shared/watching/useWatching';
import { getAccountBadgeColors } from '../../shared/common/badges';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

export const useUserMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { records, loading: watchingLoading } = useWatching();
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
  const guestAuth = auth.hasSavedAccount
    ? { href: `/signin` as const, label: `Sign in` }
    : { href: `/signup` as const, label: `Sign up` };
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
    watchingCount: watchingLoading ? 0 : records.filter(record => record.listName === `Watching`).length,
    close: () => setOpen(false),
    toggle: () => setOpen(current => !current),
  };
};
