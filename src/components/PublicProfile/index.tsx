import { useMemo } from 'react';
import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import StatePanel from '../StatePanel';
import { createStyles } from './styles';
import { routes } from '../../shared/routes';
import { RotateCw, UsersRound } from 'lucide-react-native';
import { usePublicProfile } from './usePublicProfile';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { PortfolioDomainCount, SharedProfileDomains } from './PortfolioDetails';
import { usePublicProfilePortfolio } from './usePublicProfilePortfolio';
import { elementProps, decorativeIconProps } from '../../shared/elementProps';
import { ProfileAvatar, ProfileCardSkeleton } from '../Community/ProfileCard';

const PublicProfile = ({ id }: { id: string }) => {
  const state = usePublicProfile(id);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { profile } = state;
  const portfolio = usePublicProfilePortfolio(profile?.id);
  const sharedDomains = portfolio.data?.domains;
  const retry = (id: string, onPress: () => void) => <Pressable {...elementProps(id)} accessibilityRole={`button`} onPress={onPress} style={styles.button}>
    <RotateCw size={15} color={palette.accent} {...decorativeIconProps} /><Text style={styles.buttonText}>{`Try Again`}</Text>
  </Pressable>;

  return <View {...elementProps(`public-profile-page`)} style={styles.page}>
    <PageMeta noIndex title={`Domainer Profile`} description={`View a public profile on Domains Database.`} />
    <Link href={routes.domainers.href} asChild>
      <Pressable {...elementProps(`public-profile-browse-domainers`)} style={styles.button} accessibilityRole={`link`}>
        <UsersRound size={15} color={palette.accent} {...decorativeIconProps} />
        <Text style={styles.buttonText}>{`Browse Domainers`}</Text>
      </Pressable>
    </Link>
    {state.loading ? <View {...elementProps(`public-profile-loading`)} accessible accessibilityRole={`progressbar`} accessibilityLabel={`Loading Public Profile`} accessibilityState={{ busy: true }}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}><ProfileCardSkeleton scope={`public-page`} /></View>
    </View> : profile ? <>
      <View {...elementProps(`public-profile-card`, profile.id)} style={styles.panel}>
        <View {...elementProps(`public-profile-identity`, profile.id)} style={styles.identity}>
          <ProfileAvatar key={`${profile.id}:${profile.photoURL ?? ``}`} profile={profile} scope={`public-${profile.id}`} />
          <View style={styles.identityText}>
            <Text {...elementProps(`public-profile-name`, profile.id)} accessibilityRole={`header`} style={styles.name}>{profile.name}</Text>
            <Text style={styles.muted}>{`Public Profile`}</Text>
          </View>
        </View>
        {profile.description ? <Text {...elementProps(`public-profile-bio`, profile.id)} style={styles.copy}>{profile.description}</Text> : null}
        <PortfolioDomainCount id={profile.id} portfolio={portfolio} />
      </View>
      {sharedDomains?.length ? <SharedProfileDomains id={profile.id} domains={sharedDomains} /> : null}
    </> : state.error ? <StatePanel id={`public-profile-error`} title={`Profile Could Not Be Loaded`} description={`Try loading the public profile again.`} icon={`error`} variant={`inline`} alert>
      {retry(`public-profile-retry`, state.retry)}
    </StatePanel> : <StatePanel id={`public-profile-unavailable`} title={`Public Profile Unavailable`} description={`This profile may be private or the link may be out of date.`} icon={`lock`} variant={`inline`} />}
  </View>;
};

export default PublicProfile;
