import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Globe2, Folder, Search, Filter, Compass, Layers3, ChevronDown, CalendarDays } from 'lucide-react-native';
import { overviewPreviewPanels, overviewPreviewGroups, overviewPreviewQuotes, overviewPreviewDomains, type OverviewPreviewKind } from './content';

const panelIcons = { inventory: Globe2, projects: Layers3, discovery: Compass, renewals: CalendarDays };
const panelFooters = { inventory: `Showing 3 Of 3`, renewals: `Illustrative Costs`, projects: `1 Collection · 2 Groups`, discovery: `Illustrative Quotes` };

const LandingOverviewPreview = ({ kind }: { kind: OverviewPreviewKind }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const panel = overviewPreviewPanels[kind];
  const HeaderIcon = panelIcons[kind];
  const props = (part: string, id?: string) => elementProps(`landing-overview-preview-${part}`, `${kind}${id ? `-${id}` : ``}`);

  return <View accessible pointerEvents={`none`} accessibilityRole={`image`} accessibilityLabel={panel.label} {...props(`panel`)} style={styles.panel}>
    <View {...props(`header`)} style={styles.header}>
      <HeaderIcon size={11} color={palette.accent} accessible={false} {...props(`header-icon`)} />
      <Text numberOfLines={1} {...props(`title`)} style={styles.title}>{panel.title}</Text>
      <Text {...props(`sample`)} style={styles.sample}>{`Sample`}</Text>
    </View>
    <View {...props(`toolbar`)} style={styles.toolbar}>
      <View {...props(`search`)} style={styles.search}>
        <Search size={10} color={palette.muted} accessible={false} {...props(`search-icon`)} />
        <Text numberOfLines={1} {...props(`search-text`)} style={styles.searchText}>{panel.search}</Text>
      </View>
      <View {...props(`filter`)} style={styles.filter}><Filter size={11} color={palette.accent} accessible={false} {...props(`filter-icon`)} /></View>
    </View>
    <View {...props(`body`)} style={styles.body}>
      {kind === `inventory` && <>
        <View {...props(`summary`)} style={styles.summary}>
          <Text {...props(`total`)} style={styles.summaryValue}>{`3 Domains`}</Text>
          <Text {...props(`registrars`)} style={styles.detail}>{`2 Registrars`}</Text>
        </View>
        <View {...props(`columns`)} style={styles.columns}>
          <Text {...props(`domain-heading`)} style={[styles.columnLabel, styles.domainColumn]}>{`Domain`}</Text>
          <Text {...props(`registrar-heading`)} style={[styles.columnLabel, styles.registrarColumn]}>{`Registrar`}</Text>
        </View>
        {overviewPreviewDomains.map(domain => <View key={domain.id} {...props(`row`, domain.id)} style={styles.row}>
          <View {...props(`domain`, domain.id)} style={[styles.identity, styles.domainColumn]}>
            <Globe2 size={11} color={palette.accent} accessible={false} {...props(`site-icon`, domain.id)} />
            <View {...props(`domain-copy`, domain.id)} style={styles.copy}>
              <Text numberOfLines={1} {...props(`domain-name`, domain.id)} style={styles.domainName}>{domain.name}</Text>
              <View {...props(`status`, domain.id)} style={styles.status}>
                <View {...props(`status-dot`, domain.id)} style={styles.statusDot} />
                <Text {...props(`status-label`, domain.id)} style={styles.statusText}>{`Active`}</Text>
              </View>
            </View>
          </View>
          <View {...props(`registrar`, domain.id)} style={[styles.registrar, styles.registrarColumn]}>
            <View {...props(`registrar-mark`, domain.id)} style={[styles.registrarMark, domain.registrar === `Hostinger` && styles.hostingerMark]}>
              <Text {...props(`registrar-initial`, domain.id)} style={[styles.registrarInitial, domain.registrar === `Hostinger` && styles.hostingerInitial]}>{domain.registrar.slice(0, 1)}</Text>
            </View>
            <Text numberOfLines={1} {...props(`registrar-label`, domain.id)} style={styles.registrarText}>{domain.registrar}</Text>
          </View>
        </View>)}
      </>}
      {kind === `renewals` && <>
        <View {...props(`summary`)} style={styles.summary}>
          <Text {...props(`total`)} style={styles.summaryValue}>{`$38.97 / year`}</Text>
          <Text {...props(`cost-label`)} style={styles.detail}>{`Annual cost`}</Text>
        </View>
        <View {...props(`columns`)} style={styles.columns}>
          <Text {...props(`domain-heading`)} style={[styles.columnLabel, styles.domainColumn]}>{`Domain`}</Text>
          <Text {...props(`cost-heading`)} style={[styles.columnLabel, styles.cost]}>{`Annual cost`}</Text>
        </View>
        {overviewPreviewDomains.map((domain, index) => <View key={domain.id} {...props(`row`, domain.id)} style={styles.row}>
          <View {...props(`domain`, domain.id)} style={[styles.identity, styles.domainColumn]}>
            <CalendarDays size={11} color={index === 0 ? palette.warning : palette.muted} accessible={false} {...props(`date-icon`, domain.id)} />
            <View {...props(`domain-copy`, domain.id)} style={styles.copy}>
              <Text numberOfLines={1} {...props(`domain-name`, domain.id)} style={styles.domainName}>{domain.name}</Text>
              <Text {...props(`renewal-date`, domain.id)} style={[styles.detail, index === 0 && styles.warningText]}>{domain.renewal}</Text>
            </View>
          </View>
          <Text {...props(`annual-cost`, domain.id)} style={styles.cost}>{domain.cost}</Text>
        </View>)}
      </>}
      {kind === `projects` && <>
        <View {...props(`collection`)} style={styles.collection}>
          <Folder size={12} color={palette.success} accessible={false} {...props(`collection-icon`)} />
          <Text {...props(`collection-name`)} style={styles.collectionName}>{`Side Projects`}</Text>
          <Text {...props(`collection-count`)} style={styles.detail}>{`2`}</Text>
        </View>
        <View {...props(`progress`)} style={styles.progress}>
          <View {...props(`progress-track`)} style={styles.progressTrack}><View {...props(`progress-fill`)} style={styles.progressFill} /></View>
          <Text {...props(`progress-value`)} style={styles.progressValue}>{`50%`}</Text>
        </View>
        {overviewPreviewGroups.map(group => <View key={group.id} {...props(`group`, group.id)} style={styles.group}>
          <View {...props(`group-heading`, group.id)} style={styles.groupHeading}>
            <ChevronDown size={10} color={palette.muted} accessible={false} {...props(`group-chevron`, group.id)} />
            <Text {...props(`group-name`, group.id)} style={[styles.groupName, group.id === `building` && styles.accentText]}>{group.name}</Text>
          </View>
          <View {...props(`group-domain`, group.id)} style={styles.groupDomain}>
            <Globe2 size={10} color={palette.accent} accessible={false} {...props(`group-site-icon`, group.id)} />
            <Text numberOfLines={1} {...props(`group-domain-name`, group.id)} style={[styles.domainName, styles.flex]}>{group.domain}</Text>
            <Text {...props(`group-tag`, group.id)} style={styles.tag}>{group.tag}</Text>
          </View>
        </View>)}
      </>}
      {kind === `discovery` && <>
        <View {...props(`categories`)} style={styles.categories}>
          {[`All`, `Hot`, `Trending`].map((label, index) => <Text key={label} {...props(`category`, label.toLowerCase())} style={[styles.category, index === 0 && styles.activeCategory]}>{label}</Text>)}
        </View>
        {overviewPreviewQuotes.map(quote => <View key={quote.id} {...props(`quote`, quote.id)} style={styles.quote}>
          <View {...props(`quote-heading`, quote.id)} style={styles.quoteHeading}>
            <Text numberOfLines={1} {...props(`quote-name`, quote.id)} style={[styles.domainName, styles.flex]}>{quote.name}</Text>
            <Text {...props(`quote-cost`, quote.id)} style={styles.quoteCost}>{quote.cost}<Text {...props(`quote-period`, quote.id)} style={styles.detail}>{` /yr`}</Text></Text>
          </View>
          <View {...props(`quote-details`, quote.id)} style={styles.quoteDetails}>
            <Text {...props(`quote-category`, quote.id)} style={styles.tag}>{quote.category}</Text>
            <View {...props(`quote-status`, quote.id)} style={styles.status}>
              <View {...props(`quote-status-dot`, quote.id)} style={styles.statusDot} />
              <Text {...props(`quote-available`, quote.id)} style={styles.statusText}>{`Available`}</Text>
            </View>
            <Text {...props(`quote-compare`, quote.id)} style={styles.compareText}>{`Compare 2`}</Text>
          </View>
        </View>)}
      </>}
    </View>
    <View {...props(`footer`)} style={styles.footer}><Text {...props(`footer-label`)} style={styles.footerText}>{panelFooters[kind]}</Text></View>
  </View>;
};

export default LandingOverviewPreview;
