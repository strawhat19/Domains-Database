import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { REGISTRARS } from '../../shared/config';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { getDomainStatus } from '../../shared/domainUtils';
import { parseDomainCsv, exportDomainCsv } from '../../shared/csv';
import { useDomains } from '../../shared/domainContext/useDomains';
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
    autoRenew: true,
    renewalPrice: 0,
    owner: `My Portfolio`,
    registrar: REGISTRARS[0],
    expiresAt: `${year}-${month}-${day}`,
  };
};

export const useNativePortfolio = (compact = false) => {
  const context = useDomains();
  const [search, setSearch] = useState(``);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(false);
  const [formError, setFormError] = useState(``);
  const [editorOpen, setEditorOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [renewalPrice, setRenewalPrice] = useState(``);
  const [editingId, setEditingId] = useState<string>();
  const [input, setInput] = useState<DomainInput>(newDomain);
  const [sortByName, setSortByName] = useState(true);
  const [registrar, setRegistrar] = useState<Registrar | `All`>(`All`);
  const filteredDomains = useMemo(() => {
    const query = search.trim().toLowerCase();
    return context.domains
      .filter(domain => (registrar === `All` || domain.registrar === registrar) && `${domain.name} ${domain.owner} ${domain.registrar}`.toLowerCase().includes(query))
      .sort((first, second) => sortByName ? first.name.localeCompare(second.name) : first.expiresAt.localeCompare(second.expiresAt));
  }, [context.domains, search, registrar, sortByName]);
  const visibleDomains = compact ? filteredDomains.slice(0, 4) : filteredDomains;
  const dueSoon = context.domains.filter(domain => getDomainStatus(domain) !== `Active`).length;
  const openSetup = () => {
    context.clearNotice();
    setSearch(``);
    setRegistrar(`All`);
    setSetupOpen(true);
  };
  const closeSetup = () => setSetupOpen(false);

  const openEditor = (domain?: DomainRecord) => {
    context.clearNotice();
    setFormError(``);
    setEditingId(domain?.id);
    setRenewalPrice(domain ? String(domain.renewalPrice) : ``);
    setInput(domain ? {
      name: domain.name,
      owner: domain.owner,
      notes: domain.notes,
      registrar: domain.registrar,
      expiresAt: domain.expiresAt.slice(0, 10),
      autoRenew: domain.autoRenew,
      renewalPrice: domain.renewalPrice,
    } : newDomain());
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (!saving) setEditorOpen(false);
  };

  const updateInput = <K extends keyof DomainInput>(field: K, value: DomainInput[K]) => setInput(current => ({ ...current, [field]: value }));

  const saveDomain = async () => {
    if (saving) return;
    setSaving(true);
    setFormError(``);
    try {
      const record = { ...input, renewalPrice: Number(renewalPrice || 0) };
      if (editingId) await context.updateDomain(editingId, record);
      else await context.addDomain(record);
      setEditorOpen(false);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteDomain = (domain: DomainRecord) => Alert.alert(
    `Delete Domain`,
    `Remove ${domain.name} from this device? Your registration will remain with ${domain.registrar}.`,
    [
      { text: `Cancel`, style: `cancel` },
      { text: `Delete`, style: `destructive`, onPress: () => {
        void context.deleteDomain(domain.id).catch(error => Alert.alert(`Unable To Delete Domain`, errorMessage(error)));
      } },
    ],
  );

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
    `This replaces every domain saved on this device with the sample portfolio. Export a backup first if you want to keep your entries.`,
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
    search,
    dueSoon,
    saving,
    working,
    registrar,
    formError,
    editingId,
    editorOpen,
    setupOpen,
    sortByName,
    renewalPrice,
    visibleDomains,
    filteredDomains,
    openEditor,
    openSetup,
    closeSetup,
    closeEditor,
    updateInput,
    saveDomain,
    deleteDomain,
    importCsv,
    exportCsv,
    resetSamples,
    setSearch,
    setRegistrar,
    setSortByName,
    setRenewalPrice,
  };
};
