import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../shared/seo';
import { redditCommunities, youtubeChannels, type BlogFeeds, type FeedItem } from '../shared/blog/resources';

const invalid = () => new Error(`Blog Feeds Returned An Invalid Response`);
const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

const readItems = (value: unknown, provider: `reddit` | `youtube`): FeedItem[] => {
  if (!Array.isArray(value) || value.length > 6) throw invalid();
  const ids = new Set<string>();
  const sources = provider === `reddit` ? redditCommunities : youtubeChannels;
  return value.map(item => {
    const entry = record(item);
    const source = sources.find(source => source.id === entry?.sourceId);
    if (!entry || !source || entry.sourceName !== source.label || typeof entry.url !== `string`
      || typeof entry.title !== `string` || !entry.title.trim() || entry.title.length > 240
      || typeof entry.publishedAt !== `string` || !Number.isFinite(Date.parse(entry.publishedAt))) throw invalid();
    let url: URL;
    try { url = new URL(entry.url); } catch { throw invalid(); }
    if (url.protocol !== `https:` || url.port || url.username || url.password || url.hash) throw invalid();
    const post = url.pathname.match(/^\/r\/([a-z0-9_]+)\/comments\/([a-z0-9]+)\/$/i);
    const videoId = url.searchParams.get(`v`);
    const externalId = provider === `reddit` ? post?.[2] : videoId;
    if (provider === `reddit` ? url.hostname !== `www.reddit.com` || url.search || post?.[1]?.toLowerCase() !== source.id
      : url.hostname !== `www.youtube.com` || url.pathname !== `/watch` || !videoId || !/^[\w-]{11}$/.test(videoId)
        || [...url.searchParams.keys()].length !== 1) throw invalid();
    if (typeof entry.id !== `string` || entry.id !== `${provider}:${source.id}:${externalId}` || ids.has(entry.id)) throw invalid();
    ids.add(entry.id);
    if (entry.summary !== undefined && (typeof entry.summary !== `string` || entry.summary.length > 280)) throw invalid();
    if (entry.thumbnail !== undefined) {
      if (provider !== `youtube` || typeof entry.thumbnail !== `string`) throw invalid();
      let thumbnail: URL;
      try { thumbnail = new URL(entry.thumbnail); } catch { throw invalid(); }
      if (thumbnail.protocol !== `https:` || thumbnail.port || thumbnail.username || thumbnail.password || thumbnail.hash
        || thumbnail.search || !/^i[1-4]?\.ytimg\.com$/.test(thumbnail.hostname)
        || thumbnail.pathname !== `/vi/${videoId}/hqdefault.jpg`) throw invalid();
    }
    return {
      id: entry.id,
      url: url.href,
      title: entry.title,
      sourceId: source.id,
      sourceName: source.label,
      publishedAt: entry.publishedAt,
      ...(typeof entry.summary === `string` ? { summary: entry.summary } : {}),
      ...(typeof entry.thumbnail === `string` ? { thumbnail: entry.thumbnail } : {}),
    };
  });
};

const getFeeds = async (signal?: AbortSignal): Promise<BlogFeeds> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 12_000);
  try {
    const response = await fetch(Platform.OS === `web` ? `/api/blog-feeds` : absoluteSiteUrl(`/api/blog-feeds`), {
      method: `GET`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/json` },
    });
    const input: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`Blog Feeds Are Temporarily Unavailable`);
    const result = record(input);
    if (!result || typeof result.updatedAt !== `string` || !Number.isFinite(Date.parse(result.updatedAt))
      || !Array.isArray(result.warnings) || result.warnings.length > 4
      || result.warnings.some(warning => typeof warning !== `string` || !warning.trim() || warning.length > 200)) throw invalid();
    if (controller.signal.aborted) throw new Error(`Blog Feed Request Cancelled`);
    return {
      warnings: result.warnings,
      updatedAt: result.updatedAt,
      reddit: readItems(result.reddit, `reddit`),
      youtube: readItems(result.youtube, `youtube`),
    };
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(signal?.aborted ? `Blog Feed Request Cancelled` : `Blog Feeds Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Blog Feeds`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
  }
};

export const blogFeedsAPI = { getFeeds };
