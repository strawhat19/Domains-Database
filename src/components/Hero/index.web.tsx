import './styles.scss';
import { Search } from 'lucide-react';
import ExtensionIndex from '../ExtensionIndex';
import { useHeroSearch } from './useHeroSearch';

const Hero = () => {
  const search = useHeroSearch();

  return (
  <section
    id={`landing-hero`}
    className={`landing-hero`}
    aria-labelledby={`hero-title`}
  >
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
        <label
          htmlFor={`hero-domain-search-input`}
          id={`hero-domain-search-label`}
          className={`hero-domain-search-label`}
        >
          {`Find your next domain`}
        </label>
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
    </div>
    <ExtensionIndex />
  </section>
  );
};

export default Hero;
