import { useAuth } from '../authContext/useAuth';
import { useWindowDimensions } from 'react-native';
import { canAccessAdmin } from '../admin/permissions';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const expandableMenus = [`dashboard`, `feedback`];
const savedMenuKeys = [`portfolio`, ...expandableMenus];
type NavigationPreferences = { version: 1; collapsed: boolean; desktop: string[]; mobile: string[] };
const defaultPreferences = (admin: boolean): NavigationPreferences => {
  const menus = admin ? [`dashboard`] : [];
  return { version: 1, collapsed: false, desktop: [...menus], mobile: menus.slice(0, 2) };
};
const parsePreferences = (value: string, admin: boolean, feedback: boolean): NavigationPreferences => {
  const saved: unknown = JSON.parse(value);
  if (!saved || typeof saved !== `object`) throw new Error(`Sidebar Preferences Could Not Be Loaded`);
  const record = saved as Record<string, unknown>;
  const validMenus = (menus: unknown): menus is string[] => Array.isArray(menus) && menus.every(menu => typeof menu === `string` && savedMenuKeys.includes(menu)) && new Set(menus).size === menus.length;
  if (record.version !== 1 || typeof record.collapsed !== `boolean` || !validMenus(record.desktop) || !validMenus(record.mobile)) throw new Error(`Sidebar Preferences Could Not Be Loaded`);
  const allowed = (menu: string) => menu === `dashboard` ? admin : menu === `feedback` && feedback;
  return { version: 1, collapsed: record.collapsed, desktop: record.desktop.filter(allowed), mobile: record.mobile.filter(allowed) };
};
interface AccountNavigationValue {
  collapsed: boolean;
  preferenceError: string;
  expandedRoutes: readonly string[];
  toggleCollapsed: () => void;
  toggleSubmenu: (id: string) => void;
}

export const AccountNavigationContext = createContext<AccountNavigationValue | null>(null);

export const AccountNavigationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const admin = canAccessAdmin(user);
  const feedback = canAccessAdmin(user, `feedback`);
  const layout = width > 650 ? `desktop` : `mobile`;
  const storageKey = user?.uuid ? `domains-database:account-navigation:v1:${user.uuid}` : undefined;
  const [ready, setReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState(``);
  const [preferences, setPreferences] = useState(() => defaultPreferences(admin));
  const edited = useRef(false);
  const enqueue = useMemo(() => createOperationQueue(storageKey), [storageKey]);
  useEffect(() => {
    let current = true;
    edited.current = false;
    setReady(false);
    setPreferenceError(``);
    setPreferences(defaultPreferences(admin));
    if (!storageKey) { setReady(true); return; }
    void readStorage(storageKey).then(value => {
      const saved = value ? parsePreferences(value, admin, feedback) : defaultPreferences(admin);
      if (!current) return;
      if (!edited.current) setPreferences(saved);
      setReady(true);
    }).catch(() => { if (current) setPreferenceError(`Sidebar Preferences Could Not Be Loaded`); });
    return () => { current = false; };
  }, [admin, feedback, storageKey]);
  useEffect(() => {
    if (!ready || !storageKey || !edited.current) return;
    let current = true;
    void enqueue(() => writeStorage(storageKey, JSON.stringify(preferences))).then(() => {
      if (current) setPreferenceError(``);
    }).catch(() => { if (current) setPreferenceError(`Sidebar Preferences Could Not Be Saved`); });
    return () => { current = false; };
  }, [ready, enqueue, preferences, storageKey]);
  const toggleCollapsed = useCallback(() => {
    edited.current = true;
    setPreferences(current => ({ ...current, collapsed: !current.collapsed }));
  }, []);
  const toggleSubmenu = useCallback((id: string) => {
    if (!expandableMenus.includes(id) || (id === `dashboard` && !admin) || (id === `feedback` && !feedback)) return;
    edited.current = true;
    setPreferences(current => {
      const expanded = current[layout].includes(id) ? current[layout].filter(menu => menu !== id) : [...current[layout], id];
      return { ...current, [layout]: expanded };
    });
  }, [admin, feedback, layout]);
  const collapsed = preferences.collapsed;
  const expandedRoutes = preferences[layout];
  const value = useMemo(() => ({ collapsed, preferenceError, expandedRoutes, toggleSubmenu, toggleCollapsed }), [collapsed, preferenceError, expandedRoutes, toggleSubmenu, toggleCollapsed]);
  return <AccountNavigationContext.Provider value={value}>{children}</AccountNavigationContext.Provider>;
};
