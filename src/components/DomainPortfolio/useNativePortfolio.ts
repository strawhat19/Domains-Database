import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { REGISTRARS, PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import { DEFAULT_DOMAIN_PROJECT_STATUS, normalizeDomainProjectStatus } from '../../shared/domainProject';
import { PORTFOLIO_COLUMNS, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { getDomainSource, getDomainStatus, getRegistrarCounts, getDomainDeletionRestriction } from '../../shared/domainUtils';
import { parseDomainCsv, exportDomainCsv } from '../../shared/csv';
import { useDomains } from '../../shared/domainContext/useDomains';
import { markDomainFieldsKnown } from '../../shared/registrarSync/metadata';
import { useDomainGroupEditor } from '../../shared/portfolioPreferences/useDomainGroupEditor';
import type { DomainInput, DomainRecord, Registrar } from '../../shared/types';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : `Something Went Wrong`;
const newDomain = (): DomainInput => {
  const today = new Date();
  const year = today.getFullYear() + 1;
  const month = String(today.getMonth() + 1).padStart(2, `0`);
  const day = String(today.getDate()).padStart(2, `0`);
  return {
    name: ``,
    notes: ``,
    mvp: ``,
    future: ``,
    autoRenew: true,
    description: ``,
    renewalPrice: 0,
    owner: `My Portfolio`,
    registrar: REGISTRARS[0],
    projectStatus: DEFAULT_DOMAIN_PROJECT_STATUS,
    createdAt: `${today.getFullYear()}-${month}-${day}`,
    expiresAt: `${year}-${month}-${day}`,
  };
};

export const useNativePortfolio = (compact = false) => {
  const context = useDomains();
  const registrarCounts = useMemo(() => getRegistrarCounts(context.domains), [context.domains]);
  const [search, setSearch] = useState(``);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [working, setWorking] = useState(false);
  const [formError, setFormError] = useState(``);
  const [editorOpen, setEditorOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [renewalPrice, updateRenewalPrice] = useState(``);
  const [editingId, setEditingId] = useState<string>();
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [input, setInput] = useState<DomainInput>(newDomain);
  const [sortByName, setSortByName] = useState(true);
  const [registrar, setRegistrar] = useState<Registrar | `All`>(`All`);
  const mutationPending = useRef(false);
  const deleteConfirmationOpen = useRef(false);
  const currentEditor = useRef({ open: editorOpen, id: editingId });
  currentEditor.current = { open: editorOpen, id: editingId };
  const groupEditor = useDomainGroupEditor(editingId);
  const editingSyncedDomain = Boolean(editingDomain && getDomainSource(editingDomain) === `registrar`);
  const filteredDomains = useMemo(() => {
    const query = search.trim().toLowerCase();
    return context.domains
      .filter(domain => (registrar === `All` || domain.registrar === registrar) && [
        domain.title,
        normalizeDomainProjectStatus(domain.projectStatus),
        domain.description,
        ...PORTFOLIO_COLUMNS.map(column => getPortfolioColumnValue(domain, column.field)),
      ].join(` `).toLowerCase().includes(query))
      .sort((first, second) => sortByName ? first.name.localeCompare(second.name) : first.expiresAt.localeCompare(second.expiresAt));
  }, [context.domains, search, registrar, sortByName]);
  const visibleDomains = compact ? filteredDomains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : filteredDomains;
  const dueSoon = context.domains.filter(domain => getDomainStatus(domain) !== `Active`).length;
  const openSetup = () => {
    context.clearNotice();
    setSearch(``);
    setRegistrar(`All`);
    setSetupOpen(true);
  };
  const closeSetup = () => setSetupOpen(false);

  const openEditor = (domain?: DomainRecord) => {
    if (mutationPending.current || deleteConfirmationOpen.current) return;
    context.clearNotice();
    setFormError(``);
    setEditingId(domain?.id);
    setEditingDomain(domain ?? null);
    groupEditor.resetGroup(domain?.id);
    updateRenewalPrice(domain ? String(domain.renewalPrice) : ``);
    setInput(domain ? {
      ...domain,
      meta: domain.meta,
      mvp: domain.mvp ?? ``,
      name: domain.name,
      owner: domain.owner,
      notes: domain.notes,
      future: domain.future ?? ``,
      difficulty: domain.difficulty,
      registrar: domain.registrar,
      projectStatus: normalizeDomainProjectStatus(domain.projectStatus),
      createdAt: domain.createdAt,
      expiresAt: domain.expiresAt,
      autoRenew: domain.autoRenew,
      renewalPrice: domain.renewalPrice,
      description: domain.description ?? ``,
    } : newDomain());
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (!saving && !mutationPending.current) setEditorOpen(false);
  };

  const setRenewalPrice = (value: string) => {
    if (editingSyncedDomain) return;
    updateRenewalPrice(value);
    setInput(current => markDomainFieldsKnown(current, [`renewalPrice`]));
  };
  const updateInput = <K extends keyof DomainInput>(field: K, value: DomainInput[K]) => {
    if (editingSyncedDomain && ![`mvp`, `meta`, `future`, `difficulty`, `description`, `projectStatus`].includes(field)) return;
    setInput(current => {
      if (editingSyncedDomain && field === `meta`) {
        return { ...current, meta: { ...current.meta, siteIconUrl: getCustomSiteIconUrl({ meta: value as DomainInput[`meta`] }) } };
      }
      return markDomainFieldsKnown({ ...current, [field]: value }, field === `autoRenew` || field === `renewalPrice` ? [field] : []);
    });
  };

  const saveDomain = async () => {
    if (saving || mutationPending.current || deleteConfirmationOpen.current) return;
    mutationPending.current = true;
    setSaving(true);
    setFormError(``);
    try {
      if (editingId) groupEditor.validateGroup();
      const syncedDomain = editingSyncedDomain && editingDomain
        ? context.domains.find(domain => domain.id === editingDomain.id) ?? editingDomain : null;
      const record: DomainInput = syncedDomain ? {
        ...syncedDomain,
        mvp: input.mvp,
        future: input.future,
        difficulty: input.difficulty,
        projectStatus: normalizeDomainProjectStatus(input.projectStatus),
        description: input.description ?? ``,
        meta: { ...syncedDomain.meta, siteIconUrl: getCustomSiteIconUrl(input) },
      } : { ...input, renewalPrice: Number(renewalPrice || 0) };
      if (editingId) {
        await context.updateDomain(editingId, record);
        await groupEditor.saveGroup(editingId);
      }
      else await context.addDomain(record);
      setEditorOpen(false);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      mutationPending.current = false;
      setSaving(false);
    }
  };

  const requestDelete = () => {
    if (!editorOpen || !editingId || !editingDomain || editingDomain.id !== editingId
      || saving || mutationPending.current || deleteConfirmationOpen.current) return;
    const domain = context.domains.find(record => record.id === editingId) ?? editingDomain;
    const restriction = getDomainDeletionRestriction(domain);
    if (restriction) { setFormError(restriction); return; }
    const targetId = editingId;
    const releaseConfirmation = () => { deleteConfirmationOpen.current = false; };
    deleteConfirmationOpen.current = true;
    Alert.alert(
      `Delete Domain`,
      `Remove ${domain.name} from your portfolio? Your registration will remain with ${domain.registrar || `your registrar`}.`,
      [
        { text: `Cancel`, style: `cancel`, onPress: releaseConfirmation },
        { text: `Delete`, style: `destructive`, onPress: async () => {
          releaseConfirmation();
          if (mutationPending.current || !currentEditor.current.open || currentEditor.current.id !== targetId) return;
          mutationPending.current = true;
          setSaving(true);
          setDeleting(true);
          setFormError(``);
          try {
            await context.deleteDomain(targetId);
            setEditorOpen(false);
          } catch (error) {
            setFormError(errorMessage(error));
          } finally {
            mutationPending.current = false;
            setDeleting(false);
            setSaving(false);
          }
        } },
      ],
      { cancelable: true, onDismiss: releaseConfirmation },
    );
  };

  const importCsv = async () => {
    if (working) return;
    setWorking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: [`text/*`, `application/csv`, `application/vnd.ms-excel`],
      });
      const document = result.assets?.[0];
      if (result.canceled || !document) return;
      if ((document.size ?? 0) > 5 * 1024 * 1024) throw new Error(`Choose A CSV Smaller Than 5 MB`);
      const file = new File(document.uri);
      const records = parseDomainCsv(await file.text());
      await context.importDomains(records);
      setSearch(``);
      setRegistrar(`All`);
    } catch (error) {
      Alert.alert(`Unable To Import CSV`, errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const exportCsv = async () => {
    if (working) return;
    setWorking(true);
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error(`Sharing Is Unavailable On This Device`);
      const file = new File(Paths.cache, `domains-database-${new Date().toISOString().slice(0, 10)}.csv`);
      file.create({ overwrite: true });
      const domains = await context.prepareExport();
      file.write(exportDomainCsv(domains));
      await Sharing.shareAsync(file.uri, {
        mimeType: `text/csv`,
        dialogTitle: `Export Domains`,
        UTI: `public.comma-separated-values-text`,
      });
    } catch (error) {
      Alert.alert(`Unable To Export CSV`, errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const resetSamples = () => Alert.alert(
    `Restore Sample Domains`,
    `This replaces every domain in your portfolio with the sample portfolio. Export a backup first if you want to keep your entries.`,
    [
      { text: `Cancel`, style: `cancel` },
      { text: `Restore Samples`, style: `destructive`, onPress: () => {
        void context.resetSampleData().catch(error => Alert.alert(`Unable To Restore Samples`, errorMessage(error)));
      } },
    ],
  );

  return {
    ...context,
    input,
    groupEditor,
    search,
    dueSoon,
    saving,
    deleting,
    working,
    registrar,
    formError,
    editingId,
    editorOpen,
    setupOpen,
    sortByName,
    renewalPrice,
    editingDomain,
    editingSyncedDomain,
    visibleDomains,
    registrarCounts,
    filteredDomains,
    openEditor,
    openSetup,
    closeSetup,
    closeEditor,
    updateInput,
    saveDomain,
    requestDelete,
    importCsv,
    exportCsv,
    resetSamples,
    setSearch,
    setRegistrar,
    setSortByName,
    setRenewalPrice,
  };
};
