import { useRef } from 'react';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioContextMenu } from '../PortfolioContextMenu/usePortfolioContextMenu';

export type GroupContextMenuAction = `delete` | `convert` | `convert-to-app` | `convert-to-group` | `assign-collection`;

export const useGroupContextMenu = (
  onAction: (action: GroupContextMenuAction, group: CustomPortfolioGroup, collectionId?: string) => void,
  disabled = false,
) => {
  const actionHandler = useRef(onAction);
  const { menu, runAction, ...controls } = usePortfolioContextMenu<CustomPortfolioGroup>(disabled, `.portfolio-group-settings`);
  actionHandler.current = onAction;

  const activate = (action: GroupContextMenuAction, collectionId?: string) => {
    if (!menu || (action === `delete` && menu.target.isApp) || (action === `assign-collection` && !collectionId)) return;
    runAction(() => actionHandler.current(action, menu.target, collectionId));
  };

  return {
    ...controls,
    activate,
    menu: menu && { x: menu.x, y: menu.y, group: menu.target },
  };
};
