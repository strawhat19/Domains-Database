import './styles.scss';
import { memo, useId, useRef, useEffect } from 'react';
import { getTileDepth, roundedTilePath } from './shapes';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

const halfWidth = 45;
const faceSkew = 6;
const gridSize = 22;
const halfHeight = 32;
const scene = { x: 40, y: 10, width: 900, height: 625 };
const lightTones = [`light`, `spring`, `jade`] as const;
const darkTones = [`dark`, `teal`, `forest`, `emerald`] as const;
const keyTimes = `0;.12;.55;.88;1`;
const keySplines = `0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1`;
const tiles = Array.from({ length: gridSize ** 2 }, (_, index) => {
  const row = Math.floor(index / gridSize);
  const column = index % gridSize;
  const seed = row * 41 + column * 29;
  const depth = getTileDepth(row, column);
  const lightIndex = (row * 7 + column * 13) % 17;
  const baseLuminous = lightIndex < 3;
  const toneIndex = (row * 11 + column * 7) % 10;
  const lightToneIndex = (row * 3 + column * 7) % 10;
  const peak = baseLuminous ? 48 + seed % 5 * 11 : 18 + seed % 7 * 10;
  const x = 590 + (column - row) * 47;
  const y = 10 + column * 40 + row * 27;
  const rest = baseLuminous ? 28 + seed % 4 * 10 : 7 + seed % 6 * 7;
  const centerDistance = Math.hypot(
    (x - scene.x - scene.width / 2) / (scene.width * .32),
    (y - rest - scene.y - scene.height / 2) / (scene.height * .32),
  );
  const centered = centerDistance <= 1;
  const inCore = centerDistance <= .55;
  const luminous = lightIndex < (centered ? 6 : 4);
  return {
    x,
    y,
    row,
    peak,
    rest,
    depth,
    index,
    column,
    luminous,
    lightTone: lightTones[inCore || lightToneIndex < 8 ? 0 : lightToneIndex - 7] ?? `light`,
    tone: centered || toneIndex < 6 ? `dark` : toneIndex < 8 ? `teal` : toneIndex === 8 ? `forest` : `emerald`,
    animated: luminous || (row + column) % 2 === 0,
    delay: seed % 143 / 20,
    duration: 5.5 + seed % 7 * .5,
  };
}).filter(cube => {
  const horizontalExtent = cube.luminous ? 91 : halfWidth;
  const lowerExtent = Math.max(cube.luminous ? 80 : halfHeight, halfHeight + cube.depth);
  const upperExtent = (cube.luminous ? 40 : halfHeight) + Math.max(cube.peak, cube.rest);
  return cube.x + horizontalExtent >= scene.x && cube.x - horizontalExtent <= scene.x + scene.width
    && cube.y + lowerExtent >= scene.y && cube.y - upperExtent <= scene.y + scene.height;
}).sort((left, right) => left.row + left.column - right.row - right.column || left.column - right.column);
const luminousCubes = tiles.filter(cube => cube.luminous);

type CubeFace = `top` | `left` | `right`;
type Cube = (typeof tiles)[number];

const facePath = (face: CubeFace, height: number, rounded = false, depth = 8) => {
  if (rounded) return roundedTilePath(face, height, { depth, faceSkew, halfWidth, halfHeight });
  if (face === `top`) return `M0 ${-halfHeight - height}L${halfWidth} ${faceSkew - height}L0 ${halfHeight - height}L${-halfWidth} ${-faceSkew - height}Z`;
  if (face === `left`) return `M${-halfWidth} ${-faceSkew - height}L0 ${halfHeight - height}L0 ${halfHeight}L${-halfWidth} ${-faceSkew}Z`;
  return `M0 ${halfHeight - height}L${halfWidth} ${faceSkew - height}L${halfWidth} ${faceSkew}L0 ${halfHeight}Z`;
};

const Face = ({ cube, face, suffix, moving, rounded }: { cube: Cube; face: CubeFace; suffix: string; moving: boolean; rounded: boolean }) => {
  const top = face === `top`;
  const id = `hero-cube-${face}-${suffix}-${cube.index}`;
  const heights = [5, 5, cube.peak, 5, 5];
  const values = heights.map(height => facePath(face, height, rounded, cube.depth)).join(`;`);
  const opacity = top ? `.48;.48;1;.48;.48` : `.18;.18;.95;.18;.18`;

  const shape = (
    <path
      id={id}
      strokeWidth={.7}
      d={facePath(face, top ? 0 : cube.rest, rounded, cube.depth)}
      fillOpacity={cube.luminous ? .85 : 1}
      className={`hero-cube-face hero-cube-${face}${cube.luminous ? ` hero-cube-face-luminous` : ``}`}
      fill={`url(#hero-cubes-${cube.luminous ? cube.lightTone : cube.tone}-${face}-${suffix})`}
    >
      {moving && !top && (
        <animate
          values={values}
          keyTimes={keyTimes}
          attributeName={`d`}
          calcMode={`spline`}
          keySplines={keySplines}
          repeatCount={`indefinite`}
          dur={`${cube.duration}s`}
          begin={`${-cube.delay}s`}
          id={`${id}-lift`}
          className={`hero-cube-lift`}
        />
      )}
      {moving && cube.luminous && (
        <animate
          values={opacity}
          keyTimes={keyTimes}
          calcMode={`spline`}
          keySplines={keySplines}
          repeatCount={`indefinite`}
          dur={`${cube.duration}s`}
          begin={`${-cube.delay}s`}
          attributeName={`fill-opacity`}
          id={`${id}-illumination`}
          className={`hero-cube-illumination`}
        />
      )}
    </path>
  );
  if (!top) return shape;
  return (
    <g id={`${id}-motion`} className={`hero-cube-top-motion`} transform={`translate(0 ${-cube.rest})`}>
      {cube.luminous && (
        <ellipse
          ry={40}
          rx={70}
          fillOpacity={.3}
          id={`${id}-halo`}
          className={`hero-cube-top-halo`}
          fill={`url(#hero-cubes-floor-light-${cube.lightTone}-${suffix})`}
        />
      )}
      {shape}
      {moving && (
        <animateTransform
          type={`translate`}
          keyTimes={keyTimes}
          calcMode={`spline`}
          keySplines={keySplines}
          attributeName={`transform`}
          repeatCount={`indefinite`}
          dur={`${cube.duration}s`}
          begin={`${-cube.delay}s`}
          id={`${id}-lift`}
          className={`hero-cube-lift`}
          values={heights.map(height => `0 ${-height}`).join(`;`)}
        />
      )}
    </g>
  );
};

const HeroCubes = ({ cubes = true }: { cubes?: boolean }) => {
  const suffix = useId().replace(/[^a-zA-Z0-9_-]/g, ``);
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let visible = true;
    const updateMotion = () => {
      const paused = reducedMotion || document.hidden || !visible;
      svg.dataset.motion = paused ? `paused` : `running`;
      if (paused) svg.pauseAnimations?.();
      else svg.unpauseAnimations?.();
    };
    const observer = typeof IntersectionObserver === `undefined` ? undefined : new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      updateMotion();
    });
    observer?.observe(svg);
    document.addEventListener(`visibilitychange`, updateMotion);
    updateMotion();
    return () => {
      observer?.disconnect();
      document.removeEventListener(`visibilitychange`, updateMotion);
      svg.pauseAnimations?.();
    };
  }, [reducedMotion]);

  return (
    <div aria-hidden id={`hero-cubes-${suffix}`} className={`hero-cubes`} data-shape={cubes ? `cubes` : `slabs`}>
      <svg
        ref={svgRef}
        width={`100%`}
        height={`100%`}
        focusable={`false`}
        viewBox={`${scene.x} ${scene.y} ${scene.width} ${scene.height}`}
        id={`hero-cubes-svg-${suffix}`}
        className={`hero-cubes-svg`}
        preserveAspectRatio={`xMidYMid slice`}
        data-motion={reducedMotion ? `paused` : `running`}
      >
        <defs id={`hero-cubes-defs-${suffix}`} className={`hero-cubes-defs`}>
          <radialGradient id={`hero-cubes-atmosphere-${suffix}`} className={`hero-cubes-atmosphere-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-glow)`} stopOpacity={.24} />
            <stop offset={`48%`} stopColor={`var(--cube-glow)`} stopOpacity={.08} />
            <stop offset={`100%`} stopColor={`var(--cube-glow)`} stopOpacity={0} />
          </radialGradient>
          {lightTones.map(tone => (
            <radialGradient key={tone} id={`hero-cubes-floor-light-${tone}-${suffix}`} className={`hero-cubes-floor-light-gradient`}>
              <stop offset={`0%`} stopColor={`var(--cube-${tone}-top-end)`} stopOpacity={.45} />
              <stop offset={`32%`} stopColor={`var(--cube-${tone}-top-end)`} stopOpacity={.18} />
              <stop offset={`100%`} stopColor={`var(--cube-${tone}-top-end)`} stopOpacity={0} />
            </radialGradient>
          ))}
          {darkTones.flatMap(tone => ([`top`, `left`, `right`] as const).map(face => (
            <linearGradient
              x1={`0%`}
              y1={`0%`}
              y2={`100%`}
              key={`${tone}-${face}`}
              x2={face === `right` ? `0%` : `100%`}
              id={`hero-cubes-${tone}-${face}-${suffix}`}
              className={`hero-cubes-${tone}-${face}-gradient`}
            >
              <stop offset={`0%`} stopColor={`var(--cube-${tone}-${face}-start)`} />
              <stop offset={`100%`} stopColor={`var(--cube-${tone}-${face}-end)`} />
            </linearGradient>
          )))}
          {lightTones.flatMap(tone => ([`top`, `left`, `right`] as const).map(face => (
            <linearGradient
              x1={`0%`}
              y1={`0%`}
              y2={`100%`}
              key={`${tone}-${face}`}
              x2={face === `top` ? `100%` : `0%`}
              id={`hero-cubes-${tone}-${face}-${suffix}`}
              className={`hero-cubes-${tone}-${face}-gradient`}
            >
              <stop offset={`0%`} stopColor={`var(--cube-${tone}-${face}-start)`} />
              {tone === `light` && face === `top` && <stop offset={`30%`} stopColor={`var(--cube-light-top-end)`} />}
              <stop offset={`100%`} stopColor={`var(--cube-${tone}-${face}-end)`} />
            </linearGradient>
          )))}
        </defs>
        <ellipse cx={640} cy={340} rx={530} ry={350} fill={`url(#hero-cubes-atmosphere-${suffix})`} id={`hero-cubes-atmosphere-${suffix}-shape`} className={`hero-cubes-atmosphere`} />
        <g id={`hero-cubes-floor-${suffix}`} className={`hero-cubes-floor`}>
          {tiles.map(cube => (
            <path
              key={cube.index}
              strokeWidth={.8}
              d={facePath(`top`, 0, !cubes)}
              className={`hero-cubes-floor-tile`}
              id={`hero-cubes-floor-tile-${suffix}-${cube.index}`}
              transform={`translate(${cube.x} ${cube.y})`}
            />
          ))}
        </g>
        <g id={`hero-cubes-floor-glows-${suffix}`} className={`hero-cubes-floor-glows`}>
          {luminousCubes.map(cube => (
            <ellipse
              rx={91}
              ry={64}
              cx={cube.x}
              cy={cube.y + 16}
              key={cube.index}
              fillOpacity={.6}
              className={`hero-cubes-floor-glow`}
              fill={`url(#hero-cubes-floor-light-${cube.lightTone}-${suffix})`}
              id={`hero-cubes-floor-glow-${suffix}-${cube.index}`}
            >
              {!reducedMotion && (
                <animate
                  keyTimes={keyTimes}
                  calcMode={`spline`}
                  keySplines={keySplines}
                  repeatCount={`indefinite`}
                  dur={`${cube.duration}s`}
                  begin={`${-cube.delay}s`}
                  attributeName={`fill-opacity`}
                  values={`.12;.12;.9;.12;.12`}
                  className={`hero-cubes-floor-glow-pulse`}
                  id={`hero-cubes-floor-glow-pulse-${suffix}-${cube.index}`}
                />
              )}
            </ellipse>
          ))}
        </g>
        <g id={`hero-cubes-field-${suffix}`} className={`hero-cubes-field`}>
          {tiles.map(cube => (
            <g
              key={cube.index}
              id={`hero-cube-${suffix}-${cube.index}`}
              data-light-tone={cube.luminous ? cube.lightTone : undefined}
              transform={`translate(${cube.x} ${cube.y})`}
              className={`hero-cube${cube.luminous ? ` hero-cube-luminous` : ``}`}
            >
              <Face face={`left`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} rounded={!cubes} />
              <Face face={`right`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} rounded={!cubes} />
              <Face face={`top`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} rounded={!cubes} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default memo(HeroCubes);
