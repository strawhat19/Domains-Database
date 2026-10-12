import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { normalizeDomainTags } from '../../shared/domainTags';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { DomainLinkField } from '../DomainLinks/index.web';
import { normalizeSiteIconUrl } from '../../shared/domainSiteIcon';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { normalizeGroupDetails } from '../../shared/portfolioPreferences/details';
import { normalizeDomainLink, normalizeDomainLinks } from '../../shared/domainLinks';
import { DOMAIN_PRICE_FIELDS, normalizeDomainPrice } from '../../shared/domainPricing';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import type { CustomPortfolioGroup, PortfolioGroupDetails } from '../../shared/portfolioPreferences/types';
import { isPortfolioNameTaken, normalizePortfolioName, getConvertedGroupName, isReservedPortfolioGroupName } from '../../shared/portfolioPreferences/names';

export const CREATE_COLLECTION_OPTION = `create`;
export const CONVERT_COLLECTION_OPTION = `convert`;
export const MAIN_DATABASE_COLLECTION_OPTION = `main`;

const GROUP_LINK_FIELDS: { key: DomainLinkField; label: string; multiple?: boolean }[] = [
  { key: `parentLink`, label: `Parent Link` },
  { key: `childLinks`, label: `Child Link`, multiple: true },
  { key: `previewLinks`, label: `Preview Link`, multiple: true },
  { key: `relatedLinks`, label: `Related Link`, multiple: true },
  { key: `developmentLinks`, label: `Development Links`, multiple: true },
  { key: `productionLink`, label: `Production Link` },
  { key: `githubRepoLink`, label: `GitHub Repository Link` },
  { key: `socialMediaLinks`, label: `Social Media Link`, multiple: true },
];

type GroupSettingsField = keyof PortfolioGroupDetails
  | `name` | `description` | `collection` | `collectionName` | `collectionDescription`;

export const useDomainGroupSettings = (group: CustomPortfolioGroup, onClose: () => void, convertToCollection = false) => {
  const preferences = usePortfolioPreferences();
  const [error, setError] = useState(``);
  const [activeTab, setActiveTab] = useState<`general` | `project` | `organization`>(convertToCollection ? `organization` : `general`);
  const [validationFocusRequest, setValidationFocusRequest] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [collectionName, setCollectionNameValue] = useState(``);
  const [name, setNameValue] = useState(group.name);
  const [nameFocusRequest, setNameFocusRequest] = useState(0);
  const [collectionDescription, setCollectionDescriptionValue] = useState(``);
  const [description, setDescriptionValue] = useState(group.description ?? ``);
  const [collectionId, setCollectionIdValue] = useState(convertToCollection ? CONVERT_COLLECTION_OPTION : group.collectionId ?? MAIN_DATABASE_COLLECTION_OPTION);
  const [invalidField, setInvalidField] = useState<GroupSettingsField | null>(null);
  const [details, setDetailsValue] = useState<PortfolioGroupDetails>(() => ({
    isApp: group.isApp === true,
    tags: normalizeDomainTags(group.tags),
    parentLink: group.parentLink ?? ``,
    startingBid: group.startingBid,
    siteIconUrl: group.siteIconUrl ?? ``,
    childLinks: group.childLinks ?? [],
    previewLinks: group.previewLinks ?? [],
    relatedLinks: group.relatedLinks ?? [],
    estimatedRevenue: group.estimatedRevenue,
    productionLink: group.productionLink ?? ``,
    githubRepoLink: group.githubRepoLink ?? ``,
    developmentLinks: [...(group.developmentLinks ?? [])],
    socialMediaLinks: group.socialMediaLinks ?? [],
    projectStatus: normalizeDomainProjectStatus(group.projectStatus),
  }));
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);
  const siteIconInputRef = useRef<HTMLInputElement>(null);
  const collectionChoicesRef = useRef<HTMLDivElement>(null);
  const collectionNameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const collectionDescriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const creatingCollection = collectionId === CREATE_COLLECTION_OPTION;
  const convertingToCollection = collectionId === CONVERT_COLLECTION_OPTION;
  const addingCollection = creatingCollection || convertingToCollection;
  const currentGroup = preferences.customGroups.find(current => current.id === group.id);
  const missingGroup = !currentGroup;
  const canDelete = Boolean(currentGroup) && !currentGroup?.isApp;
  const hidden = preferences.hiddenGroupKeys.includes(`custom:${group.id}`);
  const missingCollection = collectionId !== MAIN_DATABASE_COLLECTION_OPTION && !addingCollection
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
        (invokingControl ?? document.getElementById(`portfolio-table-settings`))?.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (creatingCollection) collectionNameInputRef.current?.focus();
  }, [creatingCollection]);

  useEffect(() => {
    if (!confirmingDelete) return;
    if (!canDelete) setConfirmingDelete(false);
    else deleteCancelRef.current?.focus();
  }, [canDelete, confirmingDelete]);

  useEffect(() => {
    if (!invalidField || invalidField === `name`) return;
    setActiveTab(GROUP_LINK_FIELDS.some(field => field.key === invalidField) ? `project`
      : [`collection`, `collectionName`, `collectionDescription`].includes(invalidField) ? `organization` : `general`);
  }, [invalidField, validationFocusRequest]);

  useEffect(() => {
    if (!invalidField || invalidField === `name`) return;
    const frame = window.requestAnimationFrame(() => {
      if (invalidField === `collection`) collectionChoicesRef.current?.querySelector<HTMLButtonElement>(`button:not([disabled])`)?.focus();
      else if (invalidField === `collectionName`) collectionNameInputRef.current?.focus();
      else if (invalidField === `collectionDescription`) collectionDescriptionInputRef.current?.focus();
      else if (invalidField === `description`) descriptionInputRef.current?.focus();
      else if (invalidField === `siteIconUrl`) siteIconInputRef.current?.focus();
      else document.getElementById(GROUP_LINK_FIELDS.some(field => field.key === invalidField)
        ? `domain-group-settings-links-${group.id}-${invalidField}-input`
        : `domain-group-settings-${invalidField}-input-${group.id}`)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, invalidField, validationFocusRequest, group.id]);

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
  const setDetail = <Key extends keyof PortfolioGroupDetails>(field: Key, value: PortfolioGroupDetails[Key]) => {
    clearError();
    setDetailsValue(current => ({ ...current, [field]: value }));
  };
  const toggleStar = () => {
    if (!preferences.toggleGroupStar(group.id)) setError(`Could Not Update Group Star. Try Again Shortly`);
  };
  const toggleVisibility = () => {
    if (missingGroup || preferences.loading) return;
    onClose();
    const changed = preferences.toggleGroupVisibility(`custom:${group.id}`);
    if (changed && !hidden && !preferences.showHiddenGroups) {
      window.requestAnimationFrame(() => document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true }));
    }
  };
  const requestDelete = () => {
    if (preferences.loading || !canDelete) return;
    clearError();
    setConfirmingDelete(true);
  };
  const cancelDelete = () => {
    clearError();
    setConfirmingDelete(false);
    deleteButtonRef.current?.focus();
  };
  const handleDelete = () => {
    if (!confirmingDelete || preferences.loading) return;
    clearError();
    if (!canDelete) {
      setError(missingGroup ? `This Group Is No Longer Available` : `Only Groups Can Be Deleted`);
      setConfirmingDelete(false);
      return;
    }
    if (!preferences.deleteGroup(group.id)) {
      setError(`Could Not Delete Group. Try Again Shortly`);
      return;
    }
    onClose();
    window.requestAnimationFrame(() => document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true }));
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmingDelete) return;
    setValidationFocusRequest(current => current + 1);
    clearError();
    if (missingGroup) {
      setError(availabilityError);
      return;
    }
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const reservedName = !convertingToCollection && isReservedPortfolioGroupName(trimmedName)
      && normalizePortfolioName(trimmedName) !== normalizePortfolioName(currentGroup?.name ?? group.name);
    const duplicateName = isPortfolioNameTaken(preferences, trimmedName, { groupId: group.id });
    if (!trimmedName || trimmedName.length > 80 || duplicateName || reservedName) {
      setNameFocusRequest(current => current + 1);
      setInvalidField(`name`);
      setError(reservedName
        ? `This Name Is Reserved For Domains Without A Group Or App`
        : duplicateName ? `A Collection Or Group With This Name Already Exists`
          : `Enter A ${convertingToCollection ? `Collection` : `Group`} Name Between 1 And 80 Characters`);
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
      collectionChoicesRef.current?.querySelector<HTMLButtonElement>(`button:not([disabled])`)?.focus();
      return;
    }
    const trimmedCollectionName = convertingToCollection ? trimmedName : collectionName.trim();
    const trimmedCollectionDescription = convertingToCollection ? trimmedDescription : collectionDescription.trim();
    if (addingCollection) {
      const groupNameChanged = normalizePortfolioName(currentGroup?.name ?? group.name) !== normalizePortfolioName(trimmedName);
      const duplicateCollectionName = isPortfolioNameTaken(preferences, trimmedCollectionName, {
        groupId: convertingToCollection || groupNameChanged ? group.id : undefined,
      }) || !convertingToCollection && normalizePortfolioName(trimmedCollectionName) === normalizePortfolioName(trimmedName);
      if (!trimmedCollectionName || trimmedCollectionName.length > 80 || duplicateCollectionName) {
        setInvalidField(convertingToCollection ? `name` : `collectionName`);
        setError(duplicateCollectionName ? `A Collection Or Group With This Name Already Exists` : `Enter A Collection Name Between 1 And 80 Characters`);
        if (convertingToCollection) setNameFocusRequest(current => current + 1);
        else collectionNameInputRef.current?.focus();
        return;
      }
      if (trimmedCollectionDescription.length > 280) {
        setInvalidField(convertingToCollection ? `description` : `collectionDescription`);
        setError(`Keep The Collection Description Within 280 Characters`);
        (convertingToCollection ? descriptionInputRef : collectionDescriptionInputRef).current?.focus();
        return;
      }
    }
    let detailField: keyof PortfolioGroupDetails = `siteIconUrl`;
    let normalizedDetails: PortfolioGroupDetails;
    try {
      normalizeSiteIconUrl(details.siteIconUrl);
      for (const field of GROUP_LINK_FIELDS) {
        detailField = field.key;
        if (field.multiple) normalizeDomainLinks(details[field.key], field.label);
        else normalizeDomainLink(details[field.key], field.label);
      }
      for (const { field, label } of DOMAIN_PRICE_FIELDS) {
        detailField = field;
        normalizeDomainPrice(details[field], label);
      }
      normalizedDetails = normalizeGroupDetails(details);
    } catch (failure) {
      setInvalidField(detailField);
      setError(failure instanceof Error ? failure.message : `Enter Valid Group Links`);
      if (detailField === `siteIconUrl`) siteIconInputRef.current?.focus();
      return;
    }
    if (!preferences.saveGroupSettings(group.id, {
      name: trimmedName,
      ...normalizedDetails,
      description: trimmedDescription,
      ...(convertingToCollection ? { convertToCollection: true } : {}),
      collectionId: addingCollection || collectionId === MAIN_DATABASE_COLLECTION_OPTION ? null : collectionId,
      ...(addingCollection ? { newCollection: { name: trimmedCollectionName, description: trimmedCollectionDescription } } : {}),
    })) {
      setError(convertingToCollection ? `Could Not Convert Group. Try Again Shortly` : `Could Not Save Group. Try Again Shortly`);
      return;
    }
    onClose();
  };

  return {
    name,
    hidden,
    details,
    activeTab,
    setActiveTab,
    setName,
    setDetail,
    modalRef,
    canDelete,
    toggleStar,
    toggleVisibility,
    collectionId,
    missingGroup,
    description,
    invalidField,
    handleDelete,
    cancelDelete,
    requestDelete,
    nameInputRef,
    nameFocusRequest,
    siteIconInputRef,
    handleSubmit,
    deleteButtonRef,
    deleteCancelRef,
    collectionName,
    setDescription,
    setCollectionId,
    missingCollection,
    setCollectionName,
    creatingCollection,
    confirmingDelete,
    collectionChoicesRef,
    convertingToCollection,
    collectionDescription,
    collectionNameInputRef,
    descriptionInputRef,
    setCollectionDescription,
    collectionDescriptionInputRef,
    collections: preferences.collections,
    actionsDisabled: preferences.loading || missingGroup,
    error: error || availabilityError,
    starred: currentGroup?.starred === true,
    convertedGroupName: getConvertedGroupName(preferences, name, group.id),
    invalidLinkField: GROUP_LINK_FIELDS.find(field => field.key === invalidField)?.key ?? null,
  };
};
