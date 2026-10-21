import Toast from '../Toast';
import { useMemo } from 'react';
import { Link } from 'expo-router';
import { useCommunity } from './useCommunity';
import RichTextEditor from '../RichTextEditor';
import CommunityBoard from '../CommunityBoard';
import CommunityProgress from '../CommunityProgress';
import { createStyles } from './styles.native';
import PostCard, { PostCardSkeleton } from './PostCard';
import { elementProps } from '../../shared/elementProps';
import ProfileCard, { ProfileCardSkeleton } from './ProfileCard';
import { useTheme } from '../../shared/themeContext/useTheme';
import PublicPortfolioDiscovery from '../DomainDiscovery/PublicPortfolioDiscovery';
import { Text, View, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { X, Search, Globe2, Sparkles, UsersRound, PenLine, LockKeyhole, Send, ShieldCheck, LogIn, Settings2, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react-native';

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
    public: { title: `Your community starts with a conversation.`, text: `Public updates appear here as builders join. Share a domain discovery, a launch, or something you are working on.` },
  }[state.view];
  return (
    <View {...elementProps(`community-page`)} style={styles.root}>
      <View {...elementProps(`community-header`)} style={styles.header}>
        <Text {...elementProps(`community-eyebrow`)} style={styles.eyebrow}>
          {`GOOD NAMES. INTERESTING PEOPLE.`}
        </Text>
        <Text {...elementProps(`community-title`)} style={styles.title} accessibilityRole={`header`}>
          {`Good domains bring people together.`}
        </Text>
        <Text {...elementProps(`community-description`)} style={styles.description}>
          {`Discover public portfolios, follow builders, and share what you are making. Join the conversation and earn contribution levels as the community grows.`}
        </Text>
        <View {...elementProps(`community-local-note`)} style={styles.localNote}>
          <ShieldCheck {...elementProps(`community-local-note-icon`)} size={15} color={palette.accent} />
          <Text {...elementProps(`community-local-note-text`)} style={styles.noteText}>
            {state.source === `local`
              ? `Local preview · Profiles and posts come from accounts on this device. They do not sync online. Profiles start private, and domain sharing is opt-in.`
              : state.loading ? `Connecting to the community…`
                : state.error ? `Community is unavailable. Refresh to retry the connection.`
                  : `Shared through Firebase · Profiles start private. Only public profiles and explicitly shared portfolios appear in Discover.`}
          </Text>
        </View>
      </View>
      {!!state.error && (
        <Toast id={`community-error`} message={state.error} kind={`error`} onDismiss={state.clearError} />
      )}
      {!!state.notice && (
        <Toast id={`community-notice`} message={state.notice} kind={`success`} onDismiss={state.clearNotice} />
      )}
      {state.view === `public` && !state.profileId && (
        <PublicPortfolioDiscovery
          error={state.error}
          loading={state.loading}
          profiles={state.profiles}
          onRefresh={() => { void state.refresh(); }}
        />
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
              <Link href={{ pathname: `/signin`, params: { returnTo: `/community` } }} asChild>
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
          {!!state.profileId && (
            <View {...elementProps(`community-profile-filter`)} style={styles.filterBanner}>
              <View {...elementProps(`community-profile-filter-details`)} style={styles.person}>
                <Text {...elementProps(`community-profile-filter-name`)} style={styles.panelTitle}>
                  {state.selectedProfile?.name ?? (state.loading ? `Loading profile…` : `Profile unavailable`)}
                </Text>
                <Text {...elementProps(`community-profile-filter-caption`)} style={styles.caption}>
                  {state.selectedProfile?.description || `Showing eligible updates from this builder. Private profiles remain private.`}
                </Text>
              </View>
              <Pressable
                style={styles.refresh}
                onPress={state.clearProfile}
                accessibilityRole={`button`}
                accessibilityLabel={`Show All Community Posts`}
                {...elementProps(`community-profile-filter-clear`)}
              >
                <X {...elementProps(`community-profile-filter-clear-icon`)} size={16} color={palette.muted} />
              </Pressable>
            </View>
          )}
          <View {...elementProps(`community-search-controls`)} style={styles.searchControls}>
            <View {...elementProps(`community-search-field`)} style={styles.searchField}>
              <Search {...elementProps(`community-search-icon`)} size={15} color={palette.muted} />
              <TextInput
                value={state.search}
                style={styles.searchInput}
                onChangeText={state.setSearch}
                placeholder={`Search posts and builders`}
                accessibilityLabel={`Search Loaded Community Posts`}
                placeholderTextColor={palette.muted}
                {...elementProps(`community-search-input`)}
              />
            </View>
            <View {...elementProps(`community-sort`)} style={styles.tabs} accessibilityRole={`tablist`}>
              {([`newest`, `popular`] as const).map(sort => (
                <Pressable
                  key={sort}
                  style={[styles.audience, state.sort === sort && styles.audienceActive]}
                  accessibilityRole={`tab`}
                  onPress={() => state.setSort(sort)}
                  accessibilityState={{ selected: state.sort === sort }}
                  {...elementProps(`community-sort-option`, sort)}
                >
                  <Sparkles {...elementProps(`community-sort-icon`, sort)} size={12} color={palette.accent} />
                  <Text {...elementProps(`community-sort-label`, sort)} style={styles.audienceLabel}>
                    {sort === `newest` ? `Newest` : `Most liked`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {state.loading && !state.posts.length ? [0, 1].map(index => (
            <PostCardSkeleton key={index} scope={`post-${index}`} />
          )) : state.visiblePosts.length ? state.visiblePosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              publicProfiles={state.profiles}
              busy={state.busy}
              viewerId={state.viewerId}
              onUpdate={state.updatePost}
              onLike={state.setLiked}
              onComment={state.addComment}
              onDeleteComment={state.deleteComment}
              canComment={state.user?.profilePrivacy === `public`}
              confirming={state.deletingId === post.id}
              onCancel={() => state.setDeletingId(null)}
              onDelete={id => { void state.deletePost(id); }}
            />
          )) : (
            <View {...elementProps(`community-feed-empty`)} style={styles.empty}>
              <MessageSquare {...elementProps(`community-feed-empty-icon`)} size={25} color={palette.accent} />
              <Text {...elementProps(`community-feed-empty-title`)} style={styles.emptyTitle}>
                {state.error ? `Community could not be loaded.` : state.search ? `No matching updates.` : state.profileId ? `No eligible updates from this builder.` : emptyCopy.title}
              </Text>
              <Text {...elementProps(`community-feed-empty-description`)} style={styles.emptyText}>
                {state.error ? `Your data has not been replaced with sample activity. Use Refresh to try again.` : state.search ? `Try a different search. Search covers the posts currently loaded.` : state.profileId ? `This profile may be private, unavailable, or have no updates in the current feed window.` : emptyCopy.text}
              </Text>
              {!state.user && state.view !== `public` && (
                <Link href={{ pathname: `/signin`, params: { returnTo: `/community` } }} asChild>
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
          {state.hasMorePosts && (
            <Pressable
              style={styles.secondaryAction}
              accessibilityRole={`button`}
              onPress={state.showMorePosts}
              accessibilityLabel={`Show More Loaded Posts`}
              {...elementProps(`community-show-more`)}
            >
              <ChevronDown {...elementProps(`community-show-more-icon`)} size={14} color={palette.accent} />
              <Text {...elementProps(`community-show-more-label`)} style={styles.secondaryLabel}>
                {`Show more · ${state.postCount} matching loaded post(s)`}
              </Text>
            </Pressable>
          )}
          {!!state.coverage && (
            <Text {...elementProps(`community-feed-coverage`)} style={styles.caption}>
              {state.coverage}
            </Text>
          )}
        </View>
        <View {...elementProps(`community-people`)} style={[styles.people, compact && styles.compactPeople]}>
          {!!state.ownProfile && (
            <View {...elementProps(`community-your-progress`)} style={styles.personCard}>
              <Text {...elementProps(`community-your-progress-title`)} style={styles.panelTitle}>
                {`Your contribution level`}
              </Text>
              <CommunityProgress profile={state.ownProfile} posts={state.progressPosts} scope={`your-level`} />
            </View>
          )}
          <CommunityBoard profiles={state.profiles} posts={state.progressPosts} />
          <Text {...elementProps(`community-people-title`)} style={styles.panelTitle}>
            {`People & portfolios`}
          </Text>
          <Text {...elementProps(`community-people-description`)} style={styles.caption}>
            {`Public profiles and the domains they choose to share.`}
          </Text>
          {state.loading && !state.profiles.length ? [0, 1].map(index => (
            <ProfileCardSkeleton key={index} scope={`profile-${index}`} />
          )) : state.profiles.length ? state.profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              posts={state.progressPosts}
              busy={state.busy}
              viewerId={state.viewerId}
              onFollow={state.toggleFollow}
            />
          )) : (
            <View {...elementProps(`community-people-empty`)} style={styles.personCard}>
              <UsersRound {...elementProps(`community-people-empty-icon`)} size={22} color={palette.accent} />
              <Text {...elementProps(`community-people-empty-text`)} style={styles.caption}>
                {state.error ? `Profiles are unavailable while the community connection is interrupted.` : `Public profiles will appear as people join. Make your profile public and opt in to domain sharing in Profile to be discovered.`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Community;
