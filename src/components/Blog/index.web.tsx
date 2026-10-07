import './styles.scss';
import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import { BookOpen } from 'lucide-react';
import { absoluteSiteUrl } from '../../shared/seo';
import { blogTitle, blogDescription } from '../../shared/blog/metadata';
import { blogArticles, featuredBlogArticle, regularBlogArticles } from '../../shared/blog/articles';

const Blog = () => (
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
    <div id={`blog-page`} className={`blog-page`}>
      <header data-scroll-hero id={`blog-intro`} className={`blog-intro`}>
        <div id={`blog-intro-copy`} className={`blog-intro-copy`}>
          <p id={`blog-eyebrow`} className={`blog-eyebrow`}>
            <BookOpen size={15} aria-hidden id={`blog-eyebrow-icon`} className={`blog-eyebrow-icon`} />
            {`THE DOMAIN FIELD GUIDE`}
          </p>
          <h1 id={`blog-title`} className={`blog-title`}>
            {`Domains Database Blog`}
          </h1>
          <p id={`blog-description`} className={`blog-description`}>
            {`Good names deserve good decisions. Practical guides to finding, organizing, and protecting the domains you own.`}
          </p>
          <div id={`blog-intro-footer`} className={`blog-intro-footer`}>
            <span id={`blog-count`} className={`blog-count`}>{`${blogArticles.length} guides · Built for domain owners`}</span>
            <span id={`blog-intro-note`} className={`blog-intro-note`}>{`Clear explanations. Useful checklists.`}</span>
          </div>
        </div>
        <aside id={`blog-featured`} className={`blog-featured`} aria-labelledby={`blog-featured-label`}>
          <p id={`blog-featured-label`} className={`blog-featured-label`}>
            <BookOpen size={14} aria-hidden id={`blog-featured-icon`} className={`blog-featured-icon`} />
            {`Featured guide`}
          </p>
          <BlogCard featured prefix={`blog-featured`} article={featuredBlogArticle} />
        </aside>
      </header>
      <section id={`blog-guides`} className={`blog-guides`} aria-label={`Domain articles`}>
        <div id={`blog-grid`} className={`blog-grid`}>
          {regularBlogArticles.map(article => <BlogCard key={article.slug} article={article} />)}
        </div>
      </section>
    </div>
  </>
);

export default Blog;
