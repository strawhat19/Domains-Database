import { createHash } from 'node:crypto';
import { BillingError } from '../billing/types';
import { readLimitedText } from '../registrars/request';
import { Domain } from '../../shared/models/domains/Domain';
import type { DocumentData } from 'firebase-admin/firestore';
import { validateDomainInput } from '../../shared/domainUtils';
import { hasPaidBillingAccess } from '../../shared/accountPlans';
import { isAppCollectionID, getAppCollectionIDNumber } from '../../shared/common/ids';
import { projectPublicDomain } from '../../shared/publicDirectory/domains';
import { getBillingDatabase, requireBillingActor } from '../billing/firebase';
import { readRecordTimestamps } from '../../shared/firebase/recordTimestamps';

const headers = { 'Cache-Control': `no-store, private`, 'X-Content-Type-Options': `nosniff` };
const invalid = () => new BillingError(400, `invalid_portfolio`, `Send A Valid Portfolio Change`);
const object = (value: unknown): value is DocumentData => !!value && typeof value === `object` && !Array.isArray(value);
const same = (first: unknown, second: unknown) => JSON.stringify(first ?? null) === JSON.stringify(second ?? null);
const idsHash = (ids: readonly string[]) => createHash(`sha256`).update([...ids].sort().join(`\n`)).digest(`hex`);
export const handlePortfolioCommit = async (request: Request): Promise<Response> => {
  try {
    const origin = request.headers.get(`origin`);
    if (origin && origin !== new URL(request.url).origin) throw new BillingError(403, `invalid_origin`, `Cross-Origin Portfolio Changes Are Not Allowed`);
    if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim() !== `application/json`) throw invalid();
    const actor = await requireBillingActor(request);
    const body = await readLimitedText(request.body, 3_500_000, AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]), invalid());
    let input: DocumentData;
    try { input = JSON.parse(body); } catch { throw invalid(); }
    if (!object(input) || Object.keys(input).some(key => ![`snapshot`, `ids`, `changes`, `expectedRevision`, `recordTimestamps`].includes(key))
      || !object(input.snapshot) || input.snapshot.version !== 1 || Object.keys(input.snapshot).some(key => ![`version`, `nextNumber`].includes(key))
      || !Number.isSafeInteger(input.snapshot.nextNumber) || input.snapshot.nextNumber < 1
      || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0
      || !Array.isArray(input.ids) || input.ids.length > 10_000 || new Set(input.ids).size !== input.ids.length
      || input.ids.some((id: unknown) => typeof id !== `string` || id.length > 240 || id.includes(`/`) || !isAppCollectionID(id, `Domain`))
      || !Array.isArray(input.changes) || input.changes.length > 8) throw invalid();
    const changeIds = new Set<string>();
    const changes: { id: string; record?: DocumentData }[] = input.changes.map((change: unknown) => {
      if (!object(change) || Object.keys(change).some(key => ![`id`, `record`].includes(key)) || typeof change.id !== `string`
        || change.id.length > 240 || change.id.includes(`/`) || !isAppCollectionID(change.id, `Domain`) || changeIds.has(change.id)) throw invalid();
      changeIds.add(change.id);
      if (change.record === undefined) return { id: change.id, record: undefined };
      const source = change.record;
      if (!object(source) || source.id !== change.id || source.uid !== actor.id || source.type !== `Domain`
        || source.number !== getAppCollectionIDNumber(change.id, `Domain`) || source.number >= input.snapshot.nextNumber
        || typeof source.created !== `string` || !Number.isFinite(Date.parse(source.created))
        || typeof source.updated !== `string` || !Number.isFinite(Date.parse(source.updated))) throw invalid();
      let record: DocumentData;
      try {
        const validated = validateDomainInput(source as Domain);
        record = new Domain({ ...source, ...validated, id: change.id, uid: actor.id }).toRecord();
      } catch { throw invalid(); }
      if (record.id !== change.id || Buffer.byteLength(JSON.stringify(record), `utf8`) > 750_000) throw invalid();
      return { id: change.id, record };
    });
    const timestampInput = input.recordTimestamps ?? [];
    try { readRecordTimestamps(timestampInput); } catch { throw invalid(); }
    if (Buffer.byteLength(JSON.stringify(timestampInput), `utf8`) > 200_000
      || Buffer.byteLength(JSON.stringify({ snapshot: input.snapshot, ids: input.ids, recordTimestamps: timestampInput }), `utf8`) > 750_000) throw invalid();
    const database = getBillingDatabase();
    const account = database.doc(`users/${actor.id}`);
    const snapshot = account.collection(`snapshots`).doc(`portfolio`);
    const usageRef = database.doc(`portfolioUsage/${actor.id}`);
    const result = await database.runTransaction(async transaction => {
      const [saved, currentAccount, billing, usageSnapshot, identity] = await Promise.all([
        transaction.get(snapshot), transaction.get(account), transaction.get(database.doc(`billingUsers/${actor.id}`)),
        transaction.get(usageRef), transaction.get(database.doc(`identities/${actor.firebaseUid}`)),
      ]);
      const user = currentAccount.data();
      if (user?.active !== true || user.firebase_uid !== actor.firebaseUid || user.id !== actor.id
        || user.number !== getAppCollectionIDNumber(actor.id, `User`) || identity.data()?.number !== user.number
        || identity.data()?.id !== actor.id || identity.data()?.firebase_uid !== actor.firebaseUid) throw new BillingError(403, `account_unavailable`, `This Account Is Unavailable`);
      const previous = saved.data();
      const revision = previous?.revision ?? 0;
      if (revision !== input.expectedRevision) throw new BillingError(409, `portfolio_changed`, `Saved Data Changed On Another Device — Refresh And Try Again`);
      if (input.snapshot.nextNumber < (previous?.snapshot?.nextNumber ?? 1)) throw invalid();
      const owner = user.role === `Owner`;
      const mirror = billing.data();
      const paid = owner || hasPaidBillingAccess({ plan: mirror?.plan === `starter` ? `starter` : `free`, subscriptionStatus: mirror?.subscriptionStatus ?? null, accessUntil: mirror?.accessUntil?.toMillis?.() ?? null });
      const usage = usageSnapshot.data();
      let tracked: Set<string>;
      let beforeRecords: Map<string, DocumentData>;
      if (!usageSnapshot.exists) {
        const documents = await transaction.get(account.collection(`domains`).limit(10_001));
        if (documents.size > 10_000) throw new BillingError(409, `portfolio_too_large`, `Portfolio Exceeds The Supported Commit Window — Contact Support`);
        if (documents.docs.some(document => document.data().id !== document.id || document.data().uid !== actor.id
          || document.data().number !== getAppCollectionIDNumber(document.id, `Domain`))) throw invalid();
        beforeRecords = new Map(documents.docs.map(document => [document.id, document.data()]));
        tracked = new Set(beforeRecords.keys());
      } else {
        if (!Array.isArray(previous?.ids) || !Number.isSafeInteger(usage?.count) || usage?.count !== previous.ids.length
          || usage.revision !== revision || usage.idsHash !== idsHash(previous.ids)) throw new BillingError(409, `portfolio_changed`, `Portfolio Usage Needs Reconciliation — Contact Support`);
        tracked = new Set(previous.ids);
        const references = changes.map((change: { id: string }) => account.collection(`domains`).doc(change.id));
        const documents = references.length ? await transaction.getAll(...references) : [];
        if (documents.some(document => document.exists !== tracked.has(document.id))) throw new BillingError(409, `portfolio_changed`, `Portfolio Records Need Reconciliation — Contact Support`);
        beforeRecords = new Map(documents.filter(document => document.exists).map(document => [document.id, document.data()!]));
      }
      let added = 0;
      const pendingNames = new Set<string>();
      const nameChecks = changes.filter((change): change is { id: string; record: DocumentData } => !!change.record
        && change.record.name !== beforeRecords.get(change.id)?.name);
      const duplicates = await Promise.all(nameChecks.map(change => transaction.get(account.collection(`domains`).where(`name`, `==`, change.record.name).limit(2))));
      for (const [index, matches] of duplicates.entries()) {
        const change = nameChecks[index];
        if (pendingNames.has(change.record.name)) throw invalid();
        pendingNames.add(change.record.name);
        const collision = matches.docs.some(document => {
          if (document.id === change.id) return false;
          const replacement = changes.find((value: { id: string }) => value.id === document.id);
          return !replacement || replacement.record?.name === change.record.name;
        });
        if (collision) throw new BillingError(409, `duplicate_domain`, `${change.record.name} Is Already In Your Portfolio`);
      }
      for (const change of changes) {
        const before = beforeRecords.get(change.id);
        if (change.record) {
          if (before && (before.number !== change.record.number || before.created !== change.record.created || before.uid !== change.record.uid)) throw invalid();
          if (!tracked.has(change.id)) added += 1;
          if (!paid && !same(before?.meta?.websiteInsights, change.record.meta && typeof change.record.meta === `object` && !Array.isArray(change.record.meta) ? change.record.meta.websiteInsights : undefined)) throw new BillingError(403, `starter_required`, `Choose Starter To Save Website Insights`);
          tracked.add(change.id);
        } else tracked.delete(change.id);
      }
      const limit = paid ? 333 : 33;
      if (!owner && added && tracked.size > limit) throw new BillingError(403, `domain_limit`, `${paid ? `Starter` : `Free`} Includes Up To ${limit} Domains — Remove Domain(s) Or Upgrade Before Adding More`);
      if (tracked.size !== input.ids.length || input.ids.some((id: string) => !tracked.has(id))) throw new BillingError(409, `portfolio_changed`, `Saved Portfolio Records Changed — Refresh And Try Again`);
      const numbers = new Set<number>();
      for (const id of tracked) {
        const number = getAppCollectionIDNumber(id, `Domain`);
        if (!number || number >= input.snapshot.nextNumber || numbers.has(number)) throw invalid();
        numbers.add(number);
      }
      for (const change of changes) {
        const reference = account.collection(`domains`).doc(change.id);
        const projection = database.doc(`publicProfiles/${actor.id}/domains/${change.id}`);
        if (!change.record) { transaction.delete(reference); transaction.delete(projection); }
        else {
          transaction.set(reference, change.record);
          const publicRecord = projectPublicDomain(change.record, actor.id);
          if (publicRecord) transaction.set(projection, publicRecord);
          else transaction.delete(projection);
        }
      }
      transaction.set(snapshot, { snapshot: input.snapshot, ids: input.ids, revision: revision + 1, ...(timestampInput.length ? { recordTimestamps: timestampInput } : {}) });
      transaction.set(usageRef, { version: 1, count: tracked.size, revision: revision + 1, idsHash: idsHash(input.ids) });
      return { revision: revision + 1, domainCount: tracked.size };
    });
    return Response.json(result, { headers });
  } catch (failure) {
    const error = failure instanceof BillingError ? failure : new BillingError(503, `portfolio_unavailable`, `Portfolio Could Not Be Saved — Try Again`);
    return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
  }
};
