import { useMemo } from 'react';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useBlogResources, formatFeedDate, openBlogResource } from './useBlogResources';
import { redditCommunities, youtubeChannels, type FeedItem } from '../../shared/blog/resources';
import { Rss, Globe2, ArrowRight, CirclePlay, RefreshCw, ArrowUpRight, MessageCircle } from 'lucide-react-native';

const BlogResources = () => {
  const state = useBlogResources();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const pagePadding = width >= 700 ? 32 : 20;
  const columns = width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  const bandInsets = { marginHorizontal: -pagePadding, paddingHorizontal: pagePadding };
  const contentWidth = Math.max(0, Math.min(width, 1120) - pagePadding * 2);
  const cardWidth = (contentWidth - (columns - 1) * 20) / columns;
  const renderPattern = (scope: string) => (
    <View {...elementProps(`native-blog-band-pattern`, scope)} style={styles.bandPattern} accessible={false} importantForAccessibility={`no-hide-descendants`}>
      <View {...elementProps(`native-blog-band-ring`, `${scope}-outer`)} style={[styles.bandRing, styles.outerRing]} />
      <View {...elementProps(`native-blog-band-ring`, `${scope}-inner`)} style={[styles.bandRing, styles.innerRing]} />
      <View {...elementProps(`native-blog-band-ring`, `${scope}-corner`)} style={[styles.bandRing, styles.cornerRing]} />
    </View>
  );
  const renderSources = (sources: readonly { id: string; label: string; url: string; description: string }[], video = false) => (
    <View {...elementProps(`native-blog-source-grid`, video ? `youtube` : `reddit`)} style={styles.grid}>
      {sources.map(source => (
        <Pressable
          key={source.id}
          accessibilityRole={`link`}
          accessibilityLabel={source.label}
          onPress={() => void openBlogResource(source.url)}
          {...elementProps(`native-blog-source`, source.id)}
          style={({ pressed }) => [styles.card, styles.source, { width: cardWidth }, pressed && styles.pressed]}
        >
          <View {...elementProps(`native-blog-source-heading`, source.id)} style={styles.sourceHeading}>
            {video ? <CirclePlay size={16} accessible={false} color={palette.accent} {...elementProps(`native-blog-source-icon`, source.id)} /> : <MessageCircle size={16} accessible={false} color={palette.accent} {...elementProps(`native-blog-source-icon`, source.id)} />}
            <Text {...elementProps(`native-blog-source-title`, source.id)} style={styles.cardTitle}>{source.label}</Text>
          </View>
          <Text {...elementProps(`native-blog-source-description`, source.id)} style={styles.sourceDescription}>{source.description}</Text>
          <View {...elementProps(`native-blog-source-link`, source.id)} style={styles.resourceLink}>
            <Text {...elementProps(`native-blog-source-link-text`, source.id)} style={styles.resourceText}>{video ? `Watch Channel` : `Visit Community`}</Text>
            <ArrowUpRight size={14} accessible={false} color={palette.accent} {...elementProps(`native-blog-source-arrow`, source.id)} />
          </View>
        </Pressable>
      ))}
    </View>
  );
  const renderFeeds = (items: readonly FeedItem[], video = false) => (
    <View {...elementProps(`native-blog-feed-grid`, video ? `youtube` : `reddit`)} style={styles.grid}>
      {items.map(item => {
        const suffix = `${item.sourceId}-${item.id}`;
        const date = formatFeedDate(item.publishedAt);
        return (
          <Pressable
            key={item.id}
            accessibilityRole={`link`}
            accessibilityLabel={`${item.title}, ${item.sourceName}`}
            onPress={() => void openBlogResource(item.url)}
            {...elementProps(`native-blog-feed-card`, suffix)}
            style={({ pressed }) => [styles.card, video && styles.videoCard, { width: cardWidth }, pressed && styles.pressed]}
          >
            {video && (item.thumbnail ? <Image contentFit={`cover`} source={{ uri: item.thumbnail }} style={styles.thumbnail} accessibilityLabel={item.title} {...elementProps(`native-blog-video-thumbnail`, suffix)} /> : <View {...elementProps(`native-blog-video-placeholder`, suffix)} style={[styles.thumbnail, styles.videoPlaceholder]}><CirclePlay size={36} accessible={false} color={palette.accent} {...elementProps(`native-blog-video-placeholder-icon`, suffix)} /></View>)}
            <View {...elementProps(`native-blog-feed-body`, suffix)} style={video ? styles.videoBody : { gap: 12, flex: 1 }}>
              <View {...elementProps(`native-blog-feed-meta`, suffix)} style={styles.meta}>
                <Text {...elementProps(`native-blog-feed-source`, suffix)} style={[styles.metaText, styles.sourceName]}>{item.sourceName}</Text>
                {!!date && <Text {...elementProps(`native-blog-feed-date`, suffix)} style={styles.metaText}>{date}</Text>}
              </View>
              <Text {...elementProps(`native-blog-feed-title`, suffix)} style={styles.cardTitle}>{item.title}</Text>
              {!!item.summary && !video && <Text {...elementProps(`native-blog-feed-summary`, suffix)} style={styles.sourceDescription}>{item.summary}</Text>}
              <View {...elementProps(`native-blog-feed-action`, suffix)} style={styles.resourceLink}>
                <Text {...elementProps(`native-blog-feed-action-text`, suffix)} style={styles.resourceText}>{video ? `Watch Video` : `Read Discussion`}</Text>
                <ArrowUpRight size={14} accessible={false} color={palette.accent} {...elementProps(`native-blog-feed-arrow`, suffix)} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
  const renderLoading = (video = false) => (
    <View {...elementProps(`native-blog-feed-loading`, video ? `youtube` : `reddit`)} style={styles.grid} accessibilityLabel={video ? `Loading Videos` : `Loading Discussions`}>
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} {...elementProps(`native-blog-feed-skeleton`, `${video ? `youtube` : `reddit`}-${index}`)} style={[styles.card, { width: cardWidth }]}>
          {video && <View style={[styles.thumbnail, styles.skeleton]} {...elementProps(`native-blog-thumbnail-skeleton`, `${index}`)} />}
          <View style={[styles.skeleton, styles.skeletonTitle]} {...elementProps(`native-blog-title-skeleton`, `${video ? `youtube` : `reddit`}-${index}`)} />
          <View style={[styles.skeleton, styles.skeletonLine]} {...elementProps(`native-blog-line-skeleton`, `${video ? `youtube` : `reddit`}-${index}`)} />
        </View>
      ))}
    </View>
  );

  return (
    <View {...elementProps(`native-blog-resources`)} style={styles.root}>
      <View {...elementProps(`native-blog-cta-band`)} style={[styles.ctaBand, bandInsets]}>
        {renderPattern(`cta`)}
        <View {...elementProps(`native-blog-cta`)} style={[styles.cta, width >= 850 && styles.wideCta]}>
          <View {...elementProps(`native-blog-cta-copy`)} style={styles.ctaCopy}>
            <View {...elementProps(`native-blog-cta-eyebrow`)} style={styles.eyebrow}>
              <Globe2 size={15} accessible={false} color={palette.accent} {...elementProps(`native-blog-cta-icon`)} />
              <Text {...elementProps(`native-blog-cta-eyebrow-text`)} style={styles.eyebrowText}>{`PUT YOUR IDEAS TO WORK`}</Text>
            </View>
            <Text {...elementProps(`native-blog-cta-title`)} style={styles.ctaTitle} accessibilityRole={`header`}>{`Found A Good Name? Give It A Home.`}</Text>
            <Text {...elementProps(`native-blog-cta-description`)} style={styles.description}>{`Keep your domains, registrars, renewal dates, and project ideas together. Turn your next good find into a portfolio you can manage.`}</Text>
          </View>
          <View {...elementProps(`native-blog-cta-actions`)} style={styles.ctaActions}>
            <Link asChild href={routes.domains.href}><Pressable {...elementProps(`native-blog-cta-portfolio`)} style={[styles.button, styles.primary]} accessibilityRole={`link`}><Text style={[styles.buttonText, styles.primaryText]} {...elementProps(`native-blog-cta-portfolio-text`)}>{`Open Your Portfolio`}</Text><ArrowRight size={16} accessible={false} color={palette.contrast} {...elementProps(`native-blog-cta-portfolio-icon`)} /></Pressable></Link>
            <Link asChild href={routes.search.href}><Pressable {...elementProps(`native-blog-cta-search`)} style={styles.button} accessibilityRole={`link`}><Text style={styles.buttonText} {...elementProps(`native-blog-cta-search-text`)}>{`Find A Domain`}</Text><Globe2 size={16} accessible={false} color={palette.accent} {...elementProps(`native-blog-cta-search-icon`)} /></Pressable></Link>
          </View>
        </View>
      </View>
      <View {...elementProps(`native-blog-reddit-section`)} style={styles.section}>
        <View {...elementProps(`native-blog-reddit-heading`)} style={styles.heading}>
          <View {...elementProps(`native-blog-reddit-title-row`)} style={styles.titleRow}><Rss size={23} accessible={false} color={palette.accent} {...elementProps(`native-blog-reddit-title-icon`)} /><Text {...elementProps(`native-blog-reddit-title`)} style={styles.title} accessibilityRole={`header`}>{`Domain Conversations On Reddit`}</Text></View>
          <Pressable onPress={state.refresh} disabled={state.loading} accessibilityRole={`button`} accessibilityLabel={`Refresh Community And Video Feeds`} accessibilityState={{ disabled: state.loading, busy: state.loading }} {...elementProps(`native-blog-feeds-refresh`)} style={[styles.button, state.loading && styles.disabled]}><RefreshCw size={14} accessible={false} color={palette.accent} {...elementProps(`native-blog-feeds-refresh-icon`)} /><Text {...elementProps(`native-blog-feeds-refresh-text`)} style={styles.buttonText}>{state.loading ? `Refreshing Feeds…` : `Refresh Feeds`}</Text></Pressable>
        </View>
        <Text {...elementProps(`native-blog-reddit-description`)} style={styles.description}>{`Compare notes on domain names, website building, hosting, and the details behind a good address.`}</Text>
        {renderSources(redditCommunities)}
        {!!state.error && <Text {...elementProps(`native-blog-feeds-error`)} style={styles.status} accessibilityLiveRegion={`polite`}>{state.error}</Text>}
        {!!state.feeds?.warnings?.length && <Text {...elementProps(`native-blog-feeds-warning`)} style={styles.status} accessibilityLiveRegion={`polite`}>{state.feeds.warnings.join(` · `)}</Text>}
        {state.loading && !state.feeds ? renderLoading() : state.feeds?.reddit?.length ? renderFeeds(state.feeds.reddit) : <Text {...elementProps(`native-blog-reddit-empty`)} style={styles.status} accessibilityLiveRegion={`polite`}>{`Recent Posts Are Unavailable — Explore The Communities Above`}</Text>}
      </View>
      <View {...elementProps(`native-blog-youtube-section`)} style={[styles.section, styles.youtubeBand, bandInsets]}>
        {renderPattern(`youtube`)}
        <View {...elementProps(`native-blog-youtube-heading`)} style={styles.bandHeading}>
          <Text {...elementProps(`native-blog-youtube-eyebrow`)} style={[styles.eyebrowText, styles.bandEyebrow]}>{`WATCH. LEARN. BUILD.`}</Text>
          <View {...elementProps(`native-blog-youtube-title-row`)} style={styles.titleRow}><CirclePlay size={23} accessible={false} color={`#ffffff`} {...elementProps(`native-blog-youtube-title-icon`)} /><Text {...elementProps(`native-blog-youtube-title`)} style={[styles.title, styles.bandTitle]} accessibilityRole={`header`}>{`From The Channels We Follow`}</Text></View>
          <Text {...elementProps(`native-blog-youtube-description`)} style={[styles.description, styles.bandDescription]}>{`Explore domain infrastructure, naming and website tips, and the search fundamentals that help a good website get found.`}</Text>
        </View>
        {renderSources(youtubeChannels, true)}
        {state.loading && !state.feeds ? renderLoading(true) : state.feeds?.youtube?.length ? renderFeeds(state.feeds.youtube, true) : <Text {...elementProps(`native-blog-youtube-empty`)} style={[styles.status, styles.bandDescription]} accessibilityLiveRegion={`polite`}>{`Recent Videos Are Unavailable — Explore The Channels Above`}</Text>}
      </View>
    </View>
  );
};

export default BlogResources;
