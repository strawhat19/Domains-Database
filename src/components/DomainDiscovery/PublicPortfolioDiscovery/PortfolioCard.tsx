import { Link } from 'expo-router';
import type { createStyles } from './styles.native';
import { routes } from '../../../shared/routes';
import { Text, View, Linking, Pressable } from 'react-native';
import { Globe2, UserRound, ExternalLink } from 'lucide-react-native';
import { elementProps } from '../../../shared/elementProps';
import type { ThemePalette } from '../../../shared/themeContext/theme';
import type { SharedDomainDiscoveryResult } from '../../../shared/domainSearch/publicDiscovery';

interface PortfolioCardProps {
  scope: string;
  palette: ThemePalette;
  result: SharedDomainDiscoveryResult;
  styles: ReturnType<typeof createStyles>;
}

const PortfolioCard = ({ result, styles, palette, scope }: PortfolioCardProps) => {
  const { domain, profile } = result;
  const id = `${scope}-${profile.id}-${domain.id}`;
  const status = domain.projectStatus;
  const statusColor = status === `Done` || status === `MVP` ? palette.success : status === `Blocked` ? palette.danger : palette.muted;
  const description = domain.description?.trim() || domain.mvp?.trim() || domain.future?.trim();

  return (
    <View {...elementProps(`public-discovery-card`, id)} style={styles.card}>
      <View {...elementProps(`public-discovery-card-heading`, id)} style={styles.cardHeading}>
        <Globe2 {...elementProps(`public-discovery-domain-icon`, id)} size={19} color={palette.accent} />
        <Text {...elementProps(`public-discovery-name`, id)} numberOfLines={2} style={styles.name}>
          {domain.name}
        </Text>
        <Text {...elementProps(`public-discovery-extension`, id)} style={styles.extension}>
          {`.${result.extension}`}
        </Text>
      </View>
      <View {...elementProps(`actionsCell`, id)} style={styles.actionsCell}>
        <View {...elementProps(`rowStatus`, id)} style={styles.rowStatus}>
          <View {...elementProps(`statusDotWrap`, id)} style={styles.statusDotWrap}>
            <View {...elementProps(`statusDot`, id)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <Text {...elementProps(`statusText`, id)} style={[styles.statusText, { color: statusColor }]}>
            {status || `Project status unavailable`}
          </Text>
        </View>
      </View>
      <Text {...elementProps(`public-discovery-description`, id)} numberOfLines={3} style={styles.description}>
        {description || `A domain shared by ${profile.name}. Visit their profile to follow their updates.`}
      </Text>
      <View {...elementProps(`public-discovery-card-footer`, id)} style={styles.cardFooter}>
        <Link href={{ params: { profile: profile.id }, pathname: routes.community.href }} asChild>
          <Pressable
            accessibilityRole={`link`}
            accessibilityLabel={`View ${profile.name}'s Profile And Posts`}
            {...elementProps(`public-discovery-builder`, id)}
            style={({ pressed }) => [styles.builder, pressed && styles.disabled]}
          >
            <UserRound {...elementProps(`public-discovery-builder-icon`, id)} size={14} color={palette.accent} />
            <Text {...elementProps(`public-discovery-builder-label`, id)} numberOfLines={1} style={styles.builderLabel}>
              {profile.name}
            </Text>
          </Pressable>
        </Link>
        {!!result.website && (
          <Pressable
            accessibilityRole={`link`}
            accessibilityLabel={`Visit ${domain.name}`}
            {...elementProps(`public-discovery-action`, `visit-${id}`)}
            style={({ pressed }) => [styles.action, pressed && styles.disabled]}
            onPress={() => { if (result.website) void Linking.openURL(result.website).catch(() => undefined); }}
          >
            <ExternalLink {...elementProps(`public-discovery-visit-icon`, id)} size={13} color={palette.accent} />
            <Text {...elementProps(`public-discovery-visit-label`, id)} style={styles.actionLabel}>
              {`Visit`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default PortfolioCard;
