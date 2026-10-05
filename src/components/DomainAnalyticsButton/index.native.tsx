import { useMemo } from 'react';
import DomainAnalytics from '../DomainAnalytics';
import { Pressable, Text } from 'react-native';
import { createStyles } from './styles.native';
import { ChartNoAxesCombined } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useDomainAnalyticsButton, type DomainAnalyticsButtonProps } from './useDomainAnalyticsButton';

const DomainAnalyticsButton = ({ domain, suffix, compact = false }: DomainAnalyticsButtonProps) => {
  const state = useDomainAnalyticsButton(domain, suffix);
  const { palette } = useTheme();
  const scope = state.scope;
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <>
      <Pressable
        accessibilityRole={`button`}
        accessibilityState={{ expanded: state.open }}
        accessibilityLabel={`View Analytics For ${domain}`}
        {...elementProps(`domain-analytics-button`, scope)}
        onPress={event => { event.stopPropagation(); state.show(); }}
        style={({ pressed }) => [styles.button, compact && styles.compact, pressed && styles.pressed]}
      >
        <ChartNoAxesCombined {...elementProps(`domain-analytics-button-icon`, scope)} size={15} color={palette.accent} />
        {!compact && <Text {...elementProps(`domain-analytics-button-text`, scope)} style={styles.text}>{`Analytics`}</Text>}
      </Pressable>
      {state.open && <DomainAnalytics domain={domain} suffix={suffix} onClose={state.close} />}
    </>
  );
};

export default DomainAnalyticsButton;
