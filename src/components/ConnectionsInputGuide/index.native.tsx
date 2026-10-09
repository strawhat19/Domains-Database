import { useMemo } from 'react';
import type { FocusEvent } from 'react';
import { Pause, Play } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useConnectionsInputGuide } from './useConnectionsInputGuide';
import { connectionEnvInstructions, connectionInputInstructions } from '../../shared/connections/inputs';

export interface ConnectionsInputGuideProps {
  scope: string;
}

const slides = [
  {
    id: `overview`,
    title: `Registrar Connections`,
    titleClass: `connections-title`,
    headingClass: `connections-heading`,
    copyClass: `connections-description`,
    copy: `Connect a registrar to sync its domains. Add separate GoDaddy, Hostinger, Vercel, or Squarespace reseller accounts as needed. Saved connections are checked on sign-in and refresh after 2 hours and 24 minutes. Hostinger automatically includes registered domains and domains found in accessible hosting websites.`,
  },
  {
    id: `values`,
    titleClass: `connections-input-guide-title`,
    copyClass: `connections-input-instructions`,
    title: `How To Enter Connection Values`,
    copy: connectionInputInstructions,
  },
  {
    id: `env`,
    title: `How To Add Values To .env`,
    titleClass: `connections-env-guide-title`,
    copyClass: `connections-env-instructions`,
    copy: connectionEnvInstructions,
  },
];

const ConnectionsInputGuide = ({ scope }: ConnectionsInputGuideProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useConnectionsInputGuide(slides.length);
  const PlaybackIcon = state.paused ? Play : Pause;
  const pauseLabel = state.reducedMotion ? `Autoplay Disabled For Reduced Motion` : `${state.paused ? `Play` : `Pause`} Connection Instructions`;
  const width = state.viewportWidth > 0 ? state.viewportWidth : `${100 / slides.length}%` as const;

  return (
    <View
      {...elementProps(`connections-input-guide`, scope)}
      {...(Platform.OS === `web` ? {
        role: `region` as const,
        'aria-roledescription': `carousel`,
        onPointerEnter: state.hoverIn,
        onPointerLeave: state.hoverOut,
        onFocusCapture: state.focusIn,
        onBlurCapture: (event: FocusEvent<HTMLElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget)) state.focusOut();
        },
      } : {})}
      style={styles.guide}
      accessibilityLabel={`Connection Instructions`}
    >
      <View
        {...elementProps(`connections-guide-viewport`, scope)}
        onLayout={state.onLayout}
        style={styles.viewport}
      >
        <Animated.View
          {...elementProps(`connections-guide-track`, scope)}
          style={[styles.track, {
            width: state.viewportWidth > 0 ? state.viewportWidth * slides.length : `${slides.length * 100}%`,
            transform: [{ translateX: state.translateX }],
          }]}
        >
          {slides.map((slide, index) => {
            const selected = state.index === index;
            const slideScope = `${scope}-${slide.id}-${index}`;
            return (
              <View
                key={slide.id}
                {...elementProps(`connections-guide-slide`, slideScope)}
                {...(Platform.OS === `web` ? {
                  inert: !selected,
                  'aria-hidden': !selected,
                  'aria-roledescription': `slide`,
                } : {})}
                style={[styles.slide, { width }]}
                accessibilityElementsHidden={!selected}
                importantForAccessibility={selected ? `auto` : `no-hide-descendants`}
                accessibilityLabel={`${index + 1} Of ${slides.length}`}
              >
                <View {...elementProps(slide.headingClass ?? `connections-guide-heading`, slide.headingClass ? scope : slideScope)} style={styles.heading}>
                  <Text {...elementProps(slide.titleClass, scope)} style={styles.title} accessibilityRole={`header`}>
                    {slide.title}
                  </Text>
                </View>
                <Text {...elementProps(slide.copyClass, scope)} style={styles.copy}>
                  {slide.copy}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </View>
      <View {...elementProps(`connections-guide-controls`, scope)} style={styles.controls}>
        <View {...elementProps(`connections-guide-pagination`, scope)} style={styles.pagination} accessibilityLabel={`Instruction Slides`}>
          {slides.map((slide, index) => {
            const selected = state.index === index;
            const dotScope = `${scope}-${slide.id}-${index}`;
            return (
              <Pressable
                key={slide.id}
                {...elementProps(`connections-guide-dot-button`, dotScope)}
                {...(Platform.OS === `web` ? {
                  'aria-current': selected ? `true` as const : undefined,
                  'aria-controls': `connections-guide-slide-${dotScope}`,
                } : {})}
                onPress={() => state.select(index)}
                accessibilityRole={`button`}
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.dotButton, pressed && styles.pressed]}
                accessibilityLabel={`Show ${slide.title}, Slide ${index + 1} Of ${slides.length}`}
                onFocus={state.focusIn}
                onBlur={state.focusOut}
              >
                <View {...elementProps(`connections-guide-dot`, dotScope)} style={[styles.dot, selected && styles.activeDot]} />
              </Pressable>
            );
          })}
        </View>
        <Pressable
          {...elementProps(`connections-guide-playback`, scope)}
          disabled={state.reducedMotion}
          onPress={state.togglePaused}
          accessibilityRole={`button`}
          accessibilityLabel={pauseLabel}
          onFocus={state.focusIn}
          onBlur={state.focusOut}
          accessibilityState={{ disabled: state.reducedMotion }}
          style={({ pressed }) => [styles.playback, (pressed || state.reducedMotion) && styles.pressed]}
        >
          <PlaybackIcon {...elementProps(`connections-guide-playback-icon`, scope)} size={14} color={palette.muted} />
        </Pressable>
      </View>
    </View>
  );
};

export default ConnectionsInputGuide;
