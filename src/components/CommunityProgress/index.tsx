import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Award, Sparkles } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { buildCommunityProgress } from '../../shared/social/progression';
import type { FeedPost, CommunityProfile } from '../../shared/social/types';

interface CommunityProgressProps {
  posts: FeedPost[];
  scope?: string;
  compact?: boolean;
  profile: CommunityProfile;
}

const CommunityProgress = ({ profile, posts, compact = false, scope = `profile` }: CommunityProgressProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const progress = useMemo(() => buildCommunityProgress(profile, posts), [profile, posts]);
  const id = `${scope}-${profile.id}`;
  const stats = [
    { id: `posts`, label: `Public posts`, value: progress.publicPosts },
    { id: `domains`, label: `Shared domains`, value: progress.sharedDomains },
    { id: `likes`, label: `Likes received`, value: progress.receivedLikes },
  ];
  return (
    <View {...elementProps(`community-progress`, id)} style={styles.root}>
      <View {...elementProps(`community-progress-top`, id)} style={styles.top}>
        <View {...elementProps(`community-progress-identity`, id)} style={styles.identity}>
          <Sparkles {...elementProps(`community-progress-icon`, id)} size={14} color={palette.accent} />
          <Text {...elementProps(`community-progress-level`, id)} style={styles.title}>
            {`Level ${progress.level} · ${progress.title}`}
          </Text>
        </View>
        <Text {...elementProps(`community-progress-xp`, id)} style={styles.xp}>
          {`${progress.xp.toLocaleString()} XP`}
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole={`progressbar`}
        {...elementProps(`community-progress-track`, id)}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.progress * 100) }}
        accessibilityLabel={progress.nextLevelXp === null ? `Highest Community Level Reached` : `${progress.nextLevelXp - progress.xp} XP To Level ${progress.level + 1}`}
      >
        <View {...elementProps(`community-progress-fill`, id)} style={[styles.fill, { width: `${progress.progress * 100}%` }]} />
      </View>
      <Text {...elementProps(`community-progress-scope`, id)} style={styles.caption}>
        {`Loaded public activity${progress.nextLevelXp === null ? ` · Highest level` : ` · ${progress.nextLevelXp - progress.xp} XP to next level`}`}
      </Text>
      {!compact && (
        <View {...elementProps(`community-progress-stats`, id)} style={styles.stats}>
          {stats.map(stat => (
            <View key={stat.id} {...elementProps(`community-progress-stat`, `${id}-${stat.id}`)} style={styles.stat}>
              <Text {...elementProps(`community-progress-stat-value`, `${id}-${stat.id}`)} style={styles.value}>
                {stat.value.toLocaleString()}
              </Text>
              <Text {...elementProps(`community-progress-stat-label`, `${id}-${stat.id}`)} style={styles.label}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      {!!progress.badges.length && (
        <View {...elementProps(`community-progress-badges`, id)} style={styles.badges}>
          {progress.badges.map(badge => (
            <View key={badge.id} {...elementProps(`community-progress-badge`, `${id}-${badge.id}`)} style={styles.badge}>
              <Award {...elementProps(`community-progress-badge-icon`, `${id}-${badge.id}`)} size={11} color={palette.accent} />
              <Text {...elementProps(`community-progress-badge-label`, `${id}-${badge.id}`)} style={styles.badgeLabel}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      {!compact && (
        <Text {...elementProps(`community-progress-rules`, id)} style={styles.caption}>
          {`20 XP per public post · 10 XP per distinct shared domain · 2 XP per like received. Derived from the public records currently loaded; private content does not earn public XP.`}
        </Text>
      )}
    </View>
  );
};

export default CommunityProgress;
