import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { Sparkles } from 'lucide-react-native';
import { useDomainNewBadge } from './useDomainNewBadge';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { DomainNewBadgeProps } from './useDomainNewBadge';

const DomainNewBadge = ({ id, domain, compact = false }: DomainNewBadgeProps) => {
  const { palette } = useTheme();
  const recent = useDomainNewBadge(domain);
  const styles = createStyles(palette);
  if (!recent) return null;

  return (
    <View
      accessible
      {...elementProps(`domain-new-badge`, id)}
      style={[styles.badge, compact && styles.compactBadge]}
      accessibilityLabel={`New Domain, Renewal Date In The Last 5 Days`}
    >
      <Sparkles size={9} accessible={false} color={palette.accent} {...elementProps(`domain-new-badge-icon`, id)} />
      <Text {...elementProps(`domain-new-badge-text`, id)} style={[styles.text, compact && styles.compactText]}>New</Text>
    </View>
  );
};

export default DomainNewBadge;
