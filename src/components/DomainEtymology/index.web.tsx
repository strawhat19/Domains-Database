import './styles.scss';
import type { Props } from './types';
import { urlParts, wordOrigins, exampleUrl, etymologyCaption, type UrlPartKey } from './content';

const DomainEtymology = ({ id, compact = false }: Props) => {
  const renderPart = (key: UrlPartKey) => (
    <span key={key} id={`${id}-part-${key}`} className={`domain-etymology-part domain-etymology-part-${key}`}>
      <code id={`${id}-value-${key}`} className={`domain-etymology-part-value`}>{urlParts[key].value}</code>
      <span id={`${id}-label-${key}`} className={`domain-etymology-part-label`}>{urlParts[key].label}</span>
    </span>
  );

  if (compact) return (
    <figure id={id} className={`domain-etymology domain-etymology-compact`} aria-label={`URL Breakdown: ${exampleUrl}`}>
      <div id={`${id}-url-parts`} className={`domain-etymology-url-parts`}>
        {(Object.keys(urlParts) as UrlPartKey[]).map(renderPart)}
      </div>
    </figure>
  );

  return (
    <figure id={id} className={`domain-etymology`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-caption`}>
      <div id={`${id}-heading`} className={`domain-etymology-heading`}>
        <p id={`${id}-eyebrow`} className={`domain-etymology-eyebrow`}>{`Words & Web Addresses`}</p>
        <h3 id={`${id}-title`} className={`domain-etymology-title`}>{`A Word With Roots In Ownership`}</h3>
        <p id={`${id}-intro`} className={`domain-etymology-intro`}>{`Before it named a place on the web, “domain” described land or an area under someone's control.`}</p>
      </div>
      <ol id={`${id}-origins`} className={`domain-etymology-origins`} aria-label={`Word Roots, Simplified`}>
        {wordOrigins.map((origin, index) => (
          <li key={origin.word} id={`${id}-origin-${origin.word}`} className={`domain-etymology-origin`}>
            <span id={`${id}-language-${origin.word}`} className={`domain-etymology-language`}>{origin.language}</span>
            <span id={`${id}-word-${origin.word}`} className={`domain-etymology-word`}>{origin.word}</span>
            <span id={`${id}-meaning-${origin.word}`} className={`domain-etymology-meaning`}>{origin.meaning}</span>
            {index < wordOrigins.length - 1 && <span aria-hidden id={`${id}-arrow-${index}`} className={`domain-etymology-origin-arrow`}>{`→`}</span>}
          </li>
        ))}
      </ol>
      <p id={`${id}-roots-note`} className={`domain-etymology-roots-note`}>{`Word roots, simplified`}</p>
      <div id={`${id}-anatomy`} className={`domain-etymology-anatomy`}>
        <div id={`${id}-anatomy-heading`} className={`domain-etymology-anatomy-heading`}>
          <h4 id={`${id}-anatomy-title`} className={`domain-etymology-anatomy-title`}>{`A Domain Is Part Of A URL`}</h4>
          <code id={`${id}-full-url`} className={`domain-etymology-full-url`}>{exampleUrl}</code>
        </div>
        <div id={`${id}-url-parts`} className={`domain-etymology-url-parts`} aria-label={`The Parts Of This Example URL`}>
          {renderPart(`scheme`)}
          <div id={`${id}-hostname`} className={`domain-etymology-hostname`}>
            <div id={`${id}-hostname-parts`} className={`domain-etymology-hostname-parts`}>
              {renderPart(`subdomain`)}
              <div id={`${id}-registered-domain`} className={`domain-etymology-registered-domain`}>
                <div id={`${id}-registered-parts`} className={`domain-etymology-registered-parts`}>
                  {renderPart(`name`)}
                  {renderPart(`tld`)}
                </div>
                <span id={`${id}-registered-label`} className={`domain-etymology-group-label`}>{`Registered Domain · This Example`}</span>
              </div>
            </div>
            <span id={`${id}-hostname-label`} className={`domain-etymology-group-label domain-etymology-hostname-label`}>{`Hostname · shop.example.com`}</span>
          </div>
          {renderPart(`path`)}
          {renderPart(`query`)}
          {renderPart(`fragment`)}
        </div>
      </div>
      <figcaption id={`${id}-caption`} className={`domain-etymology-caption`}>{etymologyCaption}</figcaption>
    </figure>
  );
};

export default DomainEtymology;
