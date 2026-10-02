import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useSocial } from '../../shared/social/useSocial';
import type { PostAudience } from '../../shared/social/types';

export const useCommunity = () => {
  const state = useSocial();
  const { user } = useAuth();
  const [body, setBody] = useState(``);
  const [audience, setAudience] = useState<PostAudience>(`public`);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => { setBody(``); setAudience(`public`); setDeletingId(null); }, [user?.id]);
  const publish = async () => {
    if (state.busy || !body.trim()) return;
    try { await state.createPost({ body, audience }); setBody(``); } catch {}
  };
  const toggleFollow = (id: string, following: boolean) => {
    if (!state.busy) void state.setFollowing(id, following).catch(() => undefined);
  };
  const deletePost = async (id: string) => {
    if (state.busy) return;
    if (deletingId !== id) { setDeletingId(id); return; }
    try { await state.deletePost(id); setDeletingId(null); } catch {}
  };
  return { ...state, user, body, audience, deletingId, setBody, setAudience, setDeletingId, publish, toggleFollow, deletePost };
};
