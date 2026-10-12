import { planId } from '../plans/values';
import { Timestamp } from 'firebase/firestore';
import { getAppCollectionIDNumber } from '../common/ids';
import { PlanInterest } from '../models/plans/PlanInterest';
import type { PlanVote, PlanInterestState, PlanInterestSummary } from './types';

const unreadable = () => new Error(`Saved Plan Interest Needs Attention — Nothing Was Changed`);
export const normalizePlanVote = (value: unknown): PlanVote => {
  if (value !== null && value !== `up`) throw new Error(`Choose A Valid Plan Vote`);
  return value;
};
export const readPlanInterestState = (value: unknown): PlanInterestState => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 3 || typeof data.interested !== `boolean`) throw unreadable();
  return { planId: planId(data.planId), vote: normalizePlanVote(data.vote === `down` ? null : data.vote), interested: data.interested };
};
const date = (value: unknown) => {
  const text = value instanceof Timestamp ? value.toDate().toISOString() : value;
  if (typeof text !== `string` || !Number.isFinite(Date.parse(text))) throw unreadable();
  return text;
};
export const readPlanInterest = (value: unknown): PlanInterest => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 11 || data.type !== `PlanInterest` || !Number.isSafeInteger(data.number) || Number(data.number) < 1
    || typeof data.id !== `string` || data.id.includes(`/`) || !data.id.startsWith(`PlanInterest_${data.number}_Plan_`)
    || getAppCollectionIDNumber(data.id, `PlanInterest`) !== data.number || ![`up`, `down`, `none`].includes(data.vote as string)
    || typeof data.actorKey !== `string` || !data.actorKey || data.actorKey.length > 300
    || typeof data.migratedTo !== `string` || data.migratedTo.length > 300 || typeof data.interested !== `boolean`
    || typeof data.userId !== `string` || data.userId.includes(`/`) || (data.userId !== `` && !getAppCollectionIDNumber(data.userId, `User`)) || (data.interested && !data.userId)) throw unreadable();
  return new PlanInterest({ ...data, planId: planId(data.planId), created: date(data.created), updated: date(data.updated) } as Partial<PlanInterest>);
};
export const readPlanInterestSummary = (value: unknown): PlanInterestSummary => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  const data = value as Record<string, unknown>;
  const fields = [`up`, `down`, `planId`, `updated`, `planName`, `interested`];
  if (fields.some(field => !(field in data)) || Object.keys(data).some(field => !fields.includes(field) && field !== `lastInterestId`)
    || (`lastInterestId` in data && (typeof data.lastInterestId !== `string` || data.lastInterestId.includes(`/`)
      || !getAppCollectionIDNumber(data.lastInterestId, `PlanInterest`) || !data.lastInterestId.startsWith(`PlanInterest_${getAppCollectionIDNumber(data.lastInterestId)}_Plan_`)))
    || typeof data.planName !== `string` || !data.planName.trim() || data.planName.length > 100
    || [data.up, data.down, data.interested].some(count => !Number.isSafeInteger(count) || Number(count) < 0)) throw unreadable();
  return { up: Number(data.up), down: Number(data.down), planId: planId(data.planId), updated: date(data.updated), planName: data.planName, interested: Number(data.interested) };
};
export const planInterestState = (planId: string, record?: PlanInterest | null): PlanInterestState => ({
  planId,
  interested: record?.interested ?? false,
  vote: record?.vote === `up` ? `up` : null,
});
export const adjustPlanInterestSummary = (summary: PlanInterestSummary, oldRecords: readonly PlanInterest[], record: PlanInterest, planName: string): PlanInterestSummary => {
  const count = (vote: `up` | `down`) => oldRecords.reduce((total, current) => total + Number(current.vote === vote), 0);
  return readPlanInterestSummary({
    ...summary,
    planName,
    updated: record.updated,
    up: summary.up - count(`up`) + Number(record.vote === `up`),
    down: summary.down - count(`down`) + Number(record.vote === `down`),
    interested: summary.interested - oldRecords.reduce((total, current) => total + Number(current.interested), 0) + Number(record.interested),
  });
};
