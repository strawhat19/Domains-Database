import TrendChart from '../AdminCharts';
import GitHubIdentity from './github-identity';
import { createStyles } from './styles.native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useAuth } from '../../shared/authContext/useAuth';
import { exportReport } from '../AdminAnalytics/exportReport';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getGitHubLanguageIdentity } from './github-identity/data';
import { Text, View, Linking, Pressable, ScrollView } from 'react-native';
import { useGitHubAnalytics } from '../../shared/analytics/useGitHubAnalytics';
import type { GitHubPeriod, GitHubSection } from '../../shared/analytics/github.types';
import { AdminStats, StatusCell, AdminButton, AdminLoading, useAdminWidgetStyles } from '../AdminWidgets';
import { Eye, Tag, Copy, Hash, Info, List, Star, Clock3, Users, Code2, GitFork, GitBranch, Download, BarChart3, RotateCcw, ArrowUpRight, CalendarDays, CircleDot, GitCommitHorizontal } from 'lucide-react-native';

type Metric = `commits` | `views` | `clones`;
const hasValue = (value: number | null | undefined): value is number => typeof value === `number` && Number.isFinite(value);
const count = (value: number | null | undefined) => hasValue(value) ? new Intl.NumberFormat().format(value) : `—`;
const dateLabel = (value: string | null, full = false) => value ? new Date(value).toLocaleDateString(undefined, { day: `numeric`, month: `short`, ...(full ? { year: `numeric` } : {}), timeZone: `UTC` }) : `Unavailable`;
const timeLabel = (value: string) => new Date(value).toLocaleString(undefined, { timeZone: `UTC` });
const metricLabels: Record<Metric, string> = { views: `Repository Views`, clones: `Clones`, commits: `Commits` };
const metricIcons: Record<Metric, LucideIcon> = { views: Eye, clones: Copy, commits: GitCommitHorizontal };
const sectionLabels: Record<GitHubSection, string> = { views: `Repository Views`, clones: `Clones`, commits: `Commits`, releases: `Releases`, languages: `Languages` };
const sectionIcons: Record<GitHubSection, LucideIcon> = { views: Eye, clones: Copy, commits: GitCommitHorizontal, releases: Tag, languages: Code2 };

const LeadingIcon = ({ id, Icon }: { id: string; Icon: LucideIcon }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`admin-github-icon-slot`, id)} style={styles.iconSlot} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
    <Icon {...elementProps(`admin-github-leading-icon`, id)} size={15} color={palette.accent} />
  </View>;
};

const IconLabel = ({ id, Icon, label, small = false }: { id: string; Icon: LucideIcon; label: string; small?: boolean }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`admin-github-icon-label`, id)} style={styles.identityLabel}>
    <LeadingIcon id={id} Icon={Icon} />
    <Text {...elementProps(`admin-github-icon-label-text`, id)} style={[small ? styles.small : styles.copy, styles.flexText]} selectable>{label}</Text>
  </View>;
};

const GitHubPanel = ({ id, title, note, Icon, repository = false, children }: { id: string; title: string; note?: string; Icon?: LucideIcon; repository?: boolean; children: ReactNode }) => {
  const { palette, styles: widgetStyles } = useAdminWidgetStyles();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`admin-panel`, id)} style={widgetStyles.panel}>
    <View {...elementProps(`admin-panel-heading`, id)} style={[widgetStyles.panelHeading, styles.panelHeading]}>
      <View {...elementProps(`admin-github-panel-title-row`, id)} style={styles.panelTitleRow}>
        {repository ? <GitHubIdentity id={`${id}-identity`} kind={`github`} large /> : Icon ? <LeadingIcon id={`${id}-title`} Icon={Icon} /> : null}
        <Text {...elementProps(`admin-panel-title`, id)} style={[widgetStyles.panelTitle, styles.flexText]} accessibilityRole={`header`}>{title}</Text>
      </View>
      {note ? <Text {...elementProps(`admin-panel-note`, id)} style={widgetStyles.small}>{note}</Text> : null}
    </View>
    <View {...elementProps(`admin-panel-body`, id)} style={widgetStyles.panelBody}>{children}</View>
  </View>;
};

const Choice = ({ id, label, selected, Icon, onPress }: { id: string; label: string; selected: boolean; Icon?: LucideIcon; onPress: () => void }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <Pressable
    {...elementProps(`admin-github-choice`, id)}
    onPress={onPress}
    accessibilityRole={`button`}
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    style={[styles.choice, selected && styles.selected]}
  >
    {Icon ? <LeadingIcon id={`choice-${id}`} Icon={Icon} /> : null}
    <Text {...elementProps(`admin-github-choice-label`, id)} style={styles.label}>{label}</Text>
  </Pressable>;
};

const AdminGitHub = (_props: { headingActionsTarget?: HTMLElement | null }) => {
  const { user } = useAuth();
  const { palette } = useTheme();
  const state = useGitHubAnalytics(user);
  const [metric, setMetric] = useState<Metric>(`commits`);
  const [actionError, setActionError] = useState(``);
  const [presentation, setPresentation] = useState<`chart` | `list`>(`chart`);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { report, loading, error } = state;
  const points = useMemo(() => report?.trend.flatMap(point => {
    const value = point[metric];
    return hasValue(value) ? [{ label: dateLabel(point.date), value }] : [];
  }) ?? [], [metric, report]);
  const missingPoints = (report?.trend.length ?? 0) - points.length;
  const trafficRange = report ? `${dateLabel(report.traffic.from)} – ${dateLabel(report.traffic.to)} · UTC` : ``;
  const maximumContributions = Math.max(1, ...(report?.contributors.map(contributor => contributor.commits) ?? []));
  const languageBytes = report?.languages.reduce((total, language) => total + language.bytes, 0) ?? 0;
  const languageColors = [palette.accent, palette.success, palette.warning, palette.danger, palette.muted];
  const languageColor = (name: string, index: number) => {
    const color = getGitHubLanguageIdentity(name)?.color;
    return color === `currentColor` ? palette.ink : color ?? languageColors[index % languageColors.length];
  };
  const setupError = error?.code.includes(`configured`) || error?.code.includes(`configuration`);
  const webRequired = error?.code === `admin_web_reporting_required`;
  const openGitHub = async (url: string) => {
    setActionError(``);
    try {
      const target = new URL(url);
      if (target.protocol !== `https:` || target.hostname !== `github.com`) throw new Error();
      await Linking.openURL(target.href);
    } catch { setActionError(`GitHub Link Could Not Be Opened`); }
  };
  const saveReport = async () => {
    if (!report) return;
    setActionError(``);
    try { await exportReport(`${report.repository.name}-github-${report.range.from}-${report.range.to}`, report); }
    catch { setActionError(`Report Could Not Be Exported`); }
  };
  return <View {...elementProps(`admin-github`)} style={styles.root}>
    <View {...elementProps(`admin-github-toolbar`)} style={styles.toolbar}>
      <View {...elementProps(`admin-github-heading`)} style={styles.heading}>
        <GitHubIdentity id={`github-heading`} kind={`github`} />
        <Text {...elementProps(`admin-github-title`)} style={styles.title} accessibilityRole={`header`}>{`GitHub`}</Text>
        {report ? <StatusCell id={`github-source`} label={`GitHub REST API`} /> : null}
      </View>
      <View {...elementProps(`admin-github-actions`)} style={styles.controls}>
        <AdminButton id={`github-refresh`} Icon={RotateCcw} label={`Refresh`} disabled={loading} onPress={state.refresh} />
        <AdminButton id={`github-export`} Icon={Download} label={`Export JSON`} disabled={loading || !report} onPress={() => { void saveReport(); }} />
      </View>
    </View>
    <View {...elementProps(`admin-github-periods`)} style={styles.controls} accessibilityLabel={`GitHub Reporting Period`}>
      {([7, 14, 30, 90] as GitHubPeriod[]).map(period => <Choice key={period} id={`period-${period}`} Icon={CalendarDays} label={`${period} Days`} selected={state.period === period} onPress={() => state.setPeriod(period)} />)}
    </View>
    {error ? <GitHubPanel id={`github-unavailable`} Icon={Info} title={webRequired ? `GitHub Reporting On Web` : setupError ? `Connect GitHub Reporting` : `GitHub Reporting Unavailable`}>
      <Text {...elementProps(`admin-github-error`)} style={styles.error} accessibilityRole={`alert`}>{error.message}</Text>
      {!webRequired ? <Text {...elementProps(`admin-github-connection-note`)} style={styles.copy}>{`Reports Use The Repository Connection And Your Admin Session`}</Text> : null}
      <AdminButton id={`github-retry`} Icon={RotateCcw} label={`Retry`} disabled={loading} onPress={state.refresh} />
    </GitHubPanel> : null}
    {actionError ? <Text {...elementProps(`admin-github-action-error`)} style={styles.error} accessibilityRole={`alert`}>{actionError}</Text> : null}
    {loading ? <AdminLoading id={`github`} label={`Loading GitHub Repository Data`} /> : null}
    {report ? <>
      <GitHubPanel id={`github-repository`} title={report.repository.fullName} note={`Current Repository Snapshot`} repository>
        {!!report.repository.description && <Text {...elementProps(`admin-github-description`)} style={styles.copy} selectable>{report.repository.description}</Text>}
        <View {...elementProps(`admin-github-repository-meta`)} style={styles.toolbar}>
          <View {...elementProps(`admin-github-repository-details`)} style={styles.controls}>
            <StatusCell id={`github-visibility`} tone={report.repository.private ? `gray` : `green`} label={report.repository.private ? `Private` : `Public`} />
            <IconLabel id={`branch`} Icon={GitBranch} label={`Branch: ${report.repository.defaultBranch}`} />
            <IconLabel id={`pushed`} Icon={Clock3} label={`Last Push: ${dateLabel(report.repository.pushedAt, true)} · UTC`} />
          </View>
          <AdminButton id={`github-repository-open`} Icon={ArrowUpRight} label={`Open Repository`} onPress={() => { void openGitHub(report.repository.url); }} />
        </View>
      </GitHubPanel>
      <AdminStats id={`github-period`} stats={[
        { id: `commits`, Icon: GitCommitHorizontal, label: `Commits`, value: count(report.totals.commits), hint: `${dateLabel(report.range.from)} – ${dateLabel(report.range.to)} · Default Branch` },
        { id: `views`, Icon: Eye, label: `Repository Views`, value: count(report.traffic.views), hint: trafficRange },
        { id: `clones`, Icon: Copy, label: `Clones`, value: count(report.traffic.clones), hint: trafficRange },
      ]} />
      <AdminStats id={`github-snapshot`} stats={[
        { id: `stars`, Icon: Star, label: `Stars`, value: count(report.repository.stars), hint: `Current Repository Total` },
        { id: `forks`, Icon: GitFork, label: `Forks`, value: count(report.repository.forks), hint: `Current Repository Total` },
        { id: `subscribers`, Icon: Eye, label: `Watchers`, value: count(report.repository.subscribers), hint: `Current Repository Total` },
        { id: `issues`, Icon: CircleDot, label: `Open Issues + PRs`, value: count(report.repository.openIssues), hint: `Current Repository Total` },
      ]} />
      <GitHubPanel id={`github-trend`} Icon={BarChart3} title={`Repository Activity`} note={`${dateLabel(report.range.from)} – ${dateLabel(report.range.to)} · UTC`}>
        <View {...elementProps(`admin-github-trend-controls`)} style={styles.toolbar}>
          <View {...elementProps(`admin-github-metrics`)} style={styles.controls} accessibilityLabel={`Repository Activity Metric`}>
            {([`commits`, `views`, `clones`] as Metric[]).map(item => <Choice key={item} id={`metric-${item}`} Icon={metricIcons[item]} label={metricLabels[item]} selected={metric === item} onPress={() => setMetric(item)} />)}
          </View>
          <View {...elementProps(`admin-github-presentation`)} style={styles.controls} accessibilityLabel={`Activity Presentation`}>
            <Choice id={`presentation-chart`} label={`Chart`} Icon={BarChart3} selected={presentation === `chart`} onPress={() => setPresentation(`chart`)} />
            <Choice id={`presentation-list`} label={`List`} Icon={List} selected={presentation === `list`} onPress={() => setPresentation(`list`)} />
          </View>
        </View>
        <IconLabel id={`metric-caption-${metric}`} Icon={metricIcons[metric]} label={`${metricLabels[metric]} · UTC`} />
        {presentation === `chart` ? points.length ? <TrendChart key={`${metric}-${report.range.from}-${report.range.to}`} id={`github-${metric}`} points={points} label={metricLabels[metric]} /> : <Text {...elementProps(`admin-github-trend-empty`, metric)} style={styles.copy}>{`No Measurements Available For This Metric`}</Text> : <ScrollView {...elementProps(`admin-github-trend-list`)} style={styles.table} nestedScrollEnabled>
          <View {...elementProps(`admin-github-trend-list-heading`)} style={styles.tableHeading}>
            <IconLabel id={`trend-date-title`} Icon={CalendarDays} label={`Day · UTC`} />
            <IconLabel id={`trend-value-title-${metric}`} Icon={metricIcons[metric]} label={metricLabels[metric]} />
          </View>
          {report.trend.map(point => <View key={point.date} {...elementProps(`admin-github-trend-list-row`, point.date)} style={styles.row} accessibilityLabel={`${dateLabel(point.date, true)} UTC: ${hasValue(point[metric]) ? `${count(point[metric])} ${metricLabels[metric]}` : `No Measurement`}`}>
            <Text {...elementProps(`admin-github-trend-list-date`, point.date)} style={styles.copy}>{dateLabel(point.date, true)}</Text>
            <Text {...elementProps(`admin-github-trend-list-value`, point.date)} style={styles.value}>{count(point[metric])}</Text>
          </View>)}
          {!report.trend.length ? <Text {...elementProps(`admin-github-trend-list-empty`)} style={styles.copy}>{`No Daily Measurements Available`}</Text> : null}
        </ScrollView>}
        <Text {...elementProps(`admin-github-trend-coverage`, metric)} style={styles.small}>{report.sections[metric].message}</Text>
        <Text {...elementProps(`admin-github-trend-missing`, metric)} style={styles.small}>{`— Means Unavailable${presentation === `chart` && missingPoints ? ` · ${count(missingPoints)} Unavailable Day(s) Excluded From Chart · List Retains Every Day` : ``}`}</Text>
      </GitHubPanel>
      <View {...elementProps(`admin-github-columns`)} style={styles.columns}>
        <View {...elementProps(`admin-github-column`, `contributors`)} style={styles.column}>
          <GitHubPanel id={`github-contributors`} Icon={Users} title={`Commit Authors`} note={`Commit Authors In This Range`}>
            {report.contributors.length ? <ScrollView {...elementProps(`admin-github-contributors-list`)} style={styles.table} nestedScrollEnabled>
              {report.contributors.map((contributor, index) => <View key={`${contributor.name}-${index}`} {...elementProps(`admin-github-contributor`, String(index))} style={styles.ranking} accessibilityLabel={`${contributor.name}: ${count(contributor.commits)} Commit(s) In Loaded Results`}>
                <View {...elementProps(`admin-github-contributor-heading`, String(index))} style={styles.toolbar}>
                  <View {...elementProps(`admin-github-contributor-identity`, String(index))} style={styles.identityLabel}>
                    <GitHubIdentity id={`contributor-${index}`} kind={`author`} name={contributor.name} avatarUrl={contributor.avatarUrl} />
                    <Text {...elementProps(`admin-github-contributor-name`, String(index))} style={[styles.label, styles.flexText]} selectable>{contributor.name}</Text>
                  </View>
                  <Text {...elementProps(`admin-github-contributor-count`, String(index))} style={styles.value}>{count(contributor.commits)}</Text>
                </View>
                <View {...elementProps(`admin-github-contributor-track`, String(index))} style={styles.track}><View {...elementProps(`admin-github-contributor-bar`, String(index))} style={[styles.bar, { width: `${contributor.commits / maximumContributions * 100}%` }]} /></View>
              </View>)}
            </ScrollView> : <Text {...elementProps(`admin-github-contributors-empty`)} style={styles.copy}>{`No Commit Authors In Loaded Results`}</Text>}
            <Text {...elementProps(`admin-github-contributors-coverage`)} style={styles.small}>{report.sections.commits.status === `partial` ? `Authors Reflect A Partial Commit Result · See Commit Coverage Below` : `Author Counts Reflect Loaded Commits In The Selected Range`}</Text>
          </GitHubPanel>
        </View>
        <View {...elementProps(`admin-github-column`, `languages`)} style={styles.column}>
          <GitHubPanel id={`github-languages`} Icon={Code2} title={`Languages`} note={`Current Repository Composition · Bytes`}>
            {report.languages.length ? <View {...elementProps(`admin-github-language-rankings`)} style={styles.languageRankings}>
              <View {...elementProps(`admin-github-language-composition`)} style={styles.composition} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
                {report.languages.map((language, index) => <View key={language.name} {...elementProps(`admin-github-language-segment`, language.name)} style={{ height: `100%`, width: `${languageBytes ? language.bytes / languageBytes * 100 : 0}%`, backgroundColor: languageColor(language.name, index) }} />)}
              </View>
              {report.languages.map((language, index) => {
                const color = languageColor(language.name, index);
                const percentage = languageBytes ? language.bytes / languageBytes * 100 : 0;
                return <View key={language.name} {...elementProps(`admin-github-language`, language.name)} style={styles.ranking} accessibilityLabel={`${language.name}: ${count(language.bytes)} Bytes · ${percentage.toFixed(1)}%`}>
                  <View {...elementProps(`admin-github-language-heading`, language.name)} style={styles.toolbar}>
                    <View {...elementProps(`admin-github-language-identity`, language.name)} style={styles.identityLabel}>
                      <GitHubIdentity id={`language-${language.name}`} kind={`language`} name={language.name} />
                      <View {...elementProps(`admin-github-language-color`, language.name)} style={[styles.colorKey, { backgroundColor: color }]} accessible={false} />
                      <Text {...elementProps(`admin-github-language-name`, language.name)} style={[styles.label, styles.flexText]}>{language.name}</Text>
                    </View>
                    <Text {...elementProps(`admin-github-language-value`, language.name)} style={styles.value}>{`${count(language.bytes)} · ${percentage.toFixed(1)}%`}</Text>
                  </View>
                  <View {...elementProps(`admin-github-language-track`, language.name)} style={styles.track}><View {...elementProps(`admin-github-language-bar`, language.name)} style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} /></View>
                </View>;
              })}
            </View> : <Text {...elementProps(`admin-github-languages-empty`)} style={styles.copy}>{report.sections.languages.message}</Text>}
          </GitHubPanel>
        </View>
      </View>
      <GitHubPanel id={`github-releases`} Icon={Tag} title={`Release Versions`} note={`${count(report.totals.releases)} Published Release(s) Loaded · Latest Repository Results`}>
        <ScrollView {...elementProps(`admin-github-release-list`)} style={styles.table} nestedScrollEnabled>
          {report.releases.map(release => <View key={release.id} {...elementProps(`admin-github-release`, release.id)} style={styles.card}>
            <View {...elementProps(`admin-github-release-heading`, release.id)} style={styles.cardHeading}>
              <View {...elementProps(`admin-github-release-title`, release.id)} style={styles.rowCopy}>
                <View {...elementProps(`admin-github-release-version`, release.id)} style={styles.identityLabel}>
                  <LeadingIcon id={`release-${release.id}-tag`} Icon={Tag} />
                  <Text {...elementProps(`admin-github-release-tag`, release.id)} style={[styles.value, styles.flexText]} selectable>{release.tag}</Text>
                </View>
                {!!release.name && release.name !== release.tag && <Text {...elementProps(`admin-github-release-name`, release.id)} style={styles.copy} selectable>{release.name}</Text>}
              </View>
              <StatusCell id={`github-release-${release.id}`} label={release.prerelease ? `Prerelease` : `Release`} tone={release.prerelease ? `gray` : `green`} />
            </View>
            <View {...elementProps(`admin-github-release-details`, release.id)} style={styles.toolbar}>
              <View {...elementProps(`admin-github-release-meta`, release.id)} style={styles.controls}>
                <IconLabel id={`release-${release.id}-date`} Icon={CalendarDays} label={`${dateLabel(release.publishedAt, true)} · UTC`} small />
                <IconLabel id={`release-${release.id}-downloads`} Icon={Download} label={`${count(release.downloads)} Asset Download(s)`} small />
              </View>
              <AdminButton id={`github-release-open-${release.id}`} Icon={ArrowUpRight} label={`View Release`} onPress={() => { void openGitHub(release.url); }} />
            </View>
          </View>)}
          {!report.releases.length ? <Text {...elementProps(`admin-github-releases-empty`)} style={styles.copy}>{report.sections.releases.message}</Text> : null}
        </ScrollView>
        <Text {...elementProps(`admin-github-releases-note`)} style={styles.small}>{`Asset Downloads Are Lifetime Counts For Uploaded Release Files · They Exclude Source Archives And Repository Clones`}</Text>
      </GitHubPanel>
      <GitHubPanel id={`github-commits`} Icon={GitCommitHorizontal} title={`Recent Commits`} note={`Selected Range · Default Branch · Loaded Results`}>
        <ScrollView {...elementProps(`admin-github-commit-list`)} style={styles.table} nestedScrollEnabled>
          {report.commits.map(commit => <View key={commit.sha} {...elementProps(`admin-github-commit`, commit.sha)} style={styles.card}>
            <View {...elementProps(`admin-github-commit-title`, commit.sha)} style={styles.identityLabel}>
              <LeadingIcon id={`commit-${commit.sha}-message`} Icon={GitCommitHorizontal} />
              <Text {...elementProps(`admin-github-commit-message`, commit.sha)} style={[styles.label, styles.flexText]} selectable>{commit.message}</Text>
            </View>
            <View {...elementProps(`admin-github-commit-details`, commit.sha)} style={styles.toolbar}>
              <View {...elementProps(`admin-github-commit-meta`, commit.sha)} style={styles.controls}>
                <IconLabel id={`commit-${commit.sha}-sha`} Icon={Hash} label={commit.sha.slice(0, 7)} small />
                <IconLabel id={`commit-${commit.sha}-date`} Icon={CalendarDays} label={`${dateLabel(commit.date, true)} · UTC`} small />
              </View>
              <AdminButton id={`github-commit-open-${commit.sha}`} Icon={ArrowUpRight} label={`View Commit`} onPress={() => { void openGitHub(commit.url); }} />
            </View>
          </View>)}
          {!report.commits.length ? <Text {...elementProps(`admin-github-commits-empty`)} style={styles.copy}>{report.sections.commits.message}</Text> : null}
        </ScrollView>
      </GitHubPanel>
      <GitHubPanel id={`github-coverage`} Icon={Info} title={`Source, Freshness And Coverage`}>
        <IconLabel id={`source`} Icon={Code2} label={`${report.source} · API ${report.apiVersion} · ${report.repository.fullName}`} />
        <IconLabel id={`freshness`} Icon={Clock3} label={`Fetched ${timeLabel(report.fetchedAt)} UTC · Cache Expires ${timeLabel(report.cacheExpiresAt)} UTC`} />
        <IconLabel id={`traffic-window`} Icon={CalendarDays} label={`Traffic Coverage: ${trafficRange} · GitHub Retains Up To 14 Days Of Repository Traffic`} />
        <Text {...elementProps(`admin-github-unique-traffic`)} style={styles.small}>{`GitHub Traffic Window: ${count(report.traffic.uniqueVisitors)} Unique Visitor(s) · ${count(report.traffic.uniqueCloners)} Unique Cloner(s)`}</Text>
        <View {...elementProps(`admin-github-section-coverage`)} style={styles.coverage}>
          {(Object.keys(sectionLabels) as GitHubSection[]).map(section => <View key={section} {...elementProps(`admin-github-coverage-item`, section)} style={styles.section}>
            <View {...elementProps(`admin-github-coverage-heading`, section)} style={styles.identityLabel}>
              <LeadingIcon id={`coverage-${section}`} Icon={sectionIcons[section]} />
              <StatusCell id={`github-coverage-${section}`} tone={report.sections[section].status === `ready` ? `green` : `gray`} label={sectionLabels[section]} />
            </View>
            <Text {...elementProps(`admin-github-coverage-message`, section)} style={styles.small}>{report.sections[section].message}</Text>
          </View>)}
        </View>
        {report.warnings.map((warning, index) => <Text key={`${warning}-${index}`} {...elementProps(`admin-github-warning`, String(index))} style={styles.warning}>{warning}</Text>)}
      </GitHubPanel>
    </> : null}
  </View>;
};

export default AdminGitHub;
