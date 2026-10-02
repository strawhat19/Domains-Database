import styles from './styles';
import { Layers3 } from 'lucide-react-native';
import { View, Text, ActivityIndicator } from 'react-native';
import { elementProps } from '../../shared/elementProps';

const LoadingScreen = () => (
  <View {...elementProps(`app-loading-screen`)} style={styles.screen}>
    <Layers3 {...elementProps(`app-loading-icon`)} color={`#133b50`} size={32} />
    <Text {...elementProps(`app-loading-label`)} style={styles.label}>
      {`A little order is on its way`}
    </Text>
    <ActivityIndicator {...elementProps(`app-loading-spinner`)} color={`#138b8b`} size={`small`} />
  </View>
);

export default LoadingScreen;
