import './styles.scss';
import { Link } from 'expo-router';
import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import RouterAnchor from '../RouterAnchor';
import BlogResources from '../BlogResources';
import { routes } from '../../shared/routes';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { absoluteSiteUrl } from '../../shared/seo';
import { blogTitle, blogDescription } from '../../shared/blog/metadata';
import { blogArticles, historyBlogArticle, featuredBlogArticle, regularBlogArticles } from '../../shared/blog/articles';

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
      <header id={`blog-intro`} className={`blog-intro blog-content`}>
        <Link asChild href={routes.domains.href}>
          <RouterAnchor id={`blog-back-domains`} className={`blog-back-link`}><ArrowLeft size={14} aria-hidden id={`blog-back-icon`} className={`blog-back-icon`} /><span id={`blog-back-label`} className={`blog-back-label`}>{`Back To Domains`}</span></RouterAnchor>
        </Link>
        <div id={`blog-intro-heading`} className={`blog-intro-heading`}>
          <div id={`blog-intro-copy`} className={`blog-intro-copy`}>
            <h1 id={`blog-title`} className={`blog-title`}>{`Blog`}</h1>
            <p id={`blog-description`} className={`blog-description`}>{`Learn what domains are, explore the story of the internet, and find practical ways to choose, organize, and protect the names you own.`}</p>
          </div>
          <p id={`blog-eyebrow`} className={`blog-eyebrow`}><BookOpen size={15} aria-hidden id={`blog-eyebrow-icon`} className={`blog-eyebrow-icon`} /><span id={`blog-eyebrow-label`} className={`blog-eyebrow-label`}>{`THE DOMAIN JOURNAL`}</span></p>
        </div>
      </header>
      <section data-scroll-hero id={`blog-featured`} className={`blog-featured`} aria-label={`Featured Story`}>
        <div id={`blog-featured-content`} className={`blog-content`}><BlogCard story featured prefix={`blog-featured`} article={featuredBlogArticle} /></div>
      </section>
      <section id={`blog-guides`} className={`blog-guides blog-content`} aria-labelledby={`blog-guides-title`}>
        <div id={`blog-guides-intro`} className={`blog-guides-intro`}>
          <p id={`blog-guides-eyebrow`} className={`blog-section-eyebrow`}>{`KEEP EXPLORING`}</p>
          <h2 id={`blog-guides-title`} className={`blog-section-title`}>{`Good Names Start With Curiosity.`}</h2>
          <p id={`blog-guides-description`} className={`blog-section-description`}>{`Practical guides to help you find a memorable address, make informed decisions, and give every domain a purpose.`}</p>
        </div>
        <div id={`blog-grid`} className={`blog-grid`}>
          {regularBlogArticles.map(article => <BlogCard journal key={article.slug} article={article} />)}
          <div id={`blog-history`} className={`blog-history`}>
            <BlogCard wide prefix={`blog-history`} article={historyBlogArticle} />
          </div>
        </div>
      </section>
      <BlogResources />
    </div>
  </>
);

export default Blog;
