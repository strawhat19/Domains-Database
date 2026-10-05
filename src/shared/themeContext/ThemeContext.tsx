import type { PropsWithChildren } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themePalettes, THEME_STORAGE_KEY, type ThemeMode, type ThemePalette } from './theme';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

interface ThemeContextValue {
  ready: boolean;
  isDark: boolean;
  theme: ThemeMode;
  palette: ThemePalette;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const useThemeLayoutEffect = Platform.OS === `web` && typeof window !== `undefined` ? useLayoutEffect : useEffect;

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(`dark`);
  const preferenceChanged = useRef(false);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const palette = themePalettes[theme];
  const isDark = theme === `dark`;

  useThemeLayoutEffect(() => {
    if (Platform.OS !== `web` || typeof document === `undefined`) return;
    let saved = document.documentElement.dataset.theme;
    try {
      saved = window.localStorage.getItem(THEME_STORAGE_KEY) ?? saved;
    } catch {}
    if (!preferenceChanged.current && (saved === `light` || saved === `dark`)) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(saved => {
      if (mounted && !preferenceChanged.current && (saved === `light` || saved === `dark`)) {
        setTheme(saved);
      }
    }).catch(() => undefined).finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    storageQueue.current = storageQueue.current
      .then(() => AsyncStorage.setItem(THEME_STORAGE_KEY, theme))
      .catch(() => undefined);
  }, [theme, ready]);

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
    preferenceChanged.current = true;
    setTheme(current => current === `light` ? `dark` : `light`);
  }, []);

  const value = useMemo(() => ({
    ready,
    theme,
    isDark,
    palette,
    toggleTheme,
  }), [ready, theme, isDark, palette, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
