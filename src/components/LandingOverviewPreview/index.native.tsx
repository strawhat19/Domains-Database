import { Text, View } from 'react-native';
import { memo, useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { overviewPreviewPanels, overviewPreviewGroups, overviewPreviewQuotes, overviewPreviewDomains, overviewPreviewCategories, type OverviewPreviewKind } from './content';
import { Globe2, Search, Filter, Layers3, Compass, CalendarDays, ChevronDown, Plus, List, LayoutGrid, Flame, Sparkles, TrendingUp, Star, GitBranch, ExternalLink } from 'lucide-react-native';

const panelIcons = { inventory: Globe2, projects: Layers3, discovery: Compass, renewals: CalendarDays };
const categoryIcons = { Hot: Flame, New: Sparkles, Trending: TrendingUp, All: LayoutGrid, Value: Globe2, Short: Filter };
const footerLabels = { inventory: `3 Sample Domains · Illustrative USD Costs`, renewals: `Sample Dates · Illustrative USD Costs`, projects: `1 Sample Collection · 2 Groups`, discovery: `Fictional Names · Illustrative USD Quotes · No Availability Check` };

const LandingOverviewPreview = ({ kind, scope }: { kind: OverviewPreviewKind; scope?: string }) => {
  const { palette } = useTheme();
  const [compact, setCompact] = useState(true);
  const styles = useMemo(() => createStyles(palette, compact), [palette, compact]);
  const panel = overviewPreviewPanels[kind];
  const HeaderIcon = panelIcons[kind];
  const inventory = kind === `inventory`;
  const portfolio = inventory || kind === `renewals`;
  const categories = compact ? overviewPreviewCategories.slice(0, 4) : overviewPreviewCategories;
  const quotes = compact ? overviewPreviewQuotes.slice(0, 2) : overviewPreviewQuotes;
  const props = (part: string, id?: string) => elementProps(`landing-overview-preview-${part}`, `${scope ?? kind}${id ? `-${id}` : ``}`);

  return <View
    accessible
    pointerEvents={`none`}
    accessibilityRole={`image`}
    accessibilityLabel={panel.label}
    {...props(`panel`)}
    style={styles.panel}
    onLayout={event => setCompact(event.nativeEvent.layout.width <= 560)}
  >
    <View {...props(`header`)} style={styles.header}>
      <HeaderIcon size={compact ? 15 : 17} color={palette.accent} accessible={false} {...props(`header-icon`)} />
      <Text numberOfLines={1} {...props(`title`)} style={styles.title}>{panel.title}</Text>
      <Text {...props(`sample`)} style={styles.sample}>{`Sample Preview`}</Text>
    </View>
    <View {...props(`toolbar`)} style={styles.toolbar}>
      <View {...props(`search`)} style={styles.search}>
        <Search size={14} color={palette.accent} accessible={false} {...props(`search-icon`)} />
        <Text numberOfLines={1} {...props(`search-label`)} style={styles.searchText}>{panel.search}</Text>
      </View>
      {portfolio ? <>
        <View {...props(`filter`)} style={styles.tool}><Filter size={13} color={palette.accent} accessible={false} {...props(`filter-icon`)} /><Text {...props(`filter-label`)} style={styles.toolText}>{`Filters`}</Text></View>
        {!compact && <View {...props(`views`)} style={styles.views}><List size={14} color={palette.accent} accessible={false} {...props(`table-icon`)} /><LayoutGrid size={14} color={palette.muted} accessible={false} {...props(`board-icon`)} /></View>}
      </> : <View {...props(`primary-action`)} style={styles.primary}>
        {kind === `discovery` ? <Search size={13} color={palette.contrast} accessible={false} {...props(`action-icon`)} /> : <Plus size={13} color={palette.contrast} accessible={false} {...props(`action-icon`)} />}
        <Text {...props(`action-label`)} style={styles.primaryText}>{kind === `discovery` ? `Search` : `Collection`}</Text>
      </View>}
    </View>
    {portfolio ? <>
      <View {...props(`summary`)} style={styles.summary}>
        {(inventory ? [[`Domains`, `3`], [`Registrars`, `2`], [`Annual Cost`, `$38.97`]] : [[`Annual Cost`, `$38.97`], [`Next Renewal`, `Nov 08`], [`Auto Renew`, `On`]]).map(([label, value], index) => <View key={label} {...props(`metric`, String(index))} style={styles.metric}>
          <Text {...props(`metric-value`, String(index))} style={styles.summaryValue}>{value}</Text>
          <Text {...props(`metric-label`, String(index))} style={styles.detail}>{label}</Text>
        </View>)}
      </View>
      <View {...props(`columns`)} style={styles.columns}>
        <Text {...props(`domain-heading`)} style={[styles.columnLabel, styles.domainColumn]}>{`Domain`}</Text>
        <Text {...props(`detail-heading`)} style={[styles.columnLabel, styles.registrarColumn]}>{inventory ? `Registrar` : `Renewal Date`}</Text>
        {!compact && <Text {...props(`project-heading`)} style={[styles.columnLabel, styles.projectColumn]}>{inventory ? `Project Status` : `Auto Renew`}</Text>}
        <Text {...props(`cost-heading`)} style={[styles.columnLabel, styles.costColumn]}>{`Annual Cost`}</Text>
      </View>
      <View {...props(`rows`)} style={styles.rows}>
        {overviewPreviewDomains.map(domain => <View key={domain.id} {...props(`row`, domain.id)} style={styles.row}>
          <View {...props(`identity`, domain.id)} style={[styles.identity, styles.domainColumn]}>
            {!compact && <View {...props(`site`, domain.id)} style={styles.site}><Globe2 size={15} color={palette.accent} accessible={false} {...props(`site-icon`, domain.id)} /></View>}
            <View {...props(`domain-copy`, domain.id)} style={styles.copy}>
              <Text numberOfLines={1} {...props(`domain-name`, domain.id)} style={styles.domainName}>{domain.name}</Text>
              <View {...props(`actionsCell`, domain.id)} style={styles.actionsCell}>
                <View {...props(`rowStatus`, domain.id)} style={styles.rowStatus}>
                  <View {...props(`statusDotWrap`, domain.id)} style={styles.statusDotWrap}><View {...props(`statusDot`, domain.id)} style={styles.statusDot} /></View>
                  <Text {...props(`statusText`, domain.id)} style={styles.statusText}>{`Active`}</Text>
                </View>
              </View>
            </View>
          </View>
          {inventory ? <View {...props(`registrar`, domain.id)} style={[styles.registrar, styles.registrarColumn]}>
            <View {...props(`registrar-mark`, domain.id)} style={[styles.registrarMark, domain.registrar === `Hostinger` && styles.hostingerMark]}><Text {...props(`registrar-initial`, domain.id)} style={[styles.registrarInitial, domain.registrar === `Hostinger` && styles.accentText]}>{domain.registrar.slice(0, 1)}</Text></View>
            <Text numberOfLines={1} {...props(`registrar-label`, domain.id)} style={styles.registrarText}>{domain.registrar}</Text>
          </View> : <Text {...props(`renewal-date`, domain.id)} style={[styles.renewalDate, styles.registrarColumn, domain.id === `sprout` && styles.warningText]}>{domain.renewal}</Text>}
          {!compact && <View {...props(`project`, domain.id)} style={styles.projectColumn}><Text numberOfLines={1} {...props(`project-label`, domain.id)} style={[styles.tag, (domain.project === `Done` || !inventory) && styles.successTag]}>{inventory ? domain.project : `On`}</Text></View>}
          <Text {...props(`cost`, domain.id)} style={[styles.cost, styles.costColumn]}>{domain.cost}</Text>
        </View>)}
      </View>
    </> : kind === `projects` ? <View {...props(`collection-body`)} style={styles.collectionBody}>
      <View {...props(`collection-heading`)} style={styles.collection}>
        <Layers3 size={17} color={palette.success} accessible={false} {...props(`collection-icon`)} />
        <Text {...props(`collection-name`)} style={styles.collectionName}>{`Side Projects`}</Text>
        <Text {...props(`collection-count`)} style={styles.collectionCount}>{`2 Domains`}</Text>
        <Star size={13} color={palette.success} accessible={false} {...props(`collection-star`)} />
      </View>
      <View {...props(`progress`)} style={styles.progress}>
        <Text {...props(`progress-label`)} style={styles.detail}>{`Project Progress`}</Text>
        <View {...props(`progress-track`)} style={styles.progressTrack}><View {...props(`progress-fill`)} style={styles.progressFill} /></View>
        <Text {...props(`progress-value`)} style={styles.detail}>{`82%`}</Text>
      </View>
      {overviewPreviewGroups.map(group => <View key={group.id} {...props(`group`, group.id)} style={styles.group}>
        <View {...props(`group-heading`, group.id)} style={styles.groupHeading}>
          <ChevronDown size={13} color={palette.muted} accessible={false} {...props(`group-chevron`, group.id)} />
          <Text {...props(`group-name`, group.id)} style={styles.groupName}>{group.name}</Text>
          <Text {...props(`group-count`, group.id)} style={styles.detail}>{`1 Domain`}</Text>
        </View>
        <View {...props(`group-domain`, group.id)} style={styles.groupDomain}>
          <Globe2 size={15} color={palette.accent} accessible={false} {...props(`group-site-icon`, group.id)} />
          <Text numberOfLines={1} {...props(`group-domain-name`, group.id)} style={[styles.domainName, styles.flex]}>{group.domain}</Text>
          <Text {...props(`group-tag`, group.id)} style={styles.tag}>{group.tag}</Text>
          {!compact && <View {...props(`github-link`, group.id)} style={styles.projectLink}><GitBranch size={13} color={palette.accent} accessible={false} {...props(`github-icon`, group.id)} /><Text {...props(`github-label`, group.id)} style={styles.linkText}>{`GitHub`}</Text></View>}
          <View {...props(`project-link`, group.id)} style={styles.projectLink}><ExternalLink size={12} color={palette.accent} accessible={false} {...props(`link-icon`, group.id)} /><Text {...props(`link-label`, group.id)} style={styles.linkText}>{group.link}</Text></View>
        </View>
      </View>)}
    </View> : <>
      <View {...props(`discovery-heading`)} style={styles.discoveryHeading}>
        <TrendingUp size={17} color={palette.accent} accessible={false} {...props(`trending-icon`)} />
        <Text {...props(`trending-title`)} style={styles.sectionTitle}>{`Trending Domains`}</Text>
        {!compact && <Text {...props(`trending-caption`)} style={styles.detail}>{`Compare Registrar Quotes`}</Text>}
      </View>
      <View {...props(`categories`)} style={styles.categories}>
        {categories.map((category, index) => {
          const CategoryIcon = categoryIcons[category];
          const color = category === `Hot` ? palette.warning : category === `New` || category === `Value` ? palette.success : category === `All` || category === `Trending` ? palette.accent : palette.muted;
          return <View key={category} {...props(`category`, category.toLowerCase())} style={[styles.category, index === 0 && styles.activeCategory]}><CategoryIcon size={12} color={color} accessible={false} {...props(`category-icon`, category.toLowerCase())} /><Text {...props(`category-label`, category.toLowerCase())} style={[styles.categoryLabel, { color }]}>{category}</Text></View>;
        })}
      </View>
      <View {...props(`results`)} style={styles.results}>
        {quotes.map(quote => {
          const CategoryIcon = categoryIcons[quote.category];
          const color = quote.tone === `warning` ? palette.warning : quote.tone === `success` ? palette.success : palette.accent;
          const backgroundColor = quote.tone === `warning` ? palette.warningBackground : quote.tone === `success` ? palette.successBackground : palette.subtle;
          return <View key={quote.id} {...props(`result`, quote.id)} style={[styles.quote, { borderTopColor: color }]}>
            <View {...props(`result-heading`, quote.id)} style={[styles.quoteHeading, { backgroundColor }]}>
              <View {...props(`result-title`, quote.id)} style={styles.quoteTitle}>
                <Text numberOfLines={1} {...props(`result-name`, quote.id)} style={styles.quoteName}>{quote.name}</Text>
                <Star size={13} color={palette.muted} accessible={false} {...props(`watch-icon`, quote.id)} />
              </View>
              <View {...props(`result-badges`, quote.id)} style={styles.badges}>
                <View {...props(`result-category`, quote.id)} style={[styles.badge, { borderColor: color, backgroundColor }]}><CategoryIcon size={11} color={color} accessible={false} {...props(`result-category-icon`, quote.id)} /><Text {...props(`result-category-label`, quote.id)} style={[styles.badgeLabel, { color }]}>{quote.category}</Text></View>
                <Text {...props(`result-words`, quote.id)} style={styles.wordBadge}>{`2 Words`}</Text>
              </View>
            </View>
            <View {...props(`quote-grid`, quote.id)} style={styles.quoteGrid}>
              <View {...props(`quote-columns`, quote.id)} style={styles.quoteRow}><Text {...props(`quote-platform-heading`, quote.id)} style={styles.quoteDetail}>{`Platform`}</Text><Text {...props(`quote-price-heading`, quote.id)} style={styles.quoteDetail}>{`Reg. /yr`}</Text></View>
              <View {...props(`quote-primary`, quote.id)} style={styles.quoteRow}><Text {...props(`quote-platform`, quote.id)} style={styles.provider}>{`GoDaddy`}</Text><Text {...props(`quote-price`, quote.id)} style={styles.quoteCost}>{quote.cost}</Text></View>
              <View {...props(`quote-alternative`, quote.id)} style={styles.quoteRow}><Text {...props(`quote-alternative-platform`, quote.id)} style={styles.provider}>{`Hostinger`}</Text><Text {...props(`quote-alternative-price`, quote.id)} style={styles.quoteCost}>{quote.alternative}</Text></View>
            </View>
            <View {...props(`result-compare`, quote.id)} style={styles.compare}><Text {...props(`compare-label`, quote.id)} style={styles.compareText}>{`Full Comparison`}</Text><ChevronDown size={11} color={palette.accent} accessible={false} {...props(`compare-icon`, quote.id)} /></View>
          </View>;
        })}
      </View>
    </>}
    <View {...props(`footer`)} style={styles.footer}><Text {...props(`footer-label`)} style={styles.footerText}>{footerLabels[kind]}</Text></View>
  </View>;
};

export default memo(LandingOverviewPreview);
