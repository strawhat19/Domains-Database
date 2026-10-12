import { useRef, useState } from 'react';
import type { TableSettingsTab } from './types';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { usePortfolioAddCollection } from '../PortfolioAddCollection/usePortfolioAddCollection';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useTableSettings = (onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TableSettingsTab>(`general`);
  const preferences = usePortfolioPreferences();
  const collectionForm = usePortfolioAddCollection({ idPrefix: `table-settings`, onCreated: () => preferences.setGroupBy(`custom`) });
  const hiddenValues = [preferences.showHiddenGroups, preferences.showHiddenDomains, preferences.showHiddenCollections];
  const showHiddenState: `off` | `on` | `mixed` = hiddenValues.every(Boolean) ? `on` : hiddenValues.some(Boolean) ? `mixed` : `off`;
  useModalFocus(modalRef, true, onClose, true);

  const setShowHidden = (value: boolean) => {
    if (preferences.loading) return;
    preferences.setShowHiddenGroups(value);
    preferences.setShowHiddenDomains(value);
    preferences.setShowHiddenCollections(value);
  };

  return { ...preferences, tab, setTab, modalRef, collectionForm, setShowHidden, showHiddenState };
};
