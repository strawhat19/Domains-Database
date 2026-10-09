import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import BlogResources from '../BlogResources';
import { useMemo, useEffect, useContext } from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react-native';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { absoluteSiteUrl } from '../../shared/seo';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { blogTitle, blogDescription } from '../../shared/blog/metadata';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { blogArticles, historyBlogArticle, regularBlogArticles, featuredBlogArticle } from '../../shared/blog/articles';

const Blog = () => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const wide = width >= 700;
  const padding = wide ? 32 : 20;
  const columns = width >= 1000 ? 3 : wide ? 2 : 1;
  const contentWidth = Math.min(width, 1120) - padding * 2;
  const cardWidth = (contentWidth - (columns - 1) * 20) / columns;

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
        <View {...elementProps(`native-blog-intro`)} style={styles.intro}>
          <Link asChild href={routes.domains.href}>
            <Pressable {...elementProps(`native-blog-back-domains`)} style={styles.backLink} accessibilityRole={`link`}>
              <ArrowLeft size={14} color={palette.muted} accessible={false} {...elementProps(`native-blog-back-icon`)} />
              <Text {...elementProps(`native-blog-back-label`)} style={styles.backText}>{`Back To Domains`}</Text>
            </Pressable>
          </Link>
          <View {...elementProps(`native-blog-intro-heading`)} style={[styles.introHeading, wide && styles.wideIntroHeading]}>
            <View {...elementProps(`native-blog-intro-text`)} style={[styles.introText, wide && styles.wideIntroText]}>
              <Text {...elementProps(`native-blog-title`)} style={styles.title} accessibilityRole={`header`}>{`Blog`}</Text>
              <Text {...elementProps(`native-blog-description`)} style={styles.description}>{`Learn what domains are, explore the story of the internet, and find practical ways to choose, organize, and protect the names you own.`}</Text>
            </View>
            <View {...elementProps(`native-blog-eyebrow`)} style={styles.eyebrow}>
              <BookOpen {...elementProps(`native-blog-eyebrow-icon`)} size={15} color={palette.accent} accessible={false} />
              <Text {...elementProps(`native-blog-eyebrow-text`)} style={styles.eyebrowText}>{`THE DOMAIN JOURNAL`}</Text>
            </View>
          </View>
        </View>
        <View
          {...elementProps(`native-blog-featured`)}
          style={[styles.featured, { marginHorizontal: -padding, paddingHorizontal: padding }]}
          onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}
        >
          <BlogCard story article={featuredBlogArticle} featured={wide} prefix={`blog-featured`} />
        </View>
        <View {...elementProps(`native-blog-guides`)} style={styles.guides}>
          <View {...elementProps(`native-blog-guides-intro`)} style={styles.guidesIntro}>
            <Text {...elementProps(`native-blog-guides-eyebrow`)} style={styles.eyebrowText}>{`KEEP EXPLORING`}</Text>
            <Text {...elementProps(`native-blog-guides-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Good Names Start With Curiosity.`}</Text>
            <Text {...elementProps(`native-blog-guides-description`)} style={styles.sectionDescription}>{`Practical guides to help you find a memorable address, make informed decisions, and give every domain a purpose.`}</Text>
          </View>
          <View {...elementProps(`native-blog-grid`)} style={styles.grid}>
            {regularBlogArticles.map(article => (
              <View key={article.slug} {...elementProps(`native-blog-card-slot`, article.slug)} style={{ width: cardWidth }}>
                <BlogCard journal article={article} />
              </View>
            ))}
            <View {...elementProps(`native-blog-history`)} style={{ width: contentWidth }}>
              <BlogCard wide={wide} prefix={`blog-history`} article={historyBlogArticle} />
            </View>
          </View>
        </View>
        <BlogResources />
      </View>
    </>
  );
};

export default Blog;
