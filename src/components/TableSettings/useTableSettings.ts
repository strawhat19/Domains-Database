import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (![`ArrowLeft`, `ArrowRight`, `Home`, `End`].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === `Home` ? `general` : event.key === `End` ? `columns` : tab === `general` ? `columns` : `general`;
    setTab(nextTab);
    modalRef.current?.querySelector<HTMLButtonElement>(`#table-settings-tab-${nextTab}`)?.focus();
  };

  return { ...preferences, tab, setTab, modalRef, collectionForm, onTabKeyDown, setShowHidden, showHiddenState };
};
