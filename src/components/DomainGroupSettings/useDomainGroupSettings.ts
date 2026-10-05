import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useDomainGroupSettings = (group: CustomPortfolioGroup, onClose: () => void) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [name, setNameValue] = useState(group.name);
  const [invalidField, setInvalidField] = useState<`name` | `description` | null>(null);
  const [description, setDescriptionValue] = useState(group.description ?? ``);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const missingGroup = !preferences.customGroups.some(current => current.id === group.id);
  const availabilityError = missingGroup ? `This Group Is No Longer Available` : ``;

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

  const setName = (value: string) => {
    setError(``);
    setInvalidField(null);
    setNameValue(value);
  };
  const setDescription = (value: string) => {
    setError(``);
    setInvalidField(null);
    setDescriptionValue(value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(``);
    setInvalidField(null);
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
    if (!preferences.updateGroup(group.id, trimmedName, trimmedDescription)) {
      setError(`Could Not Save Group. Try Again Shortly`);
      return;
    }
    onClose();
  };

  return {
    name,
    setName,
    modalRef,
    description,
    invalidField,
    nameInputRef,
    handleSubmit,
    setDescription,
    descriptionInputRef,
    error: error || availabilityError,
  };
};
