import { AppState } from 'react-native';
import { useRef, useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { marketplaceAPI } from '../../api/marketplace';
import { useAuth } from '../../shared/authContext/useAuth';
import { normalizeSellerUsername, sellerProfilePath, sellerUsernamePattern } from '../../shared/marketplace/paths';

type SellerPage = Awaited<ReturnType<typeof marketplaceAPI.getSellerProfile>>;
type PageState = { key: string; result: SellerPage | null; loading: boolean; error: string };
type EditState = { key: string; draft: string; busy: boolean; error: string };

const initialPage = (key: string): PageState => ({ key, result: null, loading: true, error: `` });
const notFound: SellerPage = { state: `not-found`, canEdit: false, listings: [], nextCursor: null };
const loadError = (failure: unknown) => failure instanceof Error ? failure.message : `Seller Profile Could Not Be Loaded`;

export const useSellerProfile = (value: string) => {
  const router = useRouter();
  const { user, loading: authLoading, loginRevision } = useAuth();
  const username = normalizeSellerUsername(value);
  const key = `${username}:${loginRevision}:${user?.id ?? `guest`}:${user?.updated ?? ``}:${authLoading}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const request = useRef<AbortController | null>(null);
  const focused = useRef(false);
  const saveRequest = useRef<symbol | null>(null);
  const [page, setPage] = useState<PageState>(() => initialPage(key));
  const [edit, setEdit] = useState<EditState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const active = page.key === key ? page : initialPage(key);
  const privatePage = active.result?.state === `private`;
  const profile = active.result?.profile;
  const isOwnProfile = privatePage ? Boolean(profile) : active.result?.canEdit === true;
  const canEdit = Boolean(isOwnProfile && profile && !privatePage && user?.profilePrivacy === `public`);
  const editor = canEdit && edit?.key === key ? edit : null;

  const load = useCallback(async (previous?: SellerPage) => {
    if (!focused.current || currentKey.current !== key || authLoading) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoadingMore(Boolean(previous));
    if (!previous) setPage(initialPage(key));
    const isCurrent = () => focused.current && !controller.signal.aborted && currentKey.current === key;
    try {
      const next = sellerUsernamePattern.test(username)
        ? await marketplaceAPI.getSellerProfile(username, previous?.nextCursor ?? undefined, controller.signal)
        : notFound;
      if (!isCurrent()) return;
      if (next.canonicalUsername && next.canonicalUsername !== value) {
        setPage(initialPage(key));
        router.replace(sellerProfilePath(next.canonicalUsername));
        return;
      }
      const listings = previous && next.profile && previous.state === next.state && previous.profile?.username === next.profile.username
        ? [...new Map([...previous.listings, ...next.listings].map(listing => [listing.id, listing])).values()]
        : next.listings;
      setPage({ key, loading: false, error: ``, result: { ...next, listings } });
      if (!next.canEdit) setEdit(null);
    } catch (failure) {
      if (isCurrent()) setPage({ key, result: null, loading: false, error: loadError(failure) });
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (isCurrent()) setLoadingMore(false);
      }
    }
  }, [authLoading, key, router, username, value]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    setEdit(null);
    void load();
    const foreground = AppState.addEventListener(`change`, (state) => {
      if (state === `active` && !saveRequest.current) void load();
    });
    return () => {
      focused.current = false;
      request.current?.abort();
      request.current = null;
      saveRequest.current = null;
      foreground.remove();
    };
  }, [load]));

  const refresh = () => { if (!saveRequest.current) void load(); };
  const loadMore = () => {
    if (!request.current && active.result?.nextCursor) void load(active.result);
  };
  const startEdit = () => {
    if (canEdit && profile) setEdit({ key, draft: profile.username, busy: false, error: `` });
  };
  const cancelEdit = () => { if (!saveRequest.current) setEdit(null); };
  const changeDraft = (draft: string) => {
    setEdit(current => current?.key === key && !current.busy ? { ...current, draft, error: `` } : current);
  };
  const saveUsername = async () => {
    if (!canEdit || !profile || !editor || saveRequest.current) return;
    const nextUsername = normalizeSellerUsername(editor.draft);
    if (!sellerUsernamePattern.test(nextUsername)) {
      setEdit({ ...editor, error: `Use 3 To 30 Lowercase Letters Or Numbers` });
      return;
    }
    if (nextUsername === profile.username) { cancelEdit(); return; }
    const mutation = Symbol();
    saveRequest.current = mutation;
    setEdit({ ...editor, busy: true, error: `` });
    const isCurrent = () => saveRequest.current === mutation && focused.current && currentKey.current === key;
    try {
      const saved = await marketplaceAPI.updateSellerUsername(profile.username, nextUsername);
      if (!isCurrent()) return;
      setEdit(null);
      setPage(initialPage(key));
      router.replace(sellerProfilePath(saved.username));
    } catch (failure) {
      if (isCurrent()) setEdit({ ...editor, error: failure instanceof Error ? failure.message : `Profile URL Could Not Be Saved` });
    } finally {
      if (saveRequest.current === mutation) saveRequest.current = null;
    }
  };

  return {
    active, editor, profile, canEdit, username, privatePage, isOwnProfile, loadingMore,
    refresh, loadMore, startEdit, cancelEdit, changeDraft, saveUsername,
    listings: profile ? active.result?.listings ?? [] : [],
    hasMore: Boolean(profile && active.result?.nextCursor),
  };
};
