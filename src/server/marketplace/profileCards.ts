import { Roles } from '../../types/types';
import { getBillingDatabase } from '../billing/firebase';
import { maximumPortfolioRecords, readPortfolioProfileCount } from '../portfolio/publicProfile';
import type { PublicProfileCardMetadata } from '../../shared/publicDirectory/profilePortfolio';

const roles = Object.values(Roles);
const legacyDomainReadBudget = 2_000;

export const getPublicProfileCardMetadata = async (ids: string[]): Promise<PublicProfileCardMetadata[]> => {
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    const accounts = await transaction.getAll(...ids.map(id => database.doc(`users/${id}`)), {
      fieldMask: [`id`, `active`, `profilePrivacy`, `role`],
    });
    const publicAccounts = accounts.filter(account => account.get(`id`) === account.id && account.get(`active`) === true && account.get(`profilePrivacy`) === `public`);
    if (!publicAccounts.length) return [];

    const portfolioRefs = publicAccounts.map(account => account.ref.collection(`snapshots`).doc(`portfolio`));
    const usageRefs = publicAccounts.map(account => database.doc(`portfolioUsage/${account.id}`));
    const snapshots = await transaction.getAll(...portfolioRefs, ...usageRefs, {
      fieldMask: [`count`, `revision`, `publicProfileDomainCount`],
    });
    const byPath = new Map(snapshots.map(snapshot => [snapshot.ref.path, snapshot]));
    const entries = publicAccounts.map((account, index) => {
      const revision = byPath.get(portfolioRefs[index].path)?.get(`revision`);
      const usage = byPath.get(usageRefs[index].path)?.data();
      const usageCount = usage?.count;
      const currentUsage = Number.isSafeInteger(revision) && revision > 0 && usage?.revision === revision;
      const recordedTotal = currentUsage ? readPortfolioProfileCount(usageCount, usageCount) : null;
      const totalDomains = recordedTotal === 0 ? 0 : readPortfolioProfileCount(usage?.publicProfileDomainCount, recordedTotal);
      const savedRole = account.get(`role`);
      const role = roles.find(role => role === savedRole) ?? null;
      const card: PublicProfileCardMetadata = { id: account.id, role, totalDomains };
      return { account, recordedTotal, card };
    });
    const legacy = entries.filter(({ card }) => card.totalDomains === null)
      .sort((left, right) => (left.recordedTotal ?? maximumPortfolioRecords + 1) - (right.recordedTotal ?? maximumPortfolioRecords + 1));
    let remainingLegacyReads = legacyDomainReadBudget;
    for (const { account, recordedTotal, card } of legacy) {
      if (remainingLegacyReads === 0) break;
      const readLimit = recordedTotal === null ? remainingLegacyReads : recordedTotal + 1;
      if (readLimit > remainingLegacyReads) continue;
      const records = await transaction.get(account.ref.collection(`domains`).select(`isSample`).limit(readLimit));
      remainingLegacyReads -= Math.max(1, records.size);
      if (records.size < readLimit && (recordedTotal === null || records.size === recordedTotal)) {
        card.totalDomains = records.docs.reduce((count, record) => count + Number(record.get(`isSample`) !== true), 0);
      }
    }
    return entries.map(({ card }) => card);
  }, { readOnly: true });
};
