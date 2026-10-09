import { useMemo } from 'react';
import { useCarousel } from './useCarousel';
import type { CarouselProps } from './types';
import { createStyles } from './styles.native';
import type { FocusEvent, KeyboardEvent } from 'react';
import { elementProps } from '../../shared/elementProps';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { View, Animated, Platform, Pressable } from 'react-native';

const Carousel = ({ scope, slides, autoplay = true, interval = 7000, label = `Slides` }: CarouselProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useCarousel(slides.length, autoplay, interval);
  if (!slides.length) return null;
  const width = state.viewportWidth > 0 ? state.viewportWidth : `${100 / slides.length}%` as const;
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest(`input, textarea, select, [contenteditable='true']`)) return;
    if (event.key === `ArrowLeft`) state.previous();
    else if (event.key === `ArrowRight`) state.next();
    else if (event.key === `Home`) state.select(0);
    else if (event.key === `End`) state.select(slides.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <View
      style={styles.root}
      accessibilityLabel={label}
      {...elementProps(`carousel`, scope)}
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
    >
      <View
        style={styles.viewport}
        onLayout={state.onLayout}
        {...elementProps(`carousel-viewport`, scope)}
        {...(Platform.OS === `web` ? {
          tabIndex: 0 as const,
          onKeyDown,
          onPointerDown: state.onPointerDown,
          onPointerMove: state.onPointerMove,
          onPointerUp: state.onPointerUp,
          onPointerCancel: state.onPointerCancel,
          onClickCapture: state.onClickCapture,
          onLostPointerCapture: state.onLostPointerCapture,
          dataSet: { class: `carousel-viewport`, dragging: `${state.dragging}`, swipable: `${slides.length > 1}` },
        } : state.panHandlers)}
      >
        <Animated.View
          {...elementProps(`carousel-track`, scope)}
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
                style={[styles.slide, { width }]}
                {...elementProps(`carousel-slide`, slideScope)}
                accessibilityElementsHidden={!selected}
                accessibilityLabel={`${slide.label}, ${index + 1} Of ${slides.length}`}
                importantForAccessibility={selected ? `auto` : `no-hide-descendants`}
                {...(Platform.OS === `web` ? { inert: !selected, 'aria-hidden': !selected, 'aria-roledescription': `slide` } : {})}
              >
                {slide.content}
              </View>
            );
          })}
        </Animated.View>
      </View>
      {slides.length > 1 && (
        <View {...elementProps(`carousel-controls`, scope)} style={styles.controls}>
          <Pressable
            onPress={state.previous}
            onFocus={state.focusIn}
            onBlur={Platform.OS === `web` ? undefined : state.focusOut}
            accessibilityRole={`button`}
            accessibilityLabel={`Previous Slide`}
            {...elementProps(`carousel-control`, `${scope}-previous`)}
            style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          >
            <ChevronLeft {...elementProps(`carousel-control-icon`, `${scope}-previous`)} size={18} color={palette.accent} />
          </Pressable>
          <View {...elementProps(`carousel-pagination`, scope)} style={styles.pagination} accessibilityLabel={`${label} Pagination`}>
            {slides.map((slide, index) => {
              const selected = state.index === index;
              const dotScope = `${scope}-${slide.id}-${index}`;
              return (
                <Pressable
                  key={slide.id}
                  onFocus={state.focusIn}
                  onPress={() => state.select(index)}
                  accessibilityRole={`button`}
                  accessibilityState={{ selected }}
                  {...elementProps(`carousel-dot-button`, dotScope)}
                  onBlur={Platform.OS === `web` ? undefined : state.focusOut}
                  style={({ pressed }) => [styles.dotButton, pressed && styles.pressed]}
                  accessibilityLabel={`Show ${slide.label}, Slide ${index + 1} Of ${slides.length}`}
                  {...(Platform.OS === `web` ? { 'aria-current': selected ? `true` as const : undefined, 'aria-controls': `carousel-slide-${dotScope}` } : {})}
                >
                  <View {...elementProps(`carousel-dot-connector`, dotScope)} style={[styles.connector, index === 0 && styles.firstConnector, index === slides.length - 1 && styles.lastConnector]} />
                  <View {...elementProps(`carousel-dot`, dotScope)} style={[styles.dot, selected && styles.activeDot]}>
                    <View {...elementProps(`carousel-dot-core`, dotScope)} style={[styles.dotCore, selected && styles.activeDotCore]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={state.next}
            onFocus={state.focusIn}
            onBlur={Platform.OS === `web` ? undefined : state.focusOut}
            accessibilityRole={`button`}
            accessibilityLabel={`Next Slide`}
            {...elementProps(`carousel-control`, `${scope}-next`)}
            style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          >
            <ChevronRight {...elementProps(`carousel-control-icon`, `${scope}-next`)} size={18} color={palette.accent} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Carousel;
