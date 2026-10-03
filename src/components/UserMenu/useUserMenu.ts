import { createStyles } from './styles.native';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';

export const useUserMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const guestAuth = auth.hasSavedAccount
    ? { href: `/signin` as const, label: `Sign in` }
    : { href: `/signup` as const, label: `Sign up` };
  useEffect(() => setOpen(false), [pathname, auth.user?.id]);
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
  return { ...auth, open, styles, palette, signOut, guestAuth, toggle: () => setOpen(current => !current) };
};
