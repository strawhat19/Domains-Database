import type { DomainRecord } from '../../shared/types';
import type { PortfolioGroup, PortfolioSections } from '../../shared/portfolioPreferences/types';

export type PortfolioCopyFormat = `list` | `tree` | `detail-tree`;

interface CopyTreeNode {
  label: string;
  description?: string;
  children?: CopyTreeNode[];
}

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

  if (sections.collections.length && mainNodes.length) {
    roots.push({
      children: mainNodes,
      label: `Database`,
    });
  } else roots.push(...mainNodes);

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
