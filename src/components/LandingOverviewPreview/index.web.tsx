import './styles.scss';
import type { OverviewPreviewKind } from './content';
import { Globe2, Search, Filter, Layers3, Compass, CalendarDays, ChevronDown } from 'lucide-react';
import { overviewPreviewGroups, overviewPreviewQuotes, overviewPreviewPanels, overviewPreviewDomains } from './content';

const panelIcons = { inventory: Globe2, renewals: CalendarDays, projects: Layers3, discovery: Compass };

const LandingOverviewPreview = ({ kind }: { kind: OverviewPreviewKind }) => {
  const panel = overviewPreviewPanels[kind];
  const Icon = panelIcons[kind];
  const id = `landing-overview-preview-${kind}`;
  const inventory = kind === `inventory`;

  return <div id={id} role={`img`} aria-label={panel.label} className={`overview-preview overview-preview-${kind}`}>
    <div id={`${id}-header`} className={`overview-preview-header`}>
      <Icon id={`${id}-icon`} size={13} aria-hidden className={`overview-preview-icon`} />
      <span id={`${id}-title`} className={`overview-preview-title`}>{panel.title}</span>
      <span id={`${id}-sample`} className={`overview-preview-sample`}>{`Sample`}</span>
    </div>
    <div id={`${id}-toolbar`} className={`overview-preview-toolbar`}>
      <div id={`${id}-search`} className={`overview-preview-search`}>
        <Search id={`${id}-search-icon`} size={10} aria-hidden />
        <span id={`${id}-search-label`} className={`overview-preview-search-label`}>{panel.search}</span>
      </div>
      <span id={`${id}-filter`} className={`overview-preview-filter`}><Filter id={`${id}-filter-icon`} size={11} aria-hidden /></span>
    </div>
    {kind === `inventory` || kind === `renewals` ? <>
      <div id={`${id}-summary`} className={`overview-preview-summary`}>
        <span id={`${id}-total`} className={`overview-preview-total`}>{inventory ? `3 Domains` : `$38.97 / year`}</span>
        <span id={`${id}-meta`} className={`overview-preview-muted`}>{inventory ? `2 Registrars` : `Annual cost`}</span>
      </div>
      <div id={`${id}-columns`} className={`overview-preview-columns`}>
        <span id={`${id}-domain-heading`} className={`overview-preview-column`}>{`Domain`}</span>
        <span id={`${id}-detail-heading`} className={`overview-preview-column`}>{inventory ? `Registrar` : `Annual cost`}</span>
      </div>
      <div id={`${id}-rows`} className={`overview-preview-rows`}>
        {overviewPreviewDomains.map(domain => <div key={domain.id} id={`${id}-row-${domain.id}`} className={`overview-preview-row`}>
          <div id={`${id}-identity-${domain.id}`} className={`overview-preview-identity`}>
            <span id={`${id}-site-${domain.id}`} className={`overview-preview-site`}><Globe2 id={`${id}-site-icon-${domain.id}`} size={11} aria-hidden /></span>
            <div id={`${id}-copy-${domain.id}`} className={`overview-preview-domain-copy`}>
              <span id={`${id}-name-${domain.id}`} className={`overview-preview-domain`}>{domain.name}</span>
              {inventory ? <span id={`${id}-status-cell-${domain.id}`} className={`actionsCell overview-preview-status`}>
                <span id={`${id}-status-${domain.id}`} className={`rowStatus`}>
                  <span id={`${id}-status-wrap-${domain.id}`} className={`statusDotWrap`}><span id={`${id}-status-dot-${domain.id}`} className={`statusDot`} /></span>
                  <span id={`${id}-status-label-${domain.id}`} className={`statusText`}>{`Active`}</span>
                </span>
              </span> : <span id={`${id}-renewal-${domain.id}`} className={`overview-preview-renewal${domain.id === `sprout` ? ` overview-preview-renewal-soon` : ``}`}>{domain.renewal}</span>}
            </div>
          </div>
          {inventory ? <span id={`${id}-registrar-${domain.id}`} className={`overview-preview-registrar`}>
            <span id={`${id}-registrar-mark-${domain.id}`} className={`overview-preview-registrar-mark`}>{domain.registrar.slice(0, 1)}</span>
            <span id={`${id}-registrar-label-${domain.id}`} className={`overview-preview-registrar-label`}>{domain.registrar}</span>
          </span> : <span id={`${id}-cost-${domain.id}`} className={`overview-preview-price`}>{domain.cost}</span>}
        </div>)}
      </div>
    </> : kind === `projects` ? <div id={`${id}-collection`} className={`overview-preview-collection`}>
      <div id={`${id}-collection-heading`} className={`overview-preview-collection-heading`}>
        <Layers3 id={`${id}-collection-icon`} size={12} aria-hidden />
        <span id={`${id}-collection-name`} className={`overview-preview-collection-name`}>{`Side Projects`}</span>
        <span id={`${id}-collection-count`} className={`overview-preview-count`}>{`2`}</span>
      </div>
      <div id={`${id}-progress`} className={`overview-preview-progress`}>
        <span id={`${id}-progress-track`} className={`overview-preview-progress-track`}><span id={`${id}-progress-fill`} className={`overview-preview-progress-fill`} /></span>
        <span id={`${id}-progress-label`} className={`overview-preview-muted`}>{`50%`}</span>
      </div>
      {overviewPreviewGroups.map(group => <div key={group.id} id={`${id}-group-${group.id}`} className={`overview-preview-group`}>
        <div id={`${id}-group-heading-${group.id}`} className={`overview-preview-group-heading`}>
          <ChevronDown id={`${id}-group-icon-${group.id}`} size={10} aria-hidden />
          <span id={`${id}-group-name-${group.id}`} className={`overview-preview-group-name`}>{group.name}</span>
          <span id={`${id}-group-count-${group.id}`} className={`overview-preview-muted`}>{`1`}</span>
        </div>
        <div id={`${id}-project-${group.id}`} className={`overview-preview-project`}>
          <Globe2 id={`${id}-project-icon-${group.id}`} size={11} aria-hidden className={`overview-preview-icon`} />
          <span id={`${id}-project-name-${group.id}`} className={`overview-preview-domain`}>{group.domain}</span>
          <span id={`${id}-project-tag-${group.id}`} className={`overview-preview-tag`}>{group.tag}</span>
        </div>
      </div>)}
    </div> : <>
      <div id={`${id}-categories`} className={`overview-preview-categories`}>
        {[`All`, `Hot`, `Trending`].map((category, index) => <span key={category} id={`${id}-category-${index}`} className={`overview-preview-category${index === 0 ? ` overview-preview-category-active` : ``}`}>{category}</span>)}
      </div>
      <div id={`${id}-results`} className={`overview-preview-results`}>
        {overviewPreviewQuotes.map(quote => <div key={quote.id} id={`${id}-result-${quote.id}`} className={`overview-preview-result`}>
          <div id={`${id}-result-top-${quote.id}`} className={`overview-preview-result-top`}>
            <span id={`${id}-result-name-${quote.id}`} className={`overview-preview-domain`}>{quote.name}</span>
            <span id={`${id}-result-price-${quote.id}`} className={`overview-preview-price`}>{quote.cost}<span id={`${id}-result-term-${quote.id}`} className={`overview-preview-muted`}>{`/yr`}</span></span>
          </div>
          <div id={`${id}-result-meta-${quote.id}`} className={`overview-preview-result-meta`}>
            <span id={`${id}-result-category-${quote.id}`} className={`overview-preview-muted`}>{quote.category}</span>
            <span id={`${id}-result-status-cell-${quote.id}`} className={`actionsCell overview-preview-status`}>
              <span id={`${id}-result-status-${quote.id}`} className={`rowStatus`}>
                <span id={`${id}-result-dot-wrap-${quote.id}`} className={`statusDotWrap`}><span id={`${id}-result-dot-${quote.id}`} className={`statusDot`} /></span>
                <span id={`${id}-result-status-label-${quote.id}`} className={`statusText`}>{`Available`}</span>
              </span>
            </span>
            <span id={`${id}-result-compare-${quote.id}`} className={`overview-preview-compare`}>{`Compare 2`}</span>
          </div>
        </div>)}
      </div>
    </>}
    <div id={`${id}-footer`} className={`overview-preview-footer`}>{inventory ? `Showing 3 Of 3` : kind === `renewals` ? `Illustrative Costs` : kind === `projects` ? `1 Collection · 2 Groups` : `Illustrative Quotes`}</div>
  </div>;
};

export default LandingOverviewPreview;
