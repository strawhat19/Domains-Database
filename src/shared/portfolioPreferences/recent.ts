import { getRandomArrayValues } from '../common/values';

interface PortfolioRecentItem {
  id: string;
  number?: number;
  created?: string;
  createdAt?: string;
}

const getCreatedTimestamp = (item: PortfolioRecentItem) => {
  const timestamp = Date.parse(item.createdAt ?? item.created ?? ``);
  if (Number.isFinite(timestamp)) return timestamp;
  const legacyTimestamp = /^group-([a-z0-9]+)-/i.exec(item.id)?.[1];
  const legacyTime = legacyTimestamp ? Number.parseInt(legacyTimestamp, 36) : 0;
  return Number.isFinite(legacyTime) ? legacyTime : 0;
};
const uniqueItems = <T extends PortfolioRecentItem>(items: readonly T[]) => [...new Map(items.map(item => [item.id, item])).values()];

export const getRecentPortfolioItems = <T extends PortfolioRecentItem>(items: readonly T[], limit: number) => uniqueItems(items)
  .sort((first, second) => {
    const firstValue = Number(first.number);
    const secondValue = Number(second.number);
    const firstNumber = Number.isSafeInteger(firstValue) && firstValue > 0 ? firstValue : 0;
    const secondNumber = Number.isSafeInteger(secondValue) && secondValue > 0 ? secondValue : 0;
    return secondNumber - firstNumber || getCreatedTimestamp(second) - getCreatedTimestamp(first);
  }).slice(0, Math.max(0, Math.floor(limit)));

export const getPortfolioSuggestions = <T extends PortfolioRecentItem>(items: readonly T[], limit = 4) => {
  const count = Math.max(0, Math.floor(limit));
  const candidates = uniqueItems(items);
  const recent = getRecentPortfolioItems(candidates, Math.min(2, count));
  const recentIds = new Set(recent.map(item => item.id));
  return [...recent, ...getRandomArrayValues(candidates.filter(item => !recentIds.has(item.id)), count - recent.length)];
};
