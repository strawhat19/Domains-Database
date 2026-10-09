import './styles.scss';
import StackPillShape from '../StackPillShape';
import { Search, TrendingUp } from 'lucide-react';
import type { LandingDomainCardProps } from './types';
import { getLandingDomainDetails } from '../LandingSections/presentation';

const LandingDomainCard = ({ result, onSearch }: LandingDomainCardProps) => {
  const details = getLandingDomainDetails(result);
  const suffix = result.domain.replace(/[^a-z0-9-]/gi, `-`);

  return (
    <article
      id={`landing-domain-card-${suffix}`}
      className={`landing-domain-card`}
      aria-labelledby={`landing-domain-name-${suffix}`}
    >
      <div aria-hidden id={`landing-domain-card-backing-${suffix}`} className={`landing-domain-card-backing`}>
        <StackPillShape id={`landing-domain-card-backing-${suffix}`} />
      </div>
      <StackPillShape id={`landing-domain-card-${suffix}`} />
      <div id={`landing-domain-card-top-${suffix}`} className={`landing-domain-card-top`}>
        <span id={`landing-domain-extension-${suffix}`} className={`landing-domain-extension`}>{`.${result.extension}`}</span>
        <TrendingUp size={17} aria-hidden={`true`} id={`landing-domain-trend-${suffix}`} className={`landing-domain-trend`} />
      </div>
      <h3 id={`landing-domain-name-${suffix}`} className={`landing-domain-name`}>{result.domain}</h3>
      <div id={`landing-domain-quote-${suffix}`} className={`landing-domain-quote`}>
        <span id={`landing-domain-registrar-${suffix}`} className={`landing-domain-registrar`}>{`Registration At ${details.registrar}`}</span>
        <div id={`landing-domain-price-row-${suffix}`} className={`landing-domain-price-row`}>
          <span id={`landing-domain-price-${suffix}`} className={`landing-domain-price`}>{details.price}</span>
          <span id={`landing-domain-term-${suffix}`} className={`landing-domain-term`}>{details.term}</span>
        </div>
      </div>
      <div id={`actionsCell-landing-${suffix}`} className={`actionsCell landing-domain-actions`}>
        <span id={`rowStatus-landing-${suffix}`} className={`rowStatus landing-domain-status`}>
          <span aria-hidden={`true`} id={`statusDotWrap-landing-${suffix}`} className={`statusDotWrap`}>
            <span id={`statusDot-landing-${suffix}`} className={`statusDot`} />
          </span>
          <span id={`statusText-landing-${suffix}`} className={`statusText`}>{`Available`}</span>
        </span>
        <button
          type={`button`}
          id={`landing-domain-search-${suffix}`}
          className={`landing-domain-search`}
          aria-label={`Search ${result.domain} Availability And Prices`}
          onClick={() => onSearch(result.domain)}
        >
          <Search size={13} aria-hidden={`true`} id={`landing-domain-search-icon-${suffix}`} className={`landing-domain-search-icon`} />
          <span id={`landing-domain-search-label-${suffix}`} className={`landing-domain-search-label`}>{`Search`}</span>
        </button>
      </div>
    </article>
  );
};

export default LandingDomainCard;
