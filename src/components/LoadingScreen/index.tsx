import { useMemo } from 'react';
import { createStyles } from './styles';
import { Layers3 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

const LoadingScreen = () => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`app-loading-screen`)} style={styles.screen}>
      <Layers3 {...elementProps(`app-loading-icon`)} color={palette.ink} size={32} />
      <Text {...elementProps(`app-loading-label`)} style={styles.label}>
        {`A little order is on its way`}
      </Text>
      <ActivityIndicator {...elementProps(`app-loading-spinner`)} color={palette.accent} size={`small`} />
    </View>
  );
};

export default LoadingScreen;
