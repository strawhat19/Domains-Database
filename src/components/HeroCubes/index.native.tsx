import { styles } from './styles.native';
import { getTileDepth, roundedTilePath } from './shapes';
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
    tones: [
      { left: `#0a261c`, right: `#061911`, topEnd: `#071f18`, topStart: `#12382d` },
      { left: `#082e1a`, right: `#051e12`, topEnd: `#08261a`, topStart: `#10422b` },
      { left: `#093323`, right: `#052216`, topEnd: `#082d20`, topStart: `#0f4c35` },
    ],
    litTones: [
      {
        halo: `#42ef9a`,
        topEnd: `#139c60`,
        litLeft: `#13794f`,
        topPale: `#7fffc3`,
        topTeal: `#20d982`,
        litRight: `#0a593b`,
        litTopStroke: `#67edab`,
        litLeftStroke: `#248c60`,
        litRightStroke: `#187047`,
      },
      {
        halo: `#25d88a`,
        topEnd: `#08794a`,
        litLeft: `#0d6742`,
        topPale: `#6af5a9`,
        topTeal: `#10b96d`,
        litRight: `#08472f`,
        litTopStroke: `#51d98f`,
        litLeftStroke: `#1c7c52`,
        litRightStroke: `#125e3e`,
      },
    ],
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
    tones: [
      { left: `#bfdacf`, right: `#93bcac`, topEnd: `#cee5dc`, topStart: `#f0fbf7` },
      { left: `#bfdacb`, right: `#91baa6`, topEnd: `#cee5d7`, topStart: `#f1fbf5` },
      { left: `#b6d8c7`, right: `#83b79f`, topEnd: `#c7e5d6`, topStart: `#eafbf3` },
    ],
    litTones: [
      {
        halo: `#58d99d`,
        topEnd: `#219868`,
        litLeft: `#49ae83`,
        topPale: `#e1fff0`,
        topTeal: `#58d99d`,
        litRight: `#257b5d`,
        litTopStroke: `#239a69`,
        litLeftStroke: `#3c9774`,
        litRightStroke: `#277f5c`,
      },
      {
        halo: `#36c987`,
        topEnd: `#187a54`,
        litLeft: `#349575`,
        topPale: `#d9ffe9`,
        topTeal: `#3bc087`,
        litRight: `#236653`,
        litTopStroke: `#188b60`,
        litLeftStroke: `#268769`,
        litRightStroke: `#1d7154`,
      },
    ],
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
  const x = 420 + (column - row) * 32;
  const y = 6 + column * 27 + row * 19;
  const heights = wave.map(value => height + value * amplitude);
  const restingY = y - (heights?.[0] ?? 0);
  const centerOffsetX = (x - viewBox.x - viewBox.width / 2) / (viewBox.width * .32);
  const centerOffsetY = (restingY - viewBox.y - viewBox.height / 2) / (viewBox.height * .32);
  const centerDistance = Math.hypot(centerOffsetX, centerOffsetY);
  const inCore = centerDistance <= .55;
  const inCenter = centerDistance <= 1;

  return {
    x,
    y,
    row,
    index,
    column,
    heights,
    inCore,
    inCenter,
    depth: getTileDepth(row, column),
    lit: seed < (inCenter ? 12 : 7),
    glow: wave.map(value => .72 + value * .28),
    halo: wave.map(value => .08 + value * .18),
  };
}).filter(cube => (
  cube.x + halfWidth + faceSkew >= viewBox.x
  && cube.x - halfWidth - faceSkew <= viewBox.x + viewBox.width
  && cube.y + halfHeight + faceSkew + cube.depth >= viewBox.y
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
      if (!cubes) return roundedTilePath(face, height, { x, y, faceSkew, halfWidth, halfHeight, depth: cube.depth });
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
            <Stop offset={`0%`} stopColor={palette.accent} {...elementProps(`native-hero-cubes-top-pale`, suffix)} />
            <Stop offset={`55%`} stopColor={palette.accent} {...elementProps(`native-hero-cubes-top-teal`, suffix)} />
            <Stop offset={`100%`} stopColor={palette.accent} {...elementProps(`native-hero-cubes-top-accent`, suffix)} />
          </LinearGradient>
          {cubePalette.litTones.map((tone, index) => (
            <LinearGradient
              x1={`0%`}
              y1={`0%`}
              x2={`100%`}
              y2={`100%`}
              key={index}
              id={`${topGradient}-${index}`}
              {...elementProps(`native-hero-cubes-lit-gradient`, `${suffix}-${index}`)}
            >
              <Stop offset={`0%`} stopColor={tone.topPale} {...elementProps(`native-hero-cubes-lit-pale`, `${suffix}-${index}`)} />
              <Stop offset={`55%`} stopColor={tone.topTeal} {...elementProps(`native-hero-cubes-lit-green`, `${suffix}-${index}`)} />
              <Stop offset={`100%`} stopColor={tone.topEnd} {...elementProps(`native-hero-cubes-lit-end`, `${suffix}-${index}`)} />
            </LinearGradient>
          ))}
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
          {cubePalette.tones.map((tone, index) => (
            <LinearGradient
              x1={`0%`}
              y1={`0%`}
              x2={`100%`}
              y2={`100%`}
              key={index}
              id={`${darkGradient}-${index}`}
              {...elementProps(`native-hero-cubes-tone-gradient`, `${suffix}-${index}`)}
            >
              <Stop offset={`0%`} stopColor={tone.topStart} {...elementProps(`native-hero-cubes-tone-start`, `${suffix}-${index}`)} />
              <Stop offset={`100%`} stopColor={tone.topEnd} {...elementProps(`native-hero-cubes-tone-end`, `${suffix}-${index}`)} />
            </LinearGradient>
          ))}
        </Defs>
        <G {...elementProps(`native-hero-cubes-grid`, suffix)}>
          {faces.map(cube => {
            const cubeSuffix = `${suffix}-${cube.index}`;
            const inCenter = cube.inCenter;
            const toneIndex = (cube.row * 11 + cube.column * 7) % 10;
            const toneVariant = toneIndex < 8 ? 0 : toneIndex - 7;
            const tone = cube.lit || inCenter || toneIndex < 6 ? undefined : cubePalette.tones[toneVariant];
            const leftColor = tone?.left ?? cubePalette.left;
            const rightColor = tone?.right ?? cubePalette.right;
            const faceGradient = tone ? `${darkGradient}-${toneVariant}` : darkGradient;
            const shadeIndex = (cube.row * 3 + cube.column * 7) % 10;
            const litToneIndex = cube.inCore || shadeIndex < 8 ? 0 : shadeIndex - 7;
            const litTone = cube.lit && litToneIndex ? cubePalette.litTones[litToneIndex - 1] : undefined;
            const litPalette = litTone ?? cubePalette;
            const haloColor = litTone?.halo ?? palette.accent;
            const litStroke = litTone?.litTopStroke ?? palette.accent;
            const lightGradient = litTone ? `${topGradient}-${litToneIndex - 1}` : topGradient;
            if (!cube.animated) return (
              <G key={cube.index} {...elementProps(`native-hero-cube`, cubeSuffix)}>
                <Path
                  d={cube.left}
                  strokeWidth={.65}
                  fill={leftColor}
                  stroke={cubePalette.leftStroke}
                  {...elementProps(`native-hero-cube-left`, cubeSuffix)}
                />
                <Path
                  d={cube.right}
                  strokeWidth={.65}
                  fill={rightColor}
                  stroke={cubePalette.rightStroke}
                  {...elementProps(`native-hero-cube-right`, cubeSuffix)}
                />
                <Path
                  d={cube.top}
                  strokeWidth={.8}
                  fill={`url(#${faceGradient})`}
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
                  fill={cube.lit ? litPalette.litLeft : leftColor}
                  stroke={cube.lit ? litPalette.litLeftStroke : cubePalette.leftStroke}
                  {...elementProps(`native-hero-cube-left`, cubeSuffix)}
                />
                <AnimatedPath
                  d={cube.right}
                  opacity={opacity}
                  strokeWidth={.65}
                  fill={cube.lit ? litPalette.litRight : rightColor}
                  stroke={cube.lit ? litPalette.litRightStroke : cubePalette.rightStroke}
                  {...elementProps(`native-hero-cube-right`, cubeSuffix)}
                />
                {cube.lit && (
                  <AnimatedPath
                    d={cube.top}
                    fill={haloColor}
                    strokeWidth={7}
                    stroke={haloColor}
                    strokeLinejoin={`round`}
                    opacity={cube.haloOpacity}
                    {...elementProps(`native-hero-cube-glow`, cubeSuffix)}
                  />
                )}
                <AnimatedPath
                  d={cube.top}
                  opacity={opacity}
                  strokeWidth={.8}
                  fill={`url(#${cube.lit ? lightGradient : faceGradient})`}
                  stroke={cube.lit ? litStroke : cubePalette.topStroke}
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
