import Brackets from '../Brackets';
import { Link } from 'expo-router';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { useMemo, useEffect, useContext } from 'react';
import { useAbout, aboutSectionIcons } from './useAbout';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link2, Search, Layers3, ArrowLeft, ShieldCheck, SlidersHorizontal } from 'lucide-react-native';

const sectionIcons = { Link2, Search, Layers3, ShieldCheck, SlidersHorizontal };

const About = () => {
  const content = useAbout();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const wide = width >= 900;
  const columns = width >= 700 ? 2 : 1;
  const padding = width >= 700 ? 32 : 20;
  const contentWidth = Math.max(0, Math.min(width, 1120) - padding * 2);
  const cardWidth = (contentWidth - (columns - 1) * 20) / columns;
  const heroWidth = wide ? Math.max(0, (contentWidth - 36) / 2) : contentWidth;

  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  const renderShape = (id: string, fill = palette.paper) => (
    <>
      <View
        accessible={false}
        pointerEvents={`none`}
        style={styles.cardBacking}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`native-about-backing`, id)}
      >
        <StackPillShape id={`${id}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} />
      </View>
      <View
        accessible={false}
        pointerEvents={`none`}
        style={styles.cardForeground}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`native-about-foreground`, id)}
      >
        <StackPillShape id={`${id}-foreground`} fill={fill} stroke={palette.line} />
      </View>
    </>
  );

  return (
    <View {...elementProps(`native-about-page`)} style={[styles.page, { paddingHorizontal: padding }]}>
      <Link asChild href={`/`}>
        <Pressable {...elementProps(`native-about-back`)} style={styles.backLink} accessibilityRole={`link`}>
          <ArrowLeft size={15} color={palette.muted} accessible={false} {...elementProps(`native-about-back-icon`)} />
          <Text {...elementProps(`native-about-back-label`)} style={styles.backText}>{`Back to overview`}</Text>
        </Pressable>
      </Link>
      <View
        {...elementProps(`native-about-hero`)}
        style={[styles.hero, wide && styles.wideHero]}
        onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}
      >
        <View {...elementProps(`native-about-copy`)} style={[styles.heroCopy, { width: heroWidth }]}>
          <Text {...elementProps(`native-about-eyebrow`)} style={styles.eyebrow}>{content.eyebrow}</Text>
          <Text {...elementProps(`native-about-title`)} style={styles.title} accessibilityRole={`header`}>{content.title}</Text>
          <Text {...elementProps(`native-about-description`)} style={styles.description}>{content.description}</Text>
        </View>
        <View {...elementProps(`native-about-artwork`)} style={[styles.artwork, { width: heroWidth }]}>
          {renderShape(`about-artwork`)}
          <View {...elementProps(`native-about-artwork-content`)} style={styles.artworkContent}>
            <Brackets suffix={`about`} />
          </View>
        </View>
      </View>
      <View {...elementProps(`native-about-sections`)} style={styles.grid}>
        {content.sections.map((section, index) => {
          const id = `about-section-${index}`;
          const final = index === content.sections.length - 1;
          const Icon = sectionIcons[aboutSectionIcons[index] ?? `Layers3`];
          return (
            <View key={section.title} {...elementProps(`native-about-section`, id)} style={[styles.card, { width: final ? contentWidth : cardWidth }]}>
              {renderShape(id, final ? palette.subtle : palette.paper)}
              <View {...elementProps(`native-about-section-content`, id)} style={styles.cardContent}>
                <View {...elementProps(`native-about-section-top`, id)} style={styles.cardTop}>
                  <View {...elementProps(`native-about-section-symbol`, id)} style={[styles.symbol, final && styles.finalSymbol]}>
                    <Icon size={18} color={palette.accent} accessible={false} {...elementProps(`native-about-section-icon`, id)} />
                  </View>
                  <Text {...elementProps(`native-about-section-number`, id)} style={styles.number}>{String(index + 1).padStart(2, `0`)}</Text>
                </View>
                <Text {...elementProps(`native-about-section-title`, id)} style={styles.sectionTitle} accessibilityRole={`header`}>{section.title}</Text>
                {section.body.map((paragraph, paragraphIndex) => (
                  <Text key={paragraphIndex} {...elementProps(`native-about-section-paragraph`, `${index}-${paragraphIndex}`)} style={styles.paragraph}>{paragraph}</Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default About;
