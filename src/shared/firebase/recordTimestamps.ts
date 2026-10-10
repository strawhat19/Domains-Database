import { getAppCollectionIDNumber } from '../common/ids';
import type { DocumentData } from 'firebase/firestore';

export interface RecordTimestamps {
  updated: string;
  baseUpdated: string;
  syncedAt: string | null;
  renewalCheckedAt: string | null;
  registrarCheckedAt: string | null;
}
interface TimestampGroup { numbers: number[]; timestamps: RecordTimestamps }

const isRecord = (value: unknown): value is DocumentData => Boolean(value) && typeof value === `object` && !Array.isArray(value);
export const getRecordTimestamps = (record: DocumentData, baseUpdated = record.updated): RecordTimestamps | undefined => {
  if (typeof record.updated !== `string` || typeof baseUpdated !== `string`
    || (record.meta !== undefined && !isRecord(record.meta))) return;
  const meta = record.meta;
  const sync = meta?.registrarSync;
  if (sync !== undefined && !isRecord(sync)) return;
  const estimate = sync?.renewalEstimate;
  if (estimate !== undefined && !isRecord(estimate)) return;
  const times = [sync?.syncedAt, estimate?.checkedAt, meta?.registrarCheckedAt];
  if (times.some(value => value !== undefined && typeof value !== `string`)) return;
  return {
    baseUpdated,
    updated: record.updated,
    syncedAt: sync?.syncedAt ?? null,
    renewalCheckedAt: estimate?.checkedAt ?? null,
    registrarCheckedAt: meta?.registrarCheckedAt ?? null,
  };
};
export const withoutRecordTimestamps = (record: DocumentData): DocumentData => {
  const result = { ...record };
  delete result.updated;
  if (isRecord(record.meta)) {
    result.meta = { ...record.meta };
    delete result.meta.registrarCheckedAt;
    if (isRecord(record.meta.registrarSync)) {
      result.meta.registrarSync = { ...record.meta.registrarSync };
      delete result.meta.registrarSync.syncedAt;
      if (isRecord(record.meta.registrarSync.renewalEstimate)) {
        result.meta.registrarSync.renewalEstimate = { ...record.meta.registrarSync.renewalEstimate };
        delete result.meta.registrarSync.renewalEstimate.checkedAt;
      }
    }
  }
  return result;
};
export const packRecordTimestamps = (values: Record<string, RecordTimestamps>): TimestampGroup[] => {
  const groups = new Map<string, TimestampGroup>();
  for (const [id, timestamps] of Object.entries(values)) {
    const key = JSON.stringify(timestamps);
    let group = groups.get(key);
    if (!group) { group = { timestamps, numbers: [] }; groups.set(key, group); }
    group.numbers.push(getAppCollectionIDNumber(id, `Domain`));
  }
  return [...groups.values()];
};
export const readRecordTimestamps = (value: unknown): Record<string, RecordTimestamps> => {
  if (value === undefined) return {};
  const unreadable = () => new Error(`Saved Cloud Timestamps Could Not Be Read`);
  if (!Array.isArray(value)) throw unreadable();
  const result: Record<string, RecordTimestamps> = {};
  for (const group of value) {
    const times = group?.timestamps;
    if (!isRecord(times) || typeof times.updated !== `string` || typeof times.baseUpdated !== `string`
      || !Array.isArray(group.numbers)
      || [times.syncedAt, times.renewalCheckedAt, times.registrarCheckedAt].some(time => time !== null && typeof time !== `string`)) throw unreadable();
    for (const number of group.numbers) {
      if (!Number.isSafeInteger(number) || number < 1 || result[number]) throw unreadable();
      result[number] = {
        updated: times.updated,
        baseUpdated: times.baseUpdated,
        syncedAt: times.syncedAt,
        renewalCheckedAt: times.renewalCheckedAt,
        registrarCheckedAt: times.registrarCheckedAt,
      };
    }
  }
  return result;
};
const applyTimestamp = (record: DocumentData, key: string, value: string | null) => {
  if (value === null) delete record[key];
  else record[key] = value;
};
export const applyRecordTimestamps = (record: DocumentData, times: RecordTimestamps): DocumentData => {
  if (record.updated !== times.baseUpdated) return record;
  const result: DocumentData = { ...record, updated: times.updated };
  if (isRecord(record.meta)) {
    result.meta = { ...record.meta };
    applyTimestamp(result.meta, `registrarCheckedAt`, times.registrarCheckedAt);
    if (isRecord(record.meta.registrarSync)) {
      result.meta.registrarSync = { ...record.meta.registrarSync };
      applyTimestamp(result.meta.registrarSync, `syncedAt`, times.syncedAt);
      if (isRecord(record.meta.registrarSync.renewalEstimate)) {
        result.meta.registrarSync.renewalEstimate = { ...record.meta.registrarSync.renewalEstimate };
        applyTimestamp(result.meta.registrarSync.renewalEstimate, `checkedAt`, times.renewalCheckedAt);
      }
    }
  }
  return result;
};
