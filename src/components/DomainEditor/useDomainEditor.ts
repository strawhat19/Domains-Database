import { REGISTRARS } from '../../shared/config';
import type { FormEvent } from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useMobileSheet } from '../MobileSheet/useMobileSheet';
import { useModalFocus } from '../MobileSheet/useModalFocus';
import type { DomainLinkField } from '../DomainLinks/index.web';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { DomainInput, DomainRecord } from '../../shared/types';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { markDomainFieldsKnown } from '../../shared/registrarSync/metadata';
import { normalizeDomainTags, validateDomainTags } from '../../shared/domainTags';
import { normalizeDomainLink, normalizeDomainLinks } from '../../shared/domainLinks';
import { DOMAIN_PRICE_FIELDS, normalizeDomainPrice } from '../../shared/domainPricing';
import { getCustomSiteIconUrl, normalizeSiteIconUrl } from '../../shared/domainSiteIcon';
import { useDomainGroupEditor } from '../../shared/portfolioPreferences/useDomainGroupEditor';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { getDomainSource, normalizeDomainName, getDomainDeletionRestriction } from '../../shared/domainUtils';

export { useModalFocus } from '../MobileSheet/useModalFocus';

const getInitialInput = (domain?: DomainRecord | null): DomainInput => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAt = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, `0`)}-${String(nextYear.getDate()).padStart(2, `0`)}`;
  return {
    meta: domain?.meta,
    tags: normalizeDomainTags(domain?.tags),
    name: domain?.name ?? ``,
    notes: domain?.notes ?? ``,
    owner: domain?.owner ?? ``,
    mvp: domain?.mvp ?? ``,
    future: domain?.future ?? ``,
    difficulty: domain?.difficulty,
    parentLink: domain?.parentLink ?? ``,
    startingBid: domain?.startingBid,
    estimatedRevenue: domain?.estimatedRevenue,
    childLinks: [...(domain?.childLinks ?? [])],
    previewLinks: [...(domain?.previewLinks ?? [])],
    relatedLinks: [...(domain?.relatedLinks ?? [])],
    githubRepoLink: domain?.githubRepoLink ?? ``,
    productionLink: domain?.productionLink ?? ``,
    developmentLinks: [...(domain?.developmentLinks ?? [])],
    socialMediaLinks: [...(domain?.socialMediaLinks ?? [])],
    projectStatus: normalizeDomainProjectStatus(domain?.projectStatus),
    description: domain?.description ?? ``,
    autoRenew: domain?.autoRenew ?? true,
    renewalPrice: domain?.renewalPrice ?? 0,
    createdAt: domain?.createdAt,
    expiresAt: domain?.expiresAt ?? expiresAt,
    registrar: domain?.registrar ?? REGISTRARS?.[0] ?? `Namecheap`,
  };
};

type DomainEditorTab = `general` | `project` | `links` | `actions`;
type DomainEditorField = keyof DomainInput | `siteIconUrl`;
const DOMAIN_EDITOR_LINK_FIELDS: { key: DomainLinkField; label: string; multiple?: boolean }[] = [
  { key: `parentLink`, label: `Parent Link` },
  { key: `productionLink`, label: `Production Link` },
  { key: `githubRepoLink`, label: `GitHub Repository Link` },
  { key: `childLinks`, label: `Child Links`, multiple: true },
  { key: `previewLinks`, label: `Preview Links`, multiple: true },
  { key: `relatedLinks`, label: `Related Links`, multiple: true },
  { key: `developmentLinks`, label: `Development Links`, multiple: true },
  { key: `socialMediaLinks`, label: `Social Media Links`, multiple: true },
];

export const useDomainEditor = (domain: DomainRecord | null | undefined, onClose: () => void) => {
  const preferences = usePortfolioPreferences();
  const { addDomain, deleteDomain, updateDomain } = useDomains();
  const groupEditor = useDomainGroupEditor(domain?.id);
  const isSynced = domain && getDomainSource(domain) === `registrar`;
  const [error, setError] = useState(``);
  const [activeTab, setActiveTabValue] = useState<DomainEditorTab>(`general`);
  const [invalidField, setInvalidField] = useState<DomainEditorField | null>(null);
  const [validationFocusRequest, setValidationFocusRequest] = useState(0);
  const [moving, setMoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [nameFocusRequest, setNameFocusRequest] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const pendingActionRef = useRef(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const [input, setInput] = useState<DomainInput>(() => getInitialInput(domain));
  const sheet = useMobileSheet(onClose, { disabled: saving || deleting });
  const close = () => { if (!pendingActionRef.current) sheet.close(); };
  const hidden = Boolean(domain?.id && preferences.hiddenDomainIds.includes(domain.id));
  const currentGroup = preferences.customGroups.find(group => domain?.id && group.domainIds.includes(domain.id));
  const currentCollection = preferences.collections.find(collection => currentGroup
    ? collection.id === currentGroup.collectionId : collection.domainIds?.includes(domain?.id ?? ``));
  const destinationLabel = [currentCollection?.name ?? `Database`, currentGroup?.name].filter(Boolean).join(` / `);
  const copySections = useMemo(() => ({
    collections: [],
    mainDomains: domain ? [domain] : [],
    mainGroups: domain ? [{ key: `domain:${domain.id}`, label: domain.name, domains: [domain] }] : [],
  }), [domain]);
  const toggleVisibility = () => {
    if (!domain?.id || pendingActionRef.current || preferences.loading) return;
    close();
    const changed = preferences.toggleDomainVisibility(domain.id);
    if (changed && !hidden && !preferences.showHiddenDomains) {
      document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true });
    }
  };
  const openMove = () => {
    if (!domain?.id || confirmingDelete || pendingActionRef.current || preferences.loading) return;
    setMoving(true);
  };
  const closeMove = () => {
    if (pendingActionRef.current) return;
    setMoving(false);
    moveButtonRef.current?.focus({ preventScroll: true });
  };
  const setActiveTab = (value: DomainEditorTab) => {
    if (pendingActionRef.current || confirmingDelete || value === activeTab) return;
    setMoving(false);
    setActiveTabValue(value);
  };
  useModalFocus(modalRef, true, close);

  useEffect(() => {
    if (confirmingDelete) deleteCancelRef.current?.focus();
  }, [confirmingDelete]);

  useEffect(() => {
    if (!invalidField || invalidField === `name` && domain?.id) return;
    setActiveTabValue(DOMAIN_EDITOR_LINK_FIELDS.some(field => field.key === invalidField) ? `links`
      : [`tags`, `difficulty`, `startingBid`, `estimatedRevenue`, `mvp`, `future`, `description`].includes(invalidField) ? `project` : `general`);
  }, [invalidField, validationFocusRequest, domain?.id]);

  useEffect(() => {
    if (!invalidField || invalidField === `name` && domain?.id) return;
    const frame = window.requestAnimationFrame(() => {
      const fieldId = DOMAIN_EDITOR_LINK_FIELDS.some(field => field.key === invalidField)
        ? `domain-editor-links-${domain?.id}-${invalidField}-input`
        : invalidField === `siteIconUrl` ? `domain-site-icon-input`
          : invalidField === `owner` ? `domain-owner-input`
            : invalidField === `renewalPrice` ? `domain-price-input`
              : invalidField === `name` ? `domain-name-input`
                : invalidField === `tags` ? `domain-tags-input-${domain?.id ?? `new`}`
                  : DOMAIN_PRICE_FIELDS.some(field => field.field === invalidField) ? `domain-${invalidField}-input-${domain?.id ?? `new`}`
                    : `domain-${invalidField}-input`;
      document.getElementById(fieldId)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, invalidField, validationFocusRequest, domain?.id]);

  const requestDelete = () => {
    if (!domain?.id || moving || pendingActionRef.current || getDomainDeletionRestriction(domain)) return;
    setError(``);
    setConfirmingDelete(true);
  };
  const cancelDelete = () => {
    if (pendingActionRef.current) return;
    setError(``);
    setConfirmingDelete(false);
    deleteButtonRef.current?.focus();
  };
  const handleDelete = async () => {
    if (!domain?.id || !confirmingDelete || pendingActionRef.current) return;
    const restriction = getDomainDeletionRestriction(domain);
    if (restriction) {
      setError(restriction);
      setConfirmingDelete(false);
      return;
    }
    pendingActionRef.current = true;
    setError(``);
    setDeleting(true);
    try {
      await deleteDomain(domain.id);
      sheet.dismiss();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Delete Domain`);
    } finally {
      pendingActionRef.current = false;
      setDeleting(false);
    }
  };
  const setField = <Key extends keyof DomainInput>(field: Key, value: DomainInput[Key]) => {
    if (pendingActionRef.current) return;
    if (isSynced && ![`mvp`, `meta`, `tags`, `future`, `childLinks`, `parentLink`, `difficulty`, `startingBid`, `description`, `previewLinks`, `relatedLinks`, `projectStatus`, `githubRepoLink`, `productionLink`, `estimatedRevenue`, `developmentLinks`, `socialMediaLinks`].includes(field)) return;
    setError(``);
    setInvalidField(null);
    if (field === `name`) setNameInvalid(false);
    setInput(previous => markDomainFieldsKnown({ ...previous, [field]: value }, field === `autoRenew` || field === `renewalPrice` ? [field] : []));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (moving || confirmingDelete || pendingActionRef.current) return;
    let field: DomainEditorField = `name`;
    try {
      if (!isSynced) {
        normalizeDomainName(input.name);
        field = `owner`;
        if (!input.owner?.trim()) throw new Error(`Enter The Domain Owner`);
        field = `renewalPrice`;
        if (!Number.isFinite(input.renewalPrice) || input.renewalPrice < 0) throw new Error(`Enter A Renewal Price Of Zero Or More`);
        normalizeDomainPrice(input.renewalPrice, `Renewal Price`);
      }
      field = `siteIconUrl`;
      normalizeSiteIconUrl(getCustomSiteIconUrl(input));
      for (const link of DOMAIN_EDITOR_LINK_FIELDS) {
        field = link.key;
        if (link.multiple) normalizeDomainLinks(input[link.key], link.label);
        else normalizeDomainLink(input[link.key], link.label);
      }
      for (const price of DOMAIN_PRICE_FIELDS) {
        field = price.field;
        normalizeDomainPrice(input[price.field], price.label);
      }
      field = `tags`;
      validateDomainTags(input.tags);
    } catch (caught) {
      setInvalidField(field);
      setValidationFocusRequest(current => current + 1);
      if (field === `name` && domain?.id) {
        setNameInvalid(true);
        setNameFocusRequest(current => current + 1);
      }
      setError(caught instanceof Error ? caught.message : `Enter Valid Domain Details`);
      return;
    }
    pendingActionRef.current = true;
    setError(``);
    setSaving(true);
    const domainInput = {
      ...input,
      mvp: input.mvp?.trim() ?? ``,
      future: input.future?.trim() ?? ``,
      owner: input.owner.trim(),
      name: input.name.trim().toLowerCase(),
      description: input.description?.trim() ?? ``,
    };
    try {
      if (domain?.id) {
        groupEditor.validateGroup();
        await updateDomain(domain.id, domainInput);
        groupEditor.saveGroup(domain.id);
      } else await addDomain(domainInput);
      sheet.dismiss();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Save Domain`);
    } finally {
      pendingActionRef.current = false;
      setSaving(false);
    }
  };
  return {
    error,
    input,
    close,
    sheet,
    activeTab,
    setActiveTab,
    invalidField,
    hidden,
    moving,
    openMove,
    closeMove,
    deleting,
    setField,
    modalRef,
    nameInvalid,
    groupEditor,
    copySections,
    moveButtonRef,
    handleDelete,
    cancelDelete,
    requestDelete,
    handleSubmit,
    nameFocusRequest,
    deleteButtonRef,
    deleteCancelRef,
    confirmingDelete,
    toggleVisibility,
    actionsDisabled: preferences.loading,
    destinationLabel,
    invalidLinkField: DOMAIN_EDITOR_LINK_FIELDS.find(field => field.key === invalidField)?.key ?? null,
    saving: saving || deleting,
  };
};
