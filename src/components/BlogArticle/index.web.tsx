import './styles.scss';
import { Link } from 'expo-router';
import BlogCard from '../BlogCard';
import PageMeta from '../PageMeta';
import RouterAnchor from '../RouterAnchor';
import { useBlogArticle } from './useBlogArticle';
import { Clock3, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { formatBlogDate, getArticleSchema } from '../../shared/blog/metadata';

const BlogArticle = () => {
  const { article, relatedArticles } = useBlogArticle();

  if (!article) return (
    <div id={`blog-article-missing`} className={`blog-article-missing`}>
      <PageMeta noIndex title={`Article Not Found`} description={`This article could not be found. Explore the domain guides on the Domains Database Blog.`} />
      <h1 id={`blog-article-missing-title`} className={`blog-article-title`}>{`Article not found`}</h1>
      <p id={`blog-article-missing-text`} className={`blog-article-description`}>{`Explore our guides to choosing, managing, and protecting domain names.`}</p>
      <Link href={`/blog`} asChild>
        <RouterAnchor id={`blog-article-missing-back`} className={`blog-article-back`}>
          <ArrowLeft size={15} aria-hidden id={`blog-article-missing-icon`} className={`blog-article-icon`} />
          {`Back to Blog`}
        </RouterAnchor>
      </Link>
    </div>
  );

  const id = `blog-article-${article.slug}`;
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
      <article id={id} className={`blog-article`}>
        <header data-scroll-hero id={`${id}-header`} className={`blog-article-header`}>
          <Link href={`/blog`} asChild>
            <RouterAnchor id={`${id}-back`} className={`blog-article-back`}>
              <ArrowLeft size={15} aria-hidden id={`${id}-back-icon`} className={`blog-article-icon`} />
              {`Back to Blog`}
            </RouterAnchor>
          </Link>
          <p id={`${id}-category`} className={`blog-article-category`}>{article.category}</p>
          <h1 id={`${id}-title`} className={`blog-article-title`}>{article.title}</h1>
          <p id={`${id}-description`} className={`blog-article-description`}>{article.excerpt}</p>
          <div id={`${id}-meta`} className={`blog-article-meta`}>
            <Link href={`/about`} asChild>
              <RouterAnchor id={`${id}-author`} className={`blog-article-author`}>{`By Domains Database`}</RouterAnchor>
            </Link>
            <time id={`${id}-date`} className={`blog-article-date`} dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt)}</time>
            <span id={`${id}-time`} className={`blog-article-reading-time`}>
              <Clock3 size={13} aria-hidden id={`${id}-time-icon`} className={`blog-article-icon`} />
              {`${article.readMinutes} min read`}
            </span>
          </div>
        </header>
        <figure id={`${id}-figure`} className={`blog-article-figure`}>
          <img
            width={1200}
            height={750}
            fetchPriority={`high`}
            id={`${id}-image`}
            src={article.image}
            alt={article.imageAlt}
            className={`blog-article-image`}
          />
          <figcaption id={`${id}-caption`} className={`blog-article-caption`}>{article.imageCaption}</figcaption>
        </figure>
        <div id={`${id}-layout`} className={`blog-article-layout`}>
          <aside id={`${id}-contents`} className={`blog-article-contents`} aria-labelledby={`${id}-contents-title`}>
            <p id={`${id}-contents-title`} className={`blog-article-contents-title`}>{`In this guide`}</p>
            <ol id={`${id}-contents-list`} className={`blog-article-contents-list`}>
              {article.sections.map(section => (
                <li key={section.id} id={`${id}-contents-item-${section.id}`} className={`blog-article-contents-item`}>
                  <a id={`${id}-contents-link-${section.id}`} className={`blog-article-contents-link`} href={`#${id}-${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </aside>
          <div id={`${id}-body`} className={`blog-article-body`}>
            <div id={`${id}-takeaway`} className={`blog-article-takeaway`}>
              <p id={`${id}-takeaway-label`} className={`blog-article-takeaway-label`}>{`The key takeaway`}</p>
              <p id={`${id}-takeaway-text`} className={`blog-article-takeaway-text`}>{article.takeaway}</p>
            </div>
            {article.sections.map(section => (
              <section key={section.id} id={`${id}-${section.id}`} className={`blog-article-section`} aria-labelledby={`${id}-${section.id}-title`}>
                <h2 id={`${id}-${section.id}-title`} className={`blog-article-section-title`}>{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} id={`${id}-${section.id}-paragraph-${index}`} className={`blog-article-paragraph`}>{paragraph}</p>
                ))}
                {!!section.bullets?.length && (
                  <ul id={`${id}-${section.id}-list`} className={`blog-article-list`}>
                    {section.bullets.map((bullet, index) => <li key={index} id={`${id}-${section.id}-item-${index}`} className={`blog-article-list-item`}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
            <section id={`${id}-sources`} className={`blog-article-sources`} aria-labelledby={`${id}-sources-title`}>
              <h2 id={`${id}-sources-title`} className={`blog-article-section-title`}>{`Sources & further reading`}</h2>
              <ul id={`${id}-sources-list`} className={`blog-article-source-list`}>
                {article.sources.map((source, index) => (
                  <li key={source.url} id={`${id}-source-${index}`} className={`blog-article-source-item`}>
                    <a id={`${id}-source-link-${index}`} className={`blog-article-source-link`} href={source.url} target={`_blank`} rel={`noopener noreferrer`}>
                      {source.label}
                      <ArrowUpRight size={14} aria-hidden id={`${id}-source-icon-${index}`} className={`blog-article-icon`} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <Link href={`/domains`} asChild>
              <RouterAnchor id={`${id}-portfolio-link`} className={`blog-article-portfolio-link`}>
                {`Put your domain portfolio in order`}
                <ArrowUpRight size={16} aria-hidden id={`${id}-portfolio-icon`} className={`blog-article-icon`} />
              </RouterAnchor>
            </Link>
          </div>
        </div>
        {!!relatedArticles.length && (
          <section id={`${id}-related`} className={`blog-article-related`} aria-labelledby={`${id}-related-title`}>
            <h2 id={`${id}-related-title`} className={`blog-article-related-title`}>{`Keep exploring`}</h2>
            <div id={`${id}-related-grid`} className={`blog-article-related-grid`}>
              {relatedArticles.map(related => <BlogCard key={related.slug} article={related} prefix={id} />)}
            </div>
          </section>
        )}
      </article>
    </>
  );
};

export default BlogArticle;
