import { sortDomainExtensions } from './query';
import { publicHttpsUrl } from '../social/content';
import { normalizeDomainName } from '../domainUtils';
import { DOMAIN_PROJECT_STATUSES } from '../domainProject';
import type { CommunityProfile, PublicDomain } from '../social/types';

export type PublicDiscoverySort = `newest` | `name` | `builder`;

export interface SharedDomainDiscoveryResult {
  key: string;
  extension: string;
  website: string | null;
  domain: PublicDomain;
  profile: CommunityProfile;
}

export const getSharedDomainDiscovery = (profiles: CommunityProfile[]): SharedDomainDiscoveryResult[] => {
  const records = new Map<string, SharedDomainDiscoveryResult>();
  for (const profile of profiles) {
    if (profile.profilePrivacy !== `public` || !profile.publicDomains) continue;
    for (const domain of profile.domains ?? []) {
      const key = `${profile.id}:${domain.id}`;
      let name: string;
      try { name = normalizeDomainName(domain.name); } catch { continue; }
      const suffix = domain.tld?.replace(/^\./, ``).toLowerCase();
      const extension = suffix && name.endsWith(`.${suffix}`) ? suffix : name.split(`.`).slice(1).join(`.`);
      records.set(key, { key, domain, profile, extension, website: publicHttpsUrl(`https://${name}`) });
    }
  }
  return [...records.values()];
};

export const getSharedDiscoveryFilters = (results: SharedDomainDiscoveryResult[]) => ({
  extensions: sortDomainExtensions(results.map(result => result.extension)),
  statuses: DOMAIN_PROJECT_STATUSES.filter(status => results.some(result => result.domain.projectStatus === status.value)),
});

export const filterSharedDomainDiscovery = (
  results: SharedDomainDiscoveryResult[],
  query: string,
  extension: string,
  status: string,
  sort: PublicDiscoverySort,
) => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = results.filter(result => {
    if (extension !== `all` && result.extension !== extension || status !== `all` && result.domain.projectStatus !== status) return false;
    const searchable = [result.domain.name, result.profile.name, result.profile.description, result.domain.description, result.domain.mvp, result.domain.future]
      .filter(Boolean).join(` `).toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  return filtered.sort((first, second) => {
    if (sort === `newest`) {
      const firstCreated = Date.parse(first.domain.created) || 0;
      const secondCreated = Date.parse(second.domain.created) || 0;
      const difference = secondCreated - firstCreated;
      if (difference) return difference;
    }
    if (sort === `builder`) {
      const difference = first.profile.name.localeCompare(second.profile.name);
      if (difference) return difference;
    }
    return first.domain.name.localeCompare(second.domain.name) || first.key.localeCompare(second.key);
  });
};
