import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { Gavel, Store } from 'lucide-react-native';
import { auctionTabs, type AuctionTab } from './tabs';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

const icons = { markets: Store, auctions: Gavel };

const AuctionTabs = ({ activeTab }: { activeTab: AuctionTab }) => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`auction-tabs`)} style={[styles.tabs, width < 600 && styles.compactTabs]} role={`navigation`} accessibilityLabel={`Market And Auctions`}>
      {auctionTabs.map(({ id, href, label, beta }) => {
        const Icon = icons[id];
        const selected = activeTab === id;
        return (
          <Link key={id} asChild href={href} onPress={selected ? event => event.preventDefault() : undefined}>
            <Pressable
              accessibilityRole={`link`}
              accessibilityState={{ selected }}
              {...elementProps(`auction-tab`, id)}
              accessibilityLabel={beta ? `${label}, Beta` : label}
              style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.pressed]}
            >
              <Icon {...elementProps(`auction-tab-icon`, id)} size={16} color={selected ? palette.contrast : palette.muted} accessible={false} />
              <Text {...elementProps(`auction-tab-label`, id)} style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
              {beta && <Text {...elementProps(`auction-tab-beta`, id)} style={styles.beta}>{`Beta`}</Text>}
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
};

export default AuctionTabs;
