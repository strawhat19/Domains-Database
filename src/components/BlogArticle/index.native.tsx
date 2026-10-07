import { Link } from 'expo-router';
import { Image } from 'expo-image';
import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import { useMemo, useEffect, useContext } from 'react';
import { createStyles } from './styles.native';
import { useBlogArticle } from './useBlogArticle';
import { blogImages } from '../../shared/blog/images.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Clock3, ArrowLeft, ArrowUpRight } from 'lucide-react-native';
import { formatBlogDate, getArticleSchema } from '../../shared/blog/metadata';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Alert, Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';

const BlogArticle = () => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const { article, relatedArticles } = useBlogArticle();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const wide = width >= 700;
  const padding = wide ? 32 : 20;
  const cardWidth = (Math.min(width, 1120) - padding * 2 - (wide ? 20 : 0)) / (wide ? 2 : 1);
  const openSource = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(`Unable To Open Source`, `Open this source in your browser:\n${url}`);
    }
  };

  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  if (!article) return (
    <View {...elementProps(`native-blog-article-missing`)} style={[styles.page, { paddingHorizontal: padding }]}>
      <PageMeta noIndex title={`Article Not Found`} description={`This article could not be found. Explore the domain guides on the Domains Database Blog.`} />
      <Text {...elementProps(`native-blog-article-missing-title`)} style={styles.title} accessibilityRole={`header`}>
        {`Article not found`}
      </Text>
      <Text {...elementProps(`native-blog-article-missing-text`)} style={styles.description}>
        {`Explore our guides to choosing, managing, and protecting domain names.`}
      </Text>
      <Link href={`/blog`} asChild>
        <Pressable {...elementProps(`native-blog-article-missing-back`)} style={styles.back} accessibilityRole={`link`} accessibilityLabel={`Back To Blog`}>
          <ArrowLeft {...elementProps(`native-blog-article-missing-icon`)} size={15} color={palette.muted} accessible={false} />
          <Text {...elementProps(`native-blog-article-missing-back-text`)} style={styles.backText}>{`Back to Blog`}</Text>
        </Pressable>
      </Link>
    </View>
  );

  const suffix = article.slug;

  return (
    <>
      <PageMeta
        type={`article`}
        title={article.title}
        image={article.image}
        description={article.description}
        publishedAt={article.publishedAt}
        canonicalPath={`/blog/${article.slug}`}
        structuredData={getArticleSchema(article)}
      />
      <View {...elementProps(`native-blog-article`, suffix)} style={[styles.page, { paddingHorizontal: padding }]}>
        <View
          style={styles.header}
          {...elementProps(`native-blog-article-header`, suffix)}
          onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}
        >
          <Link href={`/blog`} asChild>
            <Pressable {...elementProps(`native-blog-article-back`, suffix)} style={styles.back} accessibilityRole={`link`} accessibilityLabel={`Back To Blog`}>
              <ArrowLeft {...elementProps(`native-blog-article-back-icon`, suffix)} size={15} color={palette.muted} accessible={false} />
              <Text {...elementProps(`native-blog-article-back-text`, suffix)} style={styles.backText}>{`Back to Blog`}</Text>
            </Pressable>
          </Link>
          <Text {...elementProps(`native-blog-article-category`, suffix)} style={styles.category}>{article.category}</Text>
          <Text {...elementProps(`native-blog-article-title`, suffix)} style={[styles.title, wide && styles.wideTitle]} accessibilityRole={`header`}>
            {article.title}
          </Text>
          <Text {...elementProps(`native-blog-article-description`, suffix)} style={styles.description}>{article.excerpt}</Text>
          <View {...elementProps(`native-blog-article-meta`, suffix)} style={styles.meta}>
            <Link href={`/about`} asChild>
              <Pressable {...elementProps(`native-blog-article-author`, suffix)} style={styles.authorLink} accessibilityRole={`link`} accessibilityLabel={`About Domains Database`}>
                <Text {...elementProps(`native-blog-article-author-text`, suffix)} style={styles.author}>{`By Domains Database`}</Text>
              </Pressable>
            </Link>
            <Text {...elementProps(`native-blog-article-date`, suffix)} style={styles.metaText}>{formatBlogDate(article.publishedAt)}</Text>
            <View {...elementProps(`native-blog-article-reading-time`, suffix)} style={styles.readingTime}>
              <Clock3 {...elementProps(`native-blog-article-time-icon`, suffix)} size={13} color={palette.muted} accessible={false} />
              <Text {...elementProps(`native-blog-article-time-text`, suffix)} style={styles.metaText}>{`${article.readMinutes} min read`}</Text>
            </View>
          </View>
        </View>
        <View {...elementProps(`native-blog-article-figure`, suffix)} style={styles.figure}>
          <Image
            contentFit={`cover`}
            style={styles.image}
            source={blogImages[article.slug]}
            accessibilityLabel={article.imageAlt}
            {...elementProps(`native-blog-article-image`, suffix)}
          />
          <Text {...elementProps(`native-blog-article-caption`, suffix)} style={styles.caption}>{article.imageCaption}</Text>
        </View>
        <View {...elementProps(`native-blog-article-body`, suffix)} style={styles.body}>
          <View {...elementProps(`native-blog-article-takeaway`, suffix)} style={styles.takeaway}>
            <Text {...elementProps(`native-blog-article-takeaway-label`, suffix)} style={styles.takeawayLabel}>{`THE KEY TAKEAWAY`}</Text>
            <Text {...elementProps(`native-blog-article-takeaway-text`, suffix)} style={styles.takeawayText}>{article.takeaway}</Text>
          </View>
          {article.sections.map(section => (
            <View key={section.id} {...elementProps(`native-blog-article-section`, `${suffix}-${section.id}`)} style={styles.section}>
              <Text {...elementProps(`native-blog-article-section-title`, `${suffix}-${section.id}`)} style={styles.sectionTitle} accessibilityRole={`header`}>
                {section.title}
              </Text>
              {section.paragraphs.map((paragraph, index) => (
                <Text key={index} {...elementProps(`native-blog-article-paragraph`, `${suffix}-${section.id}-${index}`)} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
              {!!section.bullets?.length && (
                <View {...elementProps(`native-blog-article-list`, `${suffix}-${section.id}`)} style={styles.list}>
                  {section.bullets.map((bullet, index) => (
                    <View key={index} {...elementProps(`native-blog-article-list-item`, `${suffix}-${section.id}-${index}`)} style={styles.listItem}>
                      <Text {...elementProps(`native-blog-article-list-marker`, `${suffix}-${section.id}-${index}`)} style={styles.listMarker} accessible={false}>{`•`}</Text>
                      <Text {...elementProps(`native-blog-article-list-text`, `${suffix}-${section.id}-${index}`)} style={styles.listText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View {...elementProps(`native-blog-article-sources`, suffix)} style={styles.sources}>
            <Text {...elementProps(`native-blog-article-sources-title`, suffix)} style={styles.sectionTitle} accessibilityRole={`header`}>
              {`Sources & further reading`}
            </Text>
            {article.sources.map((source, index) => (
              <Pressable
                key={source.url}
                accessibilityRole={`link`}
                accessibilityLabel={source.label}
                onPress={() => void openSource(source.url)}
                {...elementProps(`native-blog-article-source-link`, `${suffix}-${index}`)}
                style={({ pressed }) => [styles.sourceLink, pressed && styles.pressed]}
              >
                <Text {...elementProps(`native-blog-article-source-text`, `${suffix}-${index}`)} style={styles.sourceText}>{source.label}</Text>
                <ArrowUpRight {...elementProps(`native-blog-article-source-icon`, `${suffix}-${index}`)} size={14} color={palette.accent} accessible={false} />
              </Pressable>
            ))}
          </View>
          <Link href={`/domains`} asChild>
            <Pressable {...elementProps(`native-blog-article-portfolio-link`, suffix)} style={styles.portfolioLink} accessibilityRole={`link`} accessibilityLabel={`Open Your Domain Portfolio`}>
              <Text {...elementProps(`native-blog-article-portfolio-text`, suffix)} style={styles.portfolioText}>{`Put your domain portfolio in order`}</Text>
              <ArrowUpRight {...elementProps(`native-blog-article-portfolio-icon`, suffix)} size={16} color={`#ffffff`} accessible={false} />
            </Pressable>
          </Link>
        </View>
        {!!relatedArticles.length && (
          <View {...elementProps(`native-blog-article-related`, suffix)} style={styles.related}>
            <Text {...elementProps(`native-blog-article-related-title`, suffix)} style={styles.relatedTitle} accessibilityRole={`header`}>{`Keep exploring`}</Text>
            <View {...elementProps(`native-blog-article-related-grid`, suffix)} style={styles.relatedGrid}>
              {relatedArticles.map(related => (
                <View key={related.slug} {...elementProps(`native-blog-article-related-slot`, `${suffix}-${related.slug}`)} style={{ width: cardWidth }}>
                  <BlogCard article={related} prefix={`blog-article-${suffix}`} />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </>
  );
};

export default BlogArticle;
