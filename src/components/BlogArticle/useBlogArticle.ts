import { useLocalSearchParams } from 'expo-router';
import { blogArticles, getBlogArticle } from '../../shared/blog/articles';

export const useBlogArticle = () => {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const article = getBlogArticle(Array.isArray(slug) ? slug[0] ?? `` : slug ?? ``);
  const relatedArticles = blogArticles.filter(item => article?.relatedSlugs.includes(item.slug));
  return { article, relatedArticles };
};
