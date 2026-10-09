import { cubes } from '../../shared/config';
import { createStyles } from './styles.native';
import { useMemo, memo, useContext } from 'react';
import HeroCubes from '../HeroCubes/index.native';
import { elementProps } from '../../shared/elementProps';
import { Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Search, Plug, Globe2, Layers3, ArrowUpRight } from 'lucide-react-native';
import { onboardingCopy, workspacePreview, onboardingBenefits, type AuthOnboardingProps } from './content';

const benefitIcons = { search: Search, organize: Layers3, connect: Plug };
const artFadeEdges = [
  { id: `top`, x1: `0`, y1: `0`, x2: `0`, y2: `1`, stops: [[0, 1], [8, .65], [16, .15], [24, 0]] },
  { id: `left`, x1: `0`, y1: `0`, x2: `1`, y2: `0`, stops: [[0, 1], [10, .75], [22, .2], [32, 0]] },
  { id: `right`, x1: `0`, y1: `0`, x2: `1`, y2: `0`, stops: [[0, 0], [76, 0], [88, .3], [96, .85], [100, 1]] },
  { id: `bottom`, x1: `0`, y1: `0`, x2: `0`, y2: `1`, stops: [[0, 0], [65, 0], [80, .28], [92, .76], [100, 1]] },
] as const;

const AuthOnboarding = ({ mode }: AuthOnboardingProps) => {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight;
  const availableHeight = pageContentHeight ?? Math.max(0, height - 200);
  const condensed = availableHeight < 560;
  const compact = width <= 900;
  const roomy = width >= 1200;
  const styles = useMemo(() => createStyles(palette, compact, condensed, roomy), [palette, compact, condensed, roomy]);
  const copy = onboardingCopy[mode];

  return (
    <View {...elementProps(`auth-onboarding`, mode)} style={styles.root}>
      {!compact && (
        <View
          accessible={false}
          style={styles.art}
          pointerEvents={`none`}
          accessibilityElementsHidden
          {...elementProps(`auth-onboarding-art`, mode)}
          importantForAccessibility={`no-hide-descendants`}
        >
          <View {...elementProps(`auth-onboarding-art-scene`, mode)} style={styles.artScene}>
            <HeroCubes cubes={cubes} suffix={`auth-onboarding-${mode}`} />
          </View>
          <Svg
            width={`100%`}
            height={`100%`}
            accessible={false}
            pointerEvents={`none`}
            style={styles.artFade}
            {...elementProps(`auth-onboarding-art-fade`, mode)}
          >
            <Defs {...elementProps(`auth-onboarding-art-fade-defs`, mode)}>
              {artFadeEdges.map(edge => (
                <LinearGradient
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  id={`auth-onboarding-art-gradient-${mode}-${edge.id}`}
                  {...elementProps(`auth-onboarding-art-gradient`, `${mode}-${edge.id}`)}
                >
                  {edge.stops.map(([offset, opacity], index) => (
                    <Stop
                      key={index}
                      stopOpacity={opacity}
                      offset={`${offset}%`}
                      stopColor={palette.paper}
                      {...elementProps(`auth-onboarding-art-fade-stop`, `${mode}-${edge.id}-${index}`)}
                    />
                  ))}
                </LinearGradient>
              ))}
            </Defs>
            {artFadeEdges.map(edge => (
              <Rect
                key={edge.id}
                width={`100%`}
                height={`100%`}
                {...elementProps(`auth-onboarding-art-fade-edge`, `${mode}-${edge.id}`)}
                fill={`url(#auth-onboarding-art-gradient-${mode}-${edge.id})`}
              />
            ))}
          </Svg>
        </View>
      )}
      <View {...elementProps(`auth-onboarding-heading`, mode)} style={styles.heading}>
        <View {...elementProps(`auth-onboarding-eyebrow`, mode)} style={styles.eyebrowRow}>
          <Layers3 {...elementProps(`auth-onboarding-eyebrow-icon`, mode)} size={14} color={palette.accent} />
          <Text {...elementProps(`auth-onboarding-eyebrow-label`, mode)} style={styles.eyebrow}>{`YOUR DOMAIN WORKSPACE`}</Text>
        </View>
        <Text {...elementProps(`auth-onboarding-title`, mode)} style={styles.title} accessibilityRole={`header`}>
          {`${copy.title}\n`}
          <Text {...elementProps(`auth-onboarding-title-accent`, mode)} style={styles.accent}>{copy.accent}</Text>
        </Text>
        {!condensed && <Text {...elementProps(`auth-onboarding-description`, mode)} style={styles.description}>{copy.description}</Text>}
      </View>
      {!compact && (
        <View {...elementProps(`auth-onboarding-preview`, mode)} style={styles.preview}>
          <View {...elementProps(`auth-onboarding-preview-heading`, mode)} style={styles.previewHeading}>
            <View {...elementProps(`auth-onboarding-preview-label`, mode)} style={styles.previewLabelRow}>
              <Layers3 {...elementProps(`auth-onboarding-preview-icon`, mode)} size={14} color={palette.accent} />
              <Text {...elementProps(`auth-onboarding-preview-label-text`, mode)} style={styles.previewLabel}>{`Workspace preview`}</Text>
            </View>
            <Text {...elementProps(`auth-onboarding-preview-tag`, mode)} style={styles.previewTag}>{`Illustration`}</Text>
          </View>
          <View {...elementProps(`auth-onboarding-search`, mode)} style={styles.search} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
            <Search {...elementProps(`auth-onboarding-search-icon`, mode)} size={16} color={palette.accent} />
            <Text {...elementProps(`auth-onboarding-search-query`, mode)} style={styles.searchQuery}>{`your next idea`}</Text>
            <Text {...elementProps(`auth-onboarding-search-extensions`, mode)} style={styles.searchExtensions}>{`.com · .io · .dev`}</Text>
          </View>
          <View {...elementProps(`auth-onboarding-records`, mode)} style={styles.records}>
            {workspacePreview.map(record => (
              <View key={record.id} {...elementProps(`auth-onboarding-record`, `${mode}-${record.id}`)} style={styles.record}>
                <View {...elementProps(`auth-onboarding-record-symbol`, `${mode}-${record.id}`)} style={styles.recordSymbol}>
                  <Globe2 {...elementProps(`auth-onboarding-record-icon`, `${mode}-${record.id}`)} size={15} color={palette.accent} />
                </View>
                <View {...elementProps(`auth-onboarding-record-copy`, `${mode}-${record.id}`)} style={styles.recordCopy}>
                  <Text {...elementProps(`auth-onboarding-record-name`, `${mode}-${record.id}`)} style={styles.recordName}>{record.name}</Text>
                  <Text {...elementProps(`auth-onboarding-record-note`, `${mode}-${record.id}`)} style={styles.recordNote}>{record.note}</Text>
                </View>
                <Text {...elementProps(`auth-onboarding-record-label`, `${mode}-${record.id}`)} style={styles.recordLabel}>{record.label}</Text>
              </View>
            ))}
          </View>
          <View {...elementProps(`auth-onboarding-preview-note`, mode)} style={styles.previewNote}>
            <Text {...elementProps(`auth-onboarding-preview-note-text`, mode)} style={styles.previewNoteText}>{`Example names. Your workspace starts with your own domains.`}</Text>
            <ArrowUpRight {...elementProps(`auth-onboarding-preview-note-icon`, mode)} size={13} color={palette.accent} />
          </View>
        </View>
      )}
      <View {...elementProps(`auth-onboarding-benefits`, mode)} style={styles.benefits}>
        {onboardingBenefits.map(benefit => {
          const Icon = benefitIcons[benefit.id];
          return (
            <View key={benefit.id} {...elementProps(`auth-onboarding-benefit`, `${mode}-${benefit.id}`)} style={styles.benefit}>
              <View {...elementProps(`auth-onboarding-benefit-heading`, `${mode}-${benefit.id}`)} style={styles.benefitHeading}>
                <Icon {...elementProps(`auth-onboarding-benefit-icon`, `${mode}-${benefit.id}`)} size={14} color={palette.accent} />
                <Text {...elementProps(`auth-onboarding-benefit-label`, `${mode}-${benefit.id}`)} style={styles.benefitLabel}>{benefit.label}</Text>
              </View>
              {!compact && !condensed && <Text {...elementProps(`auth-onboarding-benefit-copy`, `${mode}-${benefit.id}`)} style={styles.benefitCopy}>{benefit.copy}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default memo(AuthOnboarding);
