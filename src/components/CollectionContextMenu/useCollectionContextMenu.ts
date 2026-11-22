import { useEffect, useState } from 'react';
import { usePortfolioContextMenu } from '../PortfolioContextMenu/usePortfolioContextMenu';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import type { CollectionSettingsSection } from '../DomainCollectionSettings/useDomainCollectionSettings';

type SettingsAction = CollectionSettingsSection | `description`;
export type CollectionMenuAction = SettingsAction | `sort` | `collapse` | `visibility`;

export const useCollectionContextMenu = (disabled: boolean) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [dialog, setDialog] = useState<{ id: string; section: SettingsAction } | null>(null);
  const controller = usePortfolioContextMenu<string>(disabled || Boolean(dialog), `.portfolio-collection-settings, .mobile-board-icon`);
  const id = dialog?.id ?? controller.menu?.target;
  const collection = preferences.collections.find(item => item.id === id);
  const hidden = Boolean(id && preferences.hiddenCollectionIds.includes(id));
  const collapsed = Boolean(id && preferences.collapsedCollectionIds.includes(id));
  const { menu, close } = controller;

  useEffect(() => {
    if (menu && !collection) close(true);
    if (dialog && (!collection || preferences.loading)) setDialog(null);
  }, [menu, close, dialog, collection, preferences.loading]);

  const activate = (action: CollectionMenuAction) => {
    if (!collection) return;
    const { id, sortField } = collection;
    controller.runAction(() => {
      setError(``);
      switch (action) {
        case `sort`:
          if (!preferences.setCollectionSort(id, sortField === null ? `name` : null, `asc`)) setError(`Could Not Change Collection Sorting`);
          break;
        case `collapse`:
          if (!preferences.toggleCollectionCollapsed(id)) setError(`Could Not Change Collection Expansion`);
          break;
        case `visibility`:
          if (!preferences.toggleCollectionVisibility(id)) setError(`Could Not Change Collection Visibility`);
          else if (!hidden && !preferences.showHiddenCollections) {
            window.requestAnimationFrame(() => document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true }));
          }
          break;
        default:
          setDialog({ id, section: action });
      }
    });
  };

  return {
    ...controller,
    error,
    dialog,
    hidden,
    activate,
    collapsed,
    collection,
    dialogOpen: Boolean(dialog),
    clearError: () => setError(``),
    closeDialog: () => setDialog(null),
  };
};
