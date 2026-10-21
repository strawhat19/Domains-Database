import { Link } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { createStyles } from './styles.native';
import { ProfileAvatar } from '../Community/ProfileCard';
import { elementProps } from '../../shared/elementProps';
import { Text, View, Pressable, TextInput } from 'react-native';
import RichTextContent from '../RichTextEditor/RichTextContent';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Send, Trash2, X, LogIn, UserPlus, Settings2, RefreshCw } from 'lucide-react-native';
import { MAX_COMMENT_LENGTH, usePostDiscussion, type PostDiscussionProps } from './usePostDiscussion';

const PostDiscussion = (props: PostDiscussionProps) => {
  const { postId, viewerId, canComment, busy, onLoaded } = props;
  const state = usePostDiscussion(props);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = busy || state.pending;
  useEffect(() => {
    if (state.error) onLoaded?.(null, false);
    else if (!state.loading) onLoaded?.(state.comments.length, state.hasMore);
  }, [state.error, state.loading, state.comments, state.hasMore, onLoaded]);
  return (
    <View {...elementProps(`post-discussion`, postId)} style={styles.root}>
      <View {...elementProps(`post-discussion-heading`, postId)} style={styles.heading}>
        <Text {...elementProps(`post-discussion-title`, postId)} style={styles.title} accessibilityRole={`header`}>
          {`Conversation`}
        </Text>
        <Pressable
          accessibilityRole={`button`}
          disabled={state.loading || disabled}
          accessibilityLabel={`Refresh Comments`}
          onPress={() => { void state.refresh(); }}
          {...elementProps(`post-discussion-refresh`, postId)}
          style={[styles.button, (state.loading || disabled) && styles.disabled]}
        >
          <RefreshCw {...elementProps(`post-discussion-refresh-icon`, postId)} size={12} color={palette.accent} />
          <Text {...elementProps(`post-discussion-refresh-label`, postId)} style={styles.buttonLabel}>
            {state.loading ? `Loading…` : `Refresh`}
          </Text>
        </Pressable>
      </View>
      <Text {...elementProps(`post-discussion-privacy`, postId)} style={styles.caption}>
        {viewerId ? `Showing public comments and your own. Private profiles stay hidden from other readers.` : `Showing comments from public profiles.`}
      </Text>
      {!!state.error && (
        <Text {...elementProps(`post-discussion-error`, postId)} style={styles.error} accessibilityRole={`alert`}>
          {state.error}
        </Text>
      )}
      {!state.loading && !state.error && !state.comments.length && (
        <Text {...elementProps(`post-discussion-empty`, postId)} style={styles.caption}>
          {`No eligible replies are visible yet. Start the conversation with a thoughtful reply.`}
        </Text>
      )}
      <View {...elementProps(`post-discussion-comments`, postId)} style={styles.comments}>
        {state.comments.map(comment => {
          const id = `${postId}-${comment.id}`;
          const confirming = state.deletingId === comment.id;
          return (
            <View key={comment.id} {...elementProps(`post-discussion-comment`, id)} style={styles.comment}>
              <View {...elementProps(`post-discussion-comment-top`, id)} style={styles.top}>
                <ProfileAvatar profile={comment.author} scope={`comment-${id}`} />
                <View {...elementProps(`post-discussion-comment-person`, id)} style={styles.person}>
                  <Link href={{ pathname: `/community`, params: { profile: comment.authorId } }} asChild>
                    <Pressable {...elementProps(`post-discussion-comment-author-link`, id)} accessibilityRole={`link`} accessibilityLabel={`View ${comment.author.name}'s Community Activity`}>
                      <Text {...elementProps(`post-discussion-comment-author`, id)} style={styles.name}>
                        {comment.author.name}
                      </Text>
                    </Pressable>
                  </Link>
                  <Text {...elementProps(`post-discussion-comment-date`, id)} style={styles.date}>
                    {new Date(comment.created).toLocaleDateString(undefined, { month: `short`, day: `numeric`, year: `numeric` })}
                  </Text>
                </View>
              </View>
              <RichTextContent value={comment.body} scope={`comment-${id}`} />
              {comment.authorId === viewerId && (
                <View {...elementProps(`post-discussion-comment-actions`, id)} style={styles.actions}>
                  {confirming && (
                    <Pressable
                      disabled={disabled}
                      style={styles.button}
                      accessibilityRole={`button`}
                      accessibilityLabel={`Cancel Comment Deletion`}
                      onPress={() => state.setDeletingId(null)}
                      {...elementProps(`post-discussion-comment-cancel`, id)}
                    >
                      <X {...elementProps(`post-discussion-comment-cancel-icon`, id)} size={12} color={palette.accent} />
                      <Text {...elementProps(`post-discussion-comment-cancel-label`, id)} style={styles.buttonLabel}>
                        {`Cancel`}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    disabled={disabled}
                    accessibilityRole={`button`}
                    onPress={() => { void state.deleteComment(comment.id); }}
                    {...elementProps(`post-discussion-comment-delete`, id)}
                    style={[styles.button, disabled && styles.disabled]}
                    accessibilityLabel={confirming ? `Confirm Delete Comment` : `Delete Your Comment`}
                  >
                    <Trash2 {...elementProps(`post-discussion-comment-delete-icon`, id)} size={12} color={palette.danger} />
                    <Text {...elementProps(`post-discussion-comment-delete-label`, id)} style={[styles.buttonLabel, styles.deleteLabel]}>
                      {confirming ? `Confirm delete` : `Delete`}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>
      {!state.loading && state.comments.length > 0 && (
        <Text {...elementProps(`post-discussion-coverage`, postId)} style={styles.caption}>
          {`${state.comments.length} eligible comment(s) loaded${state.hasMore ? ` · More eligible replies may exist beyond this bounded preview` : ``}`}
        </Text>
      )}
      {!viewerId ? (
        <View {...elementProps(`post-discussion-auth`, postId)} style={styles.auth}>
          <Link href={{ pathname: `/signin`, params: { returnTo: `/community` } }} asChild>
            <Pressable {...elementProps(`post-discussion-signin`, postId)} style={styles.button} accessibilityRole={`link`} accessibilityLabel={`Sign In To Comment`}>
              <LogIn {...elementProps(`post-discussion-signin-icon`, postId)} size={13} color={palette.accent} />
              <Text {...elementProps(`post-discussion-signin-label`, postId)} style={styles.buttonLabel}>
                {`Sign in to reply`}
              </Text>
            </Pressable>
          </Link>
          <Link href={{ pathname: `/signup`, params: { returnTo: `/community` } }} asChild>
            <Pressable {...elementProps(`post-discussion-signup`, postId)} style={styles.button} accessibilityRole={`link`} accessibilityLabel={`Sign Up To Comment`}>
              <UserPlus {...elementProps(`post-discussion-signup-icon`, postId)} size={13} color={palette.accent} />
              <Text {...elementProps(`post-discussion-signup-label`, postId)} style={styles.buttonLabel}>
                {`Create account`}
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : !canComment ? (
        <View {...elementProps(`post-discussion-private-notice`, postId)} style={styles.composer}>
          <Text {...elementProps(`post-discussion-private-label`, postId)} style={styles.caption}>
            {`Make your profile public to join the conversation. Replies use your public name and avatar.`}
          </Text>
          <Link href={`/profile`} asChild>
            <Pressable {...elementProps(`post-discussion-settings`, postId)} style={styles.button} accessibilityRole={`link`} accessibilityLabel={`Edit Profile Privacy`}>
              <Settings2 {...elementProps(`post-discussion-settings-icon`, postId)} size={13} color={palette.accent} />
              <Text {...elementProps(`post-discussion-settings-label`, postId)} style={styles.buttonLabel}>
                {`Profile privacy`}
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View {...elementProps(`post-discussion-composer`, postId)} style={styles.composer}>
          <TextInput
            multiline
            value={state.body}
            editable={!disabled}
            style={styles.input}
            maxLength={MAX_COMMENT_LENGTH}
            onChangeText={state.setBody}
            placeholder={`Add a thoughtful reply…`}
            placeholderTextColor={palette.placeholder}
            {...elementProps(`post-discussion-input`, postId)}
            accessibilityLabel={`Comment Content · Markdown Supported`}
          />
          <View {...elementProps(`post-discussion-footer`, postId)} style={styles.footer}>
            <Text {...elementProps(`post-discussion-counter`, postId)} style={styles.caption}>
              {`${state.body.length}/${MAX_COMMENT_LENGTH} · Markdown supported`}
            </Text>
            <Pressable
              accessibilityRole={`button`}
              accessibilityLabel={`Publish Comment`}
              disabled={disabled || !state.body.trim()}
              onPress={() => { void state.publish(); }}
              {...elementProps(`post-discussion-publish`, postId)}
              style={[styles.button, styles.primary, (disabled || !state.body.trim()) && styles.disabled]}
            >
              <Send {...elementProps(`post-discussion-publish-icon`, postId)} size={13} color={palette.contrast} />
              <Text {...elementProps(`post-discussion-publish-label`, postId)} style={[styles.buttonLabel, styles.primaryLabel]}>
                {state.pending ? `Saving…` : `Reply`}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default PostDiscussion;
