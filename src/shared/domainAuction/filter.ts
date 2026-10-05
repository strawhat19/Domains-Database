import type { AuctionRecord, AuctionFilters } from './types';

const numberFilter = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : null;
const splitWords = (value: string) => value.toLowerCase().split(/[,\s]+/).map(word => word.trim()).filter(Boolean);
const sortNumber = (first: number | null, second: number | null, descending = false) => {
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  return descending ? second - first : first - second;
};

export const filterAuctionRecords = (records: AuctionRecord[], filters: AuctionFilters, now = Date.now()) => {
  const query = filters.query.trim().toLowerCase();
  const keyword = filters.keyword.trim().toLowerCase();
  const excluded = splitWords(filters.excludes);
  const extensions = splitWords(filters.extensions).map(value => value.replace(/^\./, ``));
  const minAge = numberFilter(filters.minAge);
  const minBids = numberFilter(filters.minBids);
  const minPrice = numberFilter(filters.minPrice);
  const maxPrice = numberFilter(filters.maxPrice);
  const minLength = numberFilter(filters.minLength);
  const maxLength = numberFilter(filters.maxLength);
  const hours = filters.endsWithin === `all` ? null : Number(filters.endsWithin);
  const matching = records.filter(record => {
    const domain = record.domain.toLowerCase();
    const name = domain.split(`.`)[0] ?? domain;
    const extension = domain.slice(domain.indexOf(`.`) + 1);
    if (query && !(filters.match === `starts` ? name.startsWith(query)
      : filters.match === `ends` ? name.endsWith(query)
        : filters.match === `exact` ? name === query || domain === query : domain.includes(query))) return false;
    if (keyword && !name.includes(keyword)) return false;
    if (excluded.some(word => name.includes(word))) return false;
    if (extensions.length && !extensions.includes(extension)) return false;
    if (filters.type !== `all` && record.type !== filters.type) return false;
    if (filters.source !== `all` && record.source !== filters.source) return false;
    if (filters.noDigits && /\d/.test(name)) return false;
    if (filters.noHyphens && name.includes(`-`)) return false;
    if (minLength !== null && name.length < minLength) return false;
    if (maxLength !== null && name.length > maxLength) return false;
    if (minAge !== null && (record.ageYears === null || record.ageYears < minAge)) return false;
    if (minBids !== null && (record.bids === null || record.bids < minBids)) return false;
    if (minPrice !== null && (record.priceUsd === null || record.priceUsd < minPrice)) return false;
    if (maxPrice !== null && (record.priceUsd === null || record.priceUsd > maxPrice)) return false;
    if (hours !== null) {
      const end = record.endsAt ? Date.parse(record.endsAt) : NaN;
      if (!Number.isFinite(end) || end < now || end > now + hours * 3_600_000) return false;
    }
    return true;
  });

  return matching.sort((first, second) => {
    const ending = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
    const order = filters.sort === `price-low` ? sortNumber(first.priceUsd, second.priceUsd)
      : filters.sort === `price-high` ? sortNumber(first.priceUsd, second.priceUsd, true)
        : filters.sort === `bids` ? sortNumber(first.bids, second.bids, true)
          : filters.sort === `age` ? sortNumber(first.ageYears, second.ageYears, true)
            : filters.sort === `name` ? first.domain.localeCompare(second.domain)
              : sortNumber(ending(first.endsAt), ending(second.endsAt));
    return order || first.domain.localeCompare(second.domain);
  });
};

export const getAuctionFilterCount = (filters: AuctionFilters) => [
  filters.query, filters.keyword, filters.excludes, filters.extensions,
  filters.minAge, filters.minBids, filters.minPrice, filters.maxPrice,
  filters.minLength, filters.maxLength, filters.noDigits, filters.noHyphens,
  filters.type !== `all`, filters.source !== `all`, filters.endsWithin !== `all`,
].filter(Boolean).length;
