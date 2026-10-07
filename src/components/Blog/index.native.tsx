import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import { useMemo, useEffect, useContext } from 'react';
import { BookOpen } from 'lucide-react-native';
import { View, Text, useWindowDimensions } from 'react-native';
import { createStyles } from './styles.native';
import { absoluteSiteUrl } from '../../shared/seo';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { blogTitle, blogDescription } from '../../shared/blog/metadata';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { blogArticles, regularBlogArticles, featuredBlogArticle } from '../../shared/blog/articles';

const Blog = () => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const wide = width >= 700;
  const sideBySide = width >= 1000;
  const padding = wide ? 32 : 20;
  const contentWidth = Math.min(width, 1120) - padding * 2;
  const cardWidth = (contentWidth - (wide ? 20 : 0)) / (wide ? 2 : 1);
  const featuredWidth = sideBySide ? (contentWidth - 32) * .6 : cardWidth;

  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <>
      <PageMeta
        title={blogTitle}
        canonicalPath={`/blog`}
        description={blogDescription}
        image={featuredBlogArticle.image}
        structuredData={{
          '@type': `CollectionPage`,
          '@context': `https://schema.org`,
          name: blogTitle,
          url: absoluteSiteUrl(`/blog`),
          description: blogDescription,
          mainEntity: {
            '@type': `ItemList`,
            itemListElement: blogArticles.map((article, index) => ({
              '@type': `ListItem`,
              position: index + 1,
              name: article.title,
              url: absoluteSiteUrl(`/blog/${article.slug}`),
            })),
          },
        }}
      />
      <View {...elementProps(`native-blog-page`)} style={[styles.page, { paddingHorizontal: padding }]}>
        <View
          style={[styles.intro, sideBySide && styles.sideBySideIntro]}
          {...elementProps(`native-blog-intro`)}
          onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}
        >
          <View {...elementProps(`native-blog-intro-text`)} style={[styles.introText, sideBySide && styles.sideBySideText]}>
            <View {...elementProps(`native-blog-eyebrow`)} style={styles.eyebrow}>
              <BookOpen {...elementProps(`native-blog-eyebrow-icon`)} size={15} color={palette.accent} accessible={false} />
              <Text {...elementProps(`native-blog-eyebrow-text`)} style={styles.eyebrowText}>
                {`THE DOMAIN FIELD GUIDE`}
              </Text>
            </View>
            <Text {...elementProps(`native-blog-title`)} style={[styles.title, wide && !sideBySide && styles.wideTitle]} accessibilityRole={`header`}>
              {`Domains Database Blog`}
            </Text>
            <Text {...elementProps(`native-blog-description`)} style={styles.description}>
              {`Good names deserve good decisions. Practical guides to finding, organizing, and protecting the domains you own.`}
            </Text>
            <View {...elementProps(`native-blog-intro-footer`)} style={[styles.introFooter, sideBySide && styles.sideBySideFooter]}>
              <Text {...elementProps(`native-blog-count`)} style={styles.count}>
                {`${blogArticles.length} guides · Built for domain owners`}
              </Text>
              <Text {...elementProps(`native-blog-intro-note`)} style={styles.note}>
                {`Clear explanations. Useful checklists.`}
              </Text>
            </View>
          </View>
          <View {...elementProps(`native-blog-featured`)} style={[styles.featured, sideBySide && styles.sideBySideFeatured, { width: featuredWidth }]}>
            <View {...elementProps(`native-blog-featured-label`)} style={styles.featuredLabel}>
              <BookOpen {...elementProps(`native-blog-featured-icon`)} size={15} color={palette.accent} accessible={false} />
              <Text {...elementProps(`native-blog-featured-title`)} style={styles.featuredTitle} accessibilityRole={`header`}>
                {`Featured guide`}
              </Text>
            </View>
            <BlogCard article={featuredBlogArticle} featured={sideBySide} prefix={`blog-featured`} />
          </View>
        </View>
        <View {...elementProps(`native-blog-grid`)} style={styles.grid}>
          {regularBlogArticles.map(article => (
            <View key={article.slug} {...elementProps(`native-blog-card-slot`, article.slug)} style={{ width: cardWidth }}>
              <BlogCard article={article} />
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

export default Blog;
