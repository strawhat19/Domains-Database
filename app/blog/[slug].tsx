import BlogArticle from '../../src/components/BlogArticle';
import { blogArticles } from '../../src/shared/blog/articles';

export const generateStaticParams = () => blogArticles.map(({ slug }) => ({ slug }));

const BlogArticlePage = () => <BlogArticle />;

export default BlogArticlePage;
