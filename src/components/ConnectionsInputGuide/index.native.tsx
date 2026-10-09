import { useMemo } from 'react';
import Carousel from '../Carousel';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { Globe2, KeyRound, FileKey2 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { connectionEnvInstructions, connectionInputInstructions } from '../../shared/connections/inputs';

export interface ConnectionsInputGuideProps {
  scope: string;
}

const slides = [
  {
    id: `overview`,
    Icon: Globe2,
    title: `Registrar Connections`,
    titleClass: `connections-title`,
    headingClass: `connections-heading`,
    copyClass: `connections-description`,
    copy: `Connect a registrar to sync its domains. Add separate GoDaddy, Hostinger, Vercel, or Squarespace reseller accounts as needed. Saved connections are checked on sign-in and refresh after 2 hours and 24 minutes. Hostinger automatically includes registered domains and domains found in accessible hosting websites.`,
  },
  {
    id: `values`,
    Icon: KeyRound,
    titleClass: `connections-input-guide-title`,
    copyClass: `connections-input-instructions`,
    title: `How To Enter Connection Values`,
    copy: connectionInputInstructions,
  },
  {
    id: `env`,
    Icon: FileKey2,
    title: `How To Add Values To .env`,
    titleClass: `connections-env-guide-title`,
    copyClass: `connections-env-instructions`,
    copy: connectionEnvInstructions,
  },
];

const ConnectionsInputGuide = ({ scope }: ConnectionsInputGuideProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`connections-input-guide`, scope)} style={styles.guide}>
      <Carousel
        scope={`connections-guide-${scope}`}
        label={`Connection Instructions`}
        slides={slides.map((slide, index) => {
          const Icon = slide.Icon;
          const slideScope = `${scope}-${slide.id}-${index}`;
          return {
            id: slide.id,
            label: slide.title,
            content: (
              <View {...elementProps(`connections-guide-content`, slideScope)} style={styles.content}>
                <View {...elementProps(slide.headingClass ?? `connections-guide-heading`, slideScope)} style={styles.heading}>
                  <View {...elementProps(`connections-guide-icon-wrap`, slideScope)} style={styles.icon}>
                    <Icon {...elementProps(`connections-guide-title-icon`, slideScope)} size={16} color={palette.accent} />
                  </View>
                  <Text {...elementProps(slide.titleClass, slideScope)} style={styles.title} accessibilityRole={`header`}>{slide.title}</Text>
                </View>
                <Text {...elementProps(slide.copyClass, slideScope)} style={styles.copy}>{slide.copy}</Text>
              </View>
            ),
          };
        })}
      />
    </View>
  );
};

export default ConnectionsInputGuide;
