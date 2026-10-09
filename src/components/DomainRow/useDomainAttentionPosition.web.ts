import { useRef, useEffect, useLayoutEffect } from 'react';

const attentionLeftProperty = `--domain-attention-left`;
const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useDomainAttentionPosition = (enabled: boolean, layoutKey: string) => {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useBrowserLayoutEffect(() => {
    const row = rowRef.current;
    const cell = row?.querySelector<HTMLTableCellElement>(`.domain-selection-cell`);
    if (!row || !cell) return;
    if (!enabled) {
      cell.style.removeProperty(attentionLeftProperty);
      return;
    }

    let active = true;
    let frame: number | null = null;
    const measure = () => {
      if (!active) return;
      const checkbox = row.querySelector<HTMLInputElement>(`.domain-selection`);
      const icon = row.querySelector<HTMLElement>(`.domain-identity > .domain-site-icon`);
      if (!checkbox || !icon) {
        cell.style.removeProperty(attentionLeftProperty);
        return;
      }
      const cellRect = cell.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const checkboxRect = checkbox.getBoundingClientRect();
      if (!checkboxRect.width || !iconRect.width) {
        cell.style.removeProperty(attentionLeftProperty);
        return;
      }
      const midpoint = (checkboxRect.left + checkboxRect.width / 2 + iconRect.left + iconRect.width / 2) / 2;
      const value = `${midpoint - cellRect.left - cell.clientLeft}px`;
      if (cell.style.getPropertyValue(attentionLeftProperty) !== value) cell.style.setProperty(attentionLeftProperty, value);
    };
    const schedule = () => {
      if (!active || frame !== null) return;
      frame = window.requestAnimationFrame(() => { frame = null; measure(); });
    };
    const observer = typeof ResizeObserver === `undefined` ? undefined : new ResizeObserver(schedule);
    observer?.observe(row);
    Array.from(row.cells).forEach(rowCell => observer?.observe(rowCell));
    const checkbox = row.querySelector<HTMLInputElement>(`.domain-selection`);
    const identity = row.querySelector<HTMLElement>(`.domain-identity`);
    const table = row.closest(`table`);
    if (table) observer?.observe(table);
    if (checkbox) observer?.observe(checkbox);
    if (identity) observer?.observe(identity);
    window.addEventListener(`resize`, schedule, { passive: true });
    measure();

    return () => {
      active = false;
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener(`resize`, schedule);
      cell.style.removeProperty(attentionLeftProperty);
    };
  }, [enabled, layoutKey]);

  return rowRef;
};
