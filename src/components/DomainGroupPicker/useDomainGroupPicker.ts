import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { useDomains } from '../../shared/domainContext/useDomains';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const CREATE_GROUP_OPTION = `create`;
export const UNGROUPED_GROUP_OPTION = `ungrouped`;

export const useDomainGroupPicker = (domains: DomainRecord[], onClose: () => void, onGrouped?: () => void) => {
  const preferences = usePortfolioPreferences();
  const { loading, domains: availableDomains } = useDomains();
  const [name, setNameValue] = useState(``);
  const [error, setError] = useState(``);
  const [groupId, setGroupIdValue] = useState(CREATE_GROUP_OPTION);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const groupSelectRef = useRef<HTMLSelectElement>(null);
  const initialDomainIds = useRef([...new Set(domains.map(domain => domain.id))]).current;
  const domainIds = [...new Set(domains.map(domain => domain.id))];
  const selectedIds = new Set(domainIds);
  const availableIds = new Set(availableDomains.map(domain => domain.id));
  const creatingGroup = groupId === CREATE_GROUP_OPTION;
  const missingGroup = Boolean(groupId && !creatingGroup && groupId !== UNGROUPED_GROUP_OPTION
    && !preferences.customGroups.some(group => group.id === groupId));
  const availabilityError = !domainIds.length
    ? `No Domains Selected`
    : loading
      ? `Portfolio Is Loading. Try Again Shortly`
      : initialDomainIds.some(id => !selectedIds.has(id) || !availableIds.has(id))
        ? `Some Selected Domains Are No Longer Available. Close And Select Them Again`
        : ``;
  const groupError = missingGroup ? `This Group Is No Longer Available. Choose Another Group` : ``;

  useModalFocus(modalRef, true, onClose);

  useEffect(() => {
    const invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const invokingId = invokingElement?.id;
    return () => {
      // Changing groups can remount the invoking row while keeping its checkbox ID.
      if (!invokingElement?.isConnected) {
        const invokingControl = invokingId ? document.getElementById(invokingId) : null;
        (invokingControl ?? document.getElementById(`portfolio-groups-button`))?.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (creatingGroup) nameInputRef.current?.focus();
  }, [creatingGroup]);

  const setName = (value: string) => {
    setError(``);
    setNameValue(value);
  };
  const setGroupId = (value: string) => {
    setError(``);
    setGroupIdValue(value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (availabilityError) {
      setError(availabilityError);
      return;
    }
    if (!groupId || missingGroup) {
      setError(groupError || `Choose A Group`);
      groupSelectRef.current?.focus();
      return;
    }
    if (creatingGroup) {
      const trimmedName = name.trim();
      const duplicateName = preferences.customGroups.some(group => group.name.toLowerCase() === trimmedName.toLowerCase());
      if (!trimmedName || trimmedName.length > 80 || duplicateName) {
        setError(duplicateName ? `A Group With This Name Already Exists` : `Enter A Group Name Between 1 And 80 Characters`);
        nameInputRef.current?.focus();
        return;
      }
      if (!preferences.createGroup(trimmedName, domainIds)) {
        setError(`Could Not Create Group. The Portfolio Or Group Names May Have Changed`);
        return;
      }
    } else if (!preferences.assignDomains(domainIds, groupId === UNGROUPED_GROUP_OPTION ? null : groupId)) {
      setError(`Could Not Update Groups. The Portfolio Or Selected Group May Have Changed`);
      return;
    }
    onGrouped?.();
    onClose();
  };

  return {
    name,
    groupId,
    setName,
    modalRef,
    setGroupId,
    nameInputRef,
    creatingGroup,
    handleSubmit,
    groupSelectRef,
    count: domainIds.length,
    customGroups: preferences.customGroups,
    error: error || availabilityError || groupError,
  };
};
