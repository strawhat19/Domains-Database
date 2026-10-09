import { useLocalStorage, persistenceEnabled } from '../config';
import { authAPI } from '../../api/auth';
import { THEME_STORAGE_KEY, type ThemeMode } from './theme';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';

const serialize = createOperationQueue(THEME_STORAGE_KEY);

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

export const saveTheme = (theme: ThemeMode, userId: string | null): Promise<void> => serialize(async () => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Theme Preferences`);
  if (theme !== `light` && theme !== `dark`) throw new Error(`Choose A Valid Theme`);
  const key = getThemeStorageKey(userId);
  await requireScope(userId);
  await writeStorage(key, theme);
});
