import Toast from '../Toast';
import { useMemo } from 'react';
import { Link } from 'expo-router';
import { useCommunity } from './useCommunity';
import RichTextEditor from '../RichTextEditor';
import { createStyles } from './styles.native';
import PostCard, { PostCardSkeleton } from './PostCard';
import { elementProps } from '../../shared/elementProps';
import ProfileCard, { ProfileCardSkeleton } from './ProfileCard';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Globe2, UsersRound, PenLine, LockKeyhole, Send, ShieldCheck, LogIn, Settings2, RefreshCw, MessageSquare } from 'lucide-react-native';

const Community = () => {
  const state = useCommunity();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 1000;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const tabs = [
    { id: `public` as const, label: `Discover`, Icon: Globe2 },
    { id: `following` as const, label: `Following`, Icon: UsersRound },
    { id: `mine` as const, label: `Your posts`, Icon: PenLine },
  ];
  const audiences = [
    { id: `public` as const, label: `Public`, Icon: Globe2 },
    { id: `followers` as const, label: `Followers`, Icon: UsersRound },
    { id: `private` as const, label: `Only me`, Icon: LockKeyhole },
  ];
  const emptyCopy = {
    mine: { title: `A space for your first update.`, text: `Share a domain discovery, a project, or a small piece of what you are building.` },
    following: { title: `Your circle starts here.`, text: `Follow a public profile to see their public and followers-only updates here.` },
    public: { title: `A quiet corner, for now.`, text: `Public posts from accounts on this device will appear here. Make your profile public when you are ready to join in.` },
  }[state.view];
  return (
    <View {...elementProps(`community-page`)} style={styles.root}>
      <View {...elementProps(`community-header`)} style={styles.header}>
        <Text {...elementProps(`community-eyebrow`)} style={styles.eyebrow}>
          {`GOOD NAMES. INTERESTING PEOPLE.`}
        </Text>
        <Text {...elementProps(`community-title`)} style={styles.title} accessibilityRole={`header`}>
          {`A little community.`}
        </Text>
        <Text {...elementProps(`community-description`)} style={styles.description}>
          {`Discover the people behind the domains. Share what you are building, follow a familiar name, and keep the conversation simple.`}
        </Text>
        <View {...elementProps(`community-local-note`)} style={styles.localNote}>
          <ShieldCheck {...elementProps(`community-local-note-icon`)} size={15} color={palette.accent} />
          <Text {...elementProps(`community-local-note-text`)} style={styles.noteText}>
            {state.storageEnabled
              ? `Local preview · Profiles and posts come from accounts on this device. They do not sync online. Profiles start private, and domain sharing is opt-in.`
              : `Connect a backend to enable the community. Public profiles and posts will appear here when connected.`}
          </Text>
        </View>
      </View>
      {!!state.error && (
        <Toast id={`community-error`} message={state.error} kind={`error`} onDismiss={state.clearError} />
      )}
      {!!state.notice && (
        <Toast id={`community-notice`} message={state.notice} kind={`success`} onDismiss={state.clearNotice} />
      )}
      <View {...elementProps(`community-columns`)} style={[styles.columns, compact && styles.compactColumns]}>
        <View {...elementProps(`community-feed`)} style={[styles.feed, compact && styles.compactFeed]}>
          {state.user ? (
            <View {...elementProps(`community-composer`)} style={styles.panel}>
              <View {...elementProps(`community-composer-header`)} style={styles.panelHeader}>
                <Text {...elementProps(`community-composer-title`)} style={styles.panelTitle}>
                  {`Share an update`}
                </Text>
                <PenLine {...elementProps(`community-composer-icon`)} size={16} color={palette.muted} />
              </View>
              {state.user.profilePrivacy === `private` && (
                <View {...elementProps(`community-composer-private-note`)} style={styles.localNote}>
                  <LockKeyhole {...elementProps(`community-composer-private-icon`)} size={14} color={palette.accent} />
                  <Text {...elementProps(`community-composer-private-text`)} style={styles.noteText}>
                    {`Your profile is private. All your posts are visible only to you until you make it public.`}
                  </Text>
                  <Link href={`/profile`} asChild>
                    <Pressable {...elementProps(`community-composer-settings`)} accessibilityLabel={`Edit Profile Privacy`} style={styles.refresh}>
                      <Settings2 {...elementProps(`community-composer-settings-icon`)} size={15} color={palette.accent} />
                    </Pressable>
                  </Link>
                </View>
              )}
              <RichTextEditor
                value={state.body}
                disabled={state.busy}
                onChange={state.setBody}
                scope={`community-composer`}
              />
              <View {...elementProps(`community-composer-footer`)} style={styles.composerFooter}>
                <View {...elementProps(`community-composer-audiences`)} style={styles.audiences} accessibilityLabel={`Post Audience`}>
                  {audiences.map(audience => (
                    <Pressable
                      key={audience.id}
                      disabled={state.busy}
                      accessibilityRole={`radio`}
                      accessibilityLabel={audience.label}
                      onPress={() => state.setAudience(audience.id)}
                      {...elementProps(`community-composer-audience`, audience.id)}
                      accessibilityState={{ checked: state.audience === audience.id }}
                      style={[styles.audience, state.audience === audience.id && styles.audienceActive]}
                    >
                      <audience.Icon
                        size={12}
                        color={state.audience === audience.id ? palette.accent : palette.muted}
                        {...elementProps(`community-composer-audience-icon`, audience.id)}
                      />
                      <Text
                        {...elementProps(`community-composer-audience-label`, audience.id)}
                        style={[styles.audienceLabel, state.audience === audience.id && styles.audienceActiveLabel]}
                      >
                        {audience.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  accessibilityRole={`button`}
                  accessibilityLabel={`Publish Post`}
                  {...elementProps(`community-publish`)}
                  onPress={() => { void state.publish(); }}
                  disabled={state.busy || !state.body.trim()}
                  style={[styles.action, (state.busy || !state.body.trim()) && styles.disabled]}
                >
                  <Send {...elementProps(`community-publish-icon`)} size={14} color={palette.contrast} />
                  <Text {...elementProps(`community-publish-label`)} style={styles.actionLabel}>
                    {state.busy ? `Saving…` : `Publish post`}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View {...elementProps(`community-guest-prompt`)} style={styles.panel}>
              <Text {...elementProps(`community-guest-title`)} style={styles.panelTitle}>
                {`A name, a project, a story.`}
              </Text>
              <Text {...elementProps(`community-guest-description`)} style={styles.caption}>
                {`Browse public updates below. Sign in to share your own and follow people you want to hear from.`}
              </Text>
              <Link href={`/signin`} asChild>
                <Pressable {...elementProps(`community-guest-signin`)} style={styles.secondaryAction} accessibilityLabel={`Sign In To Post And Follow`}>
                  <LogIn {...elementProps(`community-guest-signin-icon`)} size={14} color={palette.accent} />
                  <Text {...elementProps(`community-guest-signin-label`)} style={styles.secondaryLabel}>
                    {`Sign in to join`}
                  </Text>
                </Pressable>
              </Link>
            </View>
          )}
          <View {...elementProps(`community-feed-controls`)} style={styles.panelHeader}>
            <View {...elementProps(`community-feed-tabs`)} style={styles.tabs} accessibilityRole={`tablist`}>
              {tabs.map(tab => (
                <Pressable
                  key={tab.id}
                  accessibilityRole={`tab`}
                  onPress={() => state.setView(tab.id)}
                  {...elementProps(`community-feed-tab`, tab.id)}
                  accessibilityState={{ selected: state.view === tab.id }}
                  style={[styles.tab, state.view === tab.id && styles.activeTab]}
                >
                  <tab.Icon {...elementProps(`community-feed-tab-icon`, tab.id)} size={14} color={state.view === tab.id ? palette.accent : palette.muted} />
                  <Text {...elementProps(`community-feed-tab-label`, tab.id)} style={[styles.tabLabel, state.view === tab.id && styles.activeTabLabel]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              disabled={state.loading}
              accessibilityRole={`button`}
              accessibilityLabel={`Refresh Community`}
              onPress={() => { void state.refresh(); }}
              {...elementProps(`community-refresh`)}
              style={[styles.refresh, state.loading && styles.disabled]}
            >
              <RefreshCw {...elementProps(`community-refresh-icon`)} size={15} color={palette.muted} />
            </Pressable>
          </View>
          {state.loading ? [0, 1].map(index => (
            <PostCardSkeleton key={index} scope={`post-${index}`} />
          )) : state.posts.length ? state.posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              busy={state.busy}
              viewerId={state.viewerId}
              onUpdate={state.updatePost}
              confirming={state.deletingId === post.id}
              onCancel={() => state.setDeletingId(null)}
              onDelete={id => { void state.deletePost(id); }}
            />
          )) : (
            <View {...elementProps(`community-feed-empty`)} style={styles.empty}>
              <MessageSquare {...elementProps(`community-feed-empty-icon`)} size={25} color={palette.accent} />
              <Text {...elementProps(`community-feed-empty-title`)} style={styles.emptyTitle}>
                {emptyCopy.title}
              </Text>
              <Text {...elementProps(`community-feed-empty-description`)} style={styles.emptyText}>
                {emptyCopy.text}
              </Text>
              {!state.user && state.view !== `public` && (
                <Link href={`/signin`} asChild>
                  <Pressable {...elementProps(`community-feed-empty-signin`)} style={styles.secondaryAction} accessibilityLabel={`Sign In To View Your Feed`}>
                    <LogIn {...elementProps(`community-feed-empty-signin-icon`)} size={14} color={palette.accent} />
                    <Text {...elementProps(`community-feed-empty-signin-label`)} style={styles.secondaryLabel}>
                      {`Sign in`}
                    </Text>
                  </Pressable>
                </Link>
              )}
            </View>
          )}
        </View>
        <View {...elementProps(`community-people`)} style={[styles.people, compact && styles.compactPeople]}>
          <Text {...elementProps(`community-people-title`)} style={styles.panelTitle}>
            {`People & portfolios`}
          </Text>
          <Text {...elementProps(`community-people-description`)} style={styles.caption}>
            {`Public profiles and the domains they choose to share.`}
          </Text>
          {state.loading ? [0, 1].map(index => (
            <ProfileCardSkeleton key={index} scope={`profile-${index}`} />
          )) : state.profiles.length ? state.profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              busy={state.busy}
              viewerId={state.viewerId}
              onFollow={state.toggleFollow}
            />
          )) : (
            <View {...elementProps(`community-people-empty`)} style={styles.personCard}>
              <UsersRound {...elementProps(`community-people-empty-icon`)} size={22} color={palette.accent} />
              <Text {...elementProps(`community-people-empty-text`)} style={styles.caption}>
                {`No public profiles on this device yet. Profile privacy and shared domains can be changed in your profile settings.`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Community;
