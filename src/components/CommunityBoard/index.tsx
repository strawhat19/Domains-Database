import { useMemo } from 'react';
import { Link } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { Award, ChevronRight } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { buildCommunityProgress } from '../../shared/social/progression';
import type { FeedPost, CommunityProfile } from '../../shared/social/types';

const CommunityBoard = ({ posts, profiles }: { posts: FeedPost[]; profiles: CommunityProfile[] }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const builders = useMemo(() => profiles.filter(profile => profile.profilePrivacy === `public`)
    .map(profile => ({ profile, progress: buildCommunityProgress(profile, posts) }))
    .filter(builder => builder.progress.xp > 0)
    .sort((first, second) => second.progress.xp - first.progress.xp || first.profile.id.localeCompare(second.profile.id))
    .slice(0, 5), [posts, profiles]);
  return (
    <View {...elementProps(`community-board`)} style={styles.root}>
      <View {...elementProps(`community-board-heading`)} style={styles.heading}>
        <Award {...elementProps(`community-board-icon`)} size={17} color={palette.accent} />
        <Text {...elementProps(`community-board-title`)} style={styles.title}>
          {`Community board`}
        </Text>
      </View>
      <Text {...elementProps(`community-board-coverage`)} style={styles.caption}>
        {`Contributors in the loaded public activity window. Levels update as eligible posts and portfolios change.`}
      </Text>
      {builders.length ? builders.map(({ profile, progress }, index) => (
        <Link key={profile.id} href={{ pathname: `/community`, params: { profile: profile.id } }} asChild>
          <Pressable
            style={styles.row}
            accessibilityRole={`link`}
            {...elementProps(`community-board-builder`, profile.id)}
            accessibilityLabel={`${profile.name}, ${progress.xp} XP From Loaded Public Activity. View Profile`}
          >
            <Text {...elementProps(`community-board-rank`, profile.id)} style={styles.rank}>{index + 1}</Text>
            <View {...elementProps(`community-board-person`, profile.id)} style={styles.person}>
              <Text {...elementProps(`community-board-name`, profile.id)} style={styles.name}>{profile.name}</Text>
              <Text {...elementProps(`community-board-level`, profile.id)} style={styles.caption}>
                {`Level ${progress.level} · ${progress.title}`}
              </Text>
            </View>
            <Text {...elementProps(`community-board-xp`, profile.id)} style={styles.xp}>{`${progress.xp} XP`}</Text>
            <ChevronRight {...elementProps(`community-board-builder-icon`, profile.id)} size={12} color={palette.muted} />
          </Pressable>
        </Link>
      )) : (
        <Text {...elementProps(`community-board-empty`)} style={styles.caption}>
          {`The first public post or shared domain starts the board. Publish when you are ready.`}
        </Text>
      )}
    </View>
  );
};

export default CommunityBoard;
