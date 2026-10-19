import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import StackPillShape from '../StackPillShape';
import { formatBlogDate } from './presentation';
import { getBlogHref } from '../../shared/blog/metadata';
import type { BlogArticle } from '../../shared/blog/articles';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { Star, Clock3, FileText, ArrowUpRight } from 'lucide-react';

type BlogCardProps = {
  wide?: boolean;
  story?: boolean;
  prefix?: string;
  journal?: boolean;
  compact?: boolean;
  featured?: boolean;
  article: BlogArticle;
};

const BlogCard = ({ article, wide = false, story = false, journal = false, compact = false, featured = false, prefix = `blog` }: BlogCardProps) => {
  const { blogImage } = useAppBrand();
  const id = `${prefix}-card-${article.slug}`;
  const dated = journal || story || wide;
  const Heading = journal || wide ? `h3` : `h2`;

  return (
    <article id={id} className={`blog-card${wide ? ` blog-card-wide` : ``}${story ? ` blog-card-story` : ``}${journal ? ` blog-card-journal` : ``}${compact ? ` blog-card-compact` : ``}${featured ? ` blog-card-featured` : ``}`}>
      <div aria-hidden id={`${id}-backing`} className={`blog-card-backing`}><StackPillShape id={`${id}-backing`} /></div>
      <StackPillShape id={`${id}-foreground`} />
      <Link href={getBlogHref(article.slug)} asChild>
        <RouterAnchor id={`${id}-link`} className={`blog-card-link`} aria-labelledby={`${id}-title`}>
          {!journal && <div id={`${id}-visual`} className={`blog-card-visual`}>
            <img
              width={1200}
              height={750}
              decoding={`async`}
              id={`${id}-image`}
              src={blogImage(article.image)}
              alt={article.imageAlt}
              className={`blog-card-image`}
              loading={featured ? `eager` : `lazy`}
            />
          </div>}
          <div id={`${id}-body`} className={`blog-card-body`}>
            <div id={`${id}-meta`} className={`blog-card-meta`}>
              {journal && <span id={`${id}-symbol`} className={`blog-card-symbol`}><FileText size={23} aria-hidden id={`${id}-symbol-icon`} className={`blog-card-icon`} /></span>}
              {story && <Star size={15} aria-hidden id={`${id}-featured-star`} className={`blog-card-icon`} />}
              <span id={`${id}-category`} className={`blog-card-category`}>{story ? `Featured Story` : article.category}</span>
              {!dated && <span id={`${id}-reading-time`} className={`blog-card-reading-time`}>
                <Clock3 size={12} aria-hidden id={`${id}-clock`} className={`blog-card-icon`} />
                {`${article.readMinutes} min read`}
              </span>}
            </div>
            <Heading id={`${id}-title`} className={`blog-card-title`}>{article.title}</Heading>
            {!compact && <p id={`${id}-excerpt`} className={`blog-card-excerpt`}>{article.excerpt}</p>}
            {dated && <div id={`${id}-details`} className={`blog-card-details`}>
              <time id={`${id}-date`} dateTime={article.publishedAt} className={`blog-card-date`}>{formatBlogDate(article.publishedAt)}</time>
              <span id={`${id}-reading-time`} className={`blog-card-reading-time`}><Clock3 size={12} aria-hidden id={`${id}-clock`} className={`blog-card-icon`} />{`${article.readMinutes} min read`}</span>
            </div>}
            <span id={`${id}-read`} className={`blog-card-read`}>
              {story ? `Read The Story` : journal || wide ? `Read Article` : `Read guide`}
              <ArrowUpRight size={15} aria-hidden id={`${id}-arrow`} className={`blog-card-icon`} />
            </span>
          </div>
        </RouterAnchor>
      </Link>
    </article>
  );
};

export default BlogCard;
