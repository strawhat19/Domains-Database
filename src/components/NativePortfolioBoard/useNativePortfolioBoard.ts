import { Alert } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import { allowDomainsInCollections } from '../../shared/config';
import type { DomainInput, DomainRecord } from '../../shared/types';
import type { NativeDragItem, NativeDropTarget } from '../NativePortfolioDrag/index.native';
import { portfolioHaptic } from '../../shared/common/haptics.native';
import { getDomainSource } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';
import { normalizeGroupDetails } from '../../shared/portfolioPreferences/details';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { buildPortfolioSections, sortPortfolioDomains } from '../../shared/portfolioPreferences/groups';
import { DEFAULT_DOMAIN_PROJECT_STATUS, normalizeDomainProjectStatus } from '../../shared/domainProject';
import type { CustomPortfolioCollection, CustomPortfolioGroup, GroupSettingsInput } from '../../shared/portfolioPreferences/types';

export type BoardTarget = { kind: `domain` | `group` | `collection`; id: string };
export type QuickField = `name` | `description` | `projectStatus` | `mvp` | `future`;
export interface BoardEdit {
  kind: BoardTarget[`kind`];
  id?: string;
  field?: QuickField;
  convertToCollection?: boolean;
  collectionId?: string | null;
}
export interface BoardDraft extends GroupSettingsInput {
  mvp: string;
  future: string;
  visibility: `private` | `public`;
}
const newDraft = (): BoardDraft => ({ name: ``, description: ``, mvp: ``, future: ``, isApp: false, visibility: `private`, projectStatus: DEFAULT_DOMAIN_PROJECT_STATUS });

export const useNativePortfolioBoard = (domains: DomainRecord[], onEditDomain: (domain: DomainRecord) => void, selectedIds: string[]) => {
  const preferences = usePortfolioPreferences();
  const context = useDomains();
  const orderedDomains = useMemo(() => [...domains].sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: `base` })), [domains]);
  const sections = useMemo(() => buildPortfolioSections(orderedDomains, { ...preferences, groupBy: `custom` }), [orderedDomains, preferences]);
  const fullSections = useMemo(() => buildPortfolioSections(sortPortfolioDomains(context.domains, `name`), {
    ...preferences,
    groupBy: `custom`,
    showHiddenGroups: true,
    showHiddenDomains: true,
    showHiddenCollections: true,
  }), [context.domains, preferences]);
  const fullGroups = useMemo(() => [
    ...fullSections.mainGroups.filter(group => !group.customGroupId),
    ...fullSections.mainGroups.filter(group => Boolean(group.customGroupId)),
    ...fullSections.collections.flatMap(section => section.groups),
  ], [fullSections]);
  const [menu, setMenu] = useState<BoardTarget | null>(null);
  const [moving, setMoving] = useState(false);
  const [edit, setEdit] = useState<BoardEdit | null>(null);
  const [draft, setDraft] = useState<BoardDraft>(newDraft);
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const latest = useRef({ context, preferences, edit, draft, selectedIds, fullGroups });
  latest.current = { context, preferences, edit, draft, selectedIds, fullGroups };
  const menuRecord = menu?.kind === `domain` ? context.domains.find(domain => domain.id === menu.id)
    : menu?.kind === `group` ? preferences.customGroups.find(group => group.id === menu.id)
      : preferences.collections.find(collection => collection.id === menu?.id);
  const menuName = menuRecord?.name ?? `Actions`;
  const openMenu = (target: BoardTarget, held = false) => { if (busy.current) return; setMoving(false); setMenu(target); portfolioHaptic(held ? `lift` : `tap`); };
  const closeMenu = () => { setMenu(null); setMoving(false); };
  const afterMenu = () => { const action = pendingAction.current; pendingAction.current = null; action?.(); };
  const handoff = (action: () => void) => { pendingAction.current = action; closeMenu(); };
  const openEdit = (target: BoardEdit) => {
    if (busy.current) return;
    const current = latest.current;
    const record = target.kind === `domain` ? current.context.domains.find(domain => domain.id === target.id)
      : target.kind === `group` ? current.preferences.customGroups.find(group => group.id === target.id)
        : current.preferences.collections.find(collection => collection.id === target.id);
    if (target.id && !record) return;
    setError(``);
    setDraft({ ...newDraft(), ...record, collectionId: target.convertToCollection ? null : target.collectionId ?? (record as CustomPortfolioGroup | undefined)?.collectionId ?? null, visibility: (record as CustomPortfolioCollection | undefined)?.visibility ?? `private`, mvp: (record as DomainRecord | undefined)?.mvp ?? ``, future: (record as DomainRecord | undefined)?.future ?? ``, description: record?.description ?? `` });
    setEdit(target);
    portfolioHaptic(`tap`);
  };
  const closeEdit = () => { if (!busy.current) setEdit(null); };
  const change = <K extends keyof BoardDraft>(field: K, value: BoardDraft[K]) => setDraft(current => ({ ...current, [field]: value }));
  const save = async () => {
    const current = latest.current;
    const session = current.edit;
    if (!session || busy.current) return;
    busy.current = true; setSaving(true); setError(``);
    try {
      const value = current.draft;
      const name = value.name.trim();
      if ((!session.field || session.field === `name`) && !name) throw new Error(`Add A Name`);
      if (session.kind === `domain`) {
        const domain = current.context.domains.find(domain => domain.id === session.id);
        if (!domain || !session.field) throw new Error(`Domain Was Not Found`);
        if (session.field === `name` && getDomainSource(domain) === `registrar`) throw new Error(`This Name Is Managed By Your Registrar`);
        const next: DomainInput = { ...domain, [session.field]: session.field === `name` ? name : session.field === `projectStatus` ? normalizeDomainProjectStatus(value.projectStatus) : value[session.field] };
        await current.context.updateDomain(domain.id, next);
      } else if (session.kind === `collection`) {
        const collection = current.preferences.collections.find(item => item.id === session.id);
        if (session.id && !collection) throw new Error(`This Collection Is No Longer Available`);
        const result = collection ? current.preferences.updateCollection(collection.id,
          session.field && session.field !== `name` ? collection.name : name,
          session.field && session.field !== `description` ? collection.description ?? `` : value.description,
          session.field ? collection.visibility : value.visibility,
          session.field && session.field !== `projectStatus` ? collection.projectStatus : value.projectStatus)
          : current.preferences.createCollection(name, value.description);
        if (!result) throw new Error(`Collection Could Not Be Saved. Check Its Name`);
        if (!collection && typeof result === `string`) current.preferences.updateCollection(result, name, value.description, value.visibility, value.projectStatus);
      } else {
        const group = current.preferences.customGroups.find(item => item.id === session.id);
        if (session.id && !group) throw new Error(`This Group / App Is No Longer Available`);
        const details = normalizeGroupDetails(value);
        if (session.convertToCollection) {
          if (!group || !current.preferences.saveGroupSettings(group.id, { ...details, name, description: value.description, collectionId: null, convertToCollection: true, newCollection: { name, description: value.description } })) throw new Error(`Group Could Not Be Converted. Check The Collection Name`);
        } else if (group && session.field) {
          const result = session.field === `name` ? current.preferences.renameGroup(group.id, name)
            : session.field === `description` ? current.preferences.updateGroup(group.id, group.name, value.description)
              : current.preferences.updateGroupProjectStatus(group.id, normalizeDomainProjectStatus(value.projectStatus));
          if (!result) throw new Error(`Group Could Not Be Saved. Check Its Name`);
        } else {
          const groupId = group?.id ?? current.preferences.createGroup(name, [], { collectionId: value.collectionId });
          if (!groupId || !current.preferences.saveGroupSettings(groupId, { ...details, name, description: value.description, collectionId: value.collectionId ?? null })) throw new Error(`Group Could Not Be Saved. Check Its Name And Links`);
        }
      }
      portfolioHaptic(`drop`); setEdit(null);
    } catch (failure) { setError(failure instanceof Error ? failure.message : `Changes Could Not Be Saved`); }
    finally { busy.current = false; setSaving(false); }
  };
  const drop = (item: NativeDragItem, target: NativeDropTarget) => {
    const current = latest.current;
    const pref = current.preferences;
    if (pref.loading || busy.current) return;
    if (target.targetId === item.id) return;
    setError(``);
    let changed = false;
    if (item.kind === `collection` && target.targetId) changed = pref.moveCollection(item.id, target.targetId, target.placement);
    if (item.kind === `group`) {
      if (target.targetId) changed = pref.moveGroup(item.id, target.targetId, target.placement);
      else {
        changed = pref.assignGroupCollection(item.id, target.collectionId ?? null);
        const siblings = pref.customGroups.filter(group => group.id !== item.id && (group.collectionId ?? null) === (target.collectionId ?? null));
        const last = siblings[siblings.length - 1];
        if (last) pref.moveGroup(item.id, last.id, `after`);
      }
    }
    if (item.kind === `domain`) {
      if (!current.context.domains.some(domain => domain.id === item.id)) return;
      const group = target.groupId ? pref.customGroups.find(group => group.id === target.groupId) : undefined;
      if (target.groupId && (!group || (group.collectionId ?? null) !== (target.collectionId ?? null))) return;
      const collectionId = group?.collectionId ?? target.collectionId ?? undefined;
      if (!allowDomainsInCollections && collectionId && !group) return;
      const collection = pref.collections.find(collection => collection.id === collectionId);
      if (collectionId && !collection) return;
      const groupKey = group ? `custom:${group.id}` : collectionId ? `collection:${collectionId}` : `custom:ungrouped`;
      const selected = new Set(current.selectedIds);
      const ids = selected.has(item.id) ? current.fullGroups.flatMap(group => group.domains.filter(domain => selected.has(domain.id)).map(domain => domain.id)) : [item.id];
      if (!ids.length || target.targetId && ids.includes(target.targetId)) return;
      const destinationOrder = current.fullGroups.find(group => group.key === groupKey)?.domains.map(domain => domain.id) ?? [];
      if (target.targetId && !destinationOrder.includes(target.targetId)) return;
      const completeIds = [...new Set([...destinationOrder, ...ids])];
      changed = group ? pref.assignDomains(ids, group.id) : pref.assignDomainsToCollection(ids, collectionId ?? null);
      if (changed) {
        if (collection?.sortField) { pref.setCollectionSort(collection.id, null, `asc`); pref.resetOrder(groupKey); }
        const moving = new Set(ids);
        const remaining = destinationOrder.filter(id => !moving.has(id));
        if (!remaining.length) pref.resetOrder(groupKey);
        const destination = target.targetId ?? remaining[remaining.length - 1];
        const placement = target.targetId ? target.placement ?? `before` : `after`;
        if (destination) {
          const ordered = placement === `after` ? [...ids].reverse() : ids;
          ordered.forEach(id => pref.moveDomain(groupKey, id, destination, completeIds, placement));
        } else if (ids.length > 1) pref.moveDomain(groupKey, ids[0], ids[1], ids);
      }
    }
    if (changed) portfolioHaptic(`drop`);
    else setError(`Could Not Move Item — Try Again`);
  };
  const moveMenuItem = (target: NativeDropTarget) => {
    if (!menu || !menuRecord) return;
    drop({ ...menu, label: menuRecord.name }, target); closeMenu();
  };
  const removeGroup = () => {
    if (menu?.kind !== `group`) return;
    const id = menu.id;
    Alert.alert(`Delete Group`, `Remove ${menuName}? Its domains will remain in your portfolio.`, [
      { text: `Cancel`, style: `cancel` },
      { text: `Delete`, style: `destructive`, onPress: () => { if (latest.current.preferences.deleteGroup(id)) portfolioHaptic(`drop`); closeMenu(); } },
    ]);
  };
  const openDomainSettings = () => {
    const domain = context.domains.find(domain => domain.id === menu?.id);
    if (domain) handoff(() => onEditDomain(domain));
  };
  const toggleApp = () => {
    const group = latest.current.preferences.customGroups.find(group => group.id === menu?.id);
    if (!group) return;
    if (latest.current.preferences.saveGroupSettings(group.id, { name: group.name, description: group.description ?? ``, isApp: !group.isApp })) { portfolioHaptic(`drop`); closeMenu(); }
    else setError(`Group Could Not Be Converted`);
  };
  return { preferences, context, sections, fullGroups, selectedIds, menu, menuName, menuRecord, moving, setMoving, openMenu, closeMenu, afterMenu, handoff, edit, draft, error, saving, openEdit, closeEdit, change, save, drop, moveMenuItem, removeGroup, toggleApp, openDomainSettings };
};
