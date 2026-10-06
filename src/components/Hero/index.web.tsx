import './styles.scss';
import { useState } from 'react';
import MagicTyping from '../MagicTyping';
import { Search, History } from 'lucide-react';
import ExtensionIndex from '../ExtensionIndex';
import { useHeroSearch } from './useHeroSearch';
import { useWindowDimensions } from 'react-native';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import ResponsiveDomainHeading from '../ResponsiveDomainHeading';

const Hero = () => {
  const search = useHeroSearch();
  const { width } = useWindowDimensions();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
  <section
    id={`landing-hero`}
    className={`landing-hero`}
    aria-labelledby={`hero-title`}
  >
    <DiscoveryBackdrop suffix={`hero`} variant={`landing`} />
    <div id={`hero-heading-group`} className={`hero-heading-group`}>
      <p id={`hero-eyebrow`} className={`hero-eyebrow`}>
        <span
          aria-hidden={`true`}
          id={`hero-eyebrow-marker`}
          className={`hero-eyebrow-marker`}
        />
        {`PERSONAL DOMAIN REGISTRY`}
      </p>
      <h1 id={`hero-title`} className={`hero-title`}>
        {`Your domains.`}
        <br id={`hero-title-break`} className={`hero-title-break`} />
        <span id={`hero-title-accent`} className={`hero-title-accent`}>
          {`Under control.`}
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
        <ResponsiveDomainHeading
          forceCompact={width < 600}
          shortText={`Find your domain`}
          fullText={`Find your next domain`}
          htmlFor={`hero-domain-search-input`}
          id={`hero-domain-search-label`}
          className={`hero-domain-search-label`}
        />
        <MagicTyping suffix={`hero`} paused={searchFocused || Boolean(search.query)} />
        <div id={`hero-domain-search-row`} className={`hero-domain-search-row`}>
          <input
            required
            type={`text`}
            autoCorrect={`off`}
            autoComplete={`off`}
            value={search.query}
            autoCapitalize={`none`}
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
            className={`hero-domain-search-submit`}
            aria-label={`Search Domain Availability`}
          >
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
          <div id={`hero-domain-recents-items`} className={`hero-domain-recents-items`} aria-live={`polite`}>
            {search.recentSearchesLoading ? (
              <span id={`hero-domain-recents-loading`} className={`hero-domain-recents-message`}>{`Loading…`}</span>
            ) : search.recentSearches.length ? search.recentSearches.slice(0, 3).map((record, index) => (
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
    <ExtensionIndex />
  </section>
  );
};

export default Hero;
