import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const MAIN_DATABASE_COLLECTION_OPTION = `main`;
export const CREATE_COLLECTION_OPTION = `create`;

export const useDomainGroupSettings = (group: CustomPortfolioGroup, onClose: () => void) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [collectionName, setCollectionNameValue] = useState(``);
  const [name, setNameValue] = useState(group.name);
  const [collectionDescription, setCollectionDescriptionValue] = useState(``);
  const [description, setDescriptionValue] = useState(group.description ?? ``);
  const [collectionId, setCollectionIdValue] = useState(group.collectionId ?? MAIN_DATABASE_COLLECTION_OPTION);
  const [invalidField, setInvalidField] = useState<`name` | `description` | `collection` | `collectionName` | `collectionDescription` | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const collectionSelectRef = useRef<HTMLSelectElement>(null);
  const collectionNameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const collectionDescriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const creatingCollection = collectionId === CREATE_COLLECTION_OPTION;
  const currentGroup = preferences.customGroups.find(current => current.id === group.id);
  const missingGroup = !currentGroup;
  const missingCollection = collectionId !== MAIN_DATABASE_COLLECTION_OPTION && !creatingCollection
    && !preferences.collections.some(collection => collection.id === collectionId);
  const availabilityError = missingGroup
    ? `This Group Is No Longer Available`
    : missingCollection ? `This Collection Is No Longer Available. Choose Another Collection` : ``;

  useModalFocus(modalRef, true, onClose);

  useEffect(() => {
    const invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const invokingId = invokingElement?.id;
    return () => {
      // Renaming a group can remount its heading while keeping the settings button ID.
      if (!invokingElement?.isConnected) {
        const invokingControl = invokingId ? document.getElementById(invokingId) : null;
        (invokingControl ?? document.getElementById(`portfolio-groups-button`))?.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (creatingCollection) collectionNameInputRef.current?.focus();
  }, [creatingCollection]);

  const clearError = () => {
    setError(``);
    setInvalidField(null);
  };
  const setName = (value: string) => {
    clearError();
    setNameValue(value);
  };
  const setDescription = (value: string) => {
    clearError();
    setDescriptionValue(value);
  };
  const setCollectionId = (value: string) => {
    clearError();
    setCollectionIdValue(value);
  };
  const setCollectionName = (value: string) => {
    clearError();
    setCollectionNameValue(value);
  };
  const setCollectionDescription = (value: string) => {
    clearError();
    setCollectionDescriptionValue(value);
  };
  const toggleStar = () => {
    if (!preferences.toggleGroupStar(group.id)) setError(`Could Not Update Group Star. Try Again Shortly`);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    if (missingGroup) {
      setError(availabilityError);
      return;
    }
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const reservedName = trimmedName.toLowerCase() === `ungrouped`;
    const duplicateName = preferences.customGroups.some(current => current.id !== group.id
      && current.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (!trimmedName || trimmedName.length > 80 || duplicateName || reservedName) {
      setInvalidField(`name`);
      setError(reservedName
        ? `Ungrouped Is Reserved For Domains Without A Group`
        : duplicateName ? `A Group With This Name Already Exists` : `Enter A Group Name Between 1 And 80 Characters`);
      nameInputRef.current?.focus();
      return;
    }
    if (trimmedDescription.length > 280) {
      setInvalidField(`description`);
      setError(`Keep The Group Description Within 280 Characters`);
      descriptionInputRef.current?.focus();
      return;
    }
    if (missingCollection) {
      setInvalidField(`collection`);
      setError(availabilityError);
      collectionSelectRef.current?.focus();
      return;
    }
    const trimmedCollectionName = collectionName.trim();
    const trimmedCollectionDescription = collectionDescription.trim();
    if (creatingCollection) {
      const duplicateCollectionName = preferences.collections.some(collection => collection.name.trim().toLowerCase() === trimmedCollectionName.toLowerCase());
      if (!trimmedCollectionName || trimmedCollectionName.length > 80 || duplicateCollectionName) {
        setInvalidField(`collectionName`);
        setError(duplicateCollectionName ? `A Collection With This Title Already Exists` : `Enter A Collection Title Between 1 And 80 Characters`);
        collectionNameInputRef.current?.focus();
        return;
      }
      if (trimmedCollectionDescription.length > 280) {
        setInvalidField(`collectionDescription`);
        setError(`Keep The Collection Description Within 280 Characters`);
        collectionDescriptionInputRef.current?.focus();
        return;
      }
    }
    if (!preferences.saveGroupSettings(group.id, {
      name: trimmedName,
      description: trimmedDescription,
      collectionId: creatingCollection || collectionId === MAIN_DATABASE_COLLECTION_OPTION ? null : collectionId,
      ...(creatingCollection ? { newCollection: { name: trimmedCollectionName, description: trimmedCollectionDescription } } : {}),
    })) {
      setError(`Could Not Save Group. Try Again Shortly`);
      return;
    }
    onClose();
  };

  return {
    name,
    setName,
    modalRef,
    toggleStar,
    collectionId,
    missingGroup,
    description,
    invalidField,
    nameInputRef,
    handleSubmit,
    collectionName,
    setDescription,
    setCollectionId,
    missingCollection,
    setCollectionName,
    creatingCollection,
    collectionSelectRef,
    collectionDescription,
    collectionNameInputRef,
    descriptionInputRef,
    setCollectionDescription,
    collectionDescriptionInputRef,
    collections: preferences.collections,
    error: error || availabilityError,
    starred: currentGroup?.starred === true,
  };
};
