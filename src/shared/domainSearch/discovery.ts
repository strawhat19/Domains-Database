import { sortDomainExtensions } from './query';
import { searchConnectedDomains } from './client';
import type { DomainSearchPrice, DomainSearchResults, DomainSearchDomainResult } from './types';

export type DomainDiscoveryCategory = `hot` | `trending` | `new`;
export type DomainDiscoveryFilter = DomainDiscoveryStatus | `all`;
export type DomainDiscoveryStatus = DomainDiscoveryCategory | `value` | `short` | `one-word` | `two-word`;

export interface DomainDiscoveryResult extends DomainSearchDomainResult {
  extension: string;
  wordCount: number;
  statuses: DomainDiscoveryStatus[];
}

export interface DomainDiscoveryResults extends Omit<DomainSearchResults, `results`> {
  results: DomainDiscoveryResult[];
}

interface DiscoveryCandidate {
  domain: string;
  words: string[];
}

export const discoveryStatuses: { id: DomainDiscoveryStatus; label: string; description: string }[] = [
  { id: `hot`, label: `Hot`, description: `Brandable name ideas` },
  { id: `trending`, label: `Trending`, description: `Tech and creator name ideas` },
  { id: `new`, label: `New`, description: `Fresh name combinations` },
  { id: `value`, label: `Value`, description: `Confirmed USD registration at $20/year or less` },
  { id: `short`, label: `Short`, description: `Up to 10 characters before the extension` },
  { id: `one-word`, label: `1 Word`, description: `One curated keyword before the extension` },
  { id: `two-word`, label: `2 Words`, description: `Two curated keywords before the extension` },
];

const discoveryNames: Record<DomainDiscoveryCategory, DiscoveryCandidate[]> = {
  hot: [
    { domain: `embernook.com`, words: [`ember`, `nook`] },
    { domain: `glowsprout.com`, words: [`glow`, `sprout`] },
    { domain: `orbitgrove.com`, words: [`orbit`, `grove`] },
    { domain: `vividparcel.com`, words: [`vivid`, `parcel`] },
    { domain: `launchlattice.com`, words: [`launch`, `lattice`] },
    { domain: `harborwhisper.com`, words: [`harbor`, `whisper`] },
    { domain: `pixelcove.studio`, words: [`pixel`, `cove`] },
    { domain: `brightbloom.studio`, words: [`bright`, `bloom`] },
    { domain: `halcyon.studio`, words: [`halcyon`] },
  ],
  trending: [
    { domain: `agentfern.ai`, words: [`agent`, `fern`] },
    { domain: `promptcove.ai`, words: [`prompt`, `cove`] },
    { domain: `makerorbit.app`, words: [`maker`, `orbit`] },
    { domain: `buildsprout.dev`, words: [`build`, `sprout`] },
    { domain: `creatorbloom.co`, words: [`creator`, `bloom`] },
    { domain: `automategrove.com`, words: [`automate`, `grove`] },
    { domain: `signalnest.studio`, words: [`signal`, `nest`] },
    { domain: `workflowharbor.dev`, words: [`workflow`, `harbor`] },
    { domain: `verdant.dev`, words: [`verdant`] },
  ],
  new: [
    { domain: `quietorbit.co`, words: [`quiet`, `orbit`] },
    { domain: `mintquarry.com`, words: [`mint`, `quarry`] },
    { domain: `maplesignal.com`, words: [`maple`, `signal`] },
    { domain: `bloomparcel.com`, words: [`bloom`, `parcel`] },
    { domain: `amberlattice.com`, words: [`amber`, `lattice`] },
    { domain: `coppermeadow.com`, words: [`copper`, `meadow`] },
    { domain: `lunarpostbox.com`, words: [`lunar`, `postbox`] },
    { domain: `velvetcompass.com`, words: [`velvet`, `compass`] },
    { domain: `brumous.com`, words: [`brumous`] },
  ],
};

const getDiscoveryExtension = (domain: string) => domain.split(`.`).slice(1).join(`.`);
const discoveryCategories: DomainDiscoveryCategory[] = [`hot`, `trending`, `new`];
const candidateCount = Math.max(...discoveryCategories.map(category => discoveryNames[category].length));
const interleavedCandidates = Array.from({ length: candidateCount }, (_, index) => (
  discoveryCategories.flatMap(category => {
    const candidate = discoveryNames[category][index];
    return candidate ? [candidate] : [];
  })
)).flat();
const candidateRecords = new Map(interleavedCandidates.map(candidate => [candidate.domain, candidate] as const));
const discoveryCandidates = [...candidateRecords.values()].sort((first, second) => (
  Number(getDiscoveryExtension(second.domain) === `com`) - Number(getDiscoveryExtension(first.domain) === `com`)
));

export const discoveryExtensions = sortDomainExtensions(discoveryCandidates.map(candidate => getDiscoveryExtension(candidate.domain)));

export const isValueRegistration = (price: DomainSearchPrice | undefined): boolean => {
  const years = price?.years;
  return !!price && price.currency === `USD` && Number.isFinite(price.amount) && price.amount >= 0
    && typeof years === `number` && Number.isInteger(years) && years >= 1 && years <= 10 && price.amount / years <= 20;
};

const availableResults = (result: DomainSearchResults): DomainDiscoveryResults => ({
  ...result,
  results: result.results.flatMap(domain => {
    const candidate = candidateRecords.get(domain.domain);
    const connections = domain.connections.filter(connection => connection.available === true && !connection.pending && !connection.error);
    if (!candidate || !connections.length) return [];
    const wordCount = candidate.words.length;
    const statuses: DomainDiscoveryStatus[] = discoveryCategories.filter(category => discoveryNames[category].some(name => name.domain === domain.domain));
    if (connections.some(connection => isValueRegistration(connection.registration))) statuses.push(`value`);
    if ((domain.domain.split(`.`)[0]?.length ?? 0) <= 10) statuses.push(`short`);
    if (wordCount === 1) statuses.push(`one-word`);
    if (wordCount === 2) statuses.push(`two-word`);
    return [{ ...domain, statuses, wordCount, connections, extension: getDiscoveryExtension(domain.domain) }];
  }),
});

export const getDomainDiscovery = async (
  signal: AbortSignal,
  expectedUserId: string | null,
  onProgress?: (results: DomainDiscoveryResults) => void,
): Promise<DomainDiscoveryResults> => {
  const result = await searchConnectedDomains(discoveryCandidates.map(candidate => candidate.domain), signal, expectedUserId, undefined, progress => {
    if (!signal.aborted) onProgress?.(availableResults(progress));
  });
  const connections = result.results.flatMap(domain => domain.connections);
  if (connections.length && connections.every(connection => !!connection.error)) {
    throw new Error(connections[0].error || `Could Not Check Domain Availability`);
  }
  return availableResults(result);
};
