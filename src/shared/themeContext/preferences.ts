import { authAPI } from '../../api/auth';
import { accountStorageKey } from '../authentication/userScope';
import { useLocalStorage, persistenceEnabled } from '../config';
import { THEME_STORAGE_KEY, THEME_BOOTSTRAP_KEY, type ThemeMode } from './theme';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';

const serialize = createOperationQueue(THEME_STORAGE_KEY);

export const getThemePreview = (): ThemeMode | null => {
  if (typeof window === `undefined`) return null;
  try {
    const cached = window.localStorage.getItem(THEME_BOOTSTRAP_KEY);
    if (cached === `light` || cached === `dark`) return cached;
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === `light` || saved === `dark` ? saved : null;
  } catch { return null; }
};

export const saveThemePreview = (theme: ThemeMode) => {
  if ((theme !== `light` && theme !== `dark`) || typeof window === `undefined`) return;
  try { window.localStorage.setItem(THEME_BOOTSTRAP_KEY, theme); } catch {}
};

export const getThemeStorageKey = (userId: string | null) => userId === null
  ? THEME_STORAGE_KEY
  : accountStorageKey(THEME_STORAGE_KEY, userId);

const requireScope = async (expectedUserId: string | null) => {
  const session = await authAPI.restoreSession();
  if ((session?.user?.id ?? null) !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
};

const readTheme = async (key: string, userId: string | null): Promise<ThemeMode | null> => {
  await requireScope(userId);
  const saved = await readStorage(key);
  await requireScope(userId);
  if (saved === null || saved === `light` || saved === `dark`) return saved;
  throw new Error(`Saved Theme Preference Could Not Be Read`);
};

export const getSavedTheme = (userId: string | null): Promise<ThemeMode | null> => serialize(async () => {
  if (!persistenceEnabled) return null;
  const saved = await readTheme(getThemeStorageKey(userId), userId);
  return saved === null && userId !== null && useLocalStorage ? readTheme(THEME_STORAGE_KEY, userId) : saved;
});

export const subscribeSavedTheme = (
  userId: string | null,
  onValue: (theme: ThemeMode | null) => boolean | void,
  onError: (error: Error) => void,
) => {
  let saved: string | null | undefined;
  let legacy: string | null | undefined = userId !== null && useLocalStorage ? undefined : null;
  const update = () => {
    if (saved === undefined || legacy === undefined) return false;
    const theme = saved ?? legacy;
    if (theme === null || theme === `light` || theme === `dark`) return onValue(theme);
    onError(new Error(`Saved Theme Preference Could Not Be Read`));
    return false;
  };
  const unsubscribe = subscribeStorage(getThemeStorageKey(userId), value => { saved = value; return update(); }, onError);
  const unsubscribeLegacy = userId !== null && useLocalStorage
    ? subscribeStorage(THEME_STORAGE_KEY, value => { legacy = value; return update(); }, onError)
    : undefined;
  return () => { unsubscribe(); unsubscribeLegacy?.(); };
};

export const saveTheme = (theme: ThemeMode, userId: string | null): Promise<void> => serialize(async () => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Theme Preferences`);
  if (theme !== `light` && theme !== `dark`) throw new Error(`Choose A Valid Theme`);
  const key = getThemeStorageKey(userId);
  await requireScope(userId);
  await writeStorage(key, theme);
});
