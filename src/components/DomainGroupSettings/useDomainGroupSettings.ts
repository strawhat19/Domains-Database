import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { normalizeDomainTags } from '../../shared/domainTags';
import { normalizeSiteIconUrl } from '../../shared/domainSiteIcon';
import { DOMAIN_PRICE_FIELDS, normalizeDomainPrice } from '../../shared/domainPricing';
import type { DomainLinkField } from '../DomainLinks/index.web';
import { normalizeDomainLink, normalizeDomainLinks } from '../../shared/domainLinks';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { normalizeGroupDetails } from '../../shared/portfolioPreferences/details';
import type { CustomPortfolioGroup, PortfolioGroupDetails } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { isPortfolioNameTaken, normalizePortfolioName, getConvertedGroupName } from '../../shared/portfolioPreferences/names';

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
  const setDetail = <Key extends keyof PortfolioGroupDetails>(field: Key, value: PortfolioGroupDetails[Key]) => {
    clearError();
    setDetailsValue(current => ({ ...current, [field]: value }));
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
    const reservedName = !convertingToCollection && normalizePortfolioName(trimmedName) === `ungrouped`;
    const duplicateName = isPortfolioNameTaken(preferences, trimmedName, { groupId: group.id });
    if (!trimmedName || trimmedName.length > 80 || duplicateName || reservedName) {
      setNameFocusRequest(current => current + 1);
      setInvalidField(`name`);
      setError(reservedName
        ? `Ungrouped Is Reserved For Domains Without A Group`
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
    details,
    setName,
    setDetail,
    modalRef,
    toggleStar,
    collectionId,
    missingGroup,
    description,
    invalidField,
    nameInputRef,
    nameFocusRequest,
    siteIconInputRef,
    handleSubmit,
    collectionName,
    setDescription,
    setCollectionId,
    missingCollection,
    setCollectionName,
    creatingCollection,
    collectionChoicesRef,
    convertingToCollection,
    collectionDescription,
    collectionNameInputRef,
    descriptionInputRef,
    setCollectionDescription,
    collectionDescriptionInputRef,
    collections: preferences.collections,
    error: error || availabilityError,
    starred: currentGroup?.starred === true,
    convertedGroupName: getConvertedGroupName(preferences, name, group.id),
    invalidLinkField: GROUP_LINK_FIELDS.find(field => field.key === invalidField)?.key ?? null,
  };
};
