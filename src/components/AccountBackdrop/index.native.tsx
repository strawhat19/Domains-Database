import { createStyles } from './styles.native';
import { useRef, useMemo, useEffect } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { backdropDots, backdropSlabs, slabFaces } from './content';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import Svg, { G, Defs, Path, Mask, Rect, Stop, Circle, RadialGradient } from 'react-native-svg';
import { AppState, Animated, Easing, View, StyleSheet, useWindowDimensions } from 'react-native';

const AccountBackdrop = ({ top = 0 }: { top?: number }) => {
  const { width } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(.82)).current;
  const compact = width <= 650;
  const styles = useMemo(() => createStyles(isDark, compact), [isDark, compact]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    const update = (state: string | null) => {
      animation?.stop();
      animation = null;
      opacity.setValue(.82);
      if (reducedMotion || state !== `active`) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), isInteraction: false, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: .7, duration: 7000, easing: Easing.inOut(Easing.sin), isInteraction: false, useNativeDriver: true }),
      ]));
      animation.start();
    };
    update(AppState.currentState);
    const subscription = AppState.addEventListener(`change`, update);
    return () => { subscription.remove(); animation?.stop(); };
  }, [opacity, reducedMotion]);

  return <View {...elementProps(`native-account-backdrop`)} pointerEvents={`none`} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} style={[styles.root, { top }]}>
    <Animated.View {...elementProps(`native-account-backdrop-motifs`)} style={[StyleSheet.absoluteFill, { opacity }]}>
      <View {...elementProps(`native-account-backdrop-wash`)} style={styles.wash}>
        <Svg {...elementProps(`native-account-backdrop-wash-svg`)} width={`100%`} height={`100%`} viewBox={`0 0 300 300`}>
          <Defs><RadialGradient id={`native-account-backdrop-wash-gradient`}><Stop offset={0} stopColor={palette.accent} stopOpacity={.8} /><Stop offset={1} stopColor={palette.accent} stopOpacity={0} /></RadialGradient></Defs>
          <Circle cx={150} cy={150} r={145} fill={`url(#native-account-backdrop-wash-gradient)`} />
        </Svg>
      </View>
      <View {...elementProps(`native-account-backdrop-dots`)} style={styles.dots}>
        <Svg {...elementProps(`native-account-backdrop-dots-svg`)} width={`100%`} height={`100%`} viewBox={`0 0 200 150`}>
          <Defs>
            <RadialGradient id={`native-account-backdrop-dot-fade`}><Stop offset={0} stopColor={`#ffffff`} /><Stop offset={.6} stopColor={`#ffffff`} /><Stop offset={1} stopColor={`#ffffff`} stopOpacity={0} /></RadialGradient>
            <Mask id={`native-account-backdrop-dot-mask`}><Rect width={200} height={150} fill={`url(#native-account-backdrop-dot-fade)`} /></Mask>
          </Defs>
          <G mask={`url(#native-account-backdrop-dot-mask)`}>{backdropDots.map(dot => <Circle key={dot.index} {...elementProps(`native-account-backdrop-dot`, `${dot.index}`)} r={2.4} cx={dot.x} cy={dot.y} fill={palette.accent} opacity={dot.opacity} />)}</G>
        </Svg>
      </View>
      <View {...elementProps(`native-account-backdrop-slabs`)} style={styles.slabs}>
        <Svg {...elementProps(`native-account-backdrop-slabs-svg`)} width={`100%`} height={`100%`} viewBox={`0 0 320 220`}>
          {backdropSlabs.map(slab => <G key={slab.index} {...elementProps(`native-account-backdrop-slab`, `${slab.index}`)} transform={`translate(${slab.x} ${slab.y})`}>
            <Path {...elementProps(`native-account-backdrop-slab-left`, `${slab.index}`)} d={slabFaces.left} fill={palette.accent} fillOpacity={.08} stroke={palette.accent} strokeWidth={.8} opacity={.4} />
            <Path {...elementProps(`native-account-backdrop-slab-right`, `${slab.index}`)} d={slabFaces.right} fill={palette.accent} fillOpacity={.12} stroke={palette.accent} strokeWidth={.8} opacity={.65} />
            <Path {...elementProps(`native-account-backdrop-slab-top`, `${slab.index}`)} d={slabFaces.top} fill={palette.accent} fillOpacity={.06} stroke={palette.accent} strokeWidth={.9} />
          </G>)}
        </Svg>
      </View>
    </Animated.View>
  </View>;
};

export default AccountBackdrop;
