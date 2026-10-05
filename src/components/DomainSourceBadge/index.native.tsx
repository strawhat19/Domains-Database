import { Text, View } from 'react-native';
import { styles } from './styles.native';
import { getDomainSourceBadge } from './domainSourceBadge';
import { FileUp, Pencil, RefreshCw } from 'lucide-react-native';
import type { DomainSourceBadgeProps } from './domainSourceBadge';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const DomainSourceBadge = ({ id, domain }: DomainSourceBadgeProps) => {
  const { palette, isDark } = useTheme();
  const { label, source } = getDomainSourceBadge(domain);
  const Icon = source === `registrar` ? RefreshCw : source === `csv` ? FileUp : Pencil;
  const color = source === `registrar` ? palette.success
    : source === `csv` ? isDark ? `#c1a3ed` : `#7356a1` : isDark ? `#80b7f3` : `#286ab3`;

  return (
    <View
      style={styles.rowStatus}
      accessibilityLabel={`Domain Source: ${label}`}
      {...elementProps(`rowStatus`, id)}
    >
      <Icon size={11} color={color} {...elementProps(`domain-source-icon`, id)} />
      <Text {...elementProps(`statusText`, id)} style={[styles.statusText, { color }]}>
        {label}
      </Text>
    </View>
  );
};

export default DomainSourceBadge;
