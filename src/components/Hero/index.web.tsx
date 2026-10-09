import './styles.scss';
import { useState } from 'react';
import { Link } from 'expo-router';
import HeroCubes from '../HeroCubes';
import RouterAnchor from '../RouterAnchor';
import StackPillShape from '../StackPillShape';
import MagicTyping from '../MagicTyping';
import { useHeroSearch } from './useHeroSearch';
import { routes } from '../../shared/routes';
import { useStackPill } from '../../shared/config';
import { Search, Globe2, History, TrendingUp, ArrowUpRight } from 'lucide-react';

const Hero = () => {
  const search = useHeroSearch();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
  <section
    id={`landing-hero`}
    className={`landing-hero`}
    aria-labelledby={`hero-title`}
  >
    <div id={`hero-cube-viewport`} className={`hero-cube-viewport`} aria-hidden>
      <div id={`hero-cube-scene`} className={`hero-cube-scene`}>
        <HeroCubes />
      </div>
    </div>
    <div id={`hero-heading-group`} className={`hero-heading-group`}>
      <p id={`hero-eyebrow`} className={`hero-eyebrow`}>
        <span id={`hero-eyebrow-copy`} className={`hero-eyebrow-copy`}>
          <span
            aria-hidden={`true`}
            id={`hero-eyebrow-marker`}
            className={`hero-eyebrow-marker`}
          />
          <span id={`hero-eyebrow-label`} className={`hero-eyebrow-label`}>{`Your Next Idea`}</span>
        </span>
        <Link href={routes.domains.href} asChild>
          <RouterAnchor
            aria-busy={search.domainCountLoading}
            aria-label={search.domainCount > 0 ? `Go To ${search.domainCount.toLocaleString()} Domains` : `Go To Domains`}
            id={`hero-domains-link`}
            className={`hero-domains-link${useStackPill ? ` hero-button-stack` : ``}`}
          >
            {useStackPill && <StackPillShape sharp id={`hero-domains-shape`} />}
            <span id={`hero-domains-text`} className={`hero-domains-text`}>
              {search.domainCountLoading ? (
                <span
                  aria-hidden={`true`}
                  id={`hero-domains-count-skeleton`}
                  className={`hero-data-skeleton hero-count-skeleton`}
                />
              ) : search.domainCount > 0 && (
                <span id={`hero-domains-count`} className={`hero-cta-count`}>{`${search.domainCount.toLocaleString()} `}</span>
              )}
              {`Domains`}
            </span>
            <ArrowUpRight size={12} aria-hidden id={`hero-domains-icon`} className={`hero-domains-icon`} />
          </RouterAnchor>
        </Link>
      </p>
      <h1 id={`hero-title`} className={`hero-title`}>
        <span id={`hero-title-intro`} className={`hero-title-intro`}>
          {`Planner & Manager`}
        </span>
        <span id={`hero-title-accent`} className={`hero-title-accent`}>
          {`Domains Database`}
        </span>
      </h1>
      <p id={`hero-description`} className={`hero-description`}>
        {`Keep track of every name, registrar, and renewal. A domain portfolio you can actually keep up with.`}
      </p>
      <form
        role={`search`}
        id={`hero-domain-search`}
        className={`hero-domain-search`}
        onSubmit={event => { event.preventDefault(); search.submit(); }}
      >
        <div id={`hero-domain-search-trending-row`} className={`hero-domain-search-trending-row`}>
          <MagicTyping label={`Get`} suffix={`hero`} paused={searchFocused || Boolean(search.query)} />
          <Link href={routes.search.href} asChild>
            <RouterAnchor
              aria-busy={search.trendingCountLoading}
              id={`hero-trending-link`}
              className={`hero-trending-link${useStackPill ? ` hero-button-stack` : ``}`}
              aria-label={search.trendingCount > 0 ? `Explore ${search.trendingCount.toLocaleString()} Trending Domains` : `Explore Trending Domains`}
            >
              {useStackPill && <StackPillShape sharp id={`hero-trending-shape`} />}
              <span id={`hero-trending-text`} className={`hero-trending-text`}>
                {search.trendingCountLoading ? (
                  <span
                    aria-hidden={`true`}
                    id={`hero-trending-count-skeleton`}
                    className={`hero-data-skeleton hero-count-skeleton`}
                  />
                ) : search.trendingCount > 0 && (
                  <span id={`hero-trending-count`} className={`hero-cta-count`}>{`${search.trendingCount.toLocaleString()} `}</span>
                )}
                {`Trending`}
              </span>
              <TrendingUp size={12} aria-hidden id={`hero-trending-icon`} className={`hero-trending-icon`} />
            </RouterAnchor>
          </Link>
        </div>
        <div
          id={`hero-domain-search-row`}
          className={`hero-domain-search-row${useStackPill ? ` hero-search-stack` : ``}`}
        >
          {useStackPill && <StackPillShape id={`hero-domain-search-wrapper-shape`} />}
          <input
            required
            type={`text`}
            autoCorrect={`off`}
            autoComplete={`off`}
            value={search.query}
            autoCapitalize={`none`}
            aria-label={`Search For A Domain`}
            placeholder={`your-next-domain.com`}
            id={`hero-domain-search-input`}
            onBlur={() => setSearchFocused(false)}
            onFocus={() => setSearchFocused(true)}
            className={`hero-domain-search-input`}
            onChange={event => search.setQuery(event.target.value)}
          />
          <button
            type={`submit`}
            id={`hero-domain-search-submit`}
            className={`hero-domain-search-submit${useStackPill ? ` hero-button-stack` : ``}`}
            aria-label={`Search Domain Availability`}
          >
            {useStackPill && <StackPillShape id={`hero-domain-search-submit-shape`} />}
            <Search size={15} aria-hidden id={`hero-domain-search-icon`} className={`hero-domain-search-icon`} />
            <span id={`hero-domain-search-text`} className={`hero-domain-search-text`}>{`Search`}</span>
          </button>
        </div>
      </form>
      <div id={`hero-domain-discovery`} className={`hero-domain-discovery`}>
        <div id={`hero-domain-recents`} className={`hero-domain-recents`}>
          <div role={`group`} title={`Recents`} aria-label={`Recents`} id={`hero-domain-recents-heading`} className={`hero-domain-recents-heading`}>
            <History size={12} aria-hidden id={`hero-domain-recents-icon`} className={`hero-domain-recents-icon`} />
            <span id={`hero-domain-recents-label`} className={`hero-domain-recents-label`}>{`Recents`}</span>
          </div>
          <div
            aria-live={`polite`}
            id={`hero-domain-recents-items`}
            className={`hero-domain-recents-items`}
            aria-busy={search.recentSearchesLoading}
            aria-label={search.recentSearchesLoading ? `Loading Recent Domain Searches` : undefined}
          >
            {search.recentSearchesLoading ? [78, 96, 68].map((width, index) => (
              <span
                key={index}
                style={{ width }}
                aria-hidden={`true`}
                id={`hero-domain-recent-skeleton-${index}`}
                className={`hero-data-skeleton hero-recent-skeleton`}
              />
            )) : search.recentSearches.length ? search.recentSearches.slice(0, 3).map((record, index) => (
              <button
                type={`button`}
                key={record.query}
                title={record.query}
                id={`hero-domain-recent-${index}`}
                className={`hero-domain-recent`}
                onClick={() => search.searchDomain(record.query)}
                aria-label={`Search ${record.query} Again`}
              >
                <Search size={10} aria-hidden id={`hero-domain-recent-icon-${index}`} className={`hero-domain-recent-icon`} />
                <span id={`hero-domain-recent-query-${index}`} className={`hero-domain-recent-query`}>{record.query}</span>
              </button>
            )) : (
              <span id={`hero-domain-recents-empty`} className={`hero-domain-recents-message`}>
                {search.recentSearchesError ? `Recents unavailable` : `Your searches appear here`}
              </span>
            )}
          </div>
        </div>
        {!!search.recentSearchesError && (
          <p id={`hero-domain-recents-error`} className={`hero-domain-recents-error`} role={`status`}>
            {search.recentSearchesError}
          </p>
        )}
      </div>
    </div>
    <div id={`hero-bottom-row`} className={`hero-bottom-row`}>
      <p id={`hero-promise`} className={`hero-promise`}>
        <Globe2 size={14} aria-hidden id={`hero-promise-icon`} className={`hero-promise-icon`} />
        <span id={`hero-promise-text`} className={`hero-promise-text`}>
          {`Names. Renewals. Registrars.`}
        </span>
      </p>
      <Link href={routes.domains.href} asChild>
        <RouterAnchor id={`hero-portfolio-link`} className={`hero-portfolio-link`}>
          <span id={`hero-portfolio-link-text`} className={`hero-portfolio-link-text`}>
            {`Explore your portfolio`}
          </span>
          <ArrowUpRight size={14} aria-hidden id={`hero-portfolio-link-icon`} className={`hero-portfolio-link-icon`} />
        </RouterAnchor>
      </Link>
    </div>
  </section>
  );
};

export default Hero;
