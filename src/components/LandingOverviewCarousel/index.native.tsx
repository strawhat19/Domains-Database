import { useMemo } from 'react';
import { Image } from 'expo-image';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import LandingOverviewPreview from '../LandingOverviewPreview';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useOverviewCarousel } from './useOverviewCarousel.native';
import { overviewSlides, overviewCarouselSlides } from '../LandingOverview/content';
import { Globe2, Search, Layers3, LayoutTemplate, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';

const slideIcons = { overview: LayoutTemplate, inventory: Globe2, renewals: CalendarDays, projects: Layers3, discovery: Search };
const illustrationSources = { default: require('../../../assets/landing/domain-portfolio-overview.svg'), switched: require('../../../assets/landing/domain-portfolio-overview-name-switch.svg') };
const illustrationLabel = `Illustration of domain folders and a portfolio list with Renew, Review, and Keep labels`;

const LandingOverviewCarousel = () => {
  const { palette } = useTheme();
  const { switched } = useAppBrand();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { index, next, goTo, previous, onLayout, onScroll, scrollRef, onTouchEnd, onTouchStart, viewportWidth, onScrollEndDrag, onScrollBeginDrag, onMomentumScrollEnd } = useOverviewCarousel();
  const slide = overviewSlides[index] ?? overviewSlides[0];
  const stageHeight = viewportWidth > 580 ? 380 : 340;

  return (
    <View {...elementProps(`landing-overview-carousel`)} style={styles.carousel}>
      <View {...elementProps(`landing-overview-carousel-pagination`)} style={styles.pagination}>
        {overviewSlides.map((item, slideIndex) => {
          const selected = index === slideIndex;
          const Icon = slideIcons[item.id];
          return (
            <Pressable
              key={item.id}
              accessibilityRole={`tab`}
              onPress={() => goTo(slideIndex)}
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.label}: Show ${item.title}`}
              {...elementProps(`landing-overview-carousel-tab`, item.id)}
              style={({ pressed }) => [styles.tab, selected && styles.selectedTab, pressed && styles.pressed]}
            >
              <Icon size={14} accessible={false} color={selected ? palette.accent : palette.muted} {...elementProps(`landing-overview-carousel-tab-icon`, item.id)} />
              <Text {...elementProps(`landing-overview-carousel-tab-label`, item.id)} style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View {...elementProps(`landing-overview-carousel-viewport`)} style={[styles.viewport, { height: stageHeight + 2 }]}>
        <ScrollView
          horizontal
          pagingEnabled
          ref={scrollRef}
          bounces={false}
          onScroll={onScroll}
          onLayout={onLayout}
          onTouchEnd={onTouchEnd}
          onTouchStart={onTouchStart}
          onTouchCancel={onTouchEnd}
          scrollEventThrottle={64}
          directionalLockEnabled
          onScrollEndDrag={onScrollEndDrag}
          onScrollBeginDrag={onScrollBeginDrag}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          {...elementProps(`landing-overview-carousel-track`)}
        >
          {overviewCarouselSlides.map((item, slideIndex) => {
            const clone = slideIndex === 0 || slideIndex === overviewCarouselSlides.length - 1;
            const slideId = clone ? `${item.id}-clone-${slideIndex}` : item.id;
            const hidden = clone || index !== slideIndex - 1;
            return (
              <View
                key={slideId}
                accessibilityElementsHidden={hidden}
                importantForAccessibility={hidden ? `no-hide-descendants` : `auto`}
                {...elementProps(`landing-overview-carousel-slide`, slideId)}
                style={[styles.slide, { height: stageHeight, width: viewportWidth || undefined }]}
              >
                {item.id === `overview` ? (
                  <View {...elementProps(`landing-overview-carousel-illustration-frame`, clone ? slideId : undefined)} style={styles.illustrationFrame}>
                    <Image
                      accessible
                      alt={illustrationLabel}
                      contentFit={`cover`}
                      style={styles.illustration}
                      accessibilityLabel={illustrationLabel}
                      source={switched ? illustrationSources.switched : illustrationSources.default}
                      {...elementProps(`landing-overview-portfolio-illustration`, clone ? slideId : undefined)}
                    />
                  </View>
                ) : <LandingOverviewPreview kind={item.id} scope={clone ? slideId : undefined} />}
              </View>
            );
          })}
        </ScrollView>
      </View>
      <View {...elementProps(`landing-overview-carousel-footer`)} style={[styles.footer, viewportWidth > 580 && styles.wideFooter]}>
        <View {...elementProps(`landing-overview-carousel-caption`)} style={[styles.caption, viewportWidth > 580 && styles.wideCaption]}>
          <Text {...elementProps(`landing-overview-carousel-title`)} accessibilityRole={`header`} style={styles.title}>{slide.title}</Text>
          <Text {...elementProps(`landing-overview-carousel-description`)} style={styles.description}>{slide.description}</Text>
        </View>
        <View {...elementProps(`landing-overview-carousel-controls`)} style={styles.controls}>
          <Text {...elementProps(`landing-overview-carousel-position`)} style={styles.position}>{`${index + 1} / ${overviewSlides.length}`}</Text>
          <Pressable
            accessibilityRole={`button`}
            accessibilityLabel={`Previous slide`}
            onPress={previous}
            {...elementProps(`landing-overview-carousel-previous`)}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <ChevronLeft size={18} color={palette.ink} accessible={false} {...elementProps(`landing-overview-carousel-previous-icon`)} />
          </Pressable>
          <Pressable
            accessibilityRole={`button`}
            accessibilityLabel={`Next slide`}
            onPress={next}
            {...elementProps(`landing-overview-carousel-next`)}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <ChevronRight size={18} color={palette.ink} accessible={false} {...elementProps(`landing-overview-carousel-next-icon`)} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default LandingOverviewCarousel;
