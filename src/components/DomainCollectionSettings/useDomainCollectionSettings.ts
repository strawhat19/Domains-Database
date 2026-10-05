import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { CollectionVisibility, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useDomainCollectionSettings = (collection: CustomPortfolioCollection, onClose: () => void) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [name, setNameValue] = useState(collection.name);
  const [visibility, setVisibilityValue] = useState<CollectionVisibility>(collection.visibility ?? `private`);
  const [invalidField, setInvalidField] = useState<`name` | `description` | null>(null);
  const [description, setDescriptionValue] = useState(collection.description ?? ``);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const missingCollection = !preferences.collections.some(current => current.id === collection.id);
  const availabilityError = missingCollection ? `This Collection Is No Longer Available` : ``;

  useModalFocus(modalRef, true, onClose);

  useEffect(() => {
    const invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const invokingId = invokingElement?.id;
    return () => {
      if (!invokingElement?.isConnected) {
        const invokingControl = invokingId ? document.getElementById(invokingId) : null;
        (invokingControl ?? document.getElementById(`portfolio-groups-button`))?.focus();
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
  const setDescription = (value: string) => {
    clearError();
    setDescriptionValue(value);
  };
  const setVisibility = (value: CollectionVisibility) => {
    clearError();
    setVisibilityValue(value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    if (missingCollection) {
      setError(availabilityError);
      return;
    }
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const duplicateName = preferences.collections.some(current => current.id !== collection.id
      && current.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (!trimmedName || trimmedName.length > 80 || duplicateName) {
      setInvalidField(`name`);
      setError(duplicateName ? `A Collection With This Title Already Exists` : `Enter A Collection Title Between 1 And 80 Characters`);
      nameInputRef.current?.focus();
      return;
    }
    if (trimmedDescription.length > 280) {
      setInvalidField(`description`);
      setError(`Keep The Collection Description Within 280 Characters`);
      descriptionInputRef.current?.focus();
      return;
    }
    if (!preferences.updateCollection(collection.id, trimmedName, trimmedDescription, visibility)) {
      setError(`Could Not Save Collection. Try Again Shortly`);
      return;
    }
    onClose();
  };

  return {
    name,
    setName,
    modalRef,
    visibility,
    description,
    invalidField,
    nameInputRef,
    handleSubmit,
    setVisibility,
    setDescription,
    descriptionInputRef,
    error: error || availabilityError,
  };
};
