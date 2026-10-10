import type { PropsWithChildren } from 'react';
import { useAuth } from '../authContext/useAuth';
import { Appearance, Platform } from 'react-native';
import { themePalettes, type ThemeMode, type ThemePalette } from './theme';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { saveTheme, getThemePreview, saveThemePreview, subscribeSavedTheme } from './preferences';

interface ThemeContextValue {
  error: string;
  ready: boolean;
  isDark: boolean;
  theme: ThemeMode;
  palette: ThemePalette;
  clearError: () => void;
  toggleTheme: () => void;
  setThemePreference: (theme: ThemeMode) => void;
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
  const saving = useRef(false);
  const pendingSnapshot = useRef<ThemeMode | null | undefined>(undefined);
  const replaySnapshot = useRef<(() => void) | null>(null);
  const ready = !authLoading && loadedScope === scope;
  const palette = themePalettes[theme];
  const isDark = theme === `dark`;

  useThemeLayoutEffect(() => {
    if (Platform.OS !== `web` || typeof document === `undefined`) return;
    const saved = getThemePreview() ?? document.documentElement.dataset.theme;
    if (!preferenceChanged.current && (saved === `light` || saved === `dark`)) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setError(``);
    setLoadedScope(null);
    saving.current = false;
    pendingSnapshot.current = undefined;
    if (authLoading) return () => { mounted = false; };
    const isCurrent = () => mounted && currentScope.current === scope;
    const subscribe = () => subscribeSavedTheme(userId, saved => {
      if (!isCurrent()) return false;
      if (saving.current) {
        pendingSnapshot.current = saved;
        return false;
      }
      pendingSnapshot.current = undefined;
      const nextTheme = saved ?? `dark`;
      if (currentTheme.current !== nextTheme) {
        currentTheme.current = nextTheme;
        setTheme(nextTheme);
      }
      setError(``);
      setLoadedScope(scope);
    }, failure => {
      if (!isCurrent()) return;
      setError(failure.message);
      setLoadedScope(scope);
    });
    let unsubscribe = subscribe();
    const replay = () => {
      if (!isCurrent()) return;
      unsubscribe();
      unsubscribe = subscribe();
    };
    replaySnapshot.current = replay;
    return () => {
      mounted = false;
      if (replaySnapshot.current === replay) replaySnapshot.current = null;
      unsubscribe();
    };
  }, [scope, userId, authLoading]);

  useThemeLayoutEffect(() => {
    if (Platform.OS !== `web`) {
      Appearance.setColorScheme(theme);
      return;
    }
    if (!ready || typeof document === `undefined`) return;
    saveThemePreview(theme);
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

  const setThemePreference = useCallback((nextTheme: ThemeMode) => {
    if (!ready || nextTheme === currentTheme.current) return;
    preferenceChanged.current = true;
    const revision = ++mutationRevision.current;
    saving.current = true;
    currentTheme.current = nextTheme;
    setTheme(nextTheme);
    setError(``);
    void saveTheme(nextTheme, userId).then(() => {
      if (currentScope.current !== scope || mutationRevision.current !== revision) return;
      saving.current = false;
      if (pendingSnapshot.current !== undefined) replaySnapshot.current?.();
    }).catch(failure => {
      if (currentScope.current === scope && mutationRevision.current === revision) {
        setError(failure instanceof Error ? failure.message : `Could Not Save Theme Preference`);
      }
    }).finally(() => {
      if (currentScope.current === scope && mutationRevision.current === revision) saving.current = false;
    });
  }, [ready, scope, userId]);

  const toggleTheme = useCallback(() => setThemePreference(currentTheme.current === `light` ? `dark` : `light`), [setThemePreference]);
  const clearError = useCallback(() => setError(``), []);

  const value = useMemo(() => ({
    ready,
    theme,
    isDark,
    palette,
    clearError,
    toggleTheme,
    setThemePreference,
    error: ready ? error : ``,
  }), [ready, theme, isDark, palette, error, clearError, toggleTheme, setThemePreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
