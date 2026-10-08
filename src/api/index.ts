import { authAPI } from './auth';
import { Domain } from '../shared/models/domains/Domain';
import type { WebsiteInsights } from '../shared/websiteInsights/types';
import { getDomainSource, validateDomainInput, getDomainDeletionRestriction } from '../shared/domainUtils';
import { createSampleDomains } from '../shared/sampleDomains';
import { createOperationQueue } from '../shared/common/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountStorageKey } from '../shared/authentication/userScope';
import type { RegistrarDomain } from '../shared/registrarSync/types';
import { normalizeWebsiteInsights } from '../shared/websiteInsights/values';
import type { DomainInput, DomainRecord, PortfolioSnapshot } from '../shared/types';
import { useSampleData, PORTFOLIO_STORAGE_KEY, useLocalStorage } from '../shared/config';

let userScope: string | null = null;
const snapshots = new Map<string, PortfolioSnapshot>();
const LEGACY_OWNER_KEY = `${PORTFOLIO_STORAGE_KEY}:legacy-owner`;
const GUEST_STORAGE_KEY = `${PORTFOLIO_STORAGE_KEY}:guest`;
const GUEST_OWNER_KEY = `${PORTFOLIO_STORAGE_KEY}:guest-owner`;

const serialize = createOperationQueue(PORTFOLIO_STORAGE_KEY);

const serializePortfolioMutation = <T,>(operation: () => Promise<T>): Promise<T> => {
  const scope = userScope;
  return serialize(async () => {
    if (userScope !== scope) throw new Error(`Portfolio Changed, Please Try Again`);
    return operation();
  });
};

const copyDomains = (domains: DomainRecord[]): DomainRecord[] => domains.map(domain => new Domain(JSON.parse(JSON.stringify(domain))));

const getScope = () => userScope ?? `guest`;
const getScopeUid = () => userScope ?? ``;
const getStorageKey = () => userScope ? accountStorageKey(PORTFOLIO_STORAGE_KEY, userScope) : GUEST_STORAGE_KEY;

const requireScopeSession = async (userId: string) => {
  const session = await authAPI.restoreSession();
  if (session?.user.id !== userId) throw new Error(`Sign In To Manage Domains`);
  return session;
};

const saveSnapshot = async (next: PortfolioSnapshot) => {
  const scope = getScope();
  if (userScope) await requireScopeSession(userScope);
  if (useLocalStorage) {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(next));
    } catch {
      throw new Error(`Could Not Save Your Portfolio On This Device`);
    }
  }
  snapshots.set(scope, next);
};

const restoreSnapshot = (parsed: PortfolioSnapshot, uid = getScopeUid()): PortfolioSnapshot => {
  if (parsed?.version !== 1 || !Array.isArray(parsed?.domains) || !Number.isInteger(parsed?.nextNumber)) throw new Error(`Saved Portfolio Data Could Not Be Read`);
  const ids = new Set<string>();
  const names = new Set<string>();
  const numbers = new Set<number>();
  const storedDomains = useSampleData ? parsed.domains : parsed.domains.filter(domain => !domain?.isSample);
  const domains = storedDomains.map(domain => {
    const input = validateDomainInput(domain);
    if (!domain?.id || !Number.isInteger(domain?.number) || domain.number < 1 || ids.has(domain.id) || numbers.has(domain.number) || names.has(input.name)) throw new Error(`Saved Portfolio Data Could Not Be Read`);
    const restored = new Domain({ ...domain, ...input, uid, isSample: domain.isSample === true });
    ids.add(restored.id);
    numbers.add(restored.number);
    names.add(restored.name);
    return restored;
  });
  return { version: 1, domains, nextNumber: Math.max(parsed.nextNumber, ...domains.map(domain => domain.number + 1), 1) };
};

const readSnapshot = async (): Promise<PortfolioSnapshot> => {
  const scope = getScope();
  if (userScope) await requireScopeSession(userScope);
  const cached = snapshots.get(scope);
  if (cached && !useLocalStorage) {
    const domains = useSampleData ? cached.domains : cached.domains.filter(domain => !domain.isSample);
    if (domains.length !== cached.domains.length) {
      const filtered = { ...cached, domains };
      await saveSnapshot(filtered);
      return filtered;
    }
    return cached;
  }
  let saved: string | null = null;
  if (useLocalStorage) {
    try {
      saved = await AsyncStorage.getItem(getStorageKey());
    } catch {
      throw new Error(`Could Not Load Your Portfolio From This Device`);
    }
  }
  if (saved !== null) {
    let restored: PortfolioSnapshot;
    try {
      restored = restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot);
    } catch {
      throw new Error(`Saved Portfolio Data Could Not Be Read`);
    }
    if (JSON.stringify(restored) !== saved) await saveSnapshot(restored);
    else snapshots.set(scope, restored);
    return restored;
  }
  const domains = useSampleData ? createSampleDomains().map(domain => new Domain({ ...domain, uid: getScopeUid() })) : [];
  const initial: PortfolioSnapshot = { version: 1, domains, nextNumber: domains.length + 1 };
  await saveSnapshot(initial);
  return initial;
};

const claimLegacyPortfolio = async () => {
  if (!useLocalStorage || !userScope) return;
  const userId = userScope;
  let saved: string | null;
  try {
    const current = await AsyncStorage.getItem(accountStorageKey(PORTFOLIO_STORAGE_KEY, userId));
    if (current !== null) return;
    const legacyOwner = await AsyncStorage.getItem(LEGACY_OWNER_KEY);
    if (legacyOwner && legacyOwner !== userId) return;
    saved = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
  } catch {
    throw new Error(`Could Not Load Your Existing Portfolio`);
  }
  if (saved === null) return;
  let restored: PortfolioSnapshot;
  try {
    restored = restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot);
  } catch {
    throw new Error(`Existing Portfolio Data Could Not Be Read`);
  }
  try {
    await AsyncStorage.setItem(LEGACY_OWNER_KEY, userId);
  } catch {
    throw new Error(`Could Not Assign Your Existing Portfolio`);
  }
  await saveSnapshot(restored);
};

const adoptGuestPortfolio = async () => {
  if (!userScope) return;
  const session = await authAPI.restoreSession();
  if (session?.user.id !== userScope || session.user.number !== 1) return;
  const userId = userScope;
  let guest = snapshots.get(`guest`);
  if (useLocalStorage) {
    try {
      const owner = await AsyncStorage.getItem(GUEST_OWNER_KEY);
      if (owner && owner !== userId) return;
      await AsyncStorage.setItem(GUEST_OWNER_KEY, userId);
      const saved = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
      guest = saved !== null ? restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot, ``) : undefined;
    } catch {
      throw new Error(`Could Not Load Your Guest Portfolio`);
    }
  }
  if (!guest?.domains.length) return;
  const current = await readSnapshot();
  const names = new Set(current.domains.map(domain => domain.name));
  const domains = copyDomains(current.domains);
  let nextNumber = current.nextNumber;
  for (const record of guest.domains) {
    if (names.has(record.name)) continue;
    domains.push(new Domain({ ...record, id: undefined, uuid: undefined, uid: userId, number: nextNumber }));
    names.add(record.name);
    nextNumber += 1;
  }
  await saveSnapshot({ version: 1, domains, nextNumber });
  const cleared: PortfolioSnapshot = { ...guest, domains: [] };
  if (useLocalStorage) {
    try { await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cleared)); }
    catch { throw new Error(`Could Not Clear Your Adopted Guest Portfolio`); }
  }
  snapshots.set(`guest`, cleared);
};

export interface PublicDomainSummary {
  id: string;
  name: string;
  userId: string;
  tld?: string;
  mvp?: string;
  future?: string;
  created: string;
  expiresAt: string;
  createdAt?: string;
  description: string;
  difficulty?: DomainRecord[`difficulty`];
  projectStatus: DomainRecord[`projectStatus`];
  registrar: DomainRecord[`registrar`];
}

const getPublicDomainSummaries = async (userIds: string[]): Promise<PublicDomainSummary[]> => {
  const requested = new Set(userIds);
  const profiles = await authAPI.getPublicProfiles();
  const eligible = profiles.filter(profile => requested.has(profile.id) && profile.publicDomains && profile.profilePrivacy === `public`);
  const summaries: PublicDomainSummary[] = [];
  for (const profile of eligible) {
    const saved = useLocalStorage
      ? await AsyncStorage.getItem(accountStorageKey(PORTFOLIO_STORAGE_KEY, profile.id))
      : null;
    const portfolio = useLocalStorage
      ? saved !== null ? restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot, profile.id) : undefined
      : snapshots.get(profile.id);
    for (const domain of portfolio?.domains ?? []) {
      if (!domain.isSample) summaries.push({
        id: domain.id,
        tld: domain.tld,
        mvp: domain.mvp,
        name: domain.name,
        userId: profile.id,
        future: domain.future,
        created: domain.created,
        registrar: domain.registrar,
        expiresAt: domain.expiresAt,
        createdAt: domain.createdAt,
        difficulty: domain.difficulty,
        description: domain.description,
        projectStatus: domain.projectStatus,
      });
    }
  }
  return summaries;
};

const assertUnique = (name: string, domains: DomainRecord[], id?: string) => {
  if (domains.some(domain => domain.id !== id && domain.name.toLowerCase() === name)) throw new Error(`${name} Is Already In Your Portfolio`);
};

type RegistrarPatch = Partial<DomainInput> & Pick<DomainInput, `name` | `registrar`> & Pick<RegistrarDomain, `renewalEstimate`>;
const normalizeRegistrarDomain = (input: RegistrarDomain, owner: string): RegistrarPatch => {
  if (!input || typeof input !== `object` || Array.isArray(input)) throw new Error(`Registrar Domain Must Be An Object`);
  if (typeof input.name !== `string` || typeof input.registrar !== `string`) throw new Error(`Registrar Domain Must Include A Name And Registrar`);
  if (!input.registrar && !(input.meta?.externalRegistration === true && input.meta?.ownershipConfirmed === true)) throw new Error(`Confirm External Domain Ownership Before Importing`);
  const metadata: NonNullable<DomainInput[`meta`]> = {};
  for (const field of [`source`, `registrarName`, `hostingProvider`, `registrarSource`, `registrarProvider`, `registrarCheckedAt`, `registrarConnectionId`] as const) {
    const value = input.meta?.[field];
    if (value !== undefined) {
      if (typeof value !== `string` || value.length > 256) throw new Error(`Registrar Returned Invalid Source Metadata`);
      metadata[field] = value;
    }
  }
  for (const field of [`externalRegistration`, `ownershipConfirmed`] as const) {
    const value = input.meta?.[field];
    if (value !== undefined) {
      if (typeof value !== `boolean`) throw new Error(`Registrar Returned Invalid Source Metadata`);
      metadata[field] = value;
    }
  }
  const registrarIanaId = input.meta?.registrarIanaId;
  if (registrarIanaId !== undefined) {
    const identifier = typeof registrarIanaId === `string` && /^\d{1,10}$/.test(registrarIanaId) ? Number(registrarIanaId) : registrarIanaId;
    if (typeof identifier !== `number` || !Number.isSafeInteger(identifier) || identifier < 1) throw new Error(`Registrar Returned Invalid Registrar ID`);
    metadata.registrarIanaId = identifier;
  }
  if (metadata.externalRegistration === true && metadata.ownershipConfirmed !== true) throw new Error(`Confirm External Domain Ownership Before Importing`);
  for (const field of [`status`, `expiresAt`, `createdAt`, `providerId`] as const) {
    if (input[field] !== undefined && typeof input[field] !== `string`) throw new Error(`${field} Must Be Text`);
  }
  for (const field of [`locked`, `privacy`, `autoRenew`] as const) {
    if (input[field] !== undefined && typeof input[field] !== `boolean`) throw new Error(`${field} Must Be True Or False`);
  }
  const validated = validateDomainInput({
    owner,
    notes: ``,
    meta: metadata,
    renewalPrice: 0,
    name: input.name,
    status: input.status,
    locked: input.locked,
    privacy: input.privacy,
    registrar: input.registrar,
    createdAt: input.createdAt,
    providerId: input.providerId,
    expiresAt: input.expiresAt ?? ``,
    autoRenew: input.autoRenew ?? false,
  });
  const patch: RegistrarPatch = { name: validated.name, registrar: validated.registrar, meta: validated.meta };
  for (const field of [`status`, `expiresAt`, `createdAt`, `providerId`] as const) {
    const value = validated[field];
    if (value) patch[field] = value;
  }
  for (const field of [`locked`, `privacy`, `autoRenew`] as const) {
    if (input[field] !== undefined) patch[field] = validated[field];
  }
  if (input.renewalEstimate !== undefined) {
    const estimate = input.renewalEstimate;
    if (!estimate || typeof estimate !== `object` || Array.isArray(estimate)
      || input.registrar !== `GoDaddy` || typeof estimate.amount !== `number`
      || !Number.isFinite(estimate.amount) || estimate.amount < 0 || typeof estimate.currency !== `string`
      || !/^[A-Z]{3}$/.test(estimate.currency)) throw new Error(`Registrar Returned An Invalid Renewal Estimate`);
    patch.renewalEstimate = { amount: estimate.amount, currency: estimate.currency };
  }
  return patch;
};

export const API_ROUTES = [
  `/api`,
  `/api/health`,
  `/api/status`,
  `/api/users`,
  `/api/domains`,
  `/api/domains/public`,
  `/api/auth/session`,
  `/api/auth/sign-in`,
  `/api/auth/sign-up`,
  `/api/auth/sign-out`,
  `/api/domains/:id`,
  `/api/notifications`,
  `/api/domains/import`,
  `/api/domains/export`,
  `/api/registrars/sync`,
  `/api/website-insights`,
  `/api/registrars/search`,
  `/api/registrars/extensions`,
  `/api/notifications/:id`,
  ...(useSampleData ? [`/api/domains/sample`] : []),
];

const getStatus = async () => ({
    ok: true,
    status: 200,
    success: true,
    title: `Domains Database`,
    routes: [...API_ROUTES],
    datetime: new Date().toISOString(),
    mode: useLocalStorage ? `Device Storage` : `Session Storage`,
    message: `Local Portfolio API Ready`,
});

export const api = {
  getStatus,
  getHealth: getStatus,
  getRoutes: getStatus,
  setUserScope: (userId: string | null, options: { claimLegacy?: boolean; adoptGuest?: boolean } = {}) => serialize(async () => {
    const nextScope = userId?.trim() || null;
    const session = nextScope ? await requireScopeSession(nextScope) : null;
    userScope = nextScope;
    if (session?.user.number === 1) {
      if (options.claimLegacy) await claimLegacyPortfolio();
      if (options.adoptGuest) await adoptGuestPortfolio();
    }
  }),
  getDomains: () => serialize(async () => copyDomains((await readSnapshot()).domains)),
  getPublicDomainSummaries: (userIds: string[]) => serialize(() => getPublicDomainSummaries(userIds)),
  getSharedDomainSummaries: (userId: string) => serialize(() => getPublicDomainSummaries([userId])),
  saveWebsiteInsights: (id: string, name: string, insights: WebsiteInsights, expectedUserId: string): Promise<void> => serializePortfolioMutation(async () => {
    if (!userScope || expectedUserId !== userScope) throw new Error(`Sign In To Save Website Info`);
    await requireScopeSession(expectedUserId);
    const normalized = normalizeWebsiteInsights(insights, name);
    const current = await readSnapshot();
    const index = current.domains.findIndex(domain => domain.id === id && domain.name === name);
    if (index < 0) throw new Error(`Domain Changed — Refresh Website Info Again`);
    const domains = copyDomains(current.domains);
    const original = domains[index];
    domains[index] = new Domain({ ...original, meta: { ...original.meta, websiteInsights: JSON.parse(JSON.stringify(normalized)) } });
    await saveSnapshot({ ...current, domains });
  }),
  prepareExport: () => serializePortfolioMutation(async () => {
    const current = await readSnapshot();
    const exportedAt = new Date().toISOString();
    const domains = current.domains.map(domain => domain.firstExportedAt ? domain : new Domain({
      ...domain,
      updated: exportedAt,
      firstExportedAt: exportedAt,
    }));
    if (current.domains.some(domain => !domain.firstExportedAt)) await saveSnapshot({ ...current, domains });
    return copyDomains(domains);
  }),
  createDomain: (input: DomainInput) => serializePortfolioMutation(async () => {
    const current = await readSnapshot();
    const validated = validateDomainInput(input);
    assertUnique(validated.name, current.domains);
    const number = current.nextNumber;
    const domain = new Domain({ ...validated, number, uid: getScopeUid(), meta: { ...validated.meta, domainSource: `manual` } });
    await saveSnapshot({ version: 1, nextNumber: number + 1, domains: [...current.domains, domain] });
    return copyDomains([domain])[0];
  }),
  updateDomain: (id: string, input: DomainInput) => serializePortfolioMutation(async () => {
    const current = await readSnapshot();
    const original = current.domains.find(domain => domain.id === id);
    if (!original) throw new Error(`Domain Could Not Be Found`);
    const registrarManaged = getDomainSource(original) === `registrar`;
    const changes: Partial<DomainInput> = registrarManaged ? {
      notes: input?.notes ?? original.notes,
      mvp: input?.mvp ?? original.mvp,
      future: input?.future ?? original.future,
      childLinks: input?.childLinks ?? original.childLinks,
      parentLink: input?.parentLink ?? original.parentLink,
      previewLinks: input?.previewLinks ?? original.previewLinks,
      relatedLinks: input?.relatedLinks ?? original.relatedLinks,
      githubRepoLink: input?.githubRepoLink ?? original.githubRepoLink,
      productionLink: input?.productionLink ?? original.productionLink,
      socialMediaLinks: input?.socialMediaLinks ?? original.socialMediaLinks,
      difficulty: input && `difficulty` in input ? input.difficulty : original.difficulty,
      projectStatus: input && `projectStatus` in input ? input.projectStatus : original.projectStatus,
      description: input?.description ?? original.description,
      meta: {
        ...original.meta,
        ...(input?.meta?.siteIconUrl !== undefined ? { siteIconUrl: input.meta.siteIconUrl } : {}),
      },
    } : input;
    const validated = validateDomainInput({ ...original, ...changes, meta: { ...original.meta, ...changes.meta } });
    assertUnique(validated.name, current.domains, id);
    const previous = original.meta?.registrarSync;
    const incoming = validated.meta?.registrarSync;
    const previousSync = previous && typeof previous === `object` && !Array.isArray(previous) ? previous : undefined;
    const incomingSync = incoming && typeof incoming === `object` && !Array.isArray(incoming) ? incoming : undefined;
    if (previousSync || incomingSync) validated.meta = { ...validated.meta, registrarSync: {
      ...previousSync,
      ...incomingSync,
      ...(validated.autoRenew !== original.autoRenew ? { autoRenewKnown: true } : {}),
      ...(validated.renewalPrice !== original.renewalPrice ? { renewalPriceKnown: true } : {}),
    } };
    const domain = new Domain({
      ...original,
      ...validated,
      id,
      isSample: false,
      starred: original.starred,
      number: original.number,
      meta: { ...validated.meta, domainSource: getDomainSource(original) },
      updated: new Date().toISOString(),
      firstImportedAt: original.firstImportedAt ?? validated.firstImportedAt,
      firstExportedAt: original.firstExportedAt ?? validated.firstExportedAt,
    });
    await saveSnapshot({ ...current, domains: current.domains.map(record => record.id === id ? domain : record) });
    return copyDomains([domain])[0];
  }),
  toggleDomainStar: (id: string): Promise<void> => serializePortfolioMutation(async () => {
    const current = await readSnapshot();
    const original = current.domains.find(domain => domain.id === id);
    if (!original) throw new Error(`Domain Could Not Be Found`);
    const domain = new Domain({ ...original, starred: !original.starred });
    await saveSnapshot({ ...current, domains: current.domains.map(record => record.id === id ? domain : record) });
  }),
  deleteDomain: (id: string) => serializePortfolioMutation(async () => {
    const current = await readSnapshot();
    const domain = current.domains.find(record => record.id === id);
    if (!domain) throw new Error(`Domain Could Not Be Found`);
    const restriction = getDomainDeletionRestriction(domain);
    if (restriction) throw new Error(restriction);
    await saveSnapshot({ ...current, domains: current.domains.filter(domain => domain.id !== id) });
  }),
  importDomains: (inputs: DomainInput[]) => serializePortfolioMutation(async () => {
    if (!inputs?.length) throw new Error(`No Domain(s) Found In The File`);
    const current = await readSnapshot();
    const domains = copyDomains(current.domains);
    const importedNames = new Set<string>();
    const importedAt = new Date().toISOString();
    let nextNumber = current.nextNumber;
    inputs.forEach((input, index) => {
      try {
        const validated = validateDomainInput(input);
        if (importedNames.has(validated.name)) throw new Error(`${validated.name} Appears More Than Once In The Import`);
        importedNames.add(validated.name);
        const existingIndex = domains.findIndex(domain => domain.name.toLowerCase() === validated.name);
        if (existingIndex >= 0) {
          const original = domains[existingIndex];
          domains[existingIndex] = new Domain({
            ...original,
            ...validated,
            isSample: false,
            updated: importedAt,
            id: original.id,
            number: original.number,
            notes: validated.notes || original.notes,
            registrar: validated.registrar || original.registrar,
            expiresAt: validated.expiresAt || original.expiresAt,
            projectStatus: `projectStatus` in input ? validated.projectStatus : original.projectStatus,
            owner: validated.owner === `My Portfolio` ? original.owner : validated.owner,
            meta: { ...original.meta, ...validated.meta, domainSource: `csv` },
            firstImportedAt: original.firstImportedAt ?? validated.firstImportedAt ?? importedAt,
            firstExportedAt: original.firstExportedAt ?? validated.firstExportedAt,
          });
        } else {
          domains.push(new Domain({
            ...validated,
            number: nextNumber,
            uid: getScopeUid(),
            meta: { ...validated.meta, domainSource: `csv` },
            firstImportedAt: validated.firstImportedAt ?? importedAt,
          }));
          nextNumber += 1;
        }
      } catch (error) {
        throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : `Invalid Domain`}`);
      }
    });
    await saveSnapshot({ version: 1, domains, nextNumber });
    return inputs.length;
  }),
  syncRegistrarDomains: (inputs: RegistrarDomain[], expectedUserId: string, owner: string): Promise<number> => serializePortfolioMutation(async () => {
    if (typeof expectedUserId !== `string` || !userScope || expectedUserId !== userScope) throw new Error(`Sign In To Sync Registrar Domains`);
    await requireScopeSession(expectedUserId);
    if (!Array.isArray(inputs) || inputs.length > 10000) throw new Error(`Sync Up To 10000 Registrar Domains At A Time`);
    const domainOwner = typeof owner === `string` ? owner.trim() : ``;
    if (!domainOwner || domainOwner.length > 120) throw new Error(`Enter A Domain Owner Of 1 To 120 Characters`);
    const patches = Array.from(inputs, (input, index) => {
      try { return normalizeRegistrarDomain(input, domainOwner); }
      catch (error) { throw new Error(`Domain ${index + 1}: ${error instanceof Error ? error.message : `Invalid Registrar Domain`}`); }
    });
    if (!patches.length) return 0;
    const current = await readSnapshot();
    const domains = copyDomains(current.domains);
    const indexes = new Map(domains.map((domain, index) => [domain.name, index]));
    const syncedNames = new Set<string>();
    const syncedAt = new Date().toISOString();
    let nextNumber = current.nextNumber;
    for (const patch of patches) {
      const index = indexes.get(patch.name);
      const original = index !== undefined ? domains[index] : undefined;
      const previous = original?.meta?.registrarSync;
      const previousSync = previous && typeof previous === `object` && !Array.isArray(previous) ? previous : {};
      const registrar = original?.registrar === `GoDaddy Auctions` && patch.registrar === `GoDaddy` ? original.registrar : patch.registrar || original?.registrar || ``;
      const { meta, renewalEstimate, ...domainFields } = patch;
      const domain = new Domain({
        ...(original ?? { owner: domainOwner, notes: ``, renewalPrice: 0, autoRenew: false, expiresAt: `` }),
        ...domainFields,
        registrar,
        isSample: false,
        uid: expectedUserId,
        updated: syncedAt,
        firstImportedAt: original?.firstImportedAt ?? syncedAt,
        number: original?.number ?? nextNumber,
        meta: { ...original?.meta, ...meta, domainSource: `registrar`, registrarSync: {
          ...previousSync,
          source: patch.registrar,
          syncedAt,
          ...(renewalEstimate ? { renewalEstimate: { ...renewalEstimate, checkedAt: syncedAt, source: `GoDaddy v2` } } : {}),
          ...(patch.autoRenew !== undefined ? { autoRenewKnown: true } : original ? {} : { autoRenewKnown: false }),
          ...(!original ? { renewalPriceKnown: false } : {}),
        } },
      });
      if (index !== undefined) domains[index] = domain;
      else { indexes.set(patch.name, domains.length); domains.push(domain); nextNumber += 1; }
      syncedNames.add(patch.name);
    }
    await saveSnapshot({ version: 1, domains, nextNumber });
    return syncedNames.size;
  }),
  resetSampleData: () => serializePortfolioMutation(async () => {
    if (!useSampleData) throw new Error(`Sample Data Is Disabled`);
    const current = await readSnapshot();
    const domains = createSampleDomains().map((domain, index) => new Domain({
      ...domain,
      id: undefined,
      uuid: undefined,
      uid: getScopeUid(),
      number: current.nextNumber + index,
    }));
    await saveSnapshot({ version: 1, domains, nextNumber: current.nextNumber + domains.length });
    return copyDomains(domains);
  }),
};
