import './styles.scss';
import { memo, useId, useRef, useEffect } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

const halfWidth = 45;
const faceSkew = 6;
const gridSize = 22;
const halfHeight = 32;
const scene = { x: 40, y: 10, width: 900, height: 625 };
const keyTimes = `0;.12;.55;.88;1`;
const keySplines = `0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1`;
const cubes = Array.from({ length: gridSize ** 2 }, (_, index) => {
  const row = Math.floor(index / gridSize);
  const column = index % gridSize;
  const seed = row * 41 + column * 29;
  const luminous = (row * 7 + column * 13) % 17 < 3;
  const peak = luminous ? 48 + seed % 5 * 11 : 18 + seed % 7 * 10;
  return {
    row,
    peak,
    index,
    column,
    luminous,
    animated: luminous || (row + column) % 2 === 0,
    x: 590 + (column - row) * 47,
    y: 10 + column * 40 + row * 27,
    delay: seed % 143 / 20,
    duration: 5.5 + seed % 7 * .5,
    rest: luminous ? 28 + seed % 4 * 10 : 7 + seed % 6 * 7,
  };
}).filter(cube => {
  const horizontalExtent = cube.luminous ? 91 : halfWidth;
  const lowerExtent = cube.luminous ? 80 : halfHeight;
  const upperExtent = (cube.luminous ? 40 : halfHeight) + Math.max(cube.peak, cube.rest);
  return cube.x + horizontalExtent >= scene.x && cube.x - horizontalExtent <= scene.x + scene.width
    && cube.y + lowerExtent >= scene.y && cube.y - upperExtent <= scene.y + scene.height;
}).sort((left, right) => left.row + left.column - right.row - right.column || left.column - right.column);
const luminousCubes = cubes.filter(cube => cube.luminous);

type CubeFace = `top` | `left` | `right`;
type Cube = (typeof cubes)[number];

const facePath = (face: CubeFace, height: number) => {
  if (face === `top`) return `M0 ${-halfHeight - height}L${halfWidth} ${faceSkew - height}L0 ${halfHeight - height}L${-halfWidth} ${-faceSkew - height}Z`;
  if (face === `left`) return `M${-halfWidth} ${-faceSkew - height}L0 ${halfHeight - height}L0 ${halfHeight}L${-halfWidth} ${-faceSkew}Z`;
  return `M0 ${halfHeight - height}L${halfWidth} ${faceSkew - height}L${halfWidth} ${faceSkew}L0 ${halfHeight}Z`;
};

const Face = ({ cube, face, suffix, moving }: { cube: Cube; face: CubeFace; suffix: string; moving: boolean }) => {
  const top = face === `top`;
  const id = `hero-cube-${face}-${suffix}-${cube.index}`;
  const heights = [5, 5, cube.peak, 5, 5];
  const values = heights.map(height => facePath(face, height)).join(`;`);
  const opacity = top ? `.48;.48;1;.48;.48` : `.18;.18;.95;.18;.18`;

  const shape = (
    <path
      id={id}
      strokeWidth={.7}
      d={facePath(face, top ? 0 : cube.rest)}
      fillOpacity={cube.luminous ? .85 : 1}
      className={`hero-cube-face hero-cube-${face}${cube.luminous ? ` hero-cube-face-luminous` : ``}`}
      fill={`url(#hero-cubes-${cube.luminous ? `light` : `dark`}-${face}-${suffix})`}
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
          fill={`url(#hero-cubes-floor-light-${suffix})`}
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

const HeroCubes = () => {
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
    <div aria-hidden id={`hero-cubes-${suffix}`} className={`hero-cubes`}>
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
          <radialGradient id={`hero-cubes-floor-light-${suffix}`} className={`hero-cubes-floor-light-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-glow)`} stopOpacity={.45} />
            <stop offset={`32%`} stopColor={`var(--cube-glow)`} stopOpacity={.18} />
            <stop offset={`100%`} stopColor={`var(--cube-glow)`} stopOpacity={0} />
          </radialGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`100%`} y2={`100%`} id={`hero-cubes-dark-top-${suffix}`} className={`hero-cubes-dark-top-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-dark-top-start)`} />
            <stop offset={`100%`} stopColor={`var(--cube-dark-top-end)`} />
          </linearGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`100%`} y2={`100%`} id={`hero-cubes-dark-left-${suffix}`} className={`hero-cubes-dark-left-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-dark-left-start)`} />
            <stop offset={`100%`} stopColor={`var(--cube-dark-left-end)`} />
          </linearGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`0%`} y2={`100%`} id={`hero-cubes-dark-right-${suffix}`} className={`hero-cubes-dark-right-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-dark-right-start)`} />
            <stop offset={`100%`} stopColor={`var(--cube-dark-right-end)`} />
          </linearGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`100%`} y2={`100%`} id={`hero-cubes-light-top-${suffix}`} className={`hero-cubes-light-top-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-highlight)`} />
            <stop offset={`100%`} stopColor={`var(--cube-glow)`} />
          </linearGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`0%`} y2={`100%`} id={`hero-cubes-light-left-${suffix}`} className={`hero-cubes-light-left-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-glow)`} />
            <stop offset={`100%`} stopColor={`var(--cube-light-left-end)`} />
          </linearGradient>
          <linearGradient x1={`0%`} y1={`0%`} x2={`0%`} y2={`100%`} id={`hero-cubes-light-right-${suffix}`} className={`hero-cubes-light-right-gradient`}>
            <stop offset={`0%`} stopColor={`var(--cube-side-light)`} />
            <stop offset={`100%`} stopColor={`var(--cube-light-right-end)`} />
          </linearGradient>
        </defs>
        <ellipse cx={640} cy={340} rx={530} ry={350} fill={`url(#hero-cubes-atmosphere-${suffix})`} id={`hero-cubes-atmosphere-${suffix}-shape`} className={`hero-cubes-atmosphere`} />
        <g id={`hero-cubes-floor-${suffix}`} className={`hero-cubes-floor`}>
          {cubes.map(cube => (
            <path
              key={cube.index}
              strokeWidth={.8}
              d={facePath(`top`, 0)}
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
              fill={`url(#hero-cubes-floor-light-${suffix})`}
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
          {cubes.map(cube => (
            <g
              key={cube.index}
              id={`hero-cube-${suffix}-${cube.index}`}
              transform={`translate(${cube.x} ${cube.y})`}
              className={`hero-cube${cube.luminous ? ` hero-cube-luminous` : ``}`}
            >
              <Face face={`left`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} />
              <Face face={`right`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} />
              <Face face={`top`} cube={cube} suffix={suffix} moving={!reducedMotion && cube.animated} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default memo(HeroCubes);
