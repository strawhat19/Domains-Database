import styles from './styles.native';
import { Text, View } from 'react-native';
import { Layers3 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';

const Hero = () => (
  <View {...elementProps(`landing-hero`)} style={styles.hero}>
    <Text {...elementProps(`hero-eyebrow`)} style={styles.eyebrow}>
      {`A HOME FOR EVERY DOMAIN`}
    </Text>
    <Text {...elementProps(`hero-title`)} style={styles.title} accessibilityRole={`header`}>
      {`Every domain.`}
    </Text>
    <Text {...elementProps(`hero-title-accent`)} style={styles.accent}>
      {`One quiet place.`}
    </Text>
    <Text {...elementProps(`hero-description`)} style={styles.description}>
      {`Your domains may live in different accounts. Your overview shouldn’t. Keep every name, renewal, and registrar beautifully in order.`}
    </Text>
    <View {...elementProps(`hero-promise`)} style={styles.promise}>
      <Layers3 {...elementProps(`hero-promise-icon`)} size={14} color={`#138b8b`} />
      <Text {...elementProps(`hero-promise-text`)} style={styles.promiseText}>
        {`Different registrars. One clear view.`}
      </Text>
    </View>
  </View>
);

export default Hero;
