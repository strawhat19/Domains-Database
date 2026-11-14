import { authAPI } from './auth';
import { getDomainLimit } from '../shared/accountPlans';
import { Domain } from '../shared/models/domains/Domain';
import { normalizeDomainTags } from '../shared/domainTags';
import { readPaidRenewal } from '../shared/registrarSync/paidRenewal';
import { firebaseEnabled } from '../shared/firebase/config';
import { restoreDomainPrice } from '../shared/domainPricing';
import { createSampleDomains } from '../shared/sampleDomains';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RegistrarDomain } from '../shared/registrarSync/types';
import type { WebsiteInsights } from '../shared/websiteInsights/types';
import { MAX_INSIGHT_DOMAINS } from '../shared/websiteInsights/types';
import { accountStorageKey } from '../shared/authentication/userScope';
import { subscribeAccountDataReset } from '../shared/accountData/state';
import { clearFirestoreStorageCache } from '../shared/firebase/storage';
import { readDomainAppraisal } from '../shared/domainAppraisal/values';
import { readDomainParkingMetrics } from '../shared/domainParking/values';
import { mergeWebsiteInsights, normalizeWebsiteInsights } from '../shared/websiteInsights/values';
import { getPlanAccess, requireStarterAccess } from '../shared/planAccess/service';
import type { JSONValue, DomainInput, DomainRecord, PortfolioSnapshot } from '../shared/types';
import { getLocalPublicProfileRoles } from '../shared/authentication/service.local';
import { normalizeGoDaddyLifecycleActions } from '../shared/registrarSync/godaddyActions';
import type { PublicProfileCardMetadata, PublicProfilePortfolio } from '../shared/publicDirectory/profilePortfolio';
import { getDomainSource, validateDomainInput, getDomainDeletionRestriction } from '../shared/domainUtils';
import { mergeVercelConfigurations, type VercelConfigurationSnapshot } from '../shared/registrarSync/vercelConfiguration';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../shared/common/storage';
import { useSampleData, PORTFOLIO_STORAGE_KEY, useLocalStorage, persistenceEnabled } from '../shared/config';
import { projectPublicDomain, readPublicDomainSummariesForIds, type PublicDomainSummary } from '../shared/publicDirectory/domains';

export type { PublicDomainSummary } from '../shared/publicDirectory/domains';
export { domainDataAPI } from './domainData';

let userScope: string | null = null;
const snapshots = new Map<string, PortfolioSnapshot>();
subscribeAccountDataReset(userId => { snapshots.delete(userId); });
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
  const previous = snapshots.get(scope);
  const access = userScope ? await getPlanAccess(userScope) : null;
  const domainLimit = access ? getDomainLimit(access.user, access.billing) : 33;
  if (domainLimit !== null && next.domains.length > domainLimit && next.domains.some(domain => !previous?.domains.some(saved => saved.id === domain.id))) {
    throw new Error(`Your Plan Includes Up To ${domainLimit} Domains — Remove Domain(s) Or Upgrade Before Adding More`);
  }
  if (persistenceEnabled) {
    try {
      await writeStorage(getStorageKey(), JSON.stringify(next));
    } catch (error) {
      throw new Error(firebaseEnabled && error instanceof Error ? error.message : `Could Not Save Your Portfolio On This Device`);
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
    const input = validateDomainInput({
      ...domain,
      tags: normalizeDomainTags(domain?.tags),
      startingBid: restoreDomainPrice(domain?.startingBid),
      estimatedRevenue: restoreDomainPrice(domain?.estimatedRevenue),
    });
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
  if (cached && !persistenceEnabled) {
    const domains = useSampleData ? cached.domains : cached.domains.filter(domain => !domain.isSample);
    if (domains.length !== cached.domains.length) {
      const filtered = { ...cached, domains };
      await saveSnapshot(filtered);
      return filtered;
    }
    return cached;
  }
  let saved: string | null = null;
  if (persistenceEnabled) {
    try {
      saved = await readStorage(getStorageKey());
    } catch (error) {
      throw new Error(firebaseEnabled && error instanceof Error ? error.message : `Could Not Load Your Portfolio From This Device`);
    }
  }
  if (saved !== null) {
    let restored: PortfolioSnapshot;
    try {
      restored = restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot);
    } catch {
      throw new Error(`Saved Portfolio Data Could Not Be Read`);
    }
    if (useLocalStorage && JSON.stringify(restored) !== saved) await saveSnapshot(restored);
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
  if (!useLocalStorage || !userScope) return;
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
    const domain = new Domain({ ...record, id: undefined, uuid: undefined, uid: userId, number: nextNumber });
    delete domain.meta?.showOnPublicProfile;
    domains.push(domain);
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

const getPublicDomainSummaries = async (userIds: string[]): Promise<PublicDomainSummary[]> => {
  if (firebaseEnabled && !useLocalStorage) return readPublicDomainSummariesForIds(userIds);
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
      const projection = projectPublicDomain(domain, profile.id);
      if (projection) summaries.push(projection);
    }
  }
  return summaries;
};

const readLocalPublicPortfolioDomains = async (userId: string) => {
  const saved = await AsyncStorage.getItem(accountStorageKey(PORTFOLIO_STORAGE_KEY, userId));
  const domains = saved === null ? [] : restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot, userId).domains;
  return domains.filter(record => !record.isSample);
};

const getLocalPublicProfilePortfolio = async (userId: string): Promise<PublicProfilePortfolio | null> => {
  if (!useLocalStorage) return null;
  const profile = (await authAPI.getPublicProfiles()).find(record => record.id === userId && record.profilePrivacy === `public`);
  if (!profile) return null;
  const domains = await readLocalPublicPortfolioDomains(profile.id);
  return {
    totalDomains: domains.length,
    domains: domains.filter(record => record.meta?.showOnPublicProfile === true).map(({ name }) => ({ id: name, name })),
  };
};

const getLocalPublicProfileCardMetadata = async (userIds: string[]): Promise<PublicProfileCardMetadata[]> => {
  if (!useLocalStorage || !userIds.length) return [];
  const profiles = await getLocalPublicProfileRoles(userIds);
  const counts = new Map<string, number | null>();
  for (const { id } of profiles) {
    const totalDomains = await readLocalPublicPortfolioDomains(id).then(domains => domains.length, () => null);
    counts.set(id, totalDomains);
  }
  if (!counts.size) return [];
  const currentProfiles = await getLocalPublicProfileRoles([...counts.keys()]);
  return currentProfiles.map(({ id, role }) => ({ id, role, totalDomains: counts.get(id) ?? null }));
};

const assertUnique = (name: string, domains: DomainRecord[], id?: string) => {
  if (domains.some(domain => domain.id !== id && domain.name.toLowerCase() === name)) throw new Error(`${name} Is Already In Your Portfolio`);
};

const registrarImportCustomFields = [
  `mvp`,
  `tags`,
  `color`,
  `title`,
  `notes`,
  `future`,
  `childLinks`,
  `parentLink`,
  `difficulty`,
  `startingBid`,
  `description`,
  `previewLinks`,
  `relatedLinks`,
  `projectStatus`,
  `githubRepoLink`,
  `productionLink`,
  `socialMediaLinks`,
  `estimatedRevenue`,
  `developmentLinks`,
] as const;
const registrarSourceMetadata = new Set([
  `source`, `domainSource`, `registrarSync`, `registrarName`, `hostingProvider`, `registrarSource`, `registrarProvider`, `hostingDetails`, `registrarDetails`,
  `registrarIanaId`, `registrarCheckedAt`, `externalRegistration`, `ownershipConfirmed`, `automaticallyIncluded`, `registrarConnectionId`,
  `goValue`, `goValueUnavailable`, `goDaddyParking`, `vercelDomainConfiguration`, `csvRenewalCostProvided`,
]);

const renewalEstimateSource = {
  GoDaddy: `GoDaddy v2`,
  Porkbun: `Porkbun Domain Check API`,
  Namecheap: `Namecheap Renewal Catalog`,
  Vercel: `Vercel Registrar Price API`,
};
const getRenewalEstimateSource = (registrar: RegistrarDomain[`registrar`]) => registrar === `GoDaddy` || registrar === `Porkbun` || registrar === `Namecheap` || registrar === `Vercel`
  ? renewalEstimateSource[registrar] : undefined;

const metadataObject = (value: JSONValue | undefined) => value && typeof value === `object` && !Array.isArray(value) ? value : {};
const metadataDate = (value: JSONValue | undefined): value is string => typeof value === `string` && /^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?$/.test(value) && Number.isFinite(Date.parse(value));
const registrarDetails = (input: RegistrarDomain) => {
  const provider = input.registrar;
  const source = input.meta?.source;
  const raw = provider === `GoDaddy` ? metadataObject(input.meta?.registrarDetails) : input.meta ?? {};
  const details: Record<string, JSONValue> = {};
  const dates = provider === `GoDaddy` ? [`deletedAt`, `renewDeadline`, `registrarCreatedAt`, `transferAwayEligibleAt`]
    : provider === `Vercel` ? [`boughtAt`, `transferredAt`, `transferStartedAt`]
    : source === `Hostinger Portfolio API` ? [`registeredAt`, `transferLockExpiresAt`] : [];
  for (const field of dates) {
    const value = raw[field];
    if (metadataDate(value) || (field === `transferLockExpiresAt` && value === null)) details[field] = value;
  }
  const flags = provider === `GoDaddy` ? [`renewable`, `exposeWhois`, `holdRegistrar`, `transferProtected`, `expirationProtected`, `exposeRegistrantOrganization`]
    : provider === `Vercel` ? [`verified`] : provider === `Namecheap` ? [`premium`, `usesProviderDns`, `usesDefaultNameservers`]
    : provider === `Squarespace` ? [`registrantEmailVerified`]
    : source === `Hostinger Portfolio API` ? [`privacyProtectionAllowed`, `transferLockSupported`] : [];
  for (const field of flags) {
    const value = raw[field];
    if (typeof value === `boolean`) details[field] = value;
  }
  if (provider === `GoDaddy` || provider === `Squarespace`) {
    const statuses = raw.registryStatusCodes;
    if (Array.isArray(statuses) && statuses.length <= 64 && statuses.every(value => typeof value === `string` && /^[a-z][a-z0-9 _-]{0,99}$/i.test(value))) details.registryStatusCodes = statuses;
  }
  if (provider === `GoDaddy`) {
    const actions = normalizeGoDaddyLifecycleActions(raw.lifecycleActions);
    if (actions) details.lifecycleActions = actions;
    const hostnames = raw.registeredHostnames;
    if (Array.isArray(hostnames) && hostnames.length <= 64 && hostnames.every(host => typeof host === `string` && host.length <= 253
      && /^[a-z0-9.-]+$/.test(host) && host.endsWith(`.${input.name}`))) details.registeredHostnames = hostnames;
    if ([`COMPLETED`, `PENDING`, `UNABLE_TO_RETRIEVE_STATUS`].some(status => raw.icannVerification === status)) details.icannVerification = raw.icannVerification;
    for (const field of [`domainNameVerification`, `realNameVerification`]) {
      if ([`APPROVED`, `PENDING`, `REJECTED`, `UNABLE_TO_RETRIEVE_STATUS`].some(status => raw[field] === status)) details[field] = raw[field];
    }
  }
  if (provider === `Vercel`) {
    for (const field of [`customNameservers`, `intendedNameservers`]) {
      const value = raw[field];
      if (Array.isArray(value) && value.length <= 32 && value.every(server => typeof server === `string` && server.length <= 253 && /^[a-z0-9.-]+$/i.test(server))) details[field] = value;
    }
    if ([`auto`, `disabled`, `enabled`].some(value => raw.echMode === value)) details.echMode = raw.echMode;
    if ([`external`, `zeit.world`, `na`].some(value => raw.serviceType === value)) details.serviceType = raw.serviceType;
  }
  if (source === `Hostinger Portfolio API`) {
    if ([`domain`, `free_domain`, `domain_transfer`, `free_domain_transfer`].some(value => raw.registrationType === value)) details.registrationType = raw.registrationType;
    if ([null, `manual_review`, `sms_code`, `contact_verification`].some(value => raw.verificationType === value)) details.verificationType = raw.verificationType;
    const checks = metadataObject(raw.contactVerification);
    const contactVerification: Record<string, JSONValue> = {};
    for (const field of [`email`, `phone`, `contactName`]) {
      const value = checks[field];
      const { status, endsAt } = metadataObject(value);
      if (value === null) contactVerification[field] = null;
      else if (status === `pending` || status === `verified` || status === `suspended`) {
        contactVerification[field] = { status, ...(endsAt === null || metadataDate(endsAt) ? { endsAt } : {}) };
      }
    }
    if (raw.contactVerification === null) details.contactVerification = null;
    else if (Object.keys(contactVerification).length) details.contactVerification = contactVerification;
  }
  if (provider === `Porkbun` && source === `Porkbun Registration API`) {
    const renewal = readPaidRenewal(raw.lastPaidRenewal);
    if (renewal) details.lastPaidRenewal = renewal;
  }
  return details;
};
const getRegistrarImportChanges = (input: DomainInput, validated: DomainInput, original: DomainRecord): Partial<DomainInput> => {
  const changes = Object.fromEntries(registrarImportCustomFields.flatMap(field => {
    const value = validated[field];
    return input[field] !== undefined && value !== undefined && value !== `` && (!Array.isArray(value) || value.length)
      ? [[field, value]] : [];
  }));
  const meta = { ...original.meta };
  const importedCost = validated.meta?.csvRenewalCostProvided === true || metadataObject(validated.meta?.registrarSync).renewalPriceKnown === true
    || (validated.meta?.csvRenewalCostProvided === undefined && validated.renewalPrice > 0
      && metadataObject(validated.meta?.registrarSync).renewalPriceKnown !== false);
  for (const [field, value] of Object.entries(validated.meta ?? {})) {
    if (registrarSourceMetadata.has(field) || value == null || value === ``) continue;
    const previous = meta[field];
    meta[field] = value && typeof value === `object` && !Array.isArray(value)
      && previous && typeof previous === `object` && !Array.isArray(previous) ? { ...previous, ...value } : value;
  }
  if (importedCost) meta.registrarSync = { ...metadataObject(meta.registrarSync), renewalPriceKnown: true };
  return { ...changes, ...(importedCost ? { renewalPrice: validated.renewalPrice, currency: validated.currency ?? original.currency } : {}), meta };
};

type RegistrarPatch = Partial<DomainInput> & Pick<DomainInput, `name` | `registrar`> & Pick<RegistrarDomain, `renewalEstimate` | `detailsCheckedAt` | `detailsAttemptedAt`>;
const normalizeRegistrarDomain = (input: RegistrarDomain, owner: string): RegistrarPatch => {
  if (!input || typeof input !== `object` || Array.isArray(input)) throw new Error(`Registrar Domain Must Be An Object`);
  if (typeof input.name !== `string` || typeof input.registrar !== `string`) throw new Error(`Registrar Domain Must Include A Name And Registrar`);
  const hostingerHosted = input.meta?.source === `Hostinger Hosting API`
    && input.meta?.hostingProvider === `Hostinger` && input.meta?.registrarProvider === `hostinger`
    && input.meta?.externalRegistration === true && input.meta?.automaticallyIncluded === true;
  if (!input.registrar && !(input.meta?.externalRegistration === true && (input.meta?.ownershipConfirmed === true || hostingerHosted))) throw new Error(`Confirm External Domain Ownership Before Importing`);
  const metadata: NonNullable<DomainInput[`meta`]> = {};
  for (const field of [`source`, `registrarName`, `hostingProvider`, `registrarSource`, `registrarProvider`, `registrarCheckedAt`, `registrarConnectionId`] as const) {
    const value = input.meta?.[field];
    if (value !== undefined) {
      if (typeof value !== `string` || value.length > 256) throw new Error(`Registrar Returned Invalid Source Metadata`);
      metadata[field] = value;
    }
  }
  for (const field of [`externalRegistration`, `ownershipConfirmed`, `automaticallyIncluded`] as const) {
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
  if (metadata.externalRegistration === true && metadata.ownershipConfirmed !== true && !hostingerHosted) throw new Error(`Confirm External Domain Ownership Before Importing`);
  const details = registrarDetails(input);
  if (Object.keys(details).length) metadata.registrarDetails = details;
  if (metadata.source === `Hostinger Hosting API` || metadata.source === `Hostinger Portfolio API`) {
    const { hostingEnabled, hostingVhostType, hostingWebsiteType } = input.meta ?? {};
    const hosting: Record<string, JSONValue> = {};
    if (typeof hostingEnabled === `boolean`) hosting.enabled = hostingEnabled;
    const vhostType = [`main`, `addon`, `parked`].find(value => hostingVhostType === value);
    const websiteType = [`wordpress`, `builder`, `horizons`, `nodejs`, `other`].find(value => hostingWebsiteType === value);
    if (vhostType) hosting.vhostType = vhostType;
    if (websiteType) hosting.websiteType = websiteType;
    if (Object.keys(hosting).length) metadata.hostingDetails = hosting;
  }
  for (const field of [`status`, `expiresAt`, `createdAt`, `updatedAt`, `providerId`, `internationalName`] as const) {
    if (input[field] !== undefined && typeof input[field] !== `string`) throw new Error(`${field} Must Be Text`);
  }
  for (const field of [`locked`, `privacy`, `dnssec`, `autoRenew`] as const) {
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
    dnssec: input.dnssec,
    registrar: input.registrar,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    registrant: input.registrant,
    providerId: input.providerId,
    nameservers: input.nameservers,
    expiresAt: input.expiresAt ?? ``,
    autoRenew: input.autoRenew ?? false,
    internationalName: input.internationalName,
  });
  const patch: RegistrarPatch = { name: validated.name, registrar: validated.registrar, meta: validated.meta };
  for (const field of [`status`, `expiresAt`, `createdAt`, `updatedAt`, `providerId`, `internationalName`] as const) {
    const value = validated[field];
    if (value) patch[field] = value;
  }
  for (const field of [`locked`, `privacy`, `dnssec`, `autoRenew`] as const) {
    if (input[field] !== undefined) patch[field] = validated[field];
  }
  if (validated.nameservers !== undefined) patch.nameservers = validated.nameservers;
  if (validated.registrant) patch.registrant = validated.registrant;
  if (metadataDate(input.detailsCheckedAt)) patch.detailsCheckedAt = input.detailsCheckedAt;
  if (metadataDate(input.detailsAttemptedAt)) patch.detailsAttemptedAt = input.detailsAttemptedAt;
  if (input.renewalEstimate !== undefined) {
    const estimate = input.renewalEstimate;
    if (!estimate || typeof estimate !== `object` || Array.isArray(estimate)
      || !getRenewalEstimateSource(input.registrar) || typeof estimate.amount !== `number`
      || !Number.isFinite(estimate.amount) || estimate.amount < 0 || typeof estimate.currency !== `string`
      || (estimate.years !== undefined && (!Number.isInteger(estimate.years) || estimate.years < 1 || estimate.years > 100))
      || !/^[A-Z]{3}$/.test(estimate.currency)) throw new Error(`Registrar Returned An Invalid Renewal Estimate`);
    patch.renewalEstimate = { amount: estimate.amount, currency: estimate.currency, ...(estimate.years !== undefined ? { years: estimate.years } : {}) };
  }
  return patch;
};

export const API_ROUTES = [
  `/api`,
  `/api/health`,
  `/api/status`,
  `/api/users`,
  `/api/domains`,
  `/api/feedback`,
  `/api/domains/public`,
  `/api/auth/session`,
  `/api/auth/sign-in`,
  `/api/auth/sign-up`,
  `/api/domain-market`,
  `/api/auth/sign-out`,
  `/api/domains/:id`,
  `/api/notifications`,
  `/api/domains/import`,
  `/api/domains/export`,
  `/api/registrars/sync`,
  `/api/website-insights`,
  `/api/domain-analytics`,
  `/api/domain-appraisal`,
  `/api/domain-dns`,
  `/api/domain-parking`,
  `/api/auction-inventory`,
  `/api/auction-availability`,
  `/api/marketplace`,
  `/api/marketplace/seller`,
  `/api/marketplace/checkout`,
  `/api/marketplace/webhook`,
  `/api/marketplace/afternic`,
  `/api/marketplace/external`,
  `/api/registrars/search`,
  `/api/registrars/extensions`,
  `/api/connections/environment`,
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
    mode: firebaseEnabled && !useLocalStorage ? `Cloud Firestore` : useLocalStorage ? `Device Storage` : `Session Storage`,
    message: firebaseEnabled && !useLocalStorage ? `Firestore Portfolio API Ready` : `Local Portfolio API Ready`,
});

export const api = {
  getStatus,
  getHealth: getStatus,
  getRoutes: getStatus,
  setUserScope: (userId: string | null, options: { claimLegacy?: boolean; adoptGuest?: boolean } = {}) => serialize(async () => {
    const nextScope = userId?.trim() || null;
    const session = nextScope ? await requireScopeSession(nextScope) : null;
    if (nextScope !== userScope) { snapshots.clear(); clearFirestoreStorageCache(); }
    userScope = nextScope;
    if (session?.user.number === 1) {
      if (options.claimLegacy) await claimLegacyPortfolio();
      if (options.adoptGuest) await adoptGuestPortfolio();
    }
  }),
  getDomains: () => serialize(async () => copyDomains((await readSnapshot()).domains)),
  subscribeDomains: (listener: (domains: DomainRecord[]) => void, onError?: (error: Error) => void) => {
    const scope = getScope();
    const uid = getScopeUid();
    return subscribeStorage(getStorageKey(), saved => {
      if (scope !== getScope()) return;
      try {
        const snapshot = saved === null
          ? { version: 1 as const, domains: [], nextNumber: 1 }
          : restoreSnapshot(JSON.parse(saved) as PortfolioSnapshot, uid);
        snapshots.set(scope, snapshot);
        listener(copyDomains(snapshot.domains));
      } catch (reason) {
        onError?.(reason instanceof Error ? reason : new Error(`Saved Portfolio Data Could Not Be Read`));
      }
    }, onError);
  },
  getPublicDomainSummaries: (userIds: string[]) => serialize(() => getPublicDomainSummaries(userIds)),
  getSharedDomainSummaries: (userId: string) => serialize(() => getPublicDomainSummaries([userId])),
  getLocalPublicProfilePortfolio: (userId: string) => serialize(() => getLocalPublicProfilePortfolio(userId)),
  getLocalPublicProfileCardMetadata: (userIds: string[]) => serialize(() => getLocalPublicProfileCardMetadata(userIds)),
  saveDomainAppraisal: (id: string, name: string, value: unknown, expectedUserId: string): Promise<void> => serializePortfolioMutation(async () => {
    if (!userScope || userScope !== expectedUserId) throw new Error(`Sign In To Save Domain Appraisals`);
    await requireScopeSession(expectedUserId);
    const appraisal = readDomainAppraisal(value);
    const negative = value === `not-found` || value === `unsupported-tld` ? value : undefined;
    if (!appraisal && !negative) throw new Error(`Domain Appraisal Returned An Invalid Result`);
    const current = await readSnapshot();
    const index = current.domains.findIndex(domain => domain.id === id && domain.name === name && domain.uid === expectedUserId && !domain.isSample);
    if (index < 0) throw new Error(`Domain Changed — Check Its Appraisal Again`);
    const original = current.domains[index];
    const previous = readDomainAppraisal(original.meta?.goValue);
    if (previous && (!appraisal || Date.parse(previous.checkedAt) >= Date.parse(appraisal.checkedAt))) return;
    const domains = copyDomains(current.domains);
    const meta = { ...original.meta };
    if (appraisal) {
      meta.goValue = JSON.parse(JSON.stringify(appraisal));
      delete meta.goValueUnavailable;
    } else if (negative) meta.goValueUnavailable = { status: negative, checkedAt: new Date().toISOString() };
    domains[index] = new Domain({ ...original, meta });
    await saveSnapshot({ ...current, domains });
  }),
  saveDomainParking: (id: string, name: string, value: unknown, expectedUserId: string): Promise<void> => serializePortfolioMutation(async () => {
    if (!userScope || userScope !== expectedUserId) throw new Error(`Sign In To Save Domain Parking Metrics`);
    await requireScopeSession(expectedUserId);
    const parking = readDomainParkingMetrics(value, name);
    if (!parking) throw new Error(`Domain Parking Returned An Invalid Result`);
    const current = await readSnapshot();
    const index = current.domains.findIndex(domain => domain.id === id && domain.name === name && domain.uid === expectedUserId && !domain.isSample);
    if (index < 0) throw new Error(`Domain Changed — Check Its Parking Metrics Again`);
    const original = current.domains[index];
    const previous = readDomainParkingMetrics(original.meta?.goDaddyParking, name);
    if (previous && ((previous.report && !parking.report) || Date.parse(previous.checkedAt) >= Date.parse(parking.checkedAt))) return;
    const domains = copyDomains(current.domains);
    domains[index] = new Domain({ ...original, meta: { ...original.meta, goDaddyParking: JSON.parse(JSON.stringify(parking)) } });
    await saveSnapshot({ ...current, domains });
  }),
  saveWebsiteInsights: (id: string, name: string, insights: WebsiteInsights, expectedUserId: string): Promise<void> => serializePortfolioMutation(async () => {
    await requireStarterAccess(expectedUserId);
    if (!userScope || expectedUserId !== userScope) throw new Error(`Sign In To Save Website Info`);
    await requireScopeSession(expectedUserId);
    const normalized = normalizeWebsiteInsights(insights, name);
    const current = await readSnapshot();
    const index = current.domains.findIndex(domain => domain.id === id && domain.name === name);
    if (index < 0) throw new Error(`Domain Changed — Refresh Website Info Again`);
    const original = current.domains[index];
    const previous = original.meta?.websiteInsights;
    const merged = JSON.stringify(mergeWebsiteInsights(normalized, previous));
    if (JSON.stringify(previous) === merged) return;
    const domains = copyDomains(current.domains);
    domains[index] = new Domain({ ...original, meta: { ...original.meta, websiteInsights: JSON.parse(merged) } });
    await saveSnapshot({ ...current, domains });
  }),
  saveWebsiteRanks: (matches: readonly { id: string; name: string; insights: WebsiteInsights }[], expectedUserId: string): Promise<boolean> => serializePortfolioMutation(async () => {
    if (!userScope || expectedUserId !== userScope) throw new Error(`Sign In To Save Website Ranks`);
    if (matches.length > MAX_INSIGHT_DOMAINS) throw new Error(`Save Up To ${MAX_INSIGHT_DOMAINS} Website Ranks At A Time`);
    await requireStarterAccess(expectedUserId);
    const current = await readSnapshot();
    const byId = new Map(matches.map(match => [match.id, match]));
    let changed = false;
    const domains = current.domains.map(domain => {
      const match = byId.get(domain.id);
      if (!match || domain.name !== match.name || domain.uid !== expectedUserId || domain.isSample || getDomainSource(domain) !== `registrar`
        || (domain.meta?.externalRegistration === true && domain.meta?.ownershipConfirmed !== true)) return domain;
      const incoming = normalizeWebsiteInsights(match.insights, domain.name);
      if (incoming.trancoListed === undefined) return domain;
      const saved = domain.meta?.websiteInsights;
      const merged = JSON.stringify(mergeWebsiteInsights(incoming, saved));
      if (JSON.stringify(saved) === merged) return domain;
      changed = true;
      return new Domain({ ...domain, meta: { ...domain.meta, websiteInsights: JSON.parse(merged) } });
    });
    if (changed) await saveSnapshot({ ...current, domains });
    return changed;
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
    if (!userScope) delete validated.meta?.showOnPublicProfile;
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
      tags: input && input.tags !== undefined ? input.tags : original.tags,
      future: input?.future ?? original.future,
      ...(input?.renewalPrice !== undefined && metadataObject(input.meta?.registrarSync).renewalPriceKnown === true
        ? { renewalPrice: input.renewalPrice } : {}),
      ...(input && `startingBid` in input ? { startingBid: input.startingBid } : {}),
      ...(input && `estimatedRevenue` in input ? { estimatedRevenue: input.estimatedRevenue } : {}),
      childLinks: input?.childLinks ?? original.childLinks,
      parentLink: input?.parentLink ?? original.parentLink,
      previewLinks: input?.previewLinks ?? original.previewLinks,
      relatedLinks: input?.relatedLinks ?? original.relatedLinks,
      githubRepoLink: input?.githubRepoLink ?? original.githubRepoLink,
      productionLink: input?.productionLink ?? original.productionLink,
      developmentLinks: input?.developmentLinks ?? original.developmentLinks,
      socialMediaLinks: input?.socialMediaLinks ?? original.socialMediaLinks,
      difficulty: input && `difficulty` in input ? input.difficulty : original.difficulty,
      projectStatus: input && `projectStatus` in input ? input.projectStatus : original.projectStatus,
      description: input?.description ?? original.description,
      meta: {
        ...original.meta,
        ...(input?.meta?.siteIconUrl !== undefined ? { siteIconUrl: input.meta.siteIconUrl } : {}),
        ...(typeof input?.meta?.showOnPublicProfile === `boolean` ? { showOnPublicProfile: input.meta.showOnPublicProfile } : {}),
      },
    } : input;
    const validated = validateDomainInput({ ...original, ...changes, meta: { ...original.meta, ...changes.meta } });
    if (!userScope || validated.name !== original.name) delete validated.meta?.showOnPublicProfile;
    if (validated.name !== original.name) {
      delete validated.meta?.goValue;
      delete validated.meta?.goValueUnavailable;
      delete validated.meta?.goDaddyParking;
      delete validated.meta?.vercelDomainConfiguration;
    }
    assertUnique(validated.name, current.domains, id);
    const previous = original.meta?.registrarSync;
    const incoming = validated.meta?.registrarSync;
    const previousSync = previous && typeof previous === `object` && !Array.isArray(previous) ? previous : undefined;
    const incomingSync = incoming && typeof incoming === `object` && !Array.isArray(incoming) ? incoming : undefined;
    if (previousSync || incomingSync) validated.meta = { ...validated.meta, registrarSync: {
      ...previousSync,
      ...incomingSync,
      ...(validated.autoRenew !== original.autoRenew ? { autoRenewKnown: true } : {}),
      ...(validated.renewalPrice !== original.renewalPrice || metadataObject(input?.meta?.registrarSync).renewalPriceKnown === true ? { renewalPriceKnown: true } : {}),
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
  starDomains: (ids: readonly string[]): Promise<void> => serializePortfolioMutation(async () => {
    const selectedIds = new Set(ids);
    if (!selectedIds.size) return;
    const current = await readSnapshot();
    if (!current.domains.some(domain => selectedIds.has(domain.id) && !domain.starred)) return;
    const domains = current.domains.map(domain => selectedIds.has(domain.id) && !domain.starred
      ? new Domain({ ...domain, starred: true }) : domain);
    await saveSnapshot({ ...current, domains });
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
        delete validated.meta?.showOnPublicProfile;
        if (importedNames.has(validated.name)) throw new Error(`${validated.name} Appears More Than Once In The Import`);
        importedNames.add(validated.name);
        const existingIndex = domains.findIndex(domain => domain.name.toLowerCase() === validated.name);
        if (existingIndex >= 0) {
          const original = domains[existingIndex];
          const registrarManaged = getDomainSource(original) === `registrar`;
          const changes = registrarManaged ? getRegistrarImportChanges(input, validated, original) : validated;
          domains[existingIndex] = new Domain({
            ...original,
            ...changes,
            isSample: false,
            updated: importedAt,
            id: original.id,
            tags: changes.tags !== undefined ? changes.tags : original.tags,
            number: original.number,
            notes: changes.notes || original.notes,
            registrar: changes.registrar || original.registrar,
            expiresAt: changes.expiresAt || original.expiresAt,
            projectStatus: `projectStatus` in input ? changes.projectStatus ?? original.projectStatus : original.projectStatus,
            owner: changes.owner && changes.owner !== `My Portfolio` ? changes.owner : original.owner,
            meta: { ...original.meta, ...changes.meta, domainSource: registrarManaged ? `registrar` : `csv` },
            firstImportedAt: original.firstImportedAt ?? changes.firstImportedAt ?? importedAt,
            firstExportedAt: original.firstExportedAt ?? changes.firstExportedAt,
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
  syncRegistrarDomains: (inputs: RegistrarDomain[], expectedUserId: string, owner: string, vercel?: VercelConfigurationSnapshot): Promise<number> => serializePortfolioMutation(async () => {
    if (typeof expectedUserId !== `string` || !userScope || expectedUserId !== userScope) throw new Error(`Sign In To Sync Registrar Domains`);
    await requireScopeSession(expectedUserId);
    if (!Array.isArray(inputs) || inputs.length > 10000) throw new Error(`Sync Up To 10000 Registrar Domains At A Time`);
    const domainOwner = typeof owner === `string` ? owner.trim() : ``;
    if (!domainOwner || domainOwner.length > 120) throw new Error(`Enter A Domain Owner Of 1 To 120 Characters`);
    const patches = Array.from(inputs, (input, index) => {
      try { return normalizeRegistrarDomain(input, domainOwner); }
      catch (error) { throw new Error(`Domain ${index + 1}: ${error instanceof Error ? error.message : `Invalid Registrar Domain`}`); }
    });
    if (!patches.length && !vercel) return 0;
    const current = await readSnapshot();
    const domains = copyDomains(current.domains);
    const indexes = new Map(domains.map((domain, index) => [domain.name, index]));
    const syncedNames = new Set<string>();
    const syncedAt = new Date().toISOString();
    let nextNumber = current.nextNumber;
    for (const patch of patches) {
      const index = indexes.get(patch.name);
      const original = index !== undefined ? domains[index] : undefined;
      const { meta, registrant, renewalEstimate, detailsCheckedAt, detailsAttemptedAt, ...domainFields } = patch;
      const { hostingDetails, registrarDetails, ...sourceMeta } = meta ?? {};
      const hosting: Record<string, JSONValue> = hostingDetails ? { hostingProvider: `Hostinger`, hostingDetails: { ...metadataObject(original?.meta?.hostingDetails), ...metadataObject(hostingDetails), checkedAt: syncedAt } } : {};
      const external = sourceMeta.externalRegistration === true;
      if (original && external && original.registrar && original.meta?.externalRegistration !== true) {
        if (hostingDetails && index !== undefined) domains[index] = new Domain({ ...original, meta: { ...original.meta, ...hosting } });
        syncedNames.add(patch.name);
        continue;
      }
      const registrar = patch.registrar || original?.registrar || ``;
      const registrarChanged = !!original?.registrar && original.registrar !== registrar;
      const connectionChanged = !!original?.meta?.registrarConnectionId && !!sourceMeta.registrarConnectionId
        && original.meta.registrarConnectionId !== sourceMeta.registrarConnectionId;
      const providerIdChanged = !!original?.providerId && !!domainFields.providerId && original.providerId !== domainFields.providerId;
      const identityChanged = registrarChanged || connectionChanged || providerIdChanged;
      const syncedDetails = { ...(identityChanged ? {} : metadataObject(original?.meta?.registrarDetails)), ...metadataObject(registrarDetails) };
      const previousPaidRenewal = !identityChanged ? readPaidRenewal(metadataObject(original?.meta?.registrarDetails).lastPaidRenewal) : undefined;
      const paidRenewal = readPaidRenewal(syncedDetails.lastPaidRenewal);
      if (previousPaidRenewal && paidRenewal && previousPaidRenewal.paidAt > paidRenewal.paidAt) syncedDetails.lastPaidRenewal = previousPaidRenewal;
      const incomingVerification = metadataObject(registrarDetails).contactVerification;
      if (!identityChanged && incomingVerification && typeof incomingVerification === `object` && !Array.isArray(incomingVerification)) {
        const verifications = { ...metadataObject(metadataObject(original?.meta?.registrarDetails).contactVerification) };
        for (const [channel, check] of Object.entries(incomingVerification)) {
          const prior = metadataObject(verifications[channel]);
          const next = metadataObject(check);
          verifications[channel] = check && next.status === prior.status ? { ...prior, ...next } : check;
        }
        syncedDetails.contactVerification = verifications;
      }
      const previousSync = identityChanged ? {} : { ...metadataObject(original?.meta?.registrarSync) };
      for (const [key, time] of [[`detailsCheckedAt`, detailsCheckedAt], [`detailsAttemptedAt`, detailsAttemptedAt]] as const) {
        const previous = previousSync[key];
        if (time && (!metadataDate(previous) || Date.parse(time) >= Date.parse(previous))) previousSync[key] = time;
      }
      if (metadataObject(registrarDetails).renewable === false
        || patch.registrar === `Namecheap` && (syncedDetails.premium === true || patch.status?.toLowerCase() === `expired`)) delete previousSync.renewalEstimate;
      const quoteSource = getRenewalEstimateSource(patch.registrar);
      const previousMeta = { ...original?.meta };
      if (!external && previousMeta.externalRegistration === true) {
        for (const field of [`externalRegistration`, `ownershipConfirmed`, `automaticallyIncluded`, `registrarName`, `registrarSource`, `registrarCheckedAt`, `registrarIanaId`]) delete previousMeta[field];
      }
      const domain = new Domain({
        ...(original ?? { owner: domainOwner, notes: ``, renewalPrice: 0, autoRenew: false, expiresAt: `` }),
        ...domainFields,
        registrar,
        registrant: registrant ? { ...original?.registrant, ...registrant } : original?.registrant,
        isSample: false,
        uid: expectedUserId,
        updated: syncedAt,
        firstImportedAt: original?.firstImportedAt ?? syncedAt,
        number: original?.number ?? nextNumber,
        meta: { ...previousMeta, ...sourceMeta, ...hosting, domainSource: `registrar`, registrarDetails: syncedDetails, registrarSync: {
          ...previousSync,
          source: patch.registrar,
          syncedAt,
          ...(renewalEstimate && quoteSource ? { renewalEstimate: { ...renewalEstimate, checkedAt: syncedAt, source: quoteSource } } : {}),
          ...(patch.autoRenew !== undefined ? { autoRenewKnown: true } : original && !identityChanged ? {} : { autoRenewKnown: false }),
          ...(!original || metadataObject(original.meta?.registrarSync).renewalPriceKnown === false ? { renewalPriceKnown: false } : {}),
        } },
      });
      if (index !== undefined) domains[index] = domain;
      else { indexes.set(patch.name, domains.length); domains.push(domain); nextNumber += 1; }
      syncedNames.add(patch.name);
    }
    const configurationsChanged = vercel ? mergeVercelConfigurations(domains, vercel, expectedUserId, syncedAt) : false;
    if (patches.length || configurationsChanged) await saveSnapshot({ version: 1, domains, nextNumber });
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
