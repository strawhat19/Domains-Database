import type { DomainRecord } from '../../shared/types';
import type { PortfolioGroup, PortfolioSections, PortfolioPreferences } from '../../shared/portfolioPreferences/types';

export type PortfolioCopyFormat = `list` | `tree` | `detail-tree`;

interface CopyTreeNode {
  label: string;
  description?: string;
  children?: CopyTreeNode[];
}

export const excludeHiddenPortfolioSections = (sections: PortfolioSections, preferences: PortfolioPreferences): PortfolioSections => {
  const hiddenGroups = new Set(preferences.hiddenGroupKeys);
  const hiddenDomains = new Set(preferences.hiddenDomainIds);
  const hiddenCollections = new Set(preferences.hiddenCollectionIds);
  const collectionIds = new Set(preferences.collections.map(collection => collection.id));
  const membership = new Map(preferences.customGroups.flatMap(group => group.domainIds.map(id => [id, group] as const)));
  membership.forEach((group, id) => {
    if (hiddenGroups.has(`custom:${group.id}`) || group.collectionId && collectionIds.has(group.collectionId) && hiddenCollections.has(group.collectionId)) hiddenDomains.add(id);
  });
  const directOwners = new Set<string>();
  preferences.collections.forEach(collection => (collection.domainIds ?? []).forEach(id => {
    if (membership.has(id) || directOwners.has(id)) return;
    directOwners.add(id);
    if (hiddenCollections.has(collection.id)) hiddenDomains.add(id);
  }));
  const filterGroups = (groups: PortfolioGroup[]) => groups.flatMap(group => {
    if (group.key !== `all` && hiddenGroups.has(group.key)) return [];
    const domains = group.domains.filter(domain => !hiddenDomains.has(domain.id));
    return !group.customGroupId && !domains.length ? [] : [{ ...group, domains }];
  });
  const mainGroups = filterGroups(sections.mainGroups);
  const collections = sections.collections.filter(section => !hiddenCollections.has(section.collection.id)).map(section => {
    const groups = filterGroups(section.groups);
    return { ...section, groups, domains: groups.flatMap(group => group.domains) };
  });
  return { collections, mainGroups, mainDomains: mainGroups.flatMap(group => group.domains) };
};

export const buildPortfolioCopyText = (
  sections: PortfolioSections,
  visibleIds: string[],
  grouped: boolean,
  format: PortfolioCopyFormat,
): string => {
  const visible = new Set(visibleIds);
  const mainDomains = sections.mainGroups.flatMap(group => group.domains);
  const allDomains = sections.collections.flatMap(section => section.groups.flatMap(group => group.domains)).concat(mainDomains);

  if (format === `list`) {
    const records = new Map(allDomains.map(domain => [domain.id, domain]));
    return [...visible].flatMap(id => {
      const domain = records.get(id);
      return domain ? [domain] : [];
    })
      .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: `base`, numeric: true }))
      .map((domain, index) => `${index + 1}. ${domain.name}`)
      .join(`\n`);
  }

  const domainNodes = (domains: DomainRecord[]): CopyTreeNode[] => domains
    .filter(domain => visible.has(domain.id))
    .map(domain => ({ label: domain.name }));

  const groupNodes = (groups: PortfolioGroup[]): CopyTreeNode[] => groups.flatMap(group => {
    const children = domainNodes(group.domains);
    if (group.directCollectionId || group.key === `custom:ungrouped`) return children;
    return children.length || !group.domains.length ? [{
      children,
      label: group.label,
      description: group.description,
    }] : [];
  });

  const roots: CopyTreeNode[] = sections.collections.flatMap(section => {
    const children = groupNodes(section.groups);
    return children.length || !section.domains.length ? [{
      children,
      label: section.collection.name,
      description: section.collection.description,
    }] : [];
  });
  const mainNodes = grouped ? groupNodes(sections.mainGroups) : domainNodes(mainDomains);

  roots.push(...mainNodes);

  const lines: string[] = [];
  let domainNumber = 0;
  const appendNodes = (nodes: CopyTreeNode[], depth = 0) => {
    nodes.forEach(node => {
      const indent = `  `.repeat(depth);
      const prefix = node.children === undefined ? `${++domainNumber}. ` : ``;
      const description = format === `detail-tree` ? node.description?.trim().replace(/\s+/g, ` `) : undefined;
      lines.push(`${indent}${prefix}${node.label}${description ? ` — ${description}` : ``}`);
      if (node.children?.length) appendNodes(node.children, depth + 1);
    });
  };
  appendNodes(roots);
  return lines.join(`\n`);
};
