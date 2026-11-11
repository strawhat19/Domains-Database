import { createHash } from 'node:crypto';
import { BillingError } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
import type { PublicProfilePortfolio } from '../../shared/publicDirectory/profilePortfolio';

export const maximumPortfolioRecords = 10_000;
export const publicProfileDomainCollection = (account: DocumentReference) => account.collection(`profileDomains`);

export const readPortfolioProfileCount = (value: unknown, total: unknown) => {
  if (typeof value !== `number` || typeof total !== `number` || !Number.isSafeInteger(value) || !Number.isSafeInteger(total)
    || value < 0 || value > total || total > maximumPortfolioRecords) return null;
  return value;
};

export const countLegacyPortfolioDomains = async (transaction: Transaction, account: DocumentReference) => {
  const records = await transaction.get(account.collection(`domains`).select(`isSample`).limit(maximumPortfolioRecords + 1));
  if (records.size > maximumPortfolioRecords) throw new BillingError(409, `portfolio_too_large`, `Portfolio Exceeds The Supported Read Window`);
  const nonSample = records.docs.reduce((count, record) => count + Number(record.get(`isSample`) !== true), 0);
  return { nonSample, total: records.size };
};

export const getPublicProfilePortfolio = async (id: string): Promise<PublicProfilePortfolio | null> => {
  const database = getBillingDatabase();
  const account = database.doc(`users/${id}`);
  const usageRef = database.doc(`portfolioUsage/${id}`);
  const portfolioRef = account.collection(`snapshots`).doc(`portfolio`);
  return database.runTransaction(async transaction => {
    const [saved, usageSnapshot, portfolioSnapshot] = await transaction.getAll(account, usageRef, portfolioRef, {
      fieldMask: [`id`, `active`, `profilePrivacy`, `count`, `revision`, `publicProfileDomainCount`],
    });
    const user = saved.data();
    if (user?.id !== id || user.active !== true || user.profilePrivacy !== `public`) return null;
    const usage = usageSnapshot.data();
    const totalDomains = usage?.revision === portfolioSnapshot.get(`revision`)
      ? readPortfolioProfileCount(usage?.publicProfileDomainCount, usage?.count)
      : null;
    if (totalDomains === null) return { domains: [], totalDomains: (await countLegacyPortfolioDomains(transaction, account)).nonSample };
    if (totalDomains === 0) return { domains: [], totalDomains };
    const shared = await transaction.get(publicProfileDomainCollection(account).select(`name`).limit(totalDomains + 1));
    if (shared.size > totalDomains) throw new BillingError(503, `portfolio_unavailable`, `Public Portfolio Could Not Be Loaded`);
    if (shared.empty) return { domains: [], totalDomains };
    const names = new Map(shared.docs.map(record => [record.id, record.get(`name`)]));
    const sources = await transaction.getAll(...shared.docs.map(record => account.collection(`domains`).doc(record.id)), {
      fieldMask: [`id`, `uid`, `name`, `isSample`, `meta.showOnPublicProfile`],
    });
    const domains = sources.flatMap(record => {
      const name = names.get(record.id);
      if (typeof name !== `string` || !name || name.length > 253 || record.get(`name`) !== name || record.get(`id`) !== record.id
        || record.get(`uid`) !== id || record.get(`isSample`) === true || record.get(`meta.showOnPublicProfile`) !== true) return [];
      return [{ name, id: createHash(`sha256`).update(record.id).digest(`hex`) }];
    }).sort((left, right) => left.name.localeCompare(right.name));
    return { domains, totalDomains };
  }, { readOnly: true });
};
