import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { blogArticles, getBlogArticle } from '../../shared/blog/articles';

export const useBlogArticle = () => {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const { name: appName, switched, blogImage, formatContent } = useAppBrand();
  const articleSlug = Array.isArray(slug) ? slug[0] ?? `` : slug ?? ``;
  const article = useMemo(() => formatContent(getBlogArticle(articleSlug)), [articleSlug, formatContent]);
  const relatedArticles = blogArticles.filter(item => article?.relatedSlugs.includes(item.slug));
  return { article, appName, switched, blogImage, relatedArticles };
};
