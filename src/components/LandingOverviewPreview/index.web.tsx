import './styles.scss';
import { memo } from 'react';
import type { OverviewPreviewKind } from './content';
import { overviewPreviewGroups, overviewPreviewQuotes, overviewPreviewPanels, overviewPreviewDomains, overviewPreviewCategories } from './content';
import { Globe2, Search, Filter, Layers3, Compass, CalendarDays, ChevronDown, Plus, List, LayoutGrid, Flame, Sparkles, TrendingUp, Star, GitBranch, ExternalLink } from 'lucide-react';

const panelIcons = { inventory: Globe2, projects: Layers3, discovery: Compass, renewals: CalendarDays };
const categoryIcons = { Hot: Flame, New: Sparkles, Trending: TrendingUp, All: LayoutGrid, Value: Globe2, Short: Filter };
const footerLabels = { inventory: `3 Sample Domains · Illustrative USD Costs`, renewals: `Sample Dates · Illustrative USD Costs`, projects: `1 Sample Collection · 2 Groups`, discovery: `Fictional Names · Illustrative USD Quotes · No Availability Check` };

const LandingOverviewPreview = ({ kind, scope }: { kind: OverviewPreviewKind; scope?: string }) => {
  const panel = overviewPreviewPanels[kind];
  const Icon = panelIcons[kind];
  const id = `landing-overview-preview-${kind}${scope ? `-${scope}` : ``}`;
  const inventory = kind === `inventory`;
  const portfolio = inventory || kind === `renewals`;

  return <div id={id} role={`img`} aria-label={panel.label} className={`overview-preview overview-preview-${kind}`}>
    <div id={`${id}-header`} className={`overview-preview-header`}>
      <Icon id={`${id}-icon`} size={17} aria-hidden className={`overview-preview-icon`} />
      <span id={`${id}-title`} className={`overview-preview-title`}>{panel.title}</span>
      <span id={`${id}-sample`} className={`overview-preview-sample`}>{`Sample Preview`}</span>
    </div>
    <div id={`${id}-toolbar`} className={`overview-preview-toolbar`}>
      <div id={`${id}-search`} className={`overview-preview-search`}>
        <Search id={`${id}-search-icon`} size={14} aria-hidden />
        <span id={`${id}-search-label`} className={`overview-preview-search-label`}>{panel.search}</span>
      </div>
      {portfolio ? <>
        <span id={`${id}-filter`} className={`overview-preview-tool`}><Filter id={`${id}-filter-icon`} size={13} aria-hidden /><span id={`${id}-filter-label`}>{`Filters`}</span></span>
        <span id={`${id}-views`} className={`overview-preview-views`}><List id={`${id}-table-icon`} size={14} aria-hidden /><LayoutGrid id={`${id}-board-icon`} size={14} aria-hidden /></span>
      </> : <span id={`${id}-primary-action`} className={`overview-preview-primary`}>
        {kind === `discovery` ? <Search id={`${id}-action-icon`} size={13} aria-hidden /> : <Plus id={`${id}-action-icon`} size={13} aria-hidden />}
        <span id={`${id}-action-label`}>{kind === `discovery` ? `Search` : `Collection`}</span>
      </span>}
    </div>
    {portfolio ? <>
      <div id={`${id}-summary`} className={`overview-preview-summary`}>
        {(inventory ? [[`Domains`, `3`], [`Registrars`, `2`], [`Annual Cost`, `$38.97`]] : [[`Annual Cost`, `$38.97`], [`Next Renewal`, `Nov 08`], [`Auto Renew`, `On`]]).map(([label, value], index) => <div key={label} id={`${id}-metric-${index}`} className={`overview-preview-metric`}>
          <span id={`${id}-metric-value-${index}`} className={`overview-preview-total`}>{value}</span>
          <span id={`${id}-metric-label-${index}`} className={`overview-preview-muted`}>{label}</span>
        </div>)}
      </div>
      <div id={`${id}-columns`} className={`overview-preview-columns overview-preview-table-grid`}>
        <span id={`${id}-domain-heading`} className={`overview-preview-column`}>{`Domain`}</span>
        <span id={`${id}-detail-heading`} className={`overview-preview-column`}>{inventory ? `Registrar` : `Renewal Date`}</span>
        <span id={`${id}-project-heading`} className={`overview-preview-column overview-preview-extra`}>{inventory ? `Project Status` : `Auto Renew`}</span>
        <span id={`${id}-cost-heading`} className={`overview-preview-column overview-preview-cost-column`}>{`Annual Cost`}</span>
      </div>
      <div id={`${id}-rows`} className={`overview-preview-rows`}>
        {overviewPreviewDomains.map(domain => <div key={domain.id} id={`${id}-row-${domain.id}`} className={`overview-preview-row overview-preview-table-grid`}>
          <div id={`${id}-identity-${domain.id}`} className={`overview-preview-identity`}>
            <span id={`${id}-site-${domain.id}`} className={`overview-preview-site`}><Globe2 id={`${id}-site-icon-${domain.id}`} size={15} aria-hidden /></span>
            <div id={`${id}-copy-${domain.id}`} className={`overview-preview-domain-copy`}>
              <span id={`${id}-name-${domain.id}`} className={`overview-preview-domain`}>{domain.name}</span>
              <span id={`${id}-status-cell-${domain.id}`} className={`actionsCell overview-preview-status`}>
                <span id={`${id}-status-${domain.id}`} className={`rowStatus`}>
                  <span id={`${id}-status-wrap-${domain.id}`} className={`statusDotWrap`}><span id={`${id}-status-dot-${domain.id}`} className={`statusDot`} /></span>
                  <span id={`${id}-status-label-${domain.id}`} className={`statusText`}>{`Active`}</span>
                </span>
              </span>
            </div>
          </div>
          {inventory ? <span id={`${id}-registrar-${domain.id}`} className={`overview-preview-registrar`}>
            <span id={`${id}-registrar-mark-${domain.id}`} className={`overview-preview-registrar-mark${domain.registrar === `Hostinger` ? ` overview-preview-hostinger` : ``}`}>{domain.registrar.slice(0, 1)}</span>
            <span id={`${id}-registrar-label-${domain.id}`} className={`overview-preview-registrar-label`}>{domain.registrar}</span>
          </span> : <span id={`${id}-renewal-${domain.id}`} className={`overview-preview-renewal${domain.id === `sprout` ? ` overview-preview-renewal-soon` : ``}`}>{domain.renewal}</span>}
          <span id={`${id}-project-${domain.id}`} className={`overview-preview-extra`}>
            <span id={`${id}-project-label-${domain.id}`} className={`overview-preview-tag${domain.project === `Done` || !inventory ? ` overview-preview-tag-success` : ``}`}>{inventory ? domain.project : `On`}</span>
          </span>
          <span id={`${id}-cost-${domain.id}`} className={`overview-preview-price overview-preview-cost-column`}>{domain.cost}</span>
        </div>)}
      </div>
    </> : kind === `projects` ? <div id={`${id}-collection`} className={`overview-preview-collection`}>
      <div id={`${id}-collection-heading`} className={`overview-preview-collection-heading`}>
        <Layers3 id={`${id}-collection-icon`} size={17} aria-hidden />
        <span id={`${id}-collection-name`} className={`overview-preview-collection-name`}>{`Side Projects`}</span>
        <span id={`${id}-collection-count`} className={`overview-preview-count`}>{`2 Domains`}</span>
        <Star id={`${id}-collection-star`} size={13} aria-hidden />
      </div>
      <div id={`${id}-progress`} className={`overview-preview-progress`}>
        <span id={`${id}-progress-label`} className={`overview-preview-muted`}>{`Project Progress`}</span>
        <span id={`${id}-progress-track`} className={`overview-preview-progress-track`}><span id={`${id}-progress-fill`} className={`overview-preview-progress-fill`} /></span>
        <span id={`${id}-progress-value`} className={`overview-preview-muted`}>{`82%`}</span>
      </div>
      {overviewPreviewGroups.map(group => <div key={group.id} id={`${id}-group-${group.id}`} className={`overview-preview-group`}>
        <div id={`${id}-group-heading-${group.id}`} className={`overview-preview-group-heading`}>
          <ChevronDown id={`${id}-group-icon-${group.id}`} size={13} aria-hidden />
          <span id={`${id}-group-name-${group.id}`} className={`overview-preview-group-name`}>{group.name}</span>
          <span id={`${id}-group-count-${group.id}`} className={`overview-preview-muted`}>{`1 Domain`}</span>
        </div>
        <div id={`${id}-project-row-${group.id}`} className={`overview-preview-project`}>
          <Globe2 id={`${id}-project-icon-${group.id}`} size={15} aria-hidden className={`overview-preview-icon`} />
          <span id={`${id}-project-name-${group.id}`} className={`overview-preview-domain`}>{group.domain}</span>
          <span id={`${id}-project-tag-${group.id}`} className={`overview-preview-tag`}>{group.tag}</span>
          <span id={`${id}-github-${group.id}`} className={`overview-preview-project-link overview-preview-extra`}><GitBranch id={`${id}-github-icon-${group.id}`} size={13} aria-hidden /><span id={`${id}-github-label-${group.id}`}>{`GitHub`}</span></span>
          <span id={`${id}-project-link-${group.id}`} className={`overview-preview-project-link`}><ExternalLink id={`${id}-link-icon-${group.id}`} size={12} aria-hidden /><span id={`${id}-link-label-${group.id}`}>{group.link}</span></span>
        </div>
      </div>)}
    </div> : <>
      <div id={`${id}-discovery-heading`} className={`overview-preview-discovery-heading`}>
        <TrendingUp id={`${id}-trending-icon`} size={17} aria-hidden className={`overview-preview-icon`} />
        <span id={`${id}-trending-title`} className={`overview-preview-section-title`}>{`Trending Domains`}</span>
        <span id={`${id}-trending-caption`} className={`overview-preview-muted`}>{`Compare Registrar Quotes`}</span>
      </div>
      <div id={`${id}-categories`} className={`overview-preview-categories`}>
        {overviewPreviewCategories.map((category, index) => {
          const CategoryIcon = categoryIcons[category];
          return <span key={category} id={`${id}-category-${index}`} className={`overview-preview-category overview-preview-category-${category.toLowerCase()}${index === 0 ? ` overview-preview-category-active` : ``}`}><CategoryIcon id={`${id}-category-icon-${index}`} size={12} aria-hidden /><span id={`${id}-category-label-${index}`}>{category}</span></span>;
        })}
      </div>
      <div id={`${id}-results`} className={`overview-preview-results`}>
        {overviewPreviewQuotes.map(quote => {
          const CategoryIcon = categoryIcons[quote.category];
          return <div key={quote.id} id={`${id}-result-${quote.id}`} className={`overview-preview-result overview-preview-result-${quote.tone}`}>
            <div id={`${id}-result-heading-${quote.id}`} className={`overview-preview-result-heading`}>
              <span id={`${id}-result-name-${quote.id}`} className={`overview-preview-result-name`}>{quote.name}</span>
              <Star id={`${id}-watch-icon-${quote.id}`} size={13} aria-hidden className={`overview-preview-watch`} />
              <div id={`${id}-result-badges-${quote.id}`} className={`overview-preview-result-badges`}>
                <span id={`${id}-result-category-${quote.id}`} className={`overview-preview-badge`}><CategoryIcon id={`${id}-result-category-icon-${quote.id}`} size={11} aria-hidden /><span id={`${id}-result-category-label-${quote.id}`}>{quote.category}</span></span>
                <span id={`${id}-result-words-${quote.id}`} className={`overview-preview-word-badge`}>{`2 Words`}</span>
              </div>
            </div>
            <div id={`${id}-quote-grid-${quote.id}`} className={`overview-preview-quote-grid`}>
              <span id={`${id}-quote-platform-heading-${quote.id}`} className={`overview-preview-muted`}>{`Platform`}</span><span id={`${id}-quote-price-heading-${quote.id}`} className={`overview-preview-muted`}>{`Reg. /yr`}</span>
              <span id={`${id}-quote-platform-${quote.id}`} className={`overview-preview-provider`}>{`GoDaddy`}</span><span id={`${id}-quote-price-${quote.id}`} className={`overview-preview-price`}>{quote.cost}</span>
              <span id={`${id}-quote-alternative-platform-${quote.id}`} className={`overview-preview-provider`}>{`Hostinger`}</span><span id={`${id}-quote-alternative-price-${quote.id}`} className={`overview-preview-price`}>{quote.alternative}</span>
            </div>
            <div id={`${id}-result-compare-${quote.id}`} className={`overview-preview-compare`}><span id={`${id}-compare-label-${quote.id}`}>{`Full Comparison`}</span><ChevronDown id={`${id}-compare-icon-${quote.id}`} size={11} aria-hidden /></div>
          </div>;
        })}
      </div>
    </>}
    <div id={`${id}-footer`} className={`overview-preview-footer`}>{footerLabels[kind]}</div>
  </div>;
};

export default memo(LandingOverviewPreview);
