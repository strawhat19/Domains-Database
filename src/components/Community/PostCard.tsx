import { Link } from 'expo-router';
import { ProfileAvatar } from './ProfileCard';
import PostDiscussion from '../PostDiscussion';
import RichTextEditor from '../RichTextEditor';
import { createStyles } from './styles.native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { createEngagementStyles } from './PostCard.styles';
import { useTheme } from '../../shared/themeContext/useTheme';
import RichTextContent from '../RichTextEditor/RichTextContent';
import type { FeedPost, PostInput } from '../../shared/social/types';
import type { PublicProfile } from '../../shared/models/users/User';
import { commentProfileScope } from '../PostDiscussion/usePostDiscussion';
import { Globe2, UsersRound, LockKeyhole, Trash2, X, PenLine, Check, Heart, MessageCircle, LogIn } from 'lucide-react-native';

export const PostCardSkeleton = ({ scope }: { scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`community-post-skeleton`, scope)} style={styles.card} accessibilityLabel={`Loading Post`}>
      <View {...elementProps(`community-post-skeleton-top`, scope)} style={styles.cardTop}>
        <View {...elementProps(`community-post-skeleton-avatar`, scope)} style={styles.skeletonAvatar} />
        <View {...elementProps(`community-post-skeleton-name`, scope)} style={[styles.skeleton, styles.skeletonName]} />
      </View>
      <View {...elementProps(`community-post-skeleton-body`, scope)} style={styles.skeletonBody}>
        {[0, 1, 2].map(index => (
          <View
            key={index}
            {...elementProps(`community-post-skeleton-line`, `${scope}-${index}`)}
            style={[styles.skeleton, index === 2 ? styles.skeletonShort : styles.skeletonWide]}
          />
        ))}
      </View>
    </View>
  );
};

interface PostCardProps {
  busy: boolean;
  post: FeedPost;
  canComment: boolean;
  confirming: boolean;
  onCancel: () => void;
  viewerId: string | null;
  publicProfiles: PublicProfile[];
  onDelete: (id: string) => void;
  onLike: (id: string, liked: boolean) => Promise<void>;
  onComment: (id: string, body: string) => Promise<void>;
  onUpdate: (id: string, input: PostInput) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => Promise<void>;
}
const audienceIcons = { public: Globe2, followers: UsersRound, private: LockKeyhole };

const PostCard = ({ post, viewerId, busy, canComment, confirming, publicProfiles, onLike, onDelete, onCancel, onUpdate, onComment, onDeleteComment }: PostCardProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const engagementStyles = useMemo(() => createEngagementStyles(palette), [palette]);
  const own = post.authorId === viewerId;
  const selfLikeDisabled = own && !post.liked;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body);
  const [audience, setAudience] = useState(post.audience);
  const [liking, setLiking] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionVisited, setDiscussionVisited] = useState(false);
  const profileScope = `${viewerId ?? `visitor`}:${commentProfileScope(publicProfiles)}`;
  const [loadedReplies, setLoadedReplies] = useState<{ count: number; hasMore: boolean; scope: string } | null>(null);
  const visibleReplies = loadedReplies?.scope === profileScope ? loadedReplies : null;
  const [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => { setEditing(false); setLiking(false); setDiscussionOpen(false); setDiscussionVisited(false); setLoadedReplies(null); setActionError(null); }, [viewerId]);
  const commentsLoaded = useCallback((count: number | null, hasMore: boolean) => {
    setLoadedReplies(count === null ? null : { count, hasMore, scope: profileScope });
  }, [profileScope]);
  const authorOnly = post.author.profilePrivacy === `private` || post.audience === `private`;
  const AudienceIcon = authorOnly ? LockKeyhole : post.audience === `followers` ? UsersRound : Globe2;
  const audienceLabel = authorOnly ? `Only you` : post.audience === `followers` ? `Followers` : `Public`;
  const timestamp = new Date(post.created).toLocaleDateString(undefined, { month: `short`, day: `numeric`, year: `numeric` });
  const beginEdit = () => { setBody(post.body); setAudience(post.audience); setEditing(true); onCancel(); };
  const saveEdit = async () => { try { await onUpdate(post.id, { body, audience }); setEditing(false); } catch {} };
  const toggleLike = async () => {
    if (busy || liking || selfLikeDisabled) return;
    setLiking(true); setActionError(null);
    try { await onLike(post.id, !post.liked); }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : `Like Could Not Be Saved`); }
    finally { setLiking(false); }
  };
  return (
    <View {...elementProps(`community-post-card`, post.id)} style={styles.card}>
      <View {...elementProps(`community-post-top`, post.id)} style={styles.cardTop}>
        <ProfileAvatar profile={post.author} scope={`post-${post.id}`} />
        <View {...elementProps(`community-post-person`, post.id)} style={styles.person}>
          <Link href={{ pathname: `/community`, params: { profile: post.authorId } }} asChild>
            <Pressable {...elementProps(`community-post-author-link`, post.id)} accessibilityRole={`link`} accessibilityLabel={`View ${post.author.name}'s Community Activity`}>
              <Text {...elementProps(`community-post-author`, post.id)} style={styles.name}>
                {post.author.name}
              </Text>
            </Pressable>
          </Link>
          <View {...elementProps(`community-post-metadata`, post.id)} style={styles.metadata}>
            <Text {...elementProps(`community-post-date`, post.id)} style={styles.metaLabel}>
              {timestamp}
            </Text>
            <AudienceIcon {...elementProps(`community-post-audience-icon`, post.id)} size={11} color={palette.muted} />
            <Text {...elementProps(`community-post-audience`, post.id)} style={styles.metaLabel}>
              {audienceLabel}
            </Text>
          </View>
        </View>
      </View>
      {own && editing ? (
        <View {...elementProps(`community-post-editor`, post.id)} style={styles.skeletonBody}>
          <RichTextEditor value={body} onChange={setBody} disabled={busy} scope={`edit-${post.id}`} />
          <View {...elementProps(`community-post-edit-audiences`, post.id)} style={styles.audiences} accessibilityLabel={`Edited Post Audience`}>
            {([`public`, `followers`, `private`] as const).map(value => {
              const Icon = audienceIcons[value];
              return (
                <Pressable
                  key={value}
                  disabled={busy}
                  accessibilityRole={`radio`}
                  onPress={() => setAudience(value)}
                  accessibilityState={{ checked: audience === value }}
                  accessibilityLabel={value === `private` ? `Only Me` : value}
                  {...elementProps(`community-post-edit-audience`, `${post.id}-${value}`)}
                  style={[styles.audience, audience === value && styles.audienceActive]}
                >
                  <Icon
                    size={12}
                    color={palette.accent}
                    {...elementProps(`community-post-edit-audience-icon`, `${post.id}-${value}`)}
                  />
                  <Text
                    style={styles.audienceLabel}
                    {...elementProps(`community-post-edit-audience-label`, `${post.id}-${value}`)}
                  >
                    {value === `private` ? `Only me` : value === `followers` ? `Followers` : `Public`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View {...elementProps(`community-post-edit-actions`, post.id)} style={styles.deletionRow}>
            <Pressable
              disabled={busy}
              style={styles.secondaryAction}
              accessibilityRole={`button`}
              onPress={() => setEditing(false)}
              accessibilityLabel={`Cancel Post Edit`}
              {...elementProps(`community-post-edit-cancel`, post.id)}
            >
              <X {...elementProps(`community-post-edit-cancel-icon`, post.id)} size={12} color={palette.accent} />
              <Text {...elementProps(`community-post-edit-cancel-label`, post.id)} style={styles.secondaryLabel}>
                {`Cancel`}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole={`button`}
              disabled={busy || !body.trim()}
              onPress={() => { void saveEdit(); }}
              accessibilityLabel={`Save Post Changes`}
              {...elementProps(`community-post-edit-save`, post.id)}
              style={[styles.action, (busy || !body.trim()) && styles.disabled]}
            >
              <Check {...elementProps(`community-post-edit-save-icon`, post.id)} size={12} color={palette.contrast} />
              <Text {...elementProps(`community-post-edit-save-label`, post.id)} style={styles.actionLabel}>
                {`Save changes`}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : <RichTextContent value={post.body} scope={`post-${post.id}`} />}
      {own && !editing && (
        <View {...elementProps(`community-post-delete-row`, post.id)} style={styles.deletionRow}>
          <Pressable
            disabled={busy}
            onPress={beginEdit}
            accessibilityRole={`button`}
            accessibilityLabel={`Edit Your Post`}
            {...elementProps(`community-post-edit`, post.id)}
            style={[styles.deletion, busy && styles.disabled]}
          >
            <PenLine {...elementProps(`community-post-edit-icon`, post.id)} size={12} color={palette.muted} />
            <Text {...elementProps(`community-post-edit-label`, post.id)} style={styles.metaLabel}>
              {`Edit`}
            </Text>
          </Pressable>
          {confirming && (
            <Pressable
              disabled={busy}
              onPress={onCancel}
              style={styles.deletion}
              accessibilityRole={`button`}
              accessibilityLabel={`Cancel Post Deletion`}
              {...elementProps(`community-post-delete-cancel`, post.id)}
            >
              <X {...elementProps(`community-post-delete-cancel-icon`, post.id)} size={12} color={palette.muted} />
              <Text {...elementProps(`community-post-delete-cancel-label`, post.id)} style={styles.metaLabel}>
                {`Cancel`}
              </Text>
            </Pressable>
          )}
          <Pressable
            disabled={busy}
            accessibilityRole={`button`}
            onPress={() => onDelete(post.id)}
            {...elementProps(`community-post-delete`, post.id)}
            style={[styles.deletion, busy && styles.disabled]}
            accessibilityLabel={confirming ? `Confirm Delete Post` : `Delete Your Post`}
          >
            <Trash2 {...elementProps(`community-post-delete-icon`, post.id)} size={12} color={palette.danger} />
            <Text {...elementProps(`community-post-delete-label`, post.id)} style={styles.deleteLabel}>
              {confirming ? `Confirm delete` : `Delete`}
            </Text>
          </Pressable>
        </View>
      )}
      {!editing && (
        <View {...elementProps(`community-post-engagement`, post.id)} style={engagementStyles.root}>
          {viewerId ? (
            <Pressable
              disabled={busy || liking || selfLikeDisabled}
              accessibilityRole={`button`}
              onPress={() => { void toggleLike(); }}
              {...elementProps(`community-post-like`, post.id)}
              accessibilityState={{ selected: post.liked, disabled: busy || liking || selfLikeDisabled }}
              accessibilityLabel={selfLikeDisabled ? `${post.likeCount} Like(s) Received · Your Post` : `${post.liked ? `Unlike` : `Like`} Post · ${post.likeCount} Like(s)`}
              style={[engagementStyles.action, post.liked && engagementStyles.selected, (busy || liking || selfLikeDisabled) && engagementStyles.disabled]}
            >
              <Heart {...elementProps(`community-post-like-icon`, post.id)} size={14} color={post.liked ? palette.accent : palette.muted} fill={post.liked ? palette.accent : `none`} />
              <Text {...elementProps(`community-post-like-label`, post.id)} style={[engagementStyles.label, post.liked && engagementStyles.selectedLabel]}>
                {`${liking ? `Saving…` : post.liked ? `Liked` : selfLikeDisabled ? `Likes received` : `Like`} · ${post.likeCount}`}
              </Text>
            </Pressable>
          ) : (
            <Link href={{ pathname: `/signin`, params: { returnTo: `/community` } }} asChild>
              <Pressable {...elementProps(`community-post-like-signin`, post.id)} style={engagementStyles.action} accessibilityRole={`link`} accessibilityLabel={`Sign In To Like Post · ${post.likeCount} Like(s)`}>
                <LogIn {...elementProps(`community-post-like-signin-icon`, post.id)} size={14} color={palette.muted} />
                <Text {...elementProps(`community-post-like-signin-label`, post.id)} style={engagementStyles.label}>
                  {`Sign in to like · ${post.likeCount}`}
                </Text>
              </Pressable>
            </Link>
          )}
          <Pressable
            accessibilityRole={`button`}
            accessibilityState={{ expanded: discussionOpen }}
            onPress={() => { setDiscussionVisited(true); setDiscussionOpen(!discussionOpen); }}
            {...elementProps(`community-post-discussion-toggle`, post.id)}
            accessibilityLabel={`${discussionOpen ? `Hide` : `Show`} Comments${visibleReplies ? ` · ${visibleReplies.count} Eligible Comment(s) Loaded${visibleReplies.hasMore ? ` · Bounded Preview` : ``}` : ``}`}
            style={[engagementStyles.action, discussionOpen && engagementStyles.selected]}
          >
            <MessageCircle {...elementProps(`community-post-discussion-toggle-icon`, post.id)} size={14} color={discussionOpen ? palette.accent : palette.muted} />
            <Text {...elementProps(`community-post-discussion-toggle-label`, post.id)} style={[engagementStyles.label, discussionOpen && engagementStyles.selectedLabel]}>
              {`${discussionOpen ? `Hide replies` : `Replies`}${visibleReplies ? ` · ${visibleReplies.count}${visibleReplies.hasMore ? `+` : ``}` : ``}`}
            </Text>
          </Pressable>
        </View>
      )}
      {!!actionError && (
        <Text {...elementProps(`community-post-action-error`, post.id)} style={engagementStyles.error} accessibilityRole={`alert`}>
          {actionError}
        </Text>
      )}
      {discussionVisited && (
        <View {...elementProps(`community-post-discussion`, post.id)} style={(editing || !discussionOpen) && engagementStyles.hidden}>
          <PostDiscussion
            busy={busy}
            postId={post.id}
            viewerId={viewerId}
            onComment={onComment}
            canComment={canComment}
            onLoaded={commentsLoaded}
            commentCount={post.commentCount}
            publicProfiles={publicProfiles}
            onDeleteComment={onDeleteComment}
          />
        </View>
      )}
    </View>
  );
};

export default PostCard;
