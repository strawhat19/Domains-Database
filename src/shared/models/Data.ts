import { Types } from '../../types/types';
import { getRandomUnusedColor, type DataColor } from '../../styles/theme/theme';
import { capWords, countPropertiesInObject, toTimestamp } from '../common/values';
import { genID, getAppCollectionIDNumber, isAppCollectionID } from '../common/ids';

export type { DataColor } from '../../styles/theme/theme';
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export class Data {
  id: string;
  uid: string;
  name: string;
  uuid: string;
  email: string;
  title: string;
  type: Types;
  number: number;
  created: string;
  updated: string;
  color: DataColor;
  properties: number;
  description: string;

  constructor(data: Partial<Data> = {}) {
    this.type = data.type ?? Types.Data;
    this.email = data.email?.trim().toLowerCase() ?? ``;
    this.description = data.description?.trim() ?? ``;
    this.name = data.name?.trim() || capWords(this.email.split(`@`)[0] ?? ``) || this.description || `Record`;
    const idNumber = getAppCollectionIDNumber(data.id, this.type);
    this.number = data.number ?? (idNumber || 1);
    if (idNumber && idNumber !== this.number) throw new Error(`Record ID And Number Must Match`);
    this.created = toTimestamp(data.created);
    this.updated = toTimestamp(data.updated, this.created);
    const existingUUID = data.uuid || (isAppCollectionID(data.id, this.type) ? data.id?.split(`_`).at(-1) : undefined);
    const identity = genID(this.type, this.number, this.name, new Date(this.created), existingUUID);
    this.id = data.id || identity.id;
    this.uuid = identity.uuid;
    this.title = data.title || identity.title;
    this.uid = data.uid ?? ``;
    this.color = data.color?.color ? { ...data.color } : getRandomUnusedColor();
    this.properties = 0;
    this.refreshProperties();
  }

  protected refreshProperties() { this.properties = countPropertiesInObject(this); }
  toRecord(): Record<string, JSONValue> { return JSON.parse(JSON.stringify(this)); }
}
