import { Platform, AppState } from 'react-native';
import { socialAPI } from '../../api/social';
import { SOCIAL_STORAGE_KEY } from './service';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../authContext/useAuth';
import type { FeedView, PostInput, CommunitySnapshot } from './types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const emptySnapshot = (): CommunitySnapshot => ({ posts: [], profiles: [], followingIds: [], viewerId: null, storageEnabled: true });
interface SocialContextValue extends CommunitySnapshot {
  view: FeedView;
  busy: boolean;
  loading: boolean;
  error: string | null;
  notice: string | null;
  clearError: () => void;
  clearNotice: () => void;
  refresh: () => Promise<void>;
  setView: (view: FeedView) => void;
  createPost: (input: PostInput) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updatePost: (id: string, input: PostInput) => Promise<void>;
  setFollowing: (id: string, following: boolean) => Promise<void>;
}
export const SocialContext = createContext<SocialContextValue | undefined>(undefined);

export const CommunityProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<FeedView>(`public`);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const request = useRef(0);
  const mounted = useRef(true);
  const mutationBusy = useRef(false);
  const currentUserId = useRef(user?.id ?? null);
  currentUserId.current = user?.id ?? null;
  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    const revision = ++request.current;
    setLoading(true);
    try {
      const result = await socialAPI.getCommunity(view);
      if (mounted.current && revision === request.current) {
        if (result.viewerId !== currentUserId.current) { setSnapshot(emptySnapshot()); setError(`Your Account Changed — Refresh To Continue`); }
        else { setSnapshot(result); setError(null); }
      }
    } catch (failure) {
      if (mounted.current && revision === request.current) { setSnapshot(emptySnapshot()); setError(failure instanceof Error ? failure.message : `Community Could Not Be Loaded`); }
    } finally { if (mounted.current && revision === request.current) setLoading(false); }
  }, [view]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current += 1; }; }, []);
  useEffect(() => {
    setSnapshot(emptySnapshot());
    setNotice(null);
    void refresh();
  }, [user?.id, user?.updated, refresh]);
  useEffect(() => {
    const refreshQuietly = () => { void refresh(); };
    const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) refreshQuietly(); });
    if (Platform.OS === `web` && typeof window !== `undefined`) {
      const changed = (event: StorageEvent) => { if (!event.key || event.key === SOCIAL_STORAGE_KEY || event.key === `domains-database:accounts:v1`) refreshQuietly(); };
      window.addEventListener(`focus`, refreshQuietly);
      window.addEventListener(`storage`, changed);
      return () => { subscription.remove(); window.removeEventListener(`focus`, refreshQuietly); window.removeEventListener(`storage`, changed); };
    }
    return () => subscription.remove();
  }, [refresh]);
  const mutate = useCallback(async (operation: () => Promise<unknown>, message: string) => {
    const actorId = user?.id ?? null;
    if (!mounted.current || currentUserId.current !== actorId) throw new Error(`Your Account Changed — Try Again`);
    if (!actorId) throw new Error(`Sign In To Use Community`);
    if (mutationBusy.current) throw new Error(`Wait For Your Current Action`);
    mutationBusy.current = true;
    setBusy(true); setError(null); setNotice(null);
    try {
      await operation();
      if (!mounted.current || currentUserId.current !== actorId) return;
      await refresh();
      if (mounted.current && currentUserId.current === actorId) setNotice(message);
    } catch (failure) {
      if (mounted.current && currentUserId.current === actorId) setError(failure instanceof Error ? failure.message : `Community Action Could Not Be Saved`);
      throw failure;
    } finally { mutationBusy.current = false; if (mounted.current) setBusy(false); }
  }, [user?.id, refresh]);
  const value = useMemo(() => ({
    ...snapshot, view, busy, error, notice, loading, refresh, setView,
    clearError: () => setError(null), clearNotice: () => setNotice(null),
    createPost: (input: PostInput) => mutate(() => socialAPI.createPost(input, user?.id ?? null), `Post Published`),
    deletePost: (id: string) => mutate(() => socialAPI.deletePost(id, user?.id ?? null), `Post Deleted`),
    updatePost: (id: string, input: PostInput) => mutate(() => socialAPI.updatePost(id, input, user?.id ?? null), `Post Updated`),
    setFollowing: (id: string, following: boolean) => mutate(() => socialAPI.setFollowing(id, following, user?.id ?? null), following ? `Following Profile` : `Profile Unfollowed`),
  }), [snapshot, view, busy, error, notice, loading, refresh, mutate, user?.id]);
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};
