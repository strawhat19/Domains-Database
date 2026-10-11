import { useId, useRef, useState, useEffect, useCallback, useLayoutEffect, type FocusEvent, type PointerEvent } from 'react';

export type TooltipState = {
  id: string;
  top: number;
  open: boolean;
  left: number;
  label: string;
  arrowTop: number;
  triggerId: string;
  measuring: boolean;
  side: `left` | `right`;
};

const getTrigger = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>(`[data-tooltip]`) : null;

export const useSidebarTooltip = () => {
  const tooltipId = `account-sidebar-tooltip-${useId()}`;
  const showTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);
  const hoveredTrigger = useRef<HTMLElement | null>(null);
  const focusedTrigger = useRef<HTMLElement | null>(null);
  const activeTrigger = useRef<HTMLElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const keepTooltip = useCallback(() => window.clearTimeout(hideTimer.current), []);
  const showTooltip = useCallback((trigger: HTMLElement, delay = 180) => {
    if (activeTrigger.current === trigger && delay) return;
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    if (activeTrigger.current !== trigger) setTooltip((current) => current ? { ...current, open: false, measuring: false } : null);
    activeTrigger.current = trigger;
    const show = () => {
      const label = trigger.dataset.tooltip;
      showTimer.current = undefined;
      if (!label || !trigger.isConnected) return;
      const bounds = trigger.getBoundingClientRect();
      setTooltip({
        label,
        open: false,
        arrowTop: 16,
        id: tooltipId,
        side: `right`,
        measuring: true,
        triggerId: trigger.id,
        left: bounds.right + 12,
        top: bounds.top + bounds.height / 2,
      });
    };
    if (delay) showTimer.current = window.setTimeout(show, delay);
    else show();
  }, [tooltipId]);

  const hideTooltip = useCallback((delay = 0) => {
    if (!activeTrigger.current) return;
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    const close = () => {
      activeTrigger.current = null;
      setTooltip((current) => current ? { ...current, open: false, measuring: false } : null);
      hideTimer.current = window.setTimeout(() => setTooltip(null), 160);
    };
    if (delay) hideTimer.current = window.setTimeout(close, delay);
    else close();
  }, []);

  const dismissTooltip = useCallback(() => {
    hoveredTrigger.current = null;
    focusedTrigger.current = null;
    hideTooltip();
  }, [hideTooltip]);

  useLayoutEffect(() => {
    if (!tooltip?.measuring) return;
    const trigger = activeTrigger.current;
    const element = document.getElementById(tooltip.id);
    if (!trigger || !element) return;
    const bounds = trigger.getBoundingClientRect();
    const { width, height } = element.getBoundingClientRect();
    const center = bounds.top + bounds.height / 2;
    const side = bounds.right + width + 24 <= window.innerWidth ? `right` : `left`;
    const top = Math.max(12, Math.min(center - height / 2, window.innerHeight - height - 12));
    const left = Math.max(12, Math.min(side === `right` ? bounds.right + 12 : bounds.left - width - 12, window.innerWidth - width - 12));
    const arrowTop = Math.max(10, Math.min(center - top, height - 10));
    setTooltip((current) => current?.measuring ? { ...current, top, left, side, arrowTop, open: true, measuring: false } : current);
  }, [tooltip]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === `Escape`) dismissTooltip(); };
    window.addEventListener(`resize`, dismissTooltip);
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`scroll`, dismissTooltip, true);
    return () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      window.removeEventListener(`resize`, dismissTooltip);
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`scroll`, dismissTooltip, true);
    };
  }, [dismissTooltip]);

  const tooltipEvents = {
    onClickCapture: dismissTooltip,
    onFocusCapture: (event: FocusEvent<HTMLElement>) => {
      const trigger = getTrigger(event.target);
      focusedTrigger.current = trigger;
      if (trigger) showTooltip(trigger, 0);
    },
    onBlurCapture: () => {
      focusedTrigger.current = null;
      if (hoveredTrigger.current) showTooltip(hoveredTrigger.current, 0);
      else hideTooltip();
    },
    onPointerOver: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === `touch`) return;
      const trigger = getTrigger(event.target);
      if (!trigger || !event.currentTarget.contains(trigger)) return;
      hoveredTrigger.current = trigger;
      showTooltip(trigger);
    },
    onPointerOut: (event: PointerEvent<HTMLElement>) => {
      const trigger = getTrigger(event.target);
      if (!trigger || (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget))) return;
      hoveredTrigger.current = null;
      if (focusedTrigger.current) showTooltip(focusedTrigger.current, 0);
      else hideTooltip(100);
    },
  };
  const getTooltipProps = (triggerId: string, label?: string) => ({
    'data-tooltip': label,
    'aria-describedby': tooltip?.open && tooltip.triggerId === triggerId ? tooltip.id : undefined,
  });
  const leaveTooltip = () => {
    if (!focusedTrigger.current) hideTooltip(100);
  };

  return { tooltip, tooltipEvents, keepTooltip, leaveTooltip, getTooltipProps };
};
