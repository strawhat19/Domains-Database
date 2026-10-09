import { XMLParser } from 'fast-xml-parser';
import { SyntaxValidator } from 'fast-xml-validator';
import { redditCommunities, youtubeChannels, type BlogFeeds, type FeedItem, type YouTubeChannel } from '../../shared/blog/resources';

const CACHE_DURATION = 15 * 60_000;
const MAX_FEED_BYTES = 512 * 1024;
const REDDIT_FEED_URL = `https://www.reddit.com/r/Domains+webdev+webhosting/.rss`;
const headers = {
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `public, max-age=60, s-maxage=60`,
};
const entities: Record<string, string> = { lt: `<`, gt: `>`, amp: `&`, apos: `'`, quot: `"`, nbsp: ` ` };
let cached: { value: BlogFeeds; expiresAt: number } | undefined;
let pending: Promise<BlogFeeds> | undefined;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : value === undefined ? [] : [value];
const nodeText = (value: unknown) => {
  const text = typeof value === `string` ? value : record(value)?.[`#text`];
  return typeof text === `string` ? text : ``;
};

const decodeEntities = (value: string) => value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
  if (!entity.startsWith(`#`)) return Object.hasOwn(entities, entity.toLowerCase()) ? entities[entity.toLowerCase()] : match;
  const point = entity[1]?.toLowerCase() === `x` ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
  return Number.isInteger(point) && point > 0 && point <= 0x10ffff && (point < 0xd800 || point > 0xdfff) ? String.fromCodePoint(point) : ` `;
});

const plainText = (value: unknown, maximum: number) => {
  let text = nodeText(value).slice(0, 8_192);
  for (let index = 0; index < 2; index++) text = decodeEntities(text)
    .replace(/<(script|style)\b[^<>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ` `).replace(/<[^<>]*>/g, ` `);
  return text.replace(/[\p{Cc}\p{Cf}]/gu, ` `).replace(/\s+/g, ` `).trim().slice(0, maximum);
};

const publishedAt = (entry: Record<string, unknown>) => {
  const date = Date.parse(nodeText(entry.published) || nodeText(entry.updated));
  return Number.isFinite(date) ? new Date(date).toISOString() : undefined;
};

const readFeedText = async (response: Response, signal: AbortSignal) => {
  const length = response.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_FEED_BYTES)) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(`Feed Size Limit`);
  }
  if (!response.body) throw new Error(`Feed Is Empty`);
  let size = 0;
  let text = ``;
  let complete = false;
  const reader = response.body.getReader();
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  try {
    while (true) {
      if (signal.aborted) throw new Error(`Feed Request Timed Out`);
      const chunk = await reader.read();
      if (signal.aborted) throw new Error(`Feed Request Timed Out`);
      if (chunk.done) {
        text += decoder.decode();
        complete = true;
        return text;
      }
      size += chunk.value.byteLength;
      if (size > MAX_FEED_BYTES) throw new Error(`Feed Size Limit`);
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    if (!complete) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

const fetchEntries = async (url: string): Promise<Record<string, unknown>[]> => {
  const allowed = url === REDDIT_FEED_URL || youtubeChannels.some(channel => url === `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`);
  if (!allowed) throw new Error(`Feed Source Is Unavailable`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(url, {
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/atom+xml, application/rss+xml, application/xml, text/xml` },
    });
    if (!response.ok || !/^(?:application\/(?:atom\+xml|rss\+xml|xml)|text\/xml)\b/i.test(response.headers.get(`content-type`) ?? ``)) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error(`Feed Source Is Unavailable`);
    }
    const text = await readFeedText(response, controller.signal);
    if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text) || SyntaxValidator.validate(text) !== true) throw new Error(`Feed Format Is Invalid`);
    const parser = new XMLParser({ maxNestedTags: 20, processEntities: false, ignoreAttributes: false, parseTagValue: false, attributeNamePrefix: ``, parseAttributeValue: false });
    const feed = record(record(parser.parse(text) as unknown)?.feed);
    if (!feed || !nodeText(feed.title)) throw new Error(`Feed Format Is Invalid`);
    const entries = array(feed.entry).slice(0, 60).map(record);
    if (entries.some(entry => !entry)) throw new Error(`Feed Format Is Invalid`);
    return entries.filter((entry): entry is Record<string, unknown> => !!entry);
  } finally { clearTimeout(timeout); }
};

const redditItems = (entries: Record<string, unknown>[]): FeedItem[] => entries.flatMap(entry => {
  const link = array(entry.link).map(record).find(link => !!link && (link.rel === undefined || link.rel === `alternate`))?.href;
  if (typeof link !== `string`) return [];
  let url: URL;
  try { url = new URL(decodeEntities(link)); } catch { return []; }
  if (![`https:`, `http:`].includes(url.protocol) || ![`www.reddit.com`, `reddit.com`].includes(url.hostname) || url.username || url.password || url.port) return [];
  const post = url.pathname.match(/^\/r\/([a-z0-9_]+)\/comments\/([a-z0-9]+)(?:\/[^/]+)?\/?$/i);
  const source = redditCommunities.find(source => source.id === post?.[1]?.toLowerCase());
  const title = plainText(entry.title, 240);
  const date = publishedAt(entry);
  if (!source || !post?.[2] || !title || !date) return [];
  const summary = plainText(entry.content, 280);
  return [{
    title,
    sourceId: source.id,
    publishedAt: date,
    sourceName: source.label,
    id: `reddit:${source.id}:${post[2]}`,
    ...(summary ? { summary } : {}),
    url: `https://www.reddit.com/r/${source.id}/comments/${post[2]}/`,
  }];
});

const youtubeItems = (entries: Record<string, unknown>[], source: YouTubeChannel): FeedItem[] => entries.flatMap(entry => {
  const videoId = nodeText(entry[`yt:videoId`]);
  const title = plainText(entry.title, 240);
  const date = publishedAt(entry);
  if (!/^[\w-]{11}$/.test(videoId) || nodeText(entry[`yt:channelId`]) !== source.channelId || !title || !date) return [];
  const group = record(entry[`media:group`]);
  const summary = plainText(group?.[`media:description`], 280);
  const image = record(array(group?.[`media:thumbnail`])?.[0])?.url;
  let thumbnail: string | undefined;
  if (typeof image === `string`) {
    try {
      const url = new URL(image);
      if (url.protocol === `https:` && /^i[1-4]?\.ytimg\.com$/.test(url.hostname) && !url.port && !url.username && !url.password
        && !url.search && !url.hash && url.pathname === `/vi/${videoId}/hqdefault.jpg`) thumbnail = url.href;
    } catch {}
  }
  return [{
    title,
    publishedAt: date,
    sourceId: source.id,
    sourceName: source.label,
    id: `youtube:${source.id}:${videoId}`,
    ...(summary ? { summary } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    url: `https://www.youtube.com/watch?v=${videoId}`,
  }];
});

const newest = (items: FeedItem[]) => [...new Map(items.map(item => [item.id, item])).values()]
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).slice(0, 6);

const usableItems = (entries: Record<string, unknown>[], items: FeedItem[]) => {
  if (entries.length && !items.length) throw new Error(`Feed Entries Are Unavailable`);
  return newest(items);
};

const loadFeeds = async (): Promise<BlogFeeds> => {
  const results = await Promise.allSettled([
    fetchEntries(REDDIT_FEED_URL).then(entries => usableItems(entries, redditItems(entries))),
    ...youtubeChannels.map(channel => fetchEntries(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`)
      .then(entries => usableItems(entries, youtubeItems(entries, channel)))),
  ]);
  const warnings = results.flatMap((result, index) => result.status === `rejected`
    ? [index === 0 ? `Reddit Discussions Are Temporarily Unavailable` : `${youtubeChannels[index - 1]?.label ?? `YouTube`} Videos Are Temporarily Unavailable`] : []);
  const reddit = results[0]?.status === `fulfilled` ? newest(results[0].value) : [];
  const channels = results.slice(1).flatMap(result => result.status === `fulfilled` ? [result.value] : []);
  const firstVideos = channels.flatMap(items => items.slice(0, 2));
  const moreVideos = channels.flatMap(items => items.slice(2));
  const value = { reddit, warnings, youtube: newest([...firstVideos, ...moreVideos].slice(0, 6)), updatedAt: new Date().toISOString() };
  cached = { value, expiresAt: Date.now() + CACHE_DURATION };
  return value;
};

const getFeeds = () => {
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  if (!pending) pending = loadFeeds().finally(() => { pending = undefined; });
  return pending;
};

export const handleBlogFeeds = async (_request: Request): Promise<Response> => {
  try { return Response.json(await getFeeds(), { headers }); }
  catch { return Response.json({ error: `Blog Feeds Are Temporarily Unavailable` }, { status: 502, headers: { ...headers, 'Cache-Control': `no-store` } }); }
};
