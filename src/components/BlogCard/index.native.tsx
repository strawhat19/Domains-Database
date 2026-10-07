import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Clock3, ArrowUpRight } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { getBlogHref } from '../../shared/blog/metadata';
import { blogImages } from '../../shared/blog/images.native';
import type { BlogArticle } from '../../shared/blog/articles';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

type BlogCardProps = {
  prefix?: string;
  compact?: boolean;
  featured?: boolean;
  article: BlogArticle;
};

const BlogCard = ({ article, compact = false, featured = false, prefix = `blog` }: BlogCardProps) => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const phoneFeatured = featured && width < 700;
  const suffix = `${prefix}-${article.slug}`;
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`native-blog-card`, suffix)} style={styles.card}>
      <Link href={getBlogHref(article.slug)} asChild>
        <Pressable
          accessibilityRole={`link`}
          accessibilityLabel={article.title}
          {...elementProps(`native-blog-card-link`, suffix)}
          accessibilityHint={`${article.category}, ${article.readMinutes} minute read`}
          style={({ pressed }) => [styles.link, featured && styles.featuredLink, pressed && styles.pressed]}
        >
          <Image
            contentFit={compact || featured ? `contain` : `cover`}
            style={[styles.image, compact && styles.compactImage, featured && styles.featuredImage, phoneFeatured && styles.phoneFeaturedImage]}
            source={blogImages[article.slug]}
            accessibilityLabel={article.imageAlt}
            {...elementProps(`native-blog-card-image`, suffix)}
          />
          <View {...elementProps(`native-blog-card-body`, suffix)} style={[styles.body, compact && styles.compactBody, featured && styles.featuredBody, phoneFeatured && styles.phoneFeaturedBody]}>
            <View {...elementProps(`native-blog-card-meta`, suffix)} style={styles.meta}>
              <Text {...elementProps(`native-blog-card-category`, suffix)} style={styles.category}>
                {article.category}
              </Text>
              <View {...elementProps(`native-blog-card-reading-time`, suffix)} style={styles.readingTime}>
                <Clock3 {...elementProps(`native-blog-card-clock`, suffix)} size={12} color={palette.muted} accessible={false} />
                <Text {...elementProps(`native-blog-card-reading-time-text`, suffix)} style={styles.readingTimeText}>
                  {`${article.readMinutes} min read`}
                </Text>
              </View>
            </View>
            <Text {...elementProps(`native-blog-card-title`, suffix)} style={[styles.title, compact && styles.compactTitle, featured && styles.featuredTitle, phoneFeatured && styles.phoneFeaturedTitle]} accessibilityRole={`header`}>
              {article.title}
            </Text>
            {!compact && !featured && (
              <Text {...elementProps(`native-blog-card-excerpt`, suffix)} style={styles.excerpt}>
                {article.excerpt}
              </Text>
            )}
            <View {...elementProps(`native-blog-card-read`, suffix)} style={styles.read}>
              <Text {...elementProps(`native-blog-card-read-text`, suffix)} style={styles.readText}>
                {`Read guide`}
              </Text>
              <ArrowUpRight {...elementProps(`native-blog-card-arrow`, suffix)} size={15} color={palette.accent} accessible={false} />
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
};

export default BlogCard;
