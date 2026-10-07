import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { Clock3, ArrowUpRight } from 'lucide-react';
import type { BlogArticle } from '../../shared/blog/articles';
import { getBlogHref } from '../../shared/blog/metadata';

const BlogCard = ({ article, compact = false, featured = false, prefix = `blog` }: { article: BlogArticle; compact?: boolean; featured?: boolean; prefix?: string }) => {
  const id = `${prefix}-card-${article.slug}`;

  return (
    <article id={id} className={`blog-card${compact ? ` blog-card-compact` : ``}${featured ? ` blog-card-featured` : ``}`}>
      <Link href={getBlogHref(article.slug)} asChild>
        <RouterAnchor id={`${id}-link`} className={`blog-card-link`} aria-labelledby={`${id}-title`}>
          <div id={`${id}-visual`} className={`blog-card-visual`}>
            <img
              width={1200}
              height={750}
              decoding={`async`}
              id={`${id}-image`}
              src={article.image}
              alt={article.imageAlt}
              className={`blog-card-image`}
              loading={featured ? `eager` : `lazy`}
            />
          </div>
          <div id={`${id}-body`} className={`blog-card-body`}>
            <div id={`${id}-meta`} className={`blog-card-meta`}>
              <span id={`${id}-category`} className={`blog-card-category`}>{article.category}</span>
              <span id={`${id}-reading-time`} className={`blog-card-reading-time`}>
                <Clock3 size={12} aria-hidden id={`${id}-clock`} className={`blog-card-icon`} />
                {`${article.readMinutes} min read`}
              </span>
            </div>
            <h2 id={`${id}-title`} className={`blog-card-title`}>{article.title}</h2>
            {!compact && <p id={`${id}-excerpt`} className={`blog-card-excerpt`}>{article.excerpt}</p>}
            <span id={`${id}-read`} className={`blog-card-read`}>
              {`Read guide`}
              <ArrowUpRight size={15} aria-hidden id={`${id}-arrow`} className={`blog-card-icon`} />
            </span>
          </div>
        </RouterAnchor>
      </Link>
    </article>
  );
};

export default BlogCard;
