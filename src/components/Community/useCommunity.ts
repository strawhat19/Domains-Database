import { useMemo, useRef, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useSocial } from '../../shared/social/useSocial';
import { Types } from '../../types/types';
import { isAppCollectionID } from '../../shared/common/ids';
import type { PostAudience } from '../../shared/social/types';

export const useCommunity = () => {
  const state = useSocial();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ profile?: string | string[] }>();
  const candidate = Array.isArray(params.profile) ? params.profile[0] : params.profile;
  const profileId = isAppCollectionID(candidate, Types.User) ? candidate : undefined;
  const [body, setBody] = useState(``);
  const [search, setSearch] = useState(``);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sort, setSort] = useState<`newest` | `popular`>(`newest`);
  const [audience, setAudience] = useState<PostAudience>(`public`);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const actor = useRef(user?.id);
  actor.current = user?.id;
  useEffect(() => { setBody(``); setAudience(`public`); setDeletingId(null); }, [user?.id]);
  useEffect(() => { setSearch(``); }, [profileId]);
  useEffect(() => { if (profileId) state.setView(`public`); }, [profileId, state.setView]);
  useEffect(() => { setVisibleCount(12); }, [profileId, search, sort, state.view]);
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.posts.filter(post => (!profileId || post.authorId === profileId)
      && (!query || `${post.body} ${post.author.name}`.toLowerCase().includes(query)))
      .sort((first, second) => (sort === `popular` ? second.likeCount - first.likeCount : 0)
        || Date.parse(second.created) - Date.parse(first.created) || second.number - first.number);
  }, [state.posts, profileId, search, sort]);
  const selectedProfile = state.profiles.find(profile => profile.id === profileId);
  const ownProfile = state.profiles.find(profile => profile.id === user?.id);
  const publish = async () => {
    if (state.busy || !body.trim()) return;
    const authorId = actor.current;
    try {
      await state.createPost({ body, audience });
      if (actor.current === authorId) setBody(``);
    } catch {}
  };
  const toggleFollow = (id: string, following: boolean) => {
    if (!state.busy) void state.setFollowing(id, following).catch(() => undefined);
  };
  const deletePost = async (id: string) => {
    if (state.busy) return;
    if (deletingId !== id) { setDeletingId(id); return; }
    const authorId = actor.current;
    try { await state.deletePost(id); if (actor.current === authorId) setDeletingId(null); } catch {}
  };
  return {
    ...state, user, body, sort, search, audience, profileId, ownProfile, deletingId, selectedProfile,
    setBody, setSort, setSearch, setAudience, setDeletingId, publish, toggleFollow, deletePost,
    postCount: filteredPosts.length,
    visiblePosts: filteredPosts.slice(0, visibleCount),
    hasMorePosts: filteredPosts.length > visibleCount,
    showMorePosts: () => setVisibleCount(current => current + 12),
    clearProfile: () => router.replace(`/community`),
  };
};
