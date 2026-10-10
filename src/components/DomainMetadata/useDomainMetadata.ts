import { useMemo } from 'react';
import type { DomainRecord } from '../../shared/types';
import { normalizeDomainTags } from '../../shared/domainTags';
import { getPortfolioColumnValue, getPortfolioColumnDisplay, hasPortfolioColumnValue, type PortfolioColumn } from '../../shared/portfolioColumns';

export interface DomainMetadataProps {
  domain: DomainRecord;
  hideProjectDetails?: boolean;
}

interface DomainMetadataField {
  label: string;
  wide?: boolean;
  field: PortfolioColumn;
}

interface DomainMetadataItem {
  key: string;
  label: string;
  value: string;
  wide?: boolean;
}

const registrarFields: DomainMetadataField[] = [
  { field: `registrar`, label: `Registrar` },
  { field: `providerId`, label: `Provider ID` },
  { field: `status`, label: `Provider Status` },
  { field: `tld`, label: `Extension` },
  { field: `internationalName`, label: `International Name` },
  { field: `autoRenew`, label: `Auto-Renew` },
  { field: `locked`, label: `Domain Lock` },
  { field: `privacy`, label: `Privacy` },
  { field: `dnssec`, label: `DNSSEC` },
  { field: `nameservers`, label: `Nameservers` },
  { field: `forwardingUrl`, label: `Forwarding URL` },
  { field: `protectionPlan`, label: `Protection Plan` },
  { field: `expiresAt`, label: `Renewal Date` },
  { field: `createdAt`, label: `Created` },
  { field: `updatedAt`, label: `Last Updated` },
  { field: `ownershipAt`, label: `Ownership Date` },
  { field: `firstImportedAt`, label: `First Imported` },
  { field: `firstExportedAt`, label: `First Exported` },
  { field: `owner`, label: `Owner` },
  { field: `registrantName`, label: `Registrant Name` },
  { field: `registrantEmail`, label: `Registrant Email` },
  { field: `organization`, label: `Organization` },
  { field: `country`, label: `Country` },
];

const projectFields: DomainMetadataField[] = [
  { field: `projectStatus`, label: `Project Status` },
  { field: `difficulty`, label: `Difficulty` },
  { wide: true, field: `mvp`, label: `MVP` },
  { wide: true, field: `future`, label: `Future` },
];

export const useDomainMetadata = ({ domain, hideProjectDetails = false }: DomainMetadataProps) => {
  const items = useMemo(() => {
    const fields = hideProjectDetails ? registrarFields : [...registrarFields, ...projectFields];
    const values: DomainMetadataItem[] = fields.flatMap(({ field, label, wide }) => (
      hasPortfolioColumnValue(getPortfolioColumnValue(domain, field), field)
        ? [{ label, wide, key: field, value: getPortfolioColumnDisplay(domain, field) }] : []
    ));
    if (hideProjectDetails) return values;
    const textFields = [
      { key: `title`, label: `Title`, value: domain.title },
      { key: `tags`, label: `Tags`, value: normalizeDomainTags(domain.tags).join(`, `) },
      { wide: true, key: `description`, label: `Description`, value: domain.description },
      { wide: true, key: `notes`, label: `Notes`, value: domain.notes?.trim() === domain.description?.trim() ? undefined : domain.notes },
    ];
    return values.concat(textFields.flatMap(item => (
      hasPortfolioColumnValue(item.value) ? [{ ...item, value: item.value?.trim() ?? `` }] : []
    )));
  }, [domain, hideProjectDetails]);

  return { items, scope: `domain-metadata-${domain.id}` };
};
