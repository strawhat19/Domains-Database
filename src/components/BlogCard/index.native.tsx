import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Star, Clock3, FileText, ArrowUpRight } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { getBlogHref } from '../../shared/blog/metadata';
import { blogImages } from '../../shared/blog/images.native';
import type { BlogArticle } from '../../shared/blog/articles';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { formatBlogDate, getBlogCardAccent } from './presentation';

type BlogCardProps = {
  wide?: boolean;
  story?: boolean;
  prefix?: string;
  journal?: boolean;
  compact?: boolean;
  featured?: boolean;
  article: BlogArticle;
};

const BlogCard = ({ article, wide = false, story = false, journal = false, compact = false, featured = false, prefix = `blog` }: BlogCardProps) => {
  const { palette, isDark } = useTheme();
  const suffix = `${prefix}-${article.slug}`;
  const dated = journal || story || wide;
  const accent = getBlogCardAccent(article.category, isDark);
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`native-blog-card`, suffix)} style={[styles.card, story && styles.storyCard, journal && styles.journalCard, journal && { borderTopColor: accent }]}>
      {journal && <View {...elementProps(`native-blog-card-folder-tab`, suffix)} style={[styles.folderTab, { backgroundColor: accent }]} accessible={false} />}
      <Link href={getBlogHref(article.slug)} asChild>
        <Pressable
          accessibilityRole={`link`}
          accessibilityLabel={article.title}
          {...elementProps(`native-blog-card-link`, suffix)}
          accessibilityHint={`${article.category}, ${article.readMinutes} minute read`}
          style={({ pressed }) => [styles.link, (wide || featured) && styles.featuredLink, pressed && styles.pressed]}
        >
          {!journal && <Image
            contentFit={compact || featured || wide ? `contain` : `cover`}
            style={[styles.image, compact && styles.compactImage, featured && styles.featuredImage, wide && styles.wideImage]}
            source={blogImages[article.slug]}
            accessibilityLabel={article.imageAlt}
            {...elementProps(`native-blog-card-image`, suffix)}
          />}
          <View {...elementProps(`native-blog-card-body`, suffix)} style={[styles.body, compact && styles.compactBody, featured && styles.featuredBody, wide && styles.wideBody, story && styles.storyBody, journal && styles.journalBody]}>
            <View {...elementProps(`native-blog-card-meta`, suffix)} style={[styles.meta, (journal || story) && styles.journalMeta]}>
              {journal && <View {...elementProps(`native-blog-card-symbol`, suffix)} style={[styles.symbol, { backgroundColor: `${accent}18` }]}><FileText size={23} color={accent} accessible={false} {...elementProps(`native-blog-card-symbol-icon`, suffix)} /></View>}
              {story && <Star size={15} color={palette.accent} accessible={false} {...elementProps(`native-blog-card-featured-star`, suffix)} />}
              <Text {...elementProps(`native-blog-card-category`, suffix)} style={[styles.category, journal && { color: accent }]}>
                {story ? `Featured Story` : article.category}
              </Text>
              {!dated && <View {...elementProps(`native-blog-card-reading-time`, suffix)} style={styles.readingTime}>
                <Clock3 {...elementProps(`native-blog-card-clock`, suffix)} size={12} color={palette.muted} accessible={false} />
                <Text {...elementProps(`native-blog-card-reading-time-text`, suffix)} style={styles.readingTimeText}>
                  {`${article.readMinutes} min read`}
                </Text>
              </View>}
            </View>
            <Text {...elementProps(`native-blog-card-title`, suffix)} style={[styles.title, compact && styles.compactTitle, featured && styles.featuredTitle, wide && styles.wideTitle, story && styles.storyTitle]} accessibilityRole={`header`}>
              {article.title}
            </Text>
            {!compact && (!featured || story) && (
              <Text {...elementProps(`native-blog-card-excerpt`, suffix)} style={styles.excerpt}>
                {article.excerpt}
              </Text>
            )}
            {dated && <View {...elementProps(`native-blog-card-details`, suffix)} style={[styles.details, journal && styles.journalDetails]}>
              <Text {...elementProps(`native-blog-card-date`, suffix)} style={styles.readingTimeText}>{formatBlogDate(article.publishedAt)}</Text>
              <View {...elementProps(`native-blog-card-reading-time`, suffix)} style={styles.readingTime}><Clock3 size={12} color={palette.muted} accessible={false} {...elementProps(`native-blog-card-clock`, suffix)} /><Text {...elementProps(`native-blog-card-reading-time-text`, suffix)} style={styles.readingTimeText}>{`${article.readMinutes} min read`}</Text></View>
            </View>}
            <View {...elementProps(`native-blog-card-read`, suffix)} style={[styles.read, dated && styles.datedRead, story && styles.storyRead]}>
              <Text {...elementProps(`native-blog-card-read-text`, suffix)} style={[styles.readText, journal && { color: accent }, story && styles.storyReadText]}>
                {story ? `Read The Story` : journal || wide ? `Read Article` : `Read guide`}
              </Text>
              <ArrowUpRight {...elementProps(`native-blog-card-arrow`, suffix)} size={15} color={story ? palette.contrast : journal ? accent : palette.accent} accessible={false} />
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
};

export default BlogCard;
