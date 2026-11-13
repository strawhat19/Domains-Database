import { searchConnectedDomains } from './client';
import type { DomainSearchPrice, DomainSearchResults, DomainSearchProgress, DomainSearchDomainResult } from './types';
import { getDiscoveryWeek, getDiscoveryCandidates, type DomainDiscoveryCategory } from './discoveryIdeas';

export { discoveryExtensions, type DomainDiscoveryCategory } from './discoveryIdeas';
export type DomainDiscoveryFilter = DomainDiscoveryStatus | `all`;
export type DomainDiscoveryStatus = DomainDiscoveryCategory | `value` | `short` | `one-word` | `two-word`;

export interface DomainDiscoveryResult extends DomainSearchDomainResult {
  extension: string;
  wordCount: number;
  statuses: DomainDiscoveryStatus[];
}

export interface DomainDiscoveryResults extends Omit<DomainSearchResults, `results`> {
  results: DomainDiscoveryResult[];
  incomplete?: boolean;
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

export const isValueRegistration = (price: DomainSearchPrice | undefined): boolean => {
  const years = price?.years;
  return !!price && price.currency === `USD` && Number.isFinite(price.amount) && price.amount >= 0
    && typeof years === `number` && Number.isInteger(years) && years >= 1 && years <= 10 && price.amount / years <= 20;
};

type DiscoveryCandidate = ReturnType<typeof getDiscoveryCandidates>[number];

const availableResults = (result: DomainSearchResults, candidates: Map<string, DiscoveryCandidate>): DomainDiscoveryResults => ({
  ...result,
  results: result.results.flatMap(domain => {
    const candidate = candidates.get(domain.domain);
    const connections = domain.connections.filter(connection => connection.available === true && !connection.pending && !connection.error);
    if (!candidate || !connections.length) return [];
    const { wordCount } = candidate;
    const statuses: DomainDiscoveryStatus[] = [candidate.category];
    if (connections.some(connection => isValueRegistration(connection.registration))) statuses.push(`value`);
    if ((domain.domain.split(`.`)[0]?.length ?? 0) <= 10) statuses.push(`short`);
    if (wordCount === 1) statuses.push(`one-word`);
    if (wordCount === 2) statuses.push(`two-word`);
    return [{ ...domain, statuses, wordCount, connections, extension: domain.domain.split(`.`).slice(1).join(`.`) }];
  }),
});

export const getDomainDiscovery = async (
  signal: AbortSignal,
  expectedUserId: string | null,
  onProgress?: (results: DomainDiscoveryResults, progress: DomainSearchProgress) => void,
  options?: { week?: number; refresh?: boolean; previous?: DomainDiscoveryResults | null },
): Promise<DomainDiscoveryResults> => {
  const candidates = new Map(getDiscoveryCandidates(options?.week ?? getDiscoveryWeek()).map(candidate => [candidate.domain, candidate] as const));
  const previous = new Map(options?.previous?.results.map(result => [result.domain, result]) ?? []);
  const result = await searchConnectedDomains([...candidates.keys()], signal, expectedUserId, undefined, (progress, counts) => {
    if (signal.aborted) return;
    const sameConnections = options?.previous?.connectionsUpdated === progress.connectionsUpdated;
    const merged = progress.results.map(domain => ({ ...domain, connections: domain.connections.map(connection => connection.pending
      && sameConnections ? previous.get(domain.domain)?.connections.find(saved => saved.provider === connection.provider) ?? connection : connection) }));
    onProgress?.(availableResults({ ...progress, results: merged, searchedAt: sameConnections && previous.size ? options?.previous?.searchedAt ?? progress.searchedAt : progress.searchedAt }, candidates), counts);
  }, { discoveryCache: true, refresh: options?.refresh });
  const connections = result.results.flatMap(domain => domain.connections);
  if (connections.length && connections.every(connection => !!connection.error)) {
    throw new Error(connections[0].error || `Could Not Check Domain Availability`);
  }
  const incomplete = connections.some(connection => typeof connection.available !== `boolean` || Boolean(connection.error));
  return { ...availableResults(result, candidates), incomplete };
};
