import './styles.scss';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface PortfolioCollapseProps {
  id: string;
  collapsed: boolean;
  children: ReactNode;
}

const PortfolioCollapse = ({ id, collapsed, children }: PortfolioCollapseProps) => {
  const [animation, setAnimation] = useState({ collapsed, active: false });
  if (animation.collapsed !== collapsed) setAnimation({ collapsed, active: true });

  useEffect(() => {
    if (!animation.active) return;
    const finish = () => setAnimation(current => ({ ...current, active: false }));
    if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
      finish();
      return;
    }
    const timeout = window.setTimeout(finish, 240);
    return () => window.clearTimeout(timeout);
  }, [collapsed, animation.active]);

  return (
    <div
      id={id}
      inert={collapsed}
      aria-hidden={collapsed || undefined}
      data-collapsed={collapsed}
      className={`portfolio-collapse${collapsed ? ` portfolio-collapse-closed` : ``}${animation.active ? ` portfolio-collapse-transitioning` : ``}`}
      onTransitionEnd={event => {
        if (event.target === event.currentTarget && event.propertyName === `grid-template-rows`) {
          setAnimation(current => ({ ...current, active: false }));
        }
      }}
    >
      <div id={`${id}-content`} className={`portfolio-collapse-content`}>
        {children}
      </div>
    </div>
  );
};

export default PortfolioCollapse;
