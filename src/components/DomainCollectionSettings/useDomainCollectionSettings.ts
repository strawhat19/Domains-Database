import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useMobileSheet } from '../MobileSheet/useMobileSheet';
import { useModalFocus } from '../MobileSheet/useModalFocus';
import type { DomainProjectStatus } from '../../shared/domainProject';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { isPortfolioNameTaken, normalizePortfolioName, isReservedPortfolioGroupName } from '../../shared/portfolioPreferences/names';
import type { CollectionVisibility, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

export const useDomainCollectionSettings = (collection: CustomPortfolioCollection, onDismiss: () => void) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [activeTab, setActiveTab] = useState<`general` | `sharing` | `new-group`>(`general`);
  const [validationFocusRequest, setValidationFocusRequest] = useState(0);
  const [name, setNameValue] = useState(collection.name);
  const [groupName, setGroupNameValue] = useState(``);
  const [orderChanged, setOrderChanged] = useState(false);
  const [nameFocusRequest, setNameFocusRequest] = useState(0);
  const [manualOrder, setManualOrder] = useState(collection.sortField === null);
  const [visibility, setVisibilityValue] = useState<CollectionVisibility>(collection.visibility ?? `private`);
  const [invalidField, setInvalidField] = useState<`name` | `groupName` | `description` | null>(null);
  const [description, setDescriptionValue] = useState(collection.description ?? ``);
  const [projectStatus, setProjectStatusValue] = useState(() => normalizeDomainProjectStatus(collection.projectStatus));
  const modalRef = useRef<HTMLDivElement>(null);
  const groupNameInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const missingCollection = !preferences.collections.some(current => current.id === collection.id);
  const sheet = useMobileSheet(onDismiss);
  const onClose = sheet.close;
  const hidden = preferences.hiddenCollectionIds.includes(collection.id);
  const availabilityError = missingCollection ? `This Collection Is No Longer Available` : ``;

  useModalFocus(modalRef, true, onClose);

  useEffect(() => {
    const field = invalidField === `groupName` ? groupNameInputRef : descriptionInputRef;
    if (invalidField !== `description` && invalidField !== `groupName`) return;
    const frame = window.requestAnimationFrame(() => field.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [invalidField, validationFocusRequest]);

  useEffect(() => {
    const invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const invokingId = invokingElement?.id;
    return () => {
      if (!invokingElement?.isConnected) {
        const invokingControl = invokingId ? document.getElementById(invokingId) : null;
        (invokingControl ?? document.getElementById(`portfolio-table-settings`))?.focus();
      }
    };
  }, []);

  const clearError = () => {
    setError(``);
    setInvalidField(null);
  };
  const setName = (value: string) => {
    clearError();
    setNameValue(value);
  };
  const setGroupName = (value: string) => {
    clearError();
    setGroupNameValue(value);
  };
  const showGroupError = (message: string) => {
    setError(message);
    setActiveTab(`new-group`);
    setInvalidField(`groupName`);
  };
  const setDescription = (value: string) => {
    clearError();
    setDescriptionValue(value);
  };
  const setVisibility = (value: CollectionVisibility) => {
    clearError();
    setVisibilityValue(value);
  };
  const setProjectStatus = (value: DomainProjectStatus) => {
    clearError();
    setProjectStatusValue(value);
  };
  const toggleManualOrder = () => {
    clearError();
    setOrderChanged(true);
    setManualOrder(current => !current);
  };
  const toggleRowVisibility = () => {
    if (missingCollection || preferences.loading) return;
    onClose();
    const changed = preferences.toggleCollectionVisibility(collection.id);
    if (changed && !hidden && !preferences.showHiddenCollections) {
      window.requestAnimationFrame(() => document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true }));
    }
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationFocusRequest(current => current + 1);
    clearError();
    if (missingCollection) {
      setError(availabilityError);
      return;
    }
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const duplicateName = isPortfolioNameTaken(preferences, trimmedName, { collectionId: collection.id });
    if (!trimmedName || trimmedName.length > 80 || duplicateName) {
      setNameFocusRequest(current => current + 1);
      setInvalidField(`name`);
      setError(duplicateName ? `A Collection Or Group With This Name Already Exists` : `Enter A Collection Title Between 1 And 80 Characters`);
      return;
    }
    if (trimmedDescription.length > 280) {
      setActiveTab(`general`);
      setInvalidField(`description`);
      setError(`Keep The Collection Description Within 280 Characters`);
      return;
    }
    const trimmedGroupName = groupName.trim();
    if (activeTab === `new-group` || trimmedGroupName) {
      if (!trimmedGroupName || trimmedGroupName.length > 80) {
        showGroupError(`Enter A Group Name Between 1 And 80 Characters`);
        return;
      }
      if (isReservedPortfolioGroupName(trimmedGroupName)) {
        showGroupError(`This Name Is Reserved For Domains Without A Group Or App`);
        return;
      }
      if (normalizePortfolioName(trimmedGroupName) === normalizePortfolioName(trimmedName)
        || isPortfolioNameTaken(preferences, trimmedGroupName, { collectionId: collection.id })) {
        showGroupError(`A Collection Or Group With This Name Already Exists`);
        return;
      }
    }
    if (!preferences.updateCollection(collection.id, trimmedName, trimmedDescription, visibility, projectStatus)
      || (orderChanged && !preferences.setCollectionSort(collection.id, manualOrder ? null : `name`, `asc`))) {
      setError(`Could Not Save Collection. Try Again Shortly`);
      return;
    }
    if (trimmedGroupName && !preferences.createGroup(trimmedGroupName, undefined, { collectionId: collection.id })) {
      showGroupError(`Could Not Add Group To Collection. Try Again Shortly`);
      return;
    }
    onClose();
  };

  return {
    sheet,
    close: onClose,
    name,
    activeTab,
    setActiveTab,
    hidden,
    setName,
    modalRef,
    groupName,
    manualOrder,
    visibility,
    description,
    invalidField,
    nameInputRef,
    setGroupName,
    projectStatus,
    nameFocusRequest,
    groupNameInputRef,
    handleSubmit,
    setVisibility,
    setDescription,
    setProjectStatus,
    toggleManualOrder,
    toggleRowVisibility,
    descriptionInputRef,
    actionsDisabled: preferences.loading || missingCollection,
    error: error || availabilityError,
  };
};
