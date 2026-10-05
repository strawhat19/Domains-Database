import type { PropsWithChildren } from 'react';
import { useLocalStorage } from '../config';
import { useAuth } from '../authContext/useAuth';
import { AppState, Appearance, Platform } from 'react-native';
import { getSavedTheme, saveTheme, getThemeStorageKey } from './preferences';
import { themePalettes, THEME_STORAGE_KEY, type ThemeMode, type ThemePalette } from './theme';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

interface ThemeContextValue {
  error: string;
  ready: boolean;
  isDark: boolean;
  theme: ThemeMode;
  palette: ThemePalette;
  clearError: () => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const useThemeLayoutEffect = Platform.OS === `web` && typeof window !== `undefined` ? useLayoutEffect : useEffect;

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const scope = authLoading ? `pending` : userId ?? `guest`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [error, setError] = useState(``);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(`dark`);
  const currentTheme = useRef(theme);
  currentTheme.current = theme;
  const preferenceChanged = useRef(false);
  const mutationRevision = useRef(0);
  const ready = !authLoading && loadedScope === scope;
  const palette = themePalettes[theme];
  const isDark = theme === `dark`;

  useThemeLayoutEffect(() => {
    if (Platform.OS !== `web` || typeof document === `undefined`) return;
    let saved = document.documentElement.dataset.theme;
    try {
      if (useLocalStorage) saved = window.localStorage.getItem(THEME_STORAGE_KEY) ?? saved;
    } catch {}
    if (!preferenceChanged.current && (saved === `light` || saved === `dark`)) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let request = 0;
    setError(``);
    setLoadedScope(null);
    if (authLoading) return () => { mounted = false; };
    const refresh = () => {
      const revision = ++request;
      const changed = mutationRevision.current;
      const isCurrent = () => mounted && currentScope.current === scope && request === revision;
      void getSavedTheme(userId).then(saved => {
        if (isCurrent() && changed === mutationRevision.current) {
          currentTheme.current = saved ?? `dark`;
          setTheme(currentTheme.current);
          setError(``);
        }
      }).catch(failure => {
        if (isCurrent()) setError(failure instanceof Error ? failure.message : `Could Not Load Theme Preference`);
      }).finally(() => {
        if (isCurrent()) setLoadedScope(scope);
      });
    };
    const changed = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY || event.key === getThemeStorageKey(userId)) refresh();
    };
    const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) refresh(); });
    refresh();
    if (typeof window !== `undefined`) {
      window.addEventListener(`focus`, refresh);
      window.addEventListener(`storage`, changed);
    }
    return () => {
      mounted = false;
      subscription.remove();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, refresh);
        window.removeEventListener(`storage`, changed);
      }
    };
  }, [scope, userId, authLoading]);

  useThemeLayoutEffect(() => {
    if (Platform.OS !== `web`) {
      Appearance.setColorScheme(theme);
      return;
    }
    if (!ready || typeof document === `undefined`) return;
    const root = document.documentElement;
    root.dataset.themeChanging = `true`;
    root.dataset.theme = theme;
    document.querySelector(`meta[name="theme-color"]`)?.setAttribute(`content`, palette.canvas);
    void window.getComputedStyle(root).backgroundColor;
    // Restore transitions after the new theme has had a chance to paint.
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        delete root.dataset.themeChanging;
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      delete root.dataset.themeChanging;
    };
  }, [theme, palette, ready]);

  const toggleTheme = useCallback(() => {
    if (!ready) return;
    preferenceChanged.current = true;
    const nextTheme = currentTheme.current === `light` ? `dark` : `light`;
    const revision = ++mutationRevision.current;
    currentTheme.current = nextTheme;
    setTheme(nextTheme);
    setError(``);
    void saveTheme(nextTheme, userId).catch(failure => {
      if (currentScope.current === scope && mutationRevision.current === revision) {
        setError(failure instanceof Error ? failure.message : `Could Not Save Theme Preference`);
      }
    });
  }, [ready, scope, userId]);

  const clearError = useCallback(() => setError(``), []);

  const value = useMemo(() => ({
    ready,
    theme,
    isDark,
    palette,
    clearError,
    toggleTheme,
    error: ready ? error : ``,
  }), [ready, theme, isDark, palette, error, clearError, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
