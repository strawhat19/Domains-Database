import { socialAPI } from '../../api/social';
import type { FeedComment } from '../../shared/social/types';
import type { PublicProfile } from '../../shared/models/users/User';
import { MAX_COMMENT_LENGTH } from '../../shared/social/records';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export { MAX_COMMENT_LENGTH };

export interface PostDiscussionProps {
  busy: boolean;
  postId: string;
  canComment: boolean;
  commentCount: number;
  viewerId: string | null;
  publicProfiles: PublicProfile[];
  onLoaded?: (count: number | null, hasMore: boolean) => void;
  onComment: (postId: string, body: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => Promise<void>;
}

export const commentProfileScope = (profiles: PublicProfile[]) => [...new Set(profiles.filter(profile => profile.profilePrivacy === `public`).map(profile => profile.id))].sort().join(`|`);

export const usePostDiscussion = ({ postId, viewerId, busy, commentCount, publicProfiles, onComment, onDeleteComment }: PostDiscussionProps) => {
  const [body, setBody] = useState(``);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const revision = useRef(0);
  const publicProfileKey = commentProfileScope(publicProfiles);
  const profileMap = useMemo(() => new Map(publicProfiles.map(profile => [profile.id, profile])), [publicProfiles]);
  const currentScope = `${postId}:${viewerId ?? `visitor`}`;
  const scope = useRef(currentScope);
  scope.current = currentScope;
  const currentRequestScope = `${currentScope}:${publicProfileKey}`;
  const requestScope = useRef(currentRequestScope);
  requestScope.current = currentRequestScope;
  const visibleComments = useMemo(() => comments.flatMap(comment => {
    const author = profileMap.get(comment.authorId);
    if (comment.authorId !== viewerId && author?.profilePrivacy !== `public`) return [];
    return [{ ...comment, author: author ?? comment.author }];
  }), [comments, profileMap, viewerId]);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    const startedScope = requestScope.current;
    const isCurrent = () => request === revision.current && requestScope.current === startedScope;
    setLoading(true);
    setError(null);
    try {
      const result = await socialAPI.getPostComments(postId);
      if (!isCurrent()) return;
      setComments(result.comments);
      setHasMore(result.hasMore);
    } catch (failure) {
      if (isCurrent()) {
        setComments([]); setHasMore(false);
        setError(failure instanceof Error ? failure.message : `Comments Could Not Be Loaded`);
      }
    } finally { if (isCurrent()) setLoading(false); }
  }, [postId, viewerId, publicProfileKey]);
  useEffect(() => {
    setBody(``); setComments([]); setHasMore(false); setPending(false); setDeletingId(null);
    return () => { revision.current += 1; };
  }, [postId, viewerId]);
  useEffect(() => {
    void refresh();
    return () => { revision.current += 1; };
  }, [commentCount, refresh]);
  const publish = async () => {
    if (busy || pending || !body.trim()) return;
    const authorScope = scope.current;
    setPending(true); setError(null);
    try {
      await onComment(postId, body);
      if (scope.current !== authorScope) return;
      setBody(``);
      await refresh();
    } catch (failure) {
      if (scope.current === authorScope) setError(failure instanceof Error ? failure.message : `Comment Could Not Be Saved`);
    } finally { if (scope.current === authorScope) setPending(false); }
  };
  const deleteComment = async (commentId: string) => {
    if (busy || pending) return;
    if (deletingId !== commentId) { setDeletingId(commentId); return; }
    const authorScope = scope.current;
    setPending(true); setError(null);
    try {
      await onDeleteComment(postId, commentId);
      if (scope.current !== authorScope) return;
      setDeletingId(null);
      await refresh();
    } catch (failure) {
      if (scope.current === authorScope) setError(failure instanceof Error ? failure.message : `Comment Could Not Be Deleted`);
    } finally { if (scope.current === authorScope) setPending(false); }
  };
  return { body, error, pending, loading, hasMore, deletingId, refresh, publish, setBody, deleteComment, setDeletingId, comments: visibleComments };
};
