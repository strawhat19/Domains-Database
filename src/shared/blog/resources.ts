export interface BlogResource {
  id: string;
  url: string;
  label: string;
  description: string;
}

export interface YouTubeChannel extends BlogResource {
  channelId: string;
}

export interface FeedItem {
  id: string;
  url: string;
  title: string;
  sourceId: string;
  summary?: string;
  thumbnail?: string;
  sourceName: string;
  publishedAt: string;
}

export interface BlogFeeds {
  reddit: FeedItem[];
  youtube: FeedItem[];
  updatedAt: string;
  warnings: string[];
}

export const redditCommunities: readonly BlogResource[] = [
  {
    id: `domains`,
    label: `r/Domains`,
    url: `https://www.reddit.com/r/Domains/`,
    description: `Domain names, registrar questions, and portfolio discussions`,
  },
  {
    id: `webdev`,
    label: `r/webdev`,
    url: `https://www.reddit.com/r/webdev/`,
    description: `Website development, launches, and practical web questions`,
  },
  {
    id: `webhosting`,
    label: `r/webhosting`,
    url: `https://www.reddit.com/r/webhosting/`,
    description: `Hosting, DNS, and website infrastructure discussions`,
  },
];

export const youtubeChannels: readonly YouTubeChannel[] = [
  {
    id: `icann`,
    label: `ICANN`,
    channelId: `UCl7rV9qJaQEx3GKhtSLx4QA`,
    url: `https://www.youtube.com/@ICANNnews`,
    description: `Internet naming, DNS policy, and domain industry updates`,
  },
  {
    id: `namecheap`,
    label: `Namecheap`,
    channelId: `UCzVlyc5Ts9tL3qyUKqccaeA`,
    url: `https://www.youtube.com/@namecheap`,
    description: `Domain setup, website hosting, and online business tutorials`,
  },
  {
    id: `google-search-central`,
    label: `Google Search Central`,
    channelId: `UCWf2ZlNsCGDS89VBF_awNvA`,
    url: `https://www.youtube.com/@GoogleSearchCentral`,
    description: `Website indexing, SEO, and Google Search guidance`,
  },
];
