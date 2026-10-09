import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import { useBlogResources, formatFeedDate } from './useBlogResources';
import type { FeedItem, BlogResource } from '../../shared/blog/resources';
import { redditCommunities, youtubeChannels } from '../../shared/blog/resources';
import { Rss, Globe2, ArrowRight, RefreshCw, CirclePlay, ArrowUpRight, MessageCircle } from 'lucide-react';

type FeedKind = `reddit` | `youtube`;
const itemSuffix = (id: string, index: number) => `${id.replace(/[^a-z0-9_-]/gi, `-`)}-${index}`;

const SourceCards = ({ kind, sources }: { kind: FeedKind; sources: readonly BlogResource[] }) => {
  const Icon = kind === `reddit` ? Rss : CirclePlay;
  return (
    <div id={`blog-${kind}-sources`} className={`blog-resource-sources`}>
      {sources.map((source, index) => {
        const id = `blog-${kind}-source-${itemSuffix(source.id, index)}`;
        return (
          <a
            id={id}
            key={source.id}
            href={source.url}
            target={`_blank`}
            rel={`noopener noreferrer`}
            className={`blog-resource-source`}
            aria-label={`${source.label}, Opens In A New Tab`}
          >
            <span aria-hidden id={`${id}-tab`} className={`blog-resource-source-tab`} />
            <div id={`${id}-heading`} className={`blog-resource-source-heading`}>
              <span id={`${id}-icon-wrap`} className={`blog-resource-source-icon-wrap`}>
                <Icon size={18} aria-hidden id={`${id}-icon`} className={`blog-resource-icon`} />
              </span>
              <div id={`${id}-label-group`} className={`blog-resource-source-label-group`}>
                <span id={`${id}-type`} className={`blog-resource-source-type`}>{kind === `reddit` ? `Community` : `Channel`}</span>
                <h3 id={`${id}-title`} className={`blog-resource-source-title`}>{source.label}</h3>
              </div>
              <ArrowUpRight size={16} aria-hidden id={`${id}-arrow`} className={`blog-resource-source-arrow`} />
            </div>
            <p id={`${id}-description`} className={`blog-resource-source-description`}>{source.description}</p>
            <span id={`${id}-action`} className={`blog-resource-source-action`}>{kind === `reddit` ? `Explore The Community` : `Explore The Channel`}</span>
          </a>
        );
      })}
    </div>
  );
};

const CommunityCards = ({ items, loading }: { items: readonly FeedItem[]; loading: boolean }) => (
  <div id={`blog-reddit-sources`} className={`blog-resource-sources`}>
    {redditCommunities.map((source, index) => {
      const id = `blog-reddit-source-${itemSuffix(source.id, index)}`;
      const posts = items.filter(item => item.sourceId === source.id);
      return (
        <article key={source.id} id={id} className={`blog-resource-community`} aria-labelledby={`${id}-title`}>
          <span aria-hidden id={`${id}-tab`} className={`blog-resource-source-tab`} />
          <div id={`${id}-heading`} className={`blog-resource-source-heading`}>
            <span id={`${id}-icon-wrap`} className={`blog-resource-source-icon-wrap`}>
              <Rss size={20} aria-hidden id={`${id}-icon`} className={`blog-resource-icon`} />
            </span>
            <span id={`${id}-platform`} className={`blog-resource-source-type`}>{`Reddit Community`}</span>
          </div>
          <h3 id={`${id}-title`} className={`blog-resource-community-title`}>
            <a href={source.url} target={`_blank`} rel={`noopener noreferrer`} id={`${id}-title-link`} className={`blog-resource-community-title-link`} aria-label={`${source.label}, Opens In A New Tab`}>{source.label}</a>
          </h3>
          <p id={`${id}-description`} className={`blog-resource-source-description`}>{source.description}</p>
          {loading ? (
            <div role={`status`} id={`${id}-loading`} className={`blog-resource-community-loading`}>
              {[0, 1, 2].map(line => <span key={line} aria-hidden id={`${id}-skeleton-${line}`} className={`blog-resource-skeleton-line`} />)}
              <span id={`${id}-loading-label`} className={`blog-resource-feed-status`}>{`Loading Recent Discussions…`}</span>
            </div>
          ) : posts.length ? (
            <ul id={`${id}-posts`} className={`blog-resource-community-posts`}>
              {posts.map((post, postIndex) => {
                const postId = `${id}-post-${itemSuffix(post.id, postIndex)}`;
                const date = formatFeedDate(post.publishedAt);
                return (
                  <li key={post.id} id={postId} className={`blog-resource-community-post`}>
                    <a href={post.url} target={`_blank`} rel={`noopener noreferrer`} id={`${postId}-link`} className={`blog-resource-community-post-link`} aria-label={`${post.title}, Opens In A New Tab`}>{post.title}</a>
                    {!!date && <time id={`${postId}-date`} dateTime={post.publishedAt} className={`blog-resource-feed-date`}>{date}</time>}
                  </li>
                );
              })}
            </ul>
          ) : <p id={`${id}-state`} className={`blog-resource-community-state`}>{`Explore The Latest Discussions On Reddit`}</p>}
          <a href={source.url} target={`_blank`} rel={`noopener noreferrer`} id={`${id}-browse`} className={`blog-resource-community-browse`} aria-label={`Browse ${source.label}, Opens In A New Tab`}>
            <span id={`${id}-browse-label`} className={`blog-resource-button-label`}>{`Browse Latest Posts`}</span>
            <ArrowUpRight size={15} aria-hidden id={`${id}-browse-icon`} className={`blog-resource-icon`} />
          </a>
        </article>
      );
    })}
  </div>
);

const FeedCards = ({ kind, items, loading }: { kind: FeedKind; items: readonly FeedItem[]; loading: boolean }) => {
  if (loading) return (
    <>
      <p role={`status`} id={`blog-${kind}-loading`} className={`blog-resource-feed-status`}>{kind === `reddit` ? `Loading Recent Discussions…` : `Loading Recent Videos…`}</p>
      <div aria-hidden id={`blog-${kind}-skeletons`} className={`blog-resource-feed-grid`}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} id={`blog-${kind}-skeleton-${index}`} className={`blog-resource-feed-skeleton`}>
            {kind === `youtube` && <div id={`blog-${kind}-skeleton-image-${index}`} className={`blog-resource-skeleton-image`} />}
            <div id={`blog-${kind}-skeleton-body-${index}`} className={`blog-resource-feed-body`}>
              <div id={`blog-${kind}-skeleton-meta-${index}`} className={`blog-resource-skeleton-line blog-resource-skeleton-short`} />
              <div id={`blog-${kind}-skeleton-title-${index}`} className={`blog-resource-skeleton-line blog-resource-skeleton-title`} />
              <div id={`blog-${kind}-skeleton-copy-${index}`} className={`blog-resource-skeleton-line`} />
              <div id={`blog-${kind}-skeleton-end-${index}`} className={`blog-resource-skeleton-line blog-resource-skeleton-short`} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
  if (!items.length) return (
    <p role={`status`} id={`blog-${kind}-empty`} className={`blog-resource-empty`}>
      {kind === `reddit` ? `Recent Posts Are Unavailable — Explore The Communities Above` : `Recent Videos Are Unavailable — Explore The Channels Above`}
    </p>
  );
  return (
    <div id={`blog-${kind}-feed`} className={`blog-resource-feed-grid`}>
      {items.slice(0, 6).map((item, index) => {
        const id = `blog-${kind}-item-${itemSuffix(item.id, index)}`;
        const date = formatFeedDate(item.publishedAt);
        return (
          <article key={`${item.id}-${index}`} id={id} className={`blog-resource-feed-card`}>
            <span aria-hidden id={`${id}-tab`} className={`blog-resource-source-tab`} />
            <a
              target={`_blank`}
              href={item.url}
              id={`${id}-link`}
              rel={`noopener noreferrer`}
              className={`blog-resource-feed-link`}
              aria-label={`${item.title}, Opens In A New Tab`}
            >
              {kind === `youtube` && (
                <div id={`${id}-visual`} className={`blog-resource-video-visual`}>
                  {item.thumbnail ? (
                    <img
                      alt={``}
                      width={640}
                      height={360}
                      loading={`lazy`}
                      decoding={`async`}
                      src={item.thumbnail}
                      id={`${id}-thumbnail`}
                      referrerPolicy={`no-referrer`}
                      className={`blog-resource-video-thumbnail`}
                    />
                  ) : <Globe2 size={44} aria-hidden id={`${id}-fallback`} className={`blog-resource-video-fallback`} />}
                  <span id={`${id}-play-wrap`} className={`blog-resource-video-play`}>
                    <CirclePlay size={30} aria-hidden id={`${id}-play`} className={`blog-resource-icon`} />
                  </span>
                </div>
              )}
              <div id={`${id}-body`} className={`blog-resource-feed-body`}>
                <div id={`${id}-meta`} className={`blog-resource-feed-meta`}>
                  <span id={`${id}-source`} className={`blog-resource-feed-source`}>{item.sourceName}</span>
                  {!!date && <time id={`${id}-date`} dateTime={item.publishedAt} className={`blog-resource-feed-date`}>{date}</time>}
                </div>
                <h3 id={`${id}-title`} className={`blog-resource-feed-title`}>{item.title}</h3>
                {kind === `reddit` && !!item.summary && <p id={`${id}-summary`} className={`blog-resource-feed-summary`}>{item.summary}</p>}
                <span id={`${id}-action`} className={`blog-resource-feed-action`}>
                  {kind === `reddit` ? `Read Discussion` : `Watch Video`}
                  <ArrowUpRight size={15} aria-hidden id={`${id}-arrow`} className={`blog-resource-icon`} />
                </span>
              </div>
            </a>
          </article>
        );
      })}
    </div>
  );
};

const BlogResources = () => {
  const { feeds, error, loading, refresh } = useBlogResources();
  return (
    <div id={`blog-resources`} className={`blog-resources`}>
      <section id={`blog-portfolio-cta`} className={`blog-resource-band blog-resource-cta`} aria-labelledby={`blog-portfolio-cta-title`}>
        <div id={`blog-portfolio-cta-content`} className={`blog-content blog-resource-band-content`}>
          <div id={`blog-portfolio-cta-card`} className={`blog-resource-cta-card`}>
            <div id={`blog-portfolio-cta-copy`} className={`blog-resource-cta-copy`}>
              <p id={`blog-portfolio-cta-eyebrow`} className={`blog-resource-eyebrow`}>{`PUT YOUR IDEAS TO WORK`}</p>
              <h2 id={`blog-portfolio-cta-title`} className={`blog-resource-cta-title`}>{`Found A Good Name? Give It A Home.`}</h2>
              <p id={`blog-portfolio-cta-description`} className={`blog-resource-cta-description`}>{`Bring your domains, registrars, renewal dates, and project ideas together. Keep the names you own organized while you make room for what comes next.`}</p>
            </div>
            <div id={`blog-portfolio-cta-actions`} className={`blog-resource-cta-actions`}>
              <Link asChild href={routes.domains.href}>
                <RouterAnchor id={`blog-open-portfolio`} className={`blog-resource-button blog-resource-button-primary`}>
                  <Globe2 size={16} aria-hidden id={`blog-open-portfolio-icon`} className={`blog-resource-icon`} />
                  <span id={`blog-open-portfolio-label`} className={`blog-resource-button-label`}>{`Open Your Portfolio`}</span>
                  <ArrowRight size={16} aria-hidden id={`blog-open-portfolio-arrow`} className={`blog-resource-icon`} />
                </RouterAnchor>
              </Link>
              <Link asChild href={routes.search.href}>
                <RouterAnchor id={`blog-find-domain`} className={`blog-resource-button blog-resource-button-secondary`}>
                  <Globe2 size={16} aria-hidden id={`blog-find-domain-icon`} className={`blog-resource-icon`} />
                  <span id={`blog-find-domain-label`} className={`blog-resource-button-label`}>{`Find A Domain`}</span>
                  <ArrowRight size={16} aria-hidden id={`blog-find-domain-arrow`} className={`blog-resource-icon`} />
                </RouterAnchor>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id={`blog-reddit-resources`} className={`blog-content blog-resource-section`} aria-labelledby={`blog-reddit-title`} aria-busy={loading}>
        <div id={`blog-reddit-heading`} className={`blog-resource-heading`}>
          <div id={`blog-reddit-heading-copy`} className={`blog-resource-heading-copy`}>
            <p id={`blog-reddit-eyebrow`} className={`blog-resource-eyebrow`}>{`LEARN WITH THE COMMUNITY`}</p>
            <h2 id={`blog-reddit-title`} className={`blog-resource-section-title`}>
              <MessageCircle size={24} aria-hidden id={`blog-reddit-title-icon`} className={`blog-resource-heading-icon`} />
              {`Fresh Conversations On Reddit`}
            </h2>
            <p id={`blog-reddit-description`} className={`blog-resource-section-description`}>{`Join the people naming, building, and hosting the web. Explore these communities and their latest public discussions.`}</p>
          </div>
          <button
            type={`button`}
            onClick={refresh}
            disabled={loading}
            id={`blog-resource-refresh`}
            className={`blog-resource-button blog-resource-refresh`}
          >
            <RefreshCw size={15} aria-hidden id={`blog-resource-refresh-icon`} className={`blog-resource-icon`} />
            <span id={`blog-resource-refresh-label`} className={`blog-resource-button-label`}>{loading ? `Refreshing Feeds…` : `Refresh Feeds`}</span>
          </button>
        </div>
        <CommunityCards loading={loading} items={feeds?.reddit ?? []} />
        {!!error && <p role={`status`} id={`blog-resource-error`} className={`blog-resource-feed-status blog-resource-status-warning`}>{`Live Updates Are Unavailable Right Now — ${error}`}</p>}
        {!!feeds?.warnings?.length && <p role={`status`} id={`blog-resource-warnings`} className={`blog-resource-feed-status blog-resource-status-warning`}>{feeds.warnings.join(` · `)}</p>}
        {!!feeds?.updatedAt && !loading && <p id={`blog-resource-updated`} className={`blog-resource-feed-status`}>{`Feed Updated ${formatFeedDate(feeds.updatedAt)}`}</p>}
        {!loading && !feeds?.reddit?.length && <p role={`status`} id={`blog-reddit-empty`} className={`blog-resource-empty`}>{`Recent Posts Are Unavailable — Explore The Communities Above`}</p>}
      </section>

      <section id={`blog-youtube-resources`} className={`blog-resource-band blog-resource-youtube`} aria-labelledby={`blog-youtube-title`} aria-busy={loading}>
        <div id={`blog-youtube-content`} className={`blog-content blog-resource-band-content`}>
          <div id={`blog-youtube-heading`} className={`blog-resource-heading-copy`}>
            <p id={`blog-youtube-eyebrow`} className={`blog-resource-eyebrow`}>{`WATCH. LEARN. BUILD.`}</p>
            <h2 id={`blog-youtube-title`} className={`blog-resource-section-title`}>
              <CirclePlay size={24} aria-hidden id={`blog-youtube-title-icon`} className={`blog-resource-heading-icon`} />
              {`From The Channels We Follow`}
            </h2>
            <p id={`blog-youtube-description`} className={`blog-resource-section-description`}>{`Learn from ICANN, Namecheap, and Google Search Central. Browse the latest videos, then watch directly on YouTube.`}</p>
          </div>
          <SourceCards kind={`youtube`} sources={youtubeChannels} />
          <FeedCards kind={`youtube`} loading={loading} items={feeds?.youtube ?? []} />
        </div>
      </section>
    </div>
  );
};

export default BlogResources;
