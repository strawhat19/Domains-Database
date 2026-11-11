import { useMemo } from 'react';
import { createStyles } from './styles';
import { Pressable, Text, View } from 'react-native';
import { Globe2, RotateCw } from 'lucide-react-native';
import { useAnimatedDomainCount } from './useAnimatedDomainCount';
import { useTheme } from '../../shared/themeContext/useTheme';
import { elementProps, decorativeIconProps } from '../../shared/elementProps';
import type { usePublicProfilePortfolio } from './usePublicProfilePortfolio';
import type { PublicProfilePortfolio } from '../../shared/publicDirectory/profilePortfolio';

type DomainCountProps = { id: string; portfolio: ReturnType<typeof usePublicProfilePortfolio> };

const AnimatedDomainCount = ({ id, total, styles }: { id: string; total: number; styles: ReturnType<typeof createStyles> }) => {
  const count = useAnimatedDomainCount(total);
  const label = total.toLocaleString();
  return <View style={styles.countSlot}>
    <Text aria-hidden importantForAccessibility={`no-hide-descendants`} style={[styles.count, styles.countMeasure]}>{label}</Text>
    <Text {...elementProps(`public-profile-domain-count-value`, id)} accessibilityLabel={label} style={[styles.count, styles.countValue]}>
      {count?.toLocaleString()}
    </Text>
  </View>;
};

export const PortfolioDomainCount = ({ id, portfolio }: DomainCountProps) => {
  const { data, loading, error, retry } = portfolio;
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!data && !loading && !error) return null;

  return <View {...elementProps(`public-profile-portfolio`, id)} style={styles.countPanel}>
    <View {...elementProps(`public-profile-domain-count`, id)} style={styles.domainCount}>
      <Globe2 size={13} color={palette.accent} {...decorativeIconProps} />
      <Text {...elementProps(`public-profile-domain-count-label`, id)} style={styles.countLabel}>{`Total Domains`}</Text>
      {data ? <AnimatedDomainCount key={`${id}:${data.totalDomains}`} id={id} total={data.totalDomains} styles={styles} /> : null}
      {loading ? <View {...elementProps(`public-profile-domain-count-loading`, id)} style={styles.countSkeleton} accessible accessibilityRole={`progressbar`} accessibilityLabel={`Loading Domain Count`} accessibilityState={{ busy: true }} /> : null}
    </View>
    {error ? <View {...elementProps(`public-profile-portfolio-error`, id)} style={styles.section}>
      <Text style={styles.muted} accessibilityRole={`alert`}>{`Domain Count Could Not Be Loaded`}</Text>
      <Pressable {...elementProps(`public-profile-portfolio-retry`, id)} onPress={retry} style={styles.button} accessibilityRole={`button`}>
        <RotateCw size={15} color={palette.accent} {...decorativeIconProps} /><Text style={styles.buttonText}>{`Try Again`}</Text>
      </Pressable>
    </View> : null}
  </View>;
};

export const SharedProfileDomains = ({ id, domains }: { id: string; domains: PublicProfilePortfolio[`domains`] }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`public-profile-shared-domains`, id)} style={styles.panel}>
    <Text {...elementProps(`public-profile-shared-domains-heading`, id)} style={styles.heading} accessibilityRole={`header`}>{`Shared Domains`}</Text>
    {domains.map(domain => <View key={domain.id} {...elementProps(`public-profile-shared-domain`, domain.id)} style={styles.domain}>
      <Globe2 size={15} color={palette.accent} {...decorativeIconProps} />
      <Text {...elementProps(`public-profile-shared-domain-name`, domain.id)} style={styles.domainName}>{domain.name}</Text>
    </View>)}
  </View>;
};
