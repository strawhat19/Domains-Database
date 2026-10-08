import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Text, View, Pressable, Linking } from 'react-native';
import { publicHttpsUrl } from '../../shared/social/content';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { CommunityProfile } from '../../shared/social/types';
import type { PublicProfile } from '../../shared/models/users/User';
import { Globe2, LockKeyhole, UserCheck, UserPlus, LogIn, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react-native';

export const ProfileAvatar = ({ profile, scope }: { profile: PublicProfile; scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [failed, setFailed] = useState(false);
  const photo = profile.photoURL ? publicHttpsUrl(profile.photoURL) : null;
  const color = /^#[a-f\d]{6}$/i.test(profile.color?.color) ? profile.color.color : palette.accent;
  const letterColor = profile.color?.type === `light` ? `#133b50` : `#ffffff`;
  if (photo && !failed) return (
    <Image
      style={styles.avatar}
      contentFit={`cover`}
      source={{ uri: photo }}
      onError={() => setFailed(true)}
      accessibilityLabel={`${profile.name} Avatar`}
      {...elementProps(`community-avatar-image`, scope)}
    />
  );
  return (
    <View
      {...elementProps(`community-avatar`, scope)}
      accessibilityLabel={`${profile.name} Avatar`}
      style={[styles.avatar, { backgroundColor: color }]}
    >
      <Text {...elementProps(`community-avatar-letter`, scope)} style={[styles.avatarText, { color: letterColor }]}>
        {profile.name.trim().charAt(0).toUpperCase() || `?`}
      </Text>
    </View>
  );
};

export const ProfileCardSkeleton = ({ scope }: { scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`community-profile-skeleton`, scope)} style={styles.personCard} accessibilityLabel={`Loading Public Profile`}>
      <View {...elementProps(`community-profile-skeleton-top`, scope)} style={styles.cardTop}>
        <View {...elementProps(`community-profile-skeleton-avatar`, scope)} style={styles.skeletonAvatar} />
        <View {...elementProps(`community-profile-skeleton-name`, scope)} style={[styles.skeleton, styles.skeletonName]} />
      </View>
      <View {...elementProps(`community-profile-skeleton-bio`, scope)} style={[styles.skeleton, styles.skeletonWide]} />
      <View {...elementProps(`community-profile-skeleton-domain`, scope)} style={styles.skeleton} />
    </View>
  );
};

interface ProfileCardProps {
  busy: boolean;
  viewerId: string | null;
  profile: CommunityProfile;
  onFollow: (id: string, following: boolean) => void;
}

const ProfileCard = ({ profile, viewerId, busy, onFollow }: ProfileCardProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const own = profile.id === viewerId;
  const [expanded, setExpanded] = useState(false);
  const id = profile.id;
  const FollowIcon = profile.following ? UserCheck : UserPlus;
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;
  const VisibilityIcon = profile.profilePrivacy === `private` ? LockKeyhole : Globe2;
  return (
    <View {...elementProps(`community-profile-card`, id)} style={styles.personCard}>
      <View {...elementProps(`community-profile-top`, id)} style={styles.cardTop}>
        <ProfileAvatar profile={profile} scope={`profile-${id}`} />
        <View {...elementProps(`community-profile-person`, id)} style={styles.person}>
          <Text {...elementProps(`community-profile-name`, id)} style={styles.name}>
            {profile.name}
          </Text>
          <View {...elementProps(`community-profile-visibility`, id)} style={styles.metadata}>
            <VisibilityIcon
              size={11}
              color={palette.muted}
              {...elementProps(`community-profile-${profile.profilePrivacy}-icon`, id)}
            />
            <Text {...elementProps(`community-profile-visibility-label`, id)} style={styles.metaLabel}>
              {own ? profile.profilePrivacy === `private` ? `Your private profile` : `Your public profile` : `Public profile`}
            </Text>
          </View>
        </View>
      </View>
      {!!profile.description && (
        <Text {...elementProps(`community-profile-bio`, id)} style={styles.biography}>
          {profile.description}
        </Text>
      )}
      {!own && (viewerId ? (
        <Pressable
          disabled={busy}
          accessibilityRole={`button`}
          {...elementProps(`community-follow`, id)}
          onPress={() => onFollow(id, !profile.following)}
          style={[styles.secondaryAction, busy && styles.disabled]}
          accessibilityState={{ selected: profile.following, disabled: busy }}
          accessibilityLabel={`${profile.following ? `Unfollow` : `Follow`} ${profile.name}`}
        >
          <FollowIcon {...elementProps(`community-follow-icon`, id)} size={14} color={palette.accent} />
          <Text {...elementProps(`community-follow-label`, id)} style={styles.secondaryLabel}>
            {profile.following ? `Following · Unfollow` : `Follow`}
          </Text>
        </Pressable>
      ) : (
        <Link href={`/signin`} asChild>
          <Pressable {...elementProps(`community-follow-signin`, id)} style={styles.secondaryAction} accessibilityLabel={`Sign In To Follow ${profile.name}`}>
            <LogIn {...elementProps(`community-follow-signin-icon`, id)} size={14} color={palette.accent} />
            <Text {...elementProps(`community-follow-signin-label`, id)} style={styles.secondaryLabel}>
              {`Sign in to follow`}
            </Text>
          </Pressable>
        </Link>
      ))}
      {!!profile.domains.length && (
        <View {...elementProps(`community-profile-domains`, id)} style={styles.domains}>
          <Text {...elementProps(`community-profile-domains-label`, id)} style={styles.metaLabel}>
            {`SHARED DOMAINS`}
          </Text>
          {(expanded ? profile.domains : profile.domains.slice(0, 4)).map(domain => {
            const description = domain.description?.trim();
            const url = publicHttpsUrl(`https://${domain.name}`);
            return (
              <Pressable
                disabled={!url}
                key={domain.id}
                style={styles.domain}
                accessibilityRole={`link`}
                accessibilityLabel={`Visit ${domain.name}`}
                {...elementProps(`community-profile-domain`, `${id}-${domain.id}`)}
                onPress={() => { if (url) void Linking.openURL(url).catch(() => undefined); }}
              >
                <Globe2 {...elementProps(`community-profile-domain-icon`, `${id}-${domain.id}`)} size={12} color={palette.muted} />
                <View {...elementProps(`community-profile-domain-details`, `${id}-${domain.id}`)} style={styles.domainDetails}>
                  <View {...elementProps(`community-profile-domain-heading`, `${id}-${domain.id}`)} style={styles.domainHeading}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode={`tail`}
                      style={styles.domainName}
                      {...elementProps(`community-profile-domain-name`, `${id}-${domain.id}`)}
                    >
                      {domain.name}
                    </Text>
                    <View {...elementProps(`community-profile-domain-external-wrap`, `${id}-${domain.id}`)} style={styles.domainExternal}>
                      <ExternalLink {...elementProps(`community-profile-domain-external`, `${id}-${domain.id}`)} size={11} color={palette.muted} />
                    </View>
                    {!!description && (
                      <Text
                        numberOfLines={1}
                        ellipsizeMode={`tail`}
                        style={styles.domainDescription}
                        {...elementProps(`community-profile-domain-description`, `${id}-${domain.id}`)}
                      >
                        {` - ${description}`}
                      </Text>
                    )}
                  </View>
                  <Text {...elementProps(`community-profile-domain-registrar`, `${id}-${domain.id}`)} style={styles.metaLabel}>
                    {domain.registrar || `Unknown registrar`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {profile.domains.length > 4 && (
            <Pressable
              style={styles.domain}
              accessibilityRole={`button`}
              accessibilityState={{ expanded }}
              onPress={() => setExpanded(!expanded)}
              {...elementProps(`community-profile-domain-more`, id)}
              accessibilityLabel={expanded ? `Show Fewer Domains` : `Show All Shared Domains`}
            >
              <ExpandIcon {...elementProps(`community-profile-domain-more-icon`, id)} size={12} color={palette.muted} />
              <Text {...elementProps(`community-profile-domain-more-label`, id)} style={styles.moreDomains}>
                {expanded ? `Show fewer` : `+${profile.domains.length - 4} more shared domain(s)`}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default ProfileCard;
