import type { FormEvent } from 'react';
import type { DomainRecord } from '../../shared/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { useDomains } from '../../shared/domainContext/useDomains';
import { scrollToPortfolioGroup, scrollToPortfolioCollection } from './scrollToGroup.web';
import { buildPortfolioDestinationTree } from '../../shared/portfolioPreferences/destinationTree';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { isPortfolioNameTaken, normalizePortfolioName } from '../../shared/portfolioPreferences/names';

export const CREATE_GROUP_OPTION = `create`;
export const CREATE_COLLECTION_OPTION = `create`;
export const UNGROUPED_GROUP_OPTION = `ungrouped`;
export const MAIN_DATABASE_COLLECTION_OPTION = `main`;

type GroupPickerField = `name` | `collection` | `collectionName`;

export const useDomainGroupPicker = (domains: DomainRecord[], onClose: () => void, onGrouped?: () => void) => {
  const preferences = usePortfolioPreferences();
  const { loading: domainsLoading, domains: availableDomains } = useDomains();
  const loading = domainsLoading || preferences.loading;
  const initialDomainIds = useRef([...new Set(domains.map(domain => domain.id))]).current;
  const defaultCollectionId = useMemo(() => {
    const collectionIds = new Set(initialDomainIds.map(id => {
      const group = preferences.customGroups.find(current => current.domainIds.includes(id));
      return group ? group.collectionId : preferences.collections.find(collection => collection.domainIds?.includes(id))?.id;
    }));
    const [sharedCollectionId] = collectionIds;
    return collectionIds.size === 1 && sharedCollectionId && preferences.collections.some(collection => collection.id === sharedCollectionId)
      ? sharedCollectionId : MAIN_DATABASE_COLLECTION_OPTION;
  }, [initialDomainIds, preferences.collections, preferences.customGroups]);
  const [name, setNameValue] = useState(``);
  const [error, setError] = useState(``);
  const [collectionName, setCollectionNameValue] = useState(``);
  const [scrollToGroup, setScrollToGroup] = useState(false);
  const [groupId, setGroupIdValue] = useState(CREATE_GROUP_OPTION);
  const [destinationType, setDestinationType] = useState<`group` | `collection`>(`group`);
  const [invalidField, setInvalidField] = useState<GroupPickerField | null>(null);
  const [collectionId, setCollectionIdValue] = useState(defaultCollectionId);
  const collectionDefaultApplied = useRef(!loading);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const groupChoicesRef = useRef<HTMLDivElement>(null);
  const collectionChoicesRef = useRef<HTMLDivElement>(null);
  const collectionNameInputRef = useRef<HTMLInputElement>(null);
  const domainIds = [...new Set(domains.map(domain => domain.id))];
  const selectedIds = new Set(domainIds);
  const availableIds = new Set(availableDomains.map(domain => domain.id));
  const destinationTree = useMemo(() => buildPortfolioDestinationTree(availableDomains, preferences.customGroups, preferences.collections),
    [availableDomains, preferences.customGroups, preferences.collections]);
  const collections = useMemo(() => {
    const counts = new Map(destinationTree.branches.map(branch => [branch.id, branch.count]));
    return preferences.collections.map(collection => ({ ...collection, count: counts.get(collection.id) ?? 0 }));
  }, [destinationTree.branches, preferences.collections]);
  const selectingCollection = destinationType === `collection`;
  const creatingGroup = !selectingCollection && groupId === CREATE_GROUP_OPTION;
  const creatingCollection = (creatingGroup || selectingCollection) && collectionId === CREATE_COLLECTION_OPTION;
  const creatingNewCollection = selectingCollection && creatingCollection;
  const missingCollection = (creatingGroup || selectingCollection) && collectionId !== MAIN_DATABASE_COLLECTION_OPTION && !creatingCollection
    && !preferences.collections.some(collection => collection.id === collectionId);
  const missingGroup = Boolean(!selectingCollection && groupId && !creatingGroup && groupId !== UNGROUPED_GROUP_OPTION
    && !preferences.customGroups.some(group => group.id === groupId));
  const availabilityError = !domainIds.length
    ? `No Domains Selected`
    : loading
      ? `Portfolio Is Loading. Try Again Shortly`
      : initialDomainIds.length !== domainIds.length || initialDomainIds.some(id => !selectedIds.has(id)) || domainIds.some(id => !availableIds.has(id))
        ? `Some Selected Domains Are No Longer Available. Close And Select Them Again`
        : ``;
  const groupError = missingGroup ? `This Group Is No Longer Available. Choose Another Group` : ``;
  const collectionError = missingCollection ? `This Collection Is No Longer Available. Choose Another Collection` : ``;

  useModalFocus(modalRef, true, onClose, true);

  useEffect(() => {
    if (availabilityError || collectionDefaultApplied.current) return;
    collectionDefaultApplied.current = true;
    setCollectionIdValue(defaultCollectionId);
  }, [availabilityError, defaultCollectionId]);

  useEffect(() => {
    const invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const invokingId = invokingElement?.id;
    return () => {
      const controls = [
        invokingElement,
        invokingId ? document.getElementById(invokingId) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control?.isConnected && !control.matches(`:disabled`)
        && !control.closest(`[hidden], [inert], [aria-hidden='true']`))?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (availabilityError) return;
    if (creatingGroup) nameInputRef.current?.focus({ preventScroll: true });
    else if (creatingNewCollection) collectionNameInputRef.current?.focus({ preventScroll: true });
  }, [creatingGroup, creatingNewCollection, availabilityError]);

  const clearError = () => {
    setError(``);
    setInvalidField(null);
  };
  const setName = (value: string) => {
    clearError();
    setNameValue(value);
  };
  const setGroupId = (value: string) => {
    if (availabilityError) return;
    collectionDefaultApplied.current = true;
    clearError();
    setDestinationType(`group`);
    setGroupIdValue(value);
  };
  const setDestinationCollectionId = (value: string) => {
    if (availabilityError) return;
    collectionDefaultApplied.current = true;
    clearError();
    setDestinationType(`collection`);
    setCollectionIdValue(value);
    if (value !== CREATE_COLLECTION_OPTION) setCollectionNameValue(``);
  };
  const setCollectionId = (value: string) => {
    if (availabilityError) return;
    collectionDefaultApplied.current = true;
    clearError();
    setCollectionIdValue(value);
    if (value === CREATE_COLLECTION_OPTION) collectionNameInputRef.current?.focus();
    else setCollectionNameValue(``);
  };
  const setCollectionName = (value: string) => {
    if (availabilityError) return;
    collectionDefaultApplied.current = true;
    clearError();
    setCollectionNameValue(value);
    setCollectionIdValue(value.trim() || selectingCollection ? CREATE_COLLECTION_OPTION : MAIN_DATABASE_COLLECTION_OPTION);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    if (availabilityError) {
      setError(availabilityError);
      return;
    }
    if (!selectingCollection && (!groupId || missingGroup)) {
      setError(groupError || `Choose A Group`);
      const choice = Array.from(groupChoicesRef.current?.querySelectorAll<HTMLButtonElement>(`button:not([disabled])`) ?? [])
        .find(button => !button.closest(`[inert], [hidden], [aria-hidden='true']`));
      choice?.focus();
      return;
    }
    if (missingCollection) {
      setInvalidField(`collection`);
      setError(collectionError);
      const choices = creatingGroup ? collectionChoicesRef.current : groupChoicesRef.current;
      choices?.querySelector<HTMLButtonElement>(`button:not([disabled])`)?.focus({ preventScroll: true });
      return;
    }
    let destinationGroupId: string | null = groupId === UNGROUPED_GROUP_OPTION ? null : groupId;
    let destinationCollectionId: string | null = collectionId === MAIN_DATABASE_COLLECTION_OPTION ? null : collectionId;
    if (selectingCollection) {
      if (creatingCollection) {
        const trimmedCollectionName = collectionName.trim();
        const duplicateCollectionName = isPortfolioNameTaken(preferences, trimmedCollectionName);
        if (!trimmedCollectionName || trimmedCollectionName.length > 80 || duplicateCollectionName) {
          setInvalidField(`collectionName`);
          setError(duplicateCollectionName ? `A Collection Or Group With This Name Already Exists` : `Enter A Collection Name Between 1 And 80 Characters`);
          collectionNameInputRef.current?.focus({ preventScroll: true });
          return;
        }
        const createdCollectionId = preferences.createCollection(trimmedCollectionName);
        if (!createdCollectionId) {
          setError(`Could Not Create Collection. The Portfolio Or Collection May Have Changed`);
          return;
        }
        destinationCollectionId = createdCollectionId;
        setCollectionIdValue(createdCollectionId);
        setCollectionNameValue(``);
      }
      if (!preferences.assignDomainsToCollection(domainIds, destinationCollectionId)) {
        setError(`Could Not Move Domains. The Portfolio, Selected Domains, Or Collection May Have Changed`);
        return;
      }
    } else if (creatingGroup) {
      const trimmedName = name.trim();
      const reservedName = normalizePortfolioName(trimmedName) === `ungrouped`;
      const duplicateName = isPortfolioNameTaken(preferences, trimmedName);
      if (!trimmedName || trimmedName.length > 80 || duplicateName || reservedName) {
        setInvalidField(`name`);
        setError(reservedName ? `Ungrouped Is Reserved For Domains Without A Group`
          : duplicateName ? `A Collection Or Group With This Name Already Exists` : `Enter A Group Name Between 1 And 80 Characters`);
        nameInputRef.current?.focus();
        return;
      }
      const trimmedCollectionName = collectionName.trim();
      if (creatingCollection) {
        const duplicateCollectionName = isPortfolioNameTaken(preferences, trimmedCollectionName)
          || normalizePortfolioName(trimmedCollectionName) === normalizePortfolioName(trimmedName);
        if (!trimmedCollectionName || trimmedCollectionName.length > 80 || duplicateCollectionName) {
          setInvalidField(`collectionName`);
          setError(duplicateCollectionName ? `A Collection Or Group With This Name Already Exists` : `Enter A Collection Name Between 1 And 80 Characters`);
          collectionNameInputRef.current?.focus();
          return;
        }
      }
      const createdGroupId = preferences.createGroup(trimmedName, domainIds, {
        collectionId: creatingCollection || collectionId === MAIN_DATABASE_COLLECTION_OPTION ? null : collectionId,
        ...(creatingCollection ? { newCollection: { name: trimmedCollectionName, description: `` } } : {}),
      });
      if (!createdGroupId) {
        setError(`Could Not Create Group. The Portfolio, Group, Or Collection May Have Changed`);
        return;
      }
      destinationGroupId = createdGroupId;
    } else if (!preferences.assignDomains(domainIds, destinationGroupId)) {
      setError(`Could Not Update Groups. The Portfolio Or Selected Group May Have Changed`);
      return;
    }
    onGrouped?.();
    onClose();
    if (scrollToGroup) {
      if (selectingCollection) scrollToPortfolioCollection(destinationCollectionId);
      else {
        const groupCollectionId = creatingGroup
          ? !creatingCollection && collectionId !== MAIN_DATABASE_COLLECTION_OPTION ? collectionId : undefined
          : preferences.customGroups.find(group => group.id === destinationGroupId)?.collectionId;
        scrollToPortfolioGroup(destinationGroupId, groupCollectionId);
      }
    }
  };

  return {
    name,
    groupId,
    setName,
    modalRef,
    setGroupId,
    collections,
    invalidField,
    nameInputRef,
    collectionId,
    creatingGroup,
    selectingCollection,
    handleSubmit,
    scrollToGroup,
    collectionName,
    setCollectionId,
    groupChoicesRef,
    missingCollection,
    setCollectionName,
    setScrollToGroup,
    creatingCollection,
    creatingNewCollection,
    collectionChoicesRef,
    collectionNameInputRef,
    setDestinationCollectionId,
    count: domainIds.length,
    ungroupedCount: destinationTree.ungroupedCount,
    mainCollectionCount: destinationTree.mainCount,
    destinationBranches: destinationTree.branches,
    disabled: Boolean(availabilityError),
    error: error || availabilityError || groupError || collectionError,
  };
};
