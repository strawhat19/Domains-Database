import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { githubLanguages } from './assets.native';
import { elementProps } from '../../../shared/elementProps';
import { Code2, GitBranch, UserRound } from 'lucide-react-native';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { getGitHubLanguageIdentity, type GitHubIdentityProps } from './data';
import { normalizeGitHubAvatar } from '../../../shared/analytics/githubIdentity';

const Artwork = ({ id, kind, name = ``, avatarUrl, large }: GitHubIdentityProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [failed, setFailed] = useState(``);
  const author = kind === `author`;
  const language = kind === `language` ? getGitHubLanguageIdentity(name) : null;
  const avatar = author ? normalizeGitHubAvatar(avatarUrl) : null;
  const source = avatar ? { uri: avatar } : kind === `github` ? githubLanguages.github : language ? githubLanguages[language.slug] : undefined;
  const assetKey = `${kind}:${name}:${avatar ?? language?.slug ?? ``}`;
  const showImage = source !== undefined && failed !== assetKey;
  const Icon = kind === `github` ? GitBranch : author ? UserRound : Code2;
  const initial = author && name && name !== `Unlinked Author` ? name.slice(0, 1).toUpperCase() : ``;
  return <View {...elementProps(id)} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} style={[styles.root, author && styles.avatar, large && styles.large]}>
    {initial ? <Text {...elementProps(`${id}-initial`)} style={styles.initial}>{initial}</Text> : <Icon {...elementProps(`${id}-fallback`)} size={large ? 24 : 15} color={palette.muted} />}
    {showImage ? <Image
      source={source}
      accessible={false}
      recyclingKey={assetKey}
      {...elementProps(`${id}-image`)}
      contentFit={author ? `cover` : `contain`}
      onError={() => setFailed(assetKey)}
      tintColor={author ? undefined : !language || language.color === `currentColor` ? palette.ink : language.color}
      style={[styles.image, !author && styles.mark, large && styles.largeMark]}
    /> : null}
  </View>;
};
const GitHubIdentity = (props: GitHubIdentityProps) => <Artwork {...props} key={`${props.kind}:${props.name ?? ``}:${props.avatarUrl ?? ``}`} />;
export default GitHubIdentity;
