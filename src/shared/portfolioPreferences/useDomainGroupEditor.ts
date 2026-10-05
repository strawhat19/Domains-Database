import { usePortfolioPreferences } from './usePortfolioPreferences';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const useDomainGroupEditor = (domainId?: string) => {
  const preferences = usePortfolioPreferences();
  const changed = useRef(false);
  const editingId = useRef(domainId);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const [groupId, setGroupIdValue] = useState(() => (
    preferences.customGroups.find(group => domainId && group.domainIds.includes(domainId))?.id ?? ``
  ));
  const selectedId = useRef(groupId);

  const options = useMemo(() => {
    const collections = new Map(preferences.collections.map(collection => [collection.id, collection.name]));
    return [
      { id: ``, label: `Ungrouped` },
      ...preferences.customGroups.map(group => {
        const collection = group.collectionId ? collections.get(group.collectionId) : undefined;
        return { id: group.id, label: collection ? `${collection} / ${group.name}` : group.name };
      }),
    ];
  }, [preferences.collections, preferences.customGroups]);

  const resetGroup = useCallback((nextDomainId?: string) => {
    const currentGroupId = preferencesRef.current.customGroups.find(group => (
      nextDomainId && group.domainIds.includes(nextDomainId)
    ))?.id ?? ``;
    changed.current = false;
    editingId.current = nextDomainId;
    selectedId.current = currentGroupId;
    setGroupIdValue(currentGroupId);
  }, []);

  useEffect(() => {
    if (domainId !== editingId.current || !changed.current) resetGroup(domainId);
  }, [domainId, preferences.customGroups, resetGroup]);

  const setGroupId = useCallback((value: string) => {
    changed.current = changed.current || value !== selectedId.current;
    selectedId.current = value;
    setGroupIdValue(value);
  }, []);

  const validateGroup = useCallback(() => {
    const value = selectedId.current;
    if (value && !preferencesRef.current.customGroups.some(group => group.id === value)) {
      throw new Error(`This Group Is No Longer Available. Choose Another Group`);
    }
  }, []);

  const saveGroup = useCallback((savedDomainId: string) => {
    validateGroup();
    if (!changed.current) return;
    if (!savedDomainId || savedDomainId !== editingId.current) throw new Error(`The Domain Changed. Reopen The Editor`);
    const value = selectedId.current;
    const current = preferencesRef.current;
    const currentGroupId = current.customGroups.find(group => group.domainIds.includes(savedDomainId))?.id ?? ``;
    if (value !== currentGroupId && !current.assignDomains([savedDomainId], value || null)) {
      throw new Error(`Could Not Update Domain Group. Please Try Again`);
    }
    changed.current = false;
  }, [validateGroup]);

  return { groupId, options, setGroupId, resetGroup, validateGroup, saveGroup };
};
