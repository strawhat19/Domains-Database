export const GROUP_DRAG_TYPE = `application/x-domains-database-group`;
export const DOMAIN_DRAG_TYPE = `application/x-domains-database-domain`;
export const COLLECTION_DRAG_TYPE = `application/x-domains-database-collection`;

export interface DomainDragData {
  groupKey: string;
  domainId: string;
  domainIds: string[];
}

export const readDomainDrag = (transfer: DataTransfer): DomainDragData | null => {
  try {
    const value: unknown = JSON.parse(transfer.getData(DOMAIN_DRAG_TYPE));
    if (!value || typeof value !== `object`) return null;
    const data = value as Partial<DomainDragData>;
    if (typeof data.groupKey !== `string` || typeof data.domainId !== `string`
      || !Array.isArray(data.domainIds) || !data.domainIds.length
      || !data.domainIds.every(id => typeof id === `string`)
      || !data.domainIds.includes(data.domainId)) return null;
    return { ...data, domainIds: [...new Set(data.domainIds)] } as DomainDragData;
  } catch {
    return null;
  }
};
