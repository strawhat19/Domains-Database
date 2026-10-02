import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Layers3 } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const Hero = () => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`landing-hero`)} style={styles.hero}>
      <Text {...elementProps(`hero-eyebrow`)} style={styles.eyebrow}>
        {`PERSONAL DOMAIN REGISTRY`}
      </Text>
      <Text
        {...elementProps(`hero-title`)}
        style={styles.title}
        accessibilityRole={`header`}
      >
        {`Your domains.`}
      </Text>
      <Text {...elementProps(`hero-title-accent`)} style={styles.accent}>
        {`Under control.`}
      </Text>
      <Text {...elementProps(`hero-description`)} style={styles.description}>
        {`Keep track of every name, registrar, and renewal. A domain portfolio you can actually keep up with.`}
      </Text>
      <View {...elementProps(`hero-promise`)} style={styles.promise}>
        <Layers3 {...elementProps(`hero-promise-icon`)} size={14} color={palette.accent} />
        <Text {...elementProps(`hero-promise-text`)} style={styles.promiseText}>
          {`Names. Renewals. Registrars.`}
        </Text>
      </View>
    </View>
  );
};

export default Hero;
