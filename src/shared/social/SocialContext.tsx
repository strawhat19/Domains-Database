import { Platform, AppState } from 'react-native';
import { socialAPI } from '../../api/social';
import { useLocalStorage } from '../config';
import type { PropsWithChildren } from 'react';
import { SOCIAL_STORAGE_KEY } from './service';
import { useAuth } from '../authContext/useAuth';
import type { FeedView, PostInput, CommunitySnapshot } from './types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const emptySnapshot = (): CommunitySnapshot => ({
  posts: [],
  profiles: [],
  hasMore: false,
  coverage: ``,
  viewerId: null,
  progressPosts: [],
  followingIds: [],
  storageEnabled: true,
  source: useLocalStorage ? `local` : `firebase`,
});
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
  addComment: (postId: string, body: string) => Promise<void>;
  setLiked: (postId: string, liked: boolean) => Promise<void>;
  updatePost: (id: string, input: PostInput) => Promise<void>;
  setFollowing: (id: string, following: boolean) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
}
export const SocialContext = createContext<SocialContextValue | undefined>(undefined);

export const CommunityProvider = ({ children, profileId }: PropsWithChildren<{ profileId?: string }>) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<FeedView>(`public`);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [subscriptionRevision, setSubscriptionRevision] = useState(0);
  const request = useRef(0);
  const mounted = useRef(true);
  const mutationBusy = useRef(false);
  const listenerFailed = useRef(false);
  const subscribedScope = useRef(``);
  const currentUserId = useRef(user?.id ?? null);
  const currentScope = useRef(``);
  currentScope.current = `${user?.id ?? `guest`}:${view}:${profileId ?? ``}`;
  currentUserId.current = user?.id ?? null;
  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    const scope = `${currentUserId.current ?? `guest`}:${view}:${profileId ?? ``}`;
    const revision = ++request.current;
    setLoading(true);
    try {
      const result = await socialAPI.getCommunity(view, profileId);
      if (mounted.current && revision === request.current && currentScope.current === scope) {
        if (result.viewerId !== currentUserId.current) throw new Error(`Your Account Changed — Refresh To Continue`);
        setSnapshot(result); setError(null);
        if (listenerFailed.current) setSubscriptionRevision(current => current + 1);
      }
    } catch (failure) {
      if (mounted.current && revision === request.current && currentScope.current === scope) {
        setSnapshot(emptySnapshot());
        setError(failure instanceof Error ? failure.message : `Community Could Not Be Loaded`);
      }
    } finally { if (mounted.current && revision === request.current) setLoading(false); }
  }, [view, profileId]);
  const latestRefresh = useRef(refresh);
  latestRefresh.current = refresh;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current++; }; }, []);
  useEffect(() => {
    const revision = ++request.current;
    let active = true;
    const scope = `${user?.id ?? `guest`}:${view}:${profileId ?? ``}:${user?.updated ?? ``}`;
    if (subscribedScope.current !== scope) {
      setLoading(true); setError(null); setNotice(null); setSnapshot(emptySnapshot());
      subscribedScope.current = scope;
    }
    listenerFailed.current = false;
    const stop = socialAPI.subscribeCommunity(result => {
      if (!active || !mounted.current || result.viewerId !== currentUserId.current) return;
      request.current++;
      listenerFailed.current = false;
      setSnapshot(result); setError(null); setLoading(false);
    }, failure => {
      if (!active || !mounted.current) return;
      request.current++;
      listenerFailed.current = true;
      setSnapshot(emptySnapshot()); setError(failure.message); setLoading(false);
    }, view, profileId);
    return () => { active = false; stop(); if (request.current === revision) request.current++; };
  }, [view, profileId, user?.id, user?.updated, subscriptionRevision]);
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
      if (!mounted.current || currentUserId.current !== actorId) throw new Error(`Your Account Changed — Refresh To Continue`);
      await latestRefresh.current();
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
    setLiked: (postId: string, liked: boolean) => mutate(() => socialAPI.setLiked(postId, liked, user?.id ?? null), liked ? `Post Liked` : `Like Removed`),
    addComment: (postId: string, body: string) => mutate(() => socialAPI.addComment(postId, body, user?.id ?? null), `Comment Published`),
    deleteComment: (postId: string, commentId: string) => mutate(() => socialAPI.deleteComment(postId, commentId, user?.id ?? null), `Comment Deleted`),
    setFollowing: (id: string, following: boolean) => mutate(() => socialAPI.setFollowing(id, following, user?.id ?? null), following ? `Following Profile` : `Profile Unfollowed`),
  }), [snapshot, view, busy, error, notice, loading, refresh, mutate, user?.id]);
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};
