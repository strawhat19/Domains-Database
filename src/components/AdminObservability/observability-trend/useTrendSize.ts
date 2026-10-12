import { useRef, useState, useEffect } from 'react';

const useTrendSize = () => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 218 });
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
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
  return { size, plotRef };
};

export default useTrendSize;
