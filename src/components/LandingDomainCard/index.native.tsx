import { useMemo } from 'react';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import type { LandingDomainCardProps } from './types';
import { Search, TrendingUp } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getLandingDomainDetails } from '../LandingSections/presentation';

const LandingDomainCard = ({ result, onSearch }: LandingDomainCardProps) => {
  const { palette } = useTheme();
  const details = getLandingDomainDetails(result);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const suffix = result.domain.replace(/[^a-z0-9-]/gi, `-`);

  return (
    <View {...elementProps(`landing-domain-card`, suffix)} style={styles.card}>
      <View
        accessible={false}
        style={styles.backing}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-domain-card-backing`, suffix)}
      >
        <StackPillShape
          fill={palette.subtle}
          stroke={`${palette.accent}66`}
          id={`landing-domain-card-backing-${suffix}`}
        />
      </View>
      <View
        accessible={false}
        style={styles.foreground}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-domain-card-foreground`, suffix)}
      >
        <StackPillShape
          fill={palette.paper}
          stroke={palette.line}
          id={`landing-domain-card-${suffix}`}
        />
      </View>
      <View {...elementProps(`landing-domain-card-top`, suffix)} style={styles.top}>
        <Text {...elementProps(`landing-domain-extension`, suffix)} style={styles.extension}>{`.${result.extension}`}</Text>
        <TrendingUp accessible={false} {...elementProps(`landing-domain-trend`, suffix)} size={17} color={palette.accent} />
      </View>
      <Text {...elementProps(`landing-domain-name`, suffix)} style={styles.name} accessibilityRole={`header`}>{result.domain}</Text>
      <View {...elementProps(`landing-domain-quote`, suffix)} style={styles.quote}>
        <Text {...elementProps(`landing-domain-registrar`, suffix)} style={styles.registrar}>{`Registration At ${details.registrar}`}</Text>
        <View {...elementProps(`landing-domain-price-row`, suffix)} style={styles.priceRow}>
          <Text {...elementProps(`landing-domain-price`, suffix)} style={styles.price}>{details.price}</Text>
          <Text {...elementProps(`landing-domain-term`, suffix)} style={styles.term}>{details.term}</Text>
        </View>
      </View>
      <View {...elementProps(`actionsCell`, `landing-${suffix}`)} style={styles.actionsCell}>
        <View {...elementProps(`rowStatus`, `landing-${suffix}`)} style={styles.rowStatus}>
          <View {...elementProps(`statusDotWrap`, `landing-${suffix}`)} style={styles.statusDotWrap} accessible={false}>
            <View {...elementProps(`statusDot`, `landing-${suffix}`)} style={styles.statusDot} />
          </View>
          <Text {...elementProps(`statusText`, `landing-${suffix}`)} style={styles.statusText}>{`Available`}</Text>
        </View>
        <Pressable
          accessibilityRole={`button`}
          onPress={() => onSearch(result.domain)}
          {...elementProps(`landing-domain-search`, suffix)}
          accessibilityLabel={`Search ${result.domain} Availability And Prices`}
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        >
          <Search accessible={false} {...elementProps(`landing-domain-search-icon`, suffix)} size={13} color={palette.accent} />
          <Text {...elementProps(`landing-domain-search-label`, suffix)} style={styles.searchLabel}>{`Search`}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default LandingDomainCard;
