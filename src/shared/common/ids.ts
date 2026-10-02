import { randomUUID } from 'expo-crypto';
import { Types } from '../../types/types';

export const generateID = () => randomUUID().replaceAll(`-`, ``);
export const getAppCollectionIDNumber = (id: unknown, type?: Types | string) => {
  if (typeof id !== `string` || (type && !id.startsWith(`${type}_`))) return 0;
  const match = /^([A-Za-z][A-Za-z0-9]*)_(\d+)_.+_\d{1,2}_\d{2}_(AM|PM)_\d{1,2}_\d{1,2}_\d{2}_[A-Za-z0-9-]+$/.exec(id);
  const number = Number(match?.[2]);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
};
export const isAppCollectionID = (id: unknown, type?: Types | string) => getAppCollectionIDNumber(id, type) > 0;
export const getNextCollectionNumber = (items: readonly { number: number }[] = []) => Math.max(0, ...items.map(item => item.number)) + 1;
export const genID = (type: Types | string = Types.Data, number = 1, name = `Record`, date = new Date(), uuid = generateID()) => {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Record Number Must Be A Positive Integer`);
  const parts = new Intl.DateTimeFormat(`en-US`, {
    hour12: true,
    day: `2-digit`,
    year: `2-digit`,
    hour: `numeric`,
    month: `2-digit`,
    minute: `2-digit`,
    timeZone: `America/New_York`,
  }).formatToParts(date);
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === key)?.value ?? ``;
  const stamp = `${part(`hour`)}_${part(`minute`)}_${part(`dayPeriod`)}_${part(`month`)}_${part(`day`)}_${part(`year`)}`;
  const recordName = name.trim().replace(/[^\p{L}\p{N}.]+/gu, `_`).replace(/^_+|_+$/g, ``).slice(0, 80) || `Record`;
  return { uuid, title: `${type} ${number} ${name || `Record`}`, date: date.toISOString(), id: `${type}_${number}_${recordName}_${stamp}_${uuid}` };
};
