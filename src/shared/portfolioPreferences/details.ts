import type { PortfolioGroupDetails } from './types';
import { normalizeSiteIconUrl } from '../domainSiteIcon';
import { DOMAIN_PRICE_FIELDS, normalizeDomainPrice, restoreDomainPrice } from '../domainPricing';
import { normalizeDomainTags, validateDomainTags } from '../domainTags';
import { normalizeDomainLink, normalizeDomainLinks } from '../domainLinks';
import { DEFAULT_DOMAIN_PROJECT_STATUS, normalizeDomainProjectStatus } from '../domainProject';

const LINK_FIELDS = [
  [`parentLink`, `Parent Link`],
  [`productionLink`, `Production Link`],
  [`githubRepoLink`, `GitHub Repository Link`],
] as const;

const LINK_LIST_FIELDS = [
  [`childLinks`, `Child Links`],
  [`previewLinks`, `Preview Links`],
  [`relatedLinks`, `Related Links`],
  [`developmentLinks`, `Development Links`],
  [`socialMediaLinks`, `Social Media Links`],
] as const;

export const normalizeGroupDetails = (input: PortfolioGroupDetails): PortfolioGroupDetails => {
  const details: PortfolioGroupDetails = {};
  if (input.tags !== undefined) details.tags = validateDomainTags(input.tags);
  for (const { field, label } of DOMAIN_PRICE_FIELDS) {
    if (field in input) details[field] = normalizeDomainPrice(input[field], label);
  }
  if (input.isApp !== undefined) {
    if (typeof input.isApp !== `boolean`) throw new Error(`Choose Group Or App`);
    details.isApp = input.isApp;
  }
  if (input.siteIconUrl !== undefined) details.siteIconUrl = normalizeSiteIconUrl(input.siteIconUrl);
  if (input.projectStatus !== undefined) details.projectStatus = normalizeDomainProjectStatus(input.projectStatus);
  for (const [field, label] of LINK_FIELDS) {
    if (input[field] !== undefined) details[field] = normalizeDomainLink(input[field], label);
  }
  for (const [field, label] of LINK_LIST_FIELDS) {
    if (input[field] !== undefined) details[field] = normalizeDomainLinks(input[field], label);
  }
  return details;
};

export const restoreGroupDetails = (saved: Record<string, unknown>): PortfolioGroupDetails => {
  const details: PortfolioGroupDetails = {
    isApp: saved.isApp === true,
    tags: normalizeDomainTags(saved.tags),
    projectStatus: DEFAULT_DOMAIN_PROJECT_STATUS,
  };
  for (const { field } of DOMAIN_PRICE_FIELDS) details[field] = restoreDomainPrice(saved[field]);
  try { details.projectStatus = normalizeDomainProjectStatus(saved.projectStatus); }
  catch { /* Preserve groups with an invalid saved status. */ }
  try {
    const siteIconUrl = normalizeSiteIconUrl(saved.siteIconUrl);
    if (siteIconUrl) details.siteIconUrl = siteIconUrl;
  } catch { /* Preserve groups with an invalid saved icon URL. */ }
  for (const [field, label] of LINK_FIELDS) {
    try {
      const link = normalizeDomainLink(saved[field], label);
      if (link) details[field] = link;
    } catch { /* Ignore only the invalid saved link. */ }
  }
  for (const [field, label] of LINK_LIST_FIELDS) {
    const links = saved[field];
    if (!Array.isArray(links)) continue;
    const restoredLinks = links.flatMap(value => {
      try {
        const link = normalizeDomainLink(value, label);
        return link ? [link] : [];
      } catch { return []; }
    });
    if (restoredLinks.length) details[field] = [...new Set(restoredLinks)];
  }
  return details;
};
