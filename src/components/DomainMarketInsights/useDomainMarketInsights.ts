import { Linking } from 'react-native';
import { useId, useRef, useState, useEffect } from 'react';
import { domainMarketAPI } from '../../api/domainMarket';
import type { DomainRatingResult, SearchInterestInput, SearchInterestResult } from '../../shared/domainMarket/types';
import { MARKET_RANGE, MARKET_COUNTRIES, defaultMarketKeyword, normalizeMarketKeyword } from '../../shared/domainMarket/values';

export interface DomainMarketInsightsProps {
  domain: string;
  suffix?: string;
}

interface Lookup<T> {
  key: string;
  error: string;
  loading: boolean;
  result: T | null;
  notice: T | null;
}

const lookup = <T,>(key: string, result: T | null): Lookup<T> => ({ key, result, error: ``, notice: null, loading: false });
const peekRating = (domain: string) => {
  try { return domainMarketAPI.peekDomainRating(domain); }
  catch { return null; }
};
const peekSearch = (input: SearchInterestInput) => {
  try { return domainMarketAPI.peekSearchInterest(input); }
  catch { return null; }
};
const initialKeyword = (domain: string) => {
  try { return defaultMarketKeyword(domain); }
  catch { return ``; }
};
export const formatMarketPointDate = (timestamp?: number) => timestamp ? new Date(timestamp * 1_000).toLocaleDateString(undefined, { timeZone: `UTC` }) : `Unknown`;

export const formatMarketDate = (value?: string) => {
  if (!value) return `Unknown`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? `Unknown` : date.toLocaleDateString();
};

export const marketNotice = (result: DomainRatingResult | SearchInterestResult | null) => {
  if (!result || result.status === `ready`) return ``;
  if (result.status === `quota`) return `The free lookup limit has been reached. Try again after it resets.`;
  if (result.status === `unconfigured`) return `A free provider connection is required. Setup may be missing, or the configured account may not qualify.`;
  if (result.status === `insufficient`) return `There is not enough data for this lookup. Low interest does not mean zero searches.`;
  return result.message || `This provider is temporarily unavailable. Try again later.`;
};

export const useDomainMarketInsights = (domain: string, suffix?: string) => {
  const instance = useId().replace(/[^a-z0-9_-]/gi, `-`);
  const domainKey = domain.trim().toLowerCase();
  const ratingRequest = useRef<AbortController | null>(null);
  const searchRequest = useRef<AbortController | null>(null);
  const [linkError, setLinkError] = useState(``);
  const [query, setQuery] = useState({ domain: domainKey, country: ``, keyword: initialKeyword(domainKey) });
  const current = query.domain === domainKey ? query : { ...query, domain: domainKey, keyword: initialKeyword(domainKey) };
  const keyword = current.keyword.trim().replace(/\s+/g, ` `);
  const country = current.country;
  const input = { domain: domainKey, keyword, country };
  const searchKey = JSON.stringify([domainKey, keyword, country]);
  const [ratingState, setRatingState] = useState(() => lookup(domainKey, peekRating(domainKey)));
  const [searchState, setSearchState] = useState(() => lookup(searchKey, peekSearch(input)));
  let keywordError = ``;
  try { normalizeMarketKeyword(keyword); }
  catch (caught) { keywordError = caught instanceof Error ? caught.message : `Enter A Search Phrase`; }

  useEffect(() => {
    ratingRequest.current?.abort();
    setRatingState(lookup(domainKey, peekRating(domainKey)));
    return () => ratingRequest.current?.abort();
  }, [domainKey]);

  useEffect(() => {
    searchRequest.current?.abort();
    setLinkError(``);
    setSearchState(lookup(searchKey, peekSearch({ domain: domainKey, keyword, country })));
    return () => searchRequest.current?.abort();
  }, [domainKey, searchKey, keyword, country]);

  const loadRating = async () => {
    ratingRequest.current?.abort();
    const controller = new AbortController();
    ratingRequest.current = controller;
    setRatingState(previous => ({ ...(previous.key === domainKey ? previous : lookup<DomainRatingResult>(domainKey, null)), error: ``, notice: null, loading: true }));
    try {
      const result = await domainMarketAPI.getDomainRating(domainKey, controller.signal);
      if (!controller.signal.aborted) setRatingState(previous => ({ ...previous, loading: false, ...(result.status === `ready` ? { result, notice: null } : { notice: result }) }));
    } catch (caught) {
      if (!controller.signal.aborted) setRatingState(previous => ({ ...previous, loading: false, error: caught instanceof Error ? caught.message : `Unable To Load Domain Rating` }));
    }
  };

  const loadSearch = async () => {
    if (keywordError) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearchState(previous => ({ ...(previous.key === searchKey ? previous : lookup<SearchInterestResult>(searchKey, null)), error: ``, notice: null, loading: true }));
    try {
      const result = await domainMarketAPI.getSearchInterest(input, controller.signal);
      if (!controller.signal.aborted) setSearchState(previous => ({ ...previous, loading: false, ...(result.status === `ready` ? { result, notice: null } : { notice: result }) }));
    } catch (caught) {
      if (!controller.signal.aborted) setSearchState(previous => ({ ...previous, loading: false, error: caught instanceof Error ? caught.message : `Unable To Load Search Interest` }));
    }
  };

  const rating = ratingState.key === domainKey ? ratingState : lookup<DomainRatingResult>(domainKey, null);
  const search = searchState.key === searchKey ? searchState : lookup<SearchInterestResult>(searchKey, null);
  const points = search.result?.status === `ready` ? [...search.result.points].sort((a, b) => a.timestamp - b.timestamp) : [];
  const hasChart = points.length > 1 && points.some(point => point.value > 0);
  const first = points[0];
  const latest = points[points.length - 1];
  const countryLabel = MARKET_COUNTRIES.find(item => item.value === country)?.label || `Worldwide`;
  const trendsUrl = `https://trends.google.com/trends/explore?date=${encodeURIComponent(MARKET_RANGE)}&q=${encodeURIComponent(keyword)}${country ? `&geo=${encodeURIComponent(country)}` : ``}`;
  const timeSpan = (latest?.timestamp || 0) - (first?.timestamp || 0);
  const chartPath = hasChart ? points.map((point, index) => `${index ? `L` : `M`}${(12 + (point.timestamp - (first?.timestamp || 0)) * 336 / Math.max(1, timeSpan)).toFixed(1)},${(100 - point.value * .84).toFixed(1)}`).join(` `) : ``;
  const firstDate = formatMarketPointDate(first?.timestamp);
  const latestDate = formatMarketPointDate(latest?.timestamp);
  const chartSummary = hasChart ? `Search interest for ${keyword}, ${countryLabel}, from ${firstDate} to ${latestDate}. Latest interest ${latest?.value} of 100; lowest ${Math.min(...points.map(point => point.value))}, highest ${Math.max(...points.map(point => point.value))}. Scores show relative interest, not visits or monthly search counts.` : ``;

  const openLink = async (url: string) => {
    setLinkError(``);
    try { await Linking.openURL(url); }
    catch { setLinkError(`Unable To Open Research Link`); }
  };

  return {
    first,
    points,
    latest,
    rating,
    search,
    keyword,
    country,
    hasChart,
    firstDate,
    linkError,
    chartPath,
    trendsUrl,
    latestDate,
    keywordError,
    loadRating,
    loadSearch,
    openLink,
    countryLabel,
    chartSummary,
    keywordValue: current.keyword,
    ratingNotice: marketNotice(rating.notice || rating.result),
    searchNotice: marketNotice(search.notice || search.result) || (search.result?.status === `ready` && !hasChart ? `There is not enough data to draw a search interest chart. Low interest does not mean zero searches.` : ``),
    scope: `domain-market-${domainKey.replace(/[^a-z0-9_-]/gi, `-`)}-${(suffix || `insights`).replace(/[^a-z0-9_-]/gi, `-`)}-${instance}`,
    setKeyword: (value: string) => setQuery({ ...current, keyword: value }),
    setCountry: (value: string) => setQuery({ ...current, country: value }),
  };
};
