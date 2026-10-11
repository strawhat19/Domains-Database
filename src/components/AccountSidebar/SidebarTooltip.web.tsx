import './tooltip.scss';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { TooltipState } from './useSidebarTooltip';

type TooltipProps = {
  tooltip: TooltipState | null;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

const SidebarTooltip = ({ tooltip, onPointerEnter, onPointerLeave }: TooltipProps) => {
  if (!tooltip) return null;
  const style = {
    top: tooltip.top,
    left: tooltip.left,
    [`--account-sidebar-tooltip-arrow-top`]: `${tooltip.arrowTop}px`,
  } as CSSProperties;

  return createPortal(
    <div
      style={style}
      id={tooltip.id}
      role={`tooltip`}
      aria-hidden={!tooltip.open}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`account-sidebar-tooltip is-${tooltip.side}${tooltip.open ? ` is-open` : ``}`}
    >
      <span id={`${tooltip.id}-label`} className={`account-sidebar-tooltip-label`}>{tooltip.label}</span>
    </div>,
    document.body,
  );
};

export default SidebarTooltip;
