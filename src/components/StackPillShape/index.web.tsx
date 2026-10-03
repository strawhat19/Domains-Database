import './styles.scss';
import { stackPillPath } from './shape';
import type { StackPillShapeProps } from './shape';
import { useEffect, useRef, useState } from 'react';

const StackPillShape = ({ id, fill, stroke }: StackPillShapeProps) => {
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    if (typeof ResizeObserver !== `undefined`) {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener(`resize`, measure);
    return () => window.removeEventListener(`resize`, measure);
  }, []);
  return (
    <svg
      ref={svg}
      focusable={false}
      aria-hidden={true}
      id={`${id}-stack-shape`}
      className={`stack-pill-shape`}
      preserveAspectRatio={`none`}
      viewBox={size.width > 0 && size.height > 0 ? `0 0 ${size.width} ${size.height}` : undefined}
    >
      <path
        style={{ fill, stroke }}
        vectorEffect={`non-scaling-stroke`}
        id={`${id}-stack-shape-path`}
        className={`stack-pill-shape-path`}
        d={stackPillPath(size.width, size.height)}
      />
    </svg>
  );
};

export default StackPillShape;
