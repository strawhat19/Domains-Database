import { styles } from './styles.native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import Svg, { Defs, G, LinearGradient, Polygon, Stop } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const phaseSteps = Array.from({ length: 25 }, (_, index) => index / 24);
const columns = Array.from({ length: 100 }, (_, index) => {
  const row = Math.floor(index / 10);
  const column = index % 10;
  const seed = (row * 29 + column * 17) % 37;
  const waves = seed % 2 + 1;
  const offset = seed / 37 * Math.PI * 2;
  const height = 17 + seed % 15;
  const amplitude = 7 + seed % 12;
  const wave = phaseSteps.map(step => (1 + Math.sin(offset + step * Math.PI * 2 * waves)) / 2);

  return {
    row,
    index,
    column,
    lit: seed < 5,
    y: 66 + (row + column) * 18,
    x: 380 + (column - row) * 32,
    glow: wave.map(value => .72 + value * .28),
    halo: wave.map(value => .08 + value * .18),
    heights: wave.map(value => height + value * amplitude),
  };
}).sort((first, second) => first.row + first.column - second.row - second.column || first.column - second.column);

const HeroCubes = ({ suffix = `hero` }: { suffix?: string }) => {
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const phase = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const topGradient = `hero-cubes-top-gradient-${suffix}`;
  const darkGradient = `hero-cubes-dark-gradient-${suffix}`;
  const faces = useMemo(() => columns.map(cube => {
    const { x, y } = cube;
    const points = (face: `top` | `left` | `right`, height: number) => {
      const upperY = (y - height).toFixed(2);
      const middleY = (y + 16 - height).toFixed(2);
      const lowerY = (y + 32 - height).toFixed(2);

      if (face === `left`) return `${x - 29},${middleY} ${x},${lowerY} ${x},${y + 32} ${x - 29},${y + 16}`;
      if (face === `right`) return `${x},${lowerY} ${x + 29},${middleY} ${x + 29},${y + 16} ${x},${y + 32}`;
      return `${x},${upperY} ${x + 29},${middleY} ${x},${lowerY} ${x - 29},${middleY}`;
    };
    const animateFace = (face: `top` | `left` | `right`) => phase.interpolate({
      inputRange: phaseSteps,
      outputRange: cube.heights.map(height => points(face, height)),
    });

    return {
      ...cube,
      top: animateFace(`top`),
      left: animateFace(`left`),
      right: animateFace(`right`),
      glowOpacity: phase.interpolate({ inputRange: phaseSteps, outputRange: cube.glow }),
      haloOpacity: phase.interpolate({ inputRange: phaseSteps, outputRange: cube.halo }),
    };
  }), [phase]);

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, state => setActive(state !== `background` && state !== `inactive`));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion) { phase.setValue(0); return; }
    if (!active) return;
    phase.setValue(0);
    // Every column samples the same clock with its own phase and height; the fixed bases stay grounded.
    const animation = Animated.loop(Animated.timing(phase, {
      toValue: 1,
      duration: 24000,
      easing: Easing.linear,
      isInteraction: false,
      useNativeDriver: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [active, phase, reducedMotion]);

  return (
    <View
      accessible={false}
      style={styles.outer}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`native-hero-cubes`, suffix)}
    >
      <Svg
        width={`100%`}
        height={`100%`}
        viewBox={`0 0 760 500`}
        preserveAspectRatio={`xMidYMid slice`}
        {...elementProps(`native-hero-cubes-svg`, suffix)}
      >
        <Defs {...elementProps(`native-hero-cubes-defs`, suffix)}>
          <LinearGradient
            x1={`0%`}
            y1={`0%`}
            x2={`100%`}
            y2={`100%`}
            id={topGradient}
            {...elementProps(`native-hero-cubes-top-gradient`, suffix)}
          >
            <Stop offset={`0%`} stopColor={`#c0fff4`} {...elementProps(`native-hero-cubes-top-pale`, suffix)} />
            <Stop offset={`55%`} stopColor={`#64f5d9`} {...elementProps(`native-hero-cubes-top-teal`, suffix)} />
            <Stop offset={`100%`} stopColor={palette.accent} {...elementProps(`native-hero-cubes-top-accent`, suffix)} />
          </LinearGradient>
          <LinearGradient
            x1={`0%`}
            y1={`0%`}
            x2={`100%`}
            y2={`100%`}
            id={darkGradient}
            {...elementProps(`native-hero-cubes-dark-gradient`, suffix)}
          >
            <Stop offset={`0%`} stopColor={`#21333e`} {...elementProps(`native-hero-cubes-dark-start`, suffix)} />
            <Stop offset={`100%`} stopColor={`#111c25`} {...elementProps(`native-hero-cubes-dark-end`, suffix)} />
          </LinearGradient>
        </Defs>
        <G {...elementProps(`native-hero-cubes-grid`, suffix)}>
          {faces.map(cube => {
            const cubeSuffix = `${suffix}-${cube.index}`;
            const opacity = cube.lit ? cube.glowOpacity : 1;

            return (
              <G key={cube.index} {...elementProps(`native-hero-cube`, cubeSuffix)}>
                <AnimatedPolygon
                  opacity={opacity}
                  points={cube.left}
                  strokeWidth={.65}
                  fill={cube.lit ? `#176d63` : `#0b151d`}
                  stroke={cube.lit ? `#267c71` : `#17252d`}
                  {...elementProps(`native-hero-cube-left`, cubeSuffix)}
                />
                <AnimatedPolygon
                  opacity={opacity}
                  points={cube.right}
                  strokeWidth={.65}
                  fill={cube.lit ? `#0e4549` : `#070e15`}
                  stroke={cube.lit ? `#1b6768` : `#13222a`}
                  {...elementProps(`native-hero-cube-right`, cubeSuffix)}
                />
                {cube.lit && (
                  <AnimatedPolygon
                    fill={`#6cffe0`}
                    strokeWidth={7}
                    points={cube.top}
                    stroke={`#6cffe0`}
                    strokeLinejoin={`round`}
                    opacity={cube.haloOpacity}
                    {...elementProps(`native-hero-cube-glow`, cubeSuffix)}
                  />
                )}
                <AnimatedPolygon
                  opacity={opacity}
                  points={cube.top}
                  strokeWidth={.8}
                  fill={`url(#${cube.lit ? topGradient : darkGradient})`}
                  stroke={cube.lit ? `#9cffe7` : `#2a3c45`}
                  {...elementProps(`native-hero-cube-top`, cubeSuffix)}
                />
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

export default HeroCubes;
