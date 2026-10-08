import { normalizeDomainLink } from '../../shared/domainLinks';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';

const fields = [
  { field: `parentLink`, label: `Parent Link` },
  { field: `childLinks`, label: `Child Link` },
  { field: `previewLinks`, label: `Preview` },
  { field: `developmentLinks`, label: `Development Link` },
  { field: `relatedLinks`, label: `Related Link` },
  { field: `productionLink`, label: `Production Link` },
  { field: `githubRepoLink`, label: `GitHub Repository` },
  { field: `socialMediaLinks`, label: `Social Media Link` },
] as const;

export const getPortfolioGroupLinks = (group: CustomPortfolioGroup) => fields.flatMap(({ field, label }) => {
  const value = group[field];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((link, index) => {
    try {
      const href = normalizeDomainLink(link, label);
      return href ? [{
        href,
        key: `${field}-${index}`,
        preview: field === `previewLinks`,
        label: `${label}${Array.isArray(value) ? ` ${index + 1}` : ``} For ${group.name}`,
      }] : [];
    } catch {
      return [];
    }
  });
});
