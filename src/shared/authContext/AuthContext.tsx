import { api } from '../../api';
import { AppState } from 'react-native';
import { authAPI } from '../../api/auth';
import { useLocalStorage } from '../config';
import type { User } from '../models/users/User';
import { createOperationQueue } from '../common/storage';
import { AUTH_PRESENCE_KEYS } from '../authentication/accountPresence';
import { AccountDataCleanupError, type AccountAction } from '../authentication/types';
import { claimLegacyPortfolioPreferences } from '../portfolioPreferences/storage';
import type { SignInInput, SignUpInput, AuthenticationResult } from '../authentication/types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

interface AuthContextValue {
  busy: boolean;
  loading: boolean;
  hasSavedAccount: boolean;
  loginRevision: number;
  dataRevision: number;
  user: User | null;
  error: string | null;
  notice: string | null;
  clearError: () => void;
  clearNotice: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signIn: (input: SignInInput) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  manageAccount: (action: AccountAction) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
const messageFromError = (error: unknown) => error instanceof Error ? error.message : `Authentication Is Unavailable`;

export const AuthProvider = ({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) => {
  const mounted = useRef(false);
  const initialized = useRef(false);
  const currentUser = useRef<User | null>(null);
  const queue = useRef(createOperationQueue()).current;
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataRevision, setDataRevision] = useState(0);
  const [loginRevision, setLoginRevision] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasSavedAccount, setHasSavedAccount] = useState(true);

  const refreshSavedAccount = useCallback(async (accountUser: User | null) => {
    try {
      const savedAccount = Boolean(accountUser) || await authAPI.hasSavedAccount();
      if (mounted.current) setHasSavedAccount(savedAccount);
    } catch (failure) {
      if (mounted.current) setHasSavedAccount(true);
      throw failure;
    }
  }, []);

  const applySession = useCallback(async (result: AuthenticationResult | null) => {
    const userId = result?.user ? String(result.user.id) : null;
    const sameActor = initialized.current && userId === (currentUser.current?.id ?? null) && !result?.claimLegacy;
    if (sameActor) {
      await refreshSavedAccount(result?.user ?? null);
      currentUser.current = result?.user ?? null;
      if (mounted.current) { setUser(result?.user ?? null); setExpiresAt(result?.expiresAt ?? null); }
      return result?.user ?? null;
    }
    currentUser.current = null;
    if (mounted.current) { setLoading(true); setUser(null); setExpiresAt(null); }
    try {
      await refreshSavedAccount(result?.user ?? null);
      await api.setUserScope(userId, { claimLegacy: result?.claimLegacy ?? false, adoptGuest: result?.user.number === 1 });
      if (result?.claimLegacy && userId) {
        await claimLegacyPortfolioPreferences(userId);
        await authAPI.completeLegacyClaim(userId);
      }
      currentUser.current = result?.user ?? null;
      if (mounted.current) { setUser(result?.user ?? null); setExpiresAt(result?.expiresAt ?? null); }
      return result?.user ?? null;
    } catch (failure) {
      await api.setUserScope(null).catch(() => undefined);
      throw failure;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [refreshSavedAccount]);

  const refreshUser = useCallback((): Promise<void> => queue(async () => {
    if (mounted.current && !initialized.current) setLoading(true);
    try {
      await applySession(await authAPI.restoreSession());
      if (mounted.current) setError(null);
    } catch (failure) {
      currentUser.current = null;
      if (mounted.current) { setLoading(true); setUser(null); setExpiresAt(null); setError(messageFromError(failure)); }
      await api.setUserScope(null).catch(() => undefined);
      throw failure;
    } finally {
      initialized.current = true;
      if (mounted.current) setLoading(false);
    }
  }), [queue, applySession]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return () => { mounted.current = false; };
    void refreshUser().catch(() => undefined);
    const syncSession = (event: StorageEvent) => {
      if (event.key === null || AUTH_PRESENCE_KEYS.includes(event.key)) void refreshUser().catch(() => undefined);
    };
    const resumeSession = () => { void refreshUser().catch(() => undefined); };
    const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) resumeSession(); });
    if (useLocalStorage && typeof window !== `undefined`) {
      window.addEventListener(`focus`, resumeSession);
      window.addEventListener(`storage`, syncSession);
    }
    return () => {
      mounted.current = false;
      subscription.remove();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resumeSession);
        window.removeEventListener(`storage`, syncSession);
      }
    };
  }, [enabled, refreshUser]);

  useEffect(() => {
    if (!user || expiresAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleExpiry = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) { void refreshUser().catch(() => undefined); return; }
      timer = setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
    };
    scheduleExpiry();
    return () => clearTimeout(timer);
  }, [user?.id, expiresAt, refreshUser]);

  const authenticate = useCallback((operation: () => Promise<AuthenticationResult>, message: string): Promise<User> => queue(async () => {
    if (mounted.current) { setBusy(true); setError(null); setNotice(null); }
    let sessionCreated = false;
    try {
      const result = await operation();
      sessionCreated = true;
      const authenticatedUser = await applySession(result);
      if (!authenticatedUser) throw new Error(`Sign In To Access Your Saved Data`);
      if (mounted.current) { setNotice(message); setLoginRevision(current => current + 1); }
      return authenticatedUser;
    } catch (failure) {
      if (sessionCreated) {
        await authAPI.signOut().catch(() => undefined);
        await api.setUserScope(null).catch(() => undefined);
        currentUser.current = null;
        if (mounted.current) { setUser(null); setExpiresAt(null); }
      }
      if (mounted.current) setError(messageFromError(failure));
      throw failure;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }), [queue, applySession]);

  const signIn = useCallback((input: SignInInput) => authenticate(() => authAPI.signIn(input), input.reactivate ? `Account Reactivated Successfully` : `Signed In Successfully`), [authenticate]);
  const signUp = useCallback((input: SignUpInput) => authenticate(() => authAPI.signUp(input), `Account Created Successfully`), [authenticate]);

  const signOut = useCallback((): Promise<void> => queue(async () => {
    if (mounted.current) { setBusy(true); setError(null); setNotice(null); }
    try {
      await authAPI.signOut();
      await applySession(null);
      if (mounted.current) setNotice(`Signed Out Successfully`);
    } catch (failure) {
      try {
        await applySession(await authAPI.restoreSession());
      } catch {
        currentUser.current = null;
        if (mounted.current) { setLoading(true); setUser(null); setExpiresAt(null); }
        await api.setUserScope(null).catch(() => undefined);
        if (mounted.current) setLoading(false);
      }
      if (mounted.current) setError(messageFromError(failure));
      throw failure;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }), [queue, applySession]);

  const manageAccount = useCallback((action: AccountAction): Promise<void> => {
    const expectedUserId = currentUser.current?.id ?? ``;
    return queue(async () => {
      if (mounted.current) { setBusy(true); setError(null); setNotice(null); }
      try {
        await authAPI.manageAccount(action, expectedUserId);
        if (mounted.current && action !== `deactivate`) setDataRevision(current => current + 1);
        await applySession(null);
        if (mounted.current) {
          setNotice(action === `deactivate` ? `Account Deactivated Successfully`
            : action === `delete-account` ? `Account Deleted Successfully`
            : action === `delete-data-connections` ? `Account Data And Connections Deleted Successfully`
            : `Account Data Deleted Successfully`);
        }
      } catch (failure) {
        if (mounted.current && failure instanceof AccountDataCleanupError) {
          setLoading(true);
          setDataRevision(current => current + 1);
        }
        try {
          await applySession(await authAPI.restoreSession());
        } catch {
          currentUser.current = null;
          if (mounted.current) { setLoading(true); setUser(null); setExpiresAt(null); }
          await api.setUserScope(null).catch(() => undefined);
          if (mounted.current) setLoading(false);
        }
        if (mounted.current) setError(messageFromError(failure));
        throw failure;
      } finally {
        if (mounted.current) setBusy(false);
      }
    });
  }, [queue, applySession]);

  const clearError = useCallback(() => setError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const value = useMemo(() => ({ user, busy, error, notice, loading: !enabled || loading, dataRevision, loginRevision, hasSavedAccount, signIn, signUp, signOut, clearError, clearNotice, refreshUser, manageAccount }), [enabled, user, busy, error, notice, loading, dataRevision, loginRevision, hasSavedAccount, signIn, signUp, signOut, clearError, clearNotice, refreshUser, manageAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
