import type { DiscoveryBackdropVariant } from './types';
import { elementProps } from '../../shared/elementProps';
import type { ThemePalette } from '../../shared/themeContext/theme';
import Svg, { G, Defs, Path, Stop, Circle, Ellipse, LinearGradient, RadialGradient } from 'react-native-svg';

const nodes = [
  { x: 118, y: 128 },
  { x: 266, y: 232 },
  { x: 438, y: 176 },
  { x: 626, y: 294 },
  { x: 802, y: 192 },
  { x: 1042, y: 272 },
  { x: 1158, y: 126 },
  { x: 72, y: 720 },
  { x: 244, y: 602 },
  { x: 374, y: 642 },
  { x: 554, y: 484 },
  { x: 726, y: 548 },
  { x: 930, y: 352 },
  { x: 1122, y: 402 },
];

const orbits = [
  { rx: 280, ry: 174 },
  { rx: 374, ry: 242 },
  { rx: 464, ry: 308 },
];

interface BackdropArtProps {
  suffix: string;
  isDark: boolean;
  palette: ThemePalette;
  variant: DiscoveryBackdropVariant;
}

const BackdropArt = ({ suffix, isDark, palette, variant }: BackdropArtProps) => {
  const blue = isDark ? `#5b8ecd` : `#5b8ca5`;
  const orbitY = variant === `landing` ? 430 : 230;
  const glowX = variant === `landing` ? 860 : 1060;
  const tealGradient = `discovery-backdrop-teal-gradient-${suffix}`;
  const blueGradient = `discovery-backdrop-blue-gradient-${suffix}`;
  const lineGradient = `discovery-backdrop-line-gradient-${suffix}`;

  return (
    <Svg width={`100%`} height={`100%`} viewBox={`0 0 1200 900`} preserveAspectRatio={`xMidYMin meet`} {...elementProps(`discovery-backdrop-svg`, suffix)}>
      <Defs {...elementProps(`discovery-backdrop-defs`, suffix)}>
        <RadialGradient id={tealGradient} {...elementProps(`discovery-backdrop-teal-gradient`, suffix)}>
          <Stop offset={`0%`} stopColor={palette.accent} stopOpacity={isDark ? .32 : .24} {...elementProps(`discovery-backdrop-teal-center`, suffix)} />
          <Stop offset={`55%`} stopColor={palette.accent} stopOpacity={isDark ? .1 : .07} {...elementProps(`discovery-backdrop-teal-middle`, suffix)} />
          <Stop offset={`100%`} stopColor={palette.accent} stopOpacity={0} {...elementProps(`discovery-backdrop-teal-edge`, suffix)} />
        </RadialGradient>
        <RadialGradient id={blueGradient} {...elementProps(`discovery-backdrop-blue-gradient`, suffix)}>
          <Stop offset={`0%`} stopColor={blue} stopOpacity={isDark ? .23 : .18} {...elementProps(`discovery-backdrop-blue-center`, suffix)} />
          <Stop offset={`100%`} stopColor={blue} stopOpacity={0} {...elementProps(`discovery-backdrop-blue-edge`, suffix)} />
        </RadialGradient>
        <LinearGradient
          x1={`0`}
          y1={`0`}
          y2={`900`}
          x2={`1200`}
          id={lineGradient}
          gradientUnits={`userSpaceOnUse`}
          {...elementProps(`discovery-backdrop-line-gradient`, suffix)}
        >
          <Stop offset={`0%`} stopColor={palette.accent} stopOpacity={0} {...elementProps(`discovery-backdrop-line-start`, suffix)} />
          <Stop offset={`24%`} stopColor={palette.accent} stopOpacity={.35} {...elementProps(`discovery-backdrop-line-teal`, suffix)} />
          <Stop offset={`72%`} stopColor={blue} stopOpacity={.25} {...elementProps(`discovery-backdrop-line-blue`, suffix)} />
          <Stop offset={`100%`} stopColor={blue} stopOpacity={0} {...elementProps(`discovery-backdrop-line-end`, suffix)} />
        </LinearGradient>
      </Defs>
      <G {...elementProps(`discovery-backdrop-glows`, suffix)}>
        <Circle cx={glowX} cy={orbitY} r={370} fill={`url(#${tealGradient})`} {...elementProps(`discovery-backdrop-teal-glow`, suffix)} />
        <Circle cx={210} cy={730} r={310} fill={`url(#${blueGradient})`} {...elementProps(`discovery-backdrop-blue-glow`, suffix)} />
      </G>
      <G {...elementProps(`discovery-backdrop-orbits`, suffix)}>
        <G transform={`rotate(-18 930 ${orbitY})`} {...elementProps(`discovery-backdrop-orbit-plane`, suffix)}>
          {orbits.map((orbit, index) => (
            <Ellipse
              cx={930}
              cy={orbitY}
              fill={`none`}
              rx={orbit.rx}
              ry={orbit.ry}
              key={index}
              strokeWidth={1}
              stroke={`url(#${lineGradient})`}
              strokeDasharray={index === 1 ? `2 12` : undefined}
              {...elementProps(`discovery-backdrop-orbit`, `${suffix}-${index}`)}
            />
          ))}
        </G>
      </G>
      <G {...elementProps(`discovery-backdrop-constellation`, suffix)}>
        <Path
          fill={`none`}
          strokeWidth={.8}
          stroke={`url(#${lineGradient})`}
          d={`M118 128L266 232L438 176L626 294L802 192L1042 272L1158 126`}
          {...elementProps(`discovery-backdrop-north-links`, suffix)}
        />
        <Path
          fill={`none`}
          strokeWidth={.8}
          stroke={`url(#${lineGradient})`}
          d={`M72 720L244 602L374 642L554 484L726 548L930 352L1122 402`}
          {...elementProps(`discovery-backdrop-south-links`, suffix)}
        />
        {nodes.map((node, index) => (
          <Circle
            cx={node.x}
            cy={node.y}
            key={index}
            opacity={index % 4 === 0 ? .55 : .28}
            r={index % 4 === 0 ? 3.5 : 2}
            fill={index % 4 === 0 ? palette.accent : blue}
            {...elementProps(`discovery-backdrop-node`, `${suffix}-${index}`)}
          />
        ))}
      </G>
    </Svg>
  );
};

export default BackdropArt;
