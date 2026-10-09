import { styles } from './styles.native';
import { roundedTilePath } from './shapes';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const gridSize = 20;
const halfWidth = 29;
const halfHeight = 21;
const faceSkew = 4;
const viewBox = { x: 28, y: 0, width: 700, height: 455 };
const phaseSteps = Array.from({ length: 25 }, (_, index) => index / 24);
const cubePalettes = {
  dark: {
    halo: `#6cffe0`,
    left: `#0b151d`,
    right: `#070e15`,
    litLeft: `#176d63`,
    litRight: `#0e4549`,
    topPale: `#c0fff4`,
    topTeal: `#64f5d9`,
    topStart: `#21333e`,
    topEnd: `#111c25`,
    topStroke: `#2a3c45`,
    leftStroke: `#17252d`,
    rightStroke: `#13222a`,
    litTopStroke: `#9cffe7`,
    litLeftStroke: `#267c71`,
    litRightStroke: `#1b6768`,
  },
  light: {
    halo: `#34cdb0`,
    left: `#c4d4d6`,
    right: `#94b0b8`,
    litLeft: `#46a695`,
    litRight: `#237e79`,
    topPale: `#e3fff7`,
    topTeal: `#45cdae`,
    topStart: `#f7faf9`,
    topEnd: `#cbdcdd`,
    topStroke: `#a6bfc4`,
    leftStroke: `#a6bfc4`,
    rightStroke: `#87a5af`,
    litTopStroke: `#188d7b`,
    litLeftStroke: `#288d80`,
    litRightStroke: `#1a6b6a`,
  },
};
const columns = Array.from({ length: gridSize * gridSize }, (_, index) => {
  const row = Math.floor(index / gridSize);
  const column = index % gridSize;
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
    y: 6 + column * 27 + row * 19,
    x: 420 + (column - row) * 32,
    glow: wave.map(value => .72 + value * .28),
    halo: wave.map(value => .08 + value * .18),
    heights: wave.map(value => height + value * amplitude),
  };
}).filter(cube => (
  cube.x + halfWidth + faceSkew >= viewBox.x
  && cube.x - halfWidth - faceSkew <= viewBox.x + viewBox.width
  && cube.y + halfHeight + faceSkew >= viewBox.y
  && cube.y - halfHeight - Math.max(...cube.heights) - faceSkew <= viewBox.y + viewBox.height
)).sort((first, second) => first.row + first.column - second.row - second.column || first.column - second.column);

const HeroCubes = ({ cubes = true, suffix = `hero` }: { cubes?: boolean; suffix?: string }) => {
  const { isDark, palette } = useTheme();
  const cubePalette = cubePalettes[isDark ? `dark` : `light`];
  const reducedMotion = useReducedMotion();
  const phase = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const topGradient = `hero-cubes-top-gradient-${suffix}`;
  const darkGradient = `hero-cubes-dark-gradient-${suffix}`;
  const faces = useMemo(() => columns.map(cube => {
    const { x, y } = cube;
    const path = (face: `top` | `left` | `right`, height: number) => {
      if (!cubes) return roundedTilePath(face, height, { x, y, depth: 8, faceSkew, halfWidth, halfHeight });
      const upperY = (y - halfHeight - height).toFixed(2);
      const leftY = (y - faceSkew - height).toFixed(2);
      const rightY = (y + faceSkew - height).toFixed(2);
      const lowerY = (y + halfHeight - height).toFixed(2);

      if (face === `left`) return `M${x - halfWidth},${leftY} ${x},${lowerY} ${x},${y + halfHeight} ${x - halfWidth},${y - faceSkew}z`;
      if (face === `right`) return `M${x},${lowerY} ${x + halfWidth},${rightY} ${x + halfWidth},${y + faceSkew} ${x},${y + halfHeight}z`;
      return `M${x},${upperY} ${x + halfWidth},${rightY} ${x},${lowerY} ${x - halfWidth},${leftY}z`;
    };
    const animated = cube.lit || (cube.row + cube.column) % 2 === 0;
    if (!animated) {
      const height = cube.heights[0] ?? 0;
      return { ...cube, animated: false as const, top: path(`top`, height), left: path(`left`, height), right: path(`right`, height) };
    }
    const animateFace = (face: `top` | `left` | `right`) => phase.interpolate({
      inputRange: phaseSteps,
      outputRange: cube.heights.map(height => path(face, height)),
    });

    return {
      ...cube,
      animated: true as const,
      top: animateFace(`top`),
      left: animateFace(`left`),
      right: animateFace(`right`),
      glowOpacity: cube.lit ? phase.interpolate({ inputRange: phaseSteps, outputRange: cube.glow }) : 1,
      haloOpacity: cube.lit ? phase.interpolate({ inputRange: phaseSteps, outputRange: cube.halo }) : 0,
    };
  }), [cubes, phase]);

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, state => setActive(state !== `background` && state !== `inactive`));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion) { phase.setValue(0); return; }
    if (!active) return;
    phase.setValue(0);
    // Moving columns share the same clock with their own phase and height; the fixed bases stay grounded.
    const animation = Animated.loop(Animated.timing(phase, {
      toValue: 1,
      duration: 14000,
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
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
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
            <Stop offset={`0%`} stopColor={cubePalette.topPale} {...elementProps(`native-hero-cubes-top-pale`, suffix)} />
            <Stop offset={`55%`} stopColor={cubePalette.topTeal} {...elementProps(`native-hero-cubes-top-teal`, suffix)} />
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
            <Stop offset={`0%`} stopColor={cubePalette.topStart} {...elementProps(`native-hero-cubes-dark-start`, suffix)} />
            <Stop offset={`100%`} stopColor={cubePalette.topEnd} {...elementProps(`native-hero-cubes-dark-end`, suffix)} />
          </LinearGradient>
        </Defs>
        <G {...elementProps(`native-hero-cubes-grid`, suffix)}>
          {faces.map(cube => {
            const cubeSuffix = `${suffix}-${cube.index}`;
            if (!cube.animated) return (
              <G key={cube.index} {...elementProps(`native-hero-cube`, cubeSuffix)}>
                <Path
                  d={cube.left}
                  strokeWidth={.65}
                  fill={cubePalette.left}
                  stroke={cubePalette.leftStroke}
                  {...elementProps(`native-hero-cube-left`, cubeSuffix)}
                />
                <Path
                  d={cube.right}
                  strokeWidth={.65}
                  fill={cubePalette.right}
                  stroke={cubePalette.rightStroke}
                  {...elementProps(`native-hero-cube-right`, cubeSuffix)}
                />
                <Path
                  d={cube.top}
                  strokeWidth={.8}
                  fill={`url(#${darkGradient})`}
                  stroke={cubePalette.topStroke}
                  {...elementProps(`native-hero-cube-top`, cubeSuffix)}
                />
              </G>
            );
            const opacity = cube.lit ? cube.glowOpacity : 1;

            return (
              <G key={cube.index} {...elementProps(`native-hero-cube`, cubeSuffix)}>
                <AnimatedPath
                  d={cube.left}
                  opacity={opacity}
                  strokeWidth={.65}
                  fill={cube.lit ? cubePalette.litLeft : cubePalette.left}
                  stroke={cube.lit ? cubePalette.litLeftStroke : cubePalette.leftStroke}
                  {...elementProps(`native-hero-cube-left`, cubeSuffix)}
                />
                <AnimatedPath
                  d={cube.right}
                  opacity={opacity}
                  strokeWidth={.65}
                  fill={cube.lit ? cubePalette.litRight : cubePalette.right}
                  stroke={cube.lit ? cubePalette.litRightStroke : cubePalette.rightStroke}
                  {...elementProps(`native-hero-cube-right`, cubeSuffix)}
                />
                {cube.lit && (
                  <AnimatedPath
                    d={cube.top}
                    fill={cubePalette.halo}
                    strokeWidth={7}
                    stroke={cubePalette.halo}
                    strokeLinejoin={`round`}
                    opacity={cube.haloOpacity}
                    {...elementProps(`native-hero-cube-glow`, cubeSuffix)}
                  />
                )}
                <AnimatedPath
                  d={cube.top}
                  opacity={opacity}
                  strokeWidth={.8}
                  fill={`url(#${cube.lit ? topGradient : darkGradient})`}
                  stroke={cube.lit ? cubePalette.litTopStroke : cubePalette.topStroke}
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

export default memo(HeroCubes);
