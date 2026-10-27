import './styles.scss';
import { createPortal } from 'react-dom';
import GitHubIdentity from './github-identity';
import { useState, type ReactNode } from 'react';
import { formatGitHubDate, formatGitHubCount } from './data';
import { useAuth } from '../../shared/authContext/useAuth';
import { getGitHubLanguageIdentity } from './github-identity/data';
import { useGitHubAnalytics } from '../../shared/analytics/useGitHubAnalytics';
import type { GitHubPeriod, GitHubSection } from '../../shared/analytics/github.types';
import GitHubTrend, { githubMetrics, githubMetricIcons, type GitHubMetric } from './github-trend/github-trend';
import { Eye, Tag, Copy, List, Star, Clock3, Code2, Users, Globe, GitFork, CircleDot, Download, GitBranch, RefreshCw, BadgeCheck, ExternalLink, CalendarDays, LockKeyhole, FlaskConical, ChartNoAxesCombined, GitCommitHorizontal } from 'lucide-react';

const periods: GitHubPeriod[] = [7, 14, 30, 90];
const sectionLabels = { views: `Views`, clones: `Clones`, commits: `Commits`, releases: `Releases`, languages: `Languages` };
const dailyColumns = [
  { label: `Date`, Icon: CalendarDays },
  { label: `Commits`, Icon: GitCommitHorizontal },
  { label: `Views`, Icon: Eye },
  { label: `Unique Visitors`, Icon: Users },
  { label: `Clones`, Icon: Copy },
  { label: `Unique Cloners`, Icon: Users },
];
const releaseColumns = [
  { label: `Version`, Icon: Tag },
  { label: `Published (UTC)`, Icon: CalendarDays },
  { label: `Channel`, Icon: BadgeCheck },
  { label: `Asset Downloads`, Icon: Download },
];
const AdminGitHub = ({ headingTabs, headingActionsTarget }: { headingTabs?: ReactNode; headingActionsTarget?: HTMLElement | null }) => {
  const { period, report, error, loading, refresh, setPeriod } = useGitHubAnalytics(useAuth().user);
  const [metric, setMetric] = useState<GitHubMetric>(`commits`);
  const [presentation, setPresentation] = useState<`chart` | `list`>(`chart`);
  const [exportError, setExportError] = useState(``);
  const exportReport = () => {
    if (!report) return;
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: `application/json` }));
      const link = document.createElement(`a`);
      link.href = url;
      link.download = `domains-database-github-${report.range.from}-${report.range.to}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportError(``);
    } catch { setExportError(`GitHub Report Could Not Be Exported`); }
  };
  const actions = <>
    <button type={`button`} id={`github-export`} className={`dd-github-button`} disabled={!report || loading} onClick={exportReport}><Download size={14} aria-hidden={`true`} />Export JSON</button>
    <button type={`button`} id={`github-refresh`} className={`dd-github-button`} disabled={loading} onClick={refresh}><RefreshCw size={14} aria-hidden={`true`} />Refresh</button>
  </>;
  const trafficRange = report ? `${formatGitHubDate(report.traffic.from)} – ${formatGitHubDate(report.traffic.to)} · UTC` : ``;
  const metrics = report ? [
    { id: `commits`, label: `Commits`, Icon: GitCommitHorizontal, value: report.totals.commits, note: `${report.repository.defaultBranch} · Selected ${period} Days` },
    { id: `releases`, label: `Published Releases`, Icon: Tag, value: report.totals.releases, note: `Repository Release History` },
    { id: `views`, label: `Repository Views`, Icon: Eye, value: report.traffic.views, note: `${formatGitHubCount(report.traffic.uniqueVisitors)} Unique Visitors · Retained Window` },
    { id: `clones`, label: `Repository Clones`, Icon: Copy, value: report.traffic.clones, note: `${formatGitHubCount(report.traffic.uniqueCloners)} Unique Cloners · Retained Window` },
  ] : [];
  const languageTotal = report?.languages.reduce((total, language) => total + language.bytes, 0) ?? 0;
  const listedAuthorCommits = report?.contributors.reduce((total, author) => total + author.commits, 0) ?? 0;
  const authorMaximum = Math.max(1, ...(report?.contributors.map(author => author.commits) ?? []));
  const VisibilityIcon = report?.repository.private ? LockKeyhole : Globe;
  return <section id={`admin-github-analytics`} className={`dd-github`} aria-label={`GitHub Repository Analytics`} aria-busy={loading}>
    {headingTabs ? <div id={`github-dashboard-heading`} className={`dd-github-panel dd-github-dashboard-heading`}>
      <div id={`github-heading-copy`} className={`dd-github-heading-copy`}>
        <h2 id={`github-dashboard-title`} className={`dd-github-dashboard-title`}><GitBranch size={19} aria-hidden={`true`} />GitHub</h2>
        {headingTabs}
      </div>
      {!headingActionsTarget && <div id={`github-heading-actions`} className={`dd-github-actions`}>{actions}</div>}
    </div> : null}
    {headingActionsTarget ? createPortal(actions, headingActionsTarget) : !headingTabs && <div id={`github-heading-actions`} className={`dd-github-actions`}>{actions}</div>}
    <div id={`github-range-controls`} className={`dd-github-toolbar`}>
      <div id={`github-periods`} className={`dd-github-toggle`} aria-label={`Repository Reporting Period`}>{periods.map(days => <button key={days} type={`button`} id={`github-period-${days}`} className={`dd-github-option${period === days ? ` is-active` : ``}`} aria-pressed={period === days} onClick={() => setPeriod(days)}><CalendarDays id={`github-period-icon-${days}`} size={13} aria-hidden={`true`} />{days} Days</button>)}</div>
      <span id={`github-requested-range`} className={`dd-github-caption`}><CalendarDays id={`github-requested-range-icon`} size={14} aria-hidden={`true`} />{report ? `${formatGitHubDate(report.range.from)} – ${formatGitHubDate(report.range.to)} · UTC` : `Default Branch Activity`}</span>
    </div>
    {error && <div id={`github-error`} className={`dd-github-notice is-error`} role={`alert`}>{error.message}</div>}
    {exportError && <p id={`github-export-error`} className={`dd-github-notice is-error`} role={`alert`}>{exportError}</p>}
    {loading && <div id={`github-loading`} className={`dd-github-panel`} role={`status`} aria-label={`Loading GitHub Analytics`}><p id={`github-loading-label`} className={`dd-github-caption`}>Loading GitHub Repository Activity</p>{[0, 1, 2].map(index => <div key={index} id={`github-loading-skeleton-${index}`} className={`dd-github-skeleton`} />)}</div>}
    {report && <>
      <div id={`github-repository`} className={`dd-github-panel dd-github-repository`}>
        <GitHubIdentity id={`github-repository-icon`} kind={`github`} large />
        <div id={`github-repository-copy`} className={`dd-github-repository-copy`}>
          <a id={`github-repository-link`} href={report.repository.url} target={`_blank`} rel={`noreferrer`} className={`dd-github-title dd-github-link`}>{report.repository.fullName}<ExternalLink size={14} aria-hidden={`true`} /></a>
          {report.repository.description && <p id={`github-repository-description`} className={`dd-github-caption`}>{report.repository.description}</p>}
          <div id={`github-repository-meta`} className={`dd-github-repository-meta`}>
            <span id={`github-repository-visibility`} className={`dd-github-caption`}><VisibilityIcon id={`github-repository-visibility-icon`} size={14} aria-hidden={`true`} />{report.repository.private ? `Private` : `Public`}</span>
            <span id={`github-repository-branch`} className={`dd-github-caption`}><GitBranch id={`github-repository-branch-icon`} size={14} aria-hidden={`true`} />{report.repository.defaultBranch}</span>
            <span id={`github-repository-push`} className={`dd-github-caption`}><Clock3 id={`github-repository-push-icon`} size={14} aria-hidden={`true`} />Last Push {formatGitHubDate(report.repository.pushedAt, true)} UTC</span>
          </div>
        </div>
        <div id={`github-repository-stats`} className={`dd-github-repository-stats`}>
          <span id={`github-stars`} className={`dd-github-caption`}><Star id={`github-stars-icon`} size={14} aria-hidden={`true`} />{formatGitHubCount(report.repository.stars)} Stars</span>
          <span id={`github-forks`} className={`dd-github-caption`}><GitFork id={`github-forks-icon`} size={14} aria-hidden={`true`} />{formatGitHubCount(report.repository.forks)} Forks</span>
          <span id={`github-open-issues`} className={`dd-github-caption`}><CircleDot id={`github-open-issues-icon`} size={14} aria-hidden={`true`} />{formatGitHubCount(report.repository.openIssues)} Open Issues + PRs</span>
          <span id={`github-subscribers`} className={`dd-github-caption`}><Eye id={`github-subscribers-icon`} size={14} aria-hidden={`true`} />{formatGitHubCount(report.repository.subscribers)} Subscribers</span>
        </div>
      </div>
      <div id={`github-metrics`} className={`dd-github-metrics`}>{metrics.map(({ id, Icon, label, value, note }) => <div key={id} id={`github-metric-${id}`} className={`dd-github-panel dd-github-metric`}><span id={`github-metric-label-${id}`} className={`dd-github-caption`}><span id={`github-metric-visual-${id}`} className={`dd-github-metric-visual`} aria-hidden={`true`}><Icon id={`github-metric-icon-${id}`} size={15} /></span>{label}</span><strong id={`github-metric-value-${id}`} className={`dd-github-value`}>{formatGitHubCount(value)}</strong><span id={`github-metric-note-${id}`} className={`dd-github-caption`}>{note}</span></div>)}</div>
      <p id={`github-traffic-coverage`} className={`dd-github-caption`}>Traffic Window: {trafficRange}. GitHub retains up to 14 days. Daily unique counts are never added into period unique totals.</p>
      <div id={`github-section-statuses`} className={`dd-github-notices`}>{(Object.keys(report.sections) as GitHubSection[]).map(key => report.sections[key].status !== `ready` ? <p key={key} id={`github-section-status-${key}`} className={`dd-github-notice`} role={`status`}><strong id={`github-section-label-${key}`}>{sectionLabels[key]}: </strong>{report.sections[key].message}</p> : null)}{report.warnings.map((warning, index) => <p key={`${warning}-${index}`} id={`github-warning-${index}`} className={`dd-github-notice`} role={`status`}>{warning}</p>)}</div>
      <div id={`github-activity`} className={`dd-github-panel`}>
        <div id={`github-activity-heading`} className={`dd-github-panel-heading`}>
          <h3 id={`github-activity-title`} className={`dd-github-title`}><ChartNoAxesCombined id={`github-activity-icon`} size={16} aria-hidden={`true`} />Repository Activity</h3>
          <div id={`github-chart-controls`} className={`dd-github-controls`}>
            <div id={`github-metric-controls`} className={`dd-github-toggle`} aria-label={`Chart Metric`}>{([`commits`, `views`, `clones`] as const).map(value => {
              const Icon = githubMetricIcons[value];
              return <button key={value} type={`button`} id={`github-chart-metric-${value}`} className={`dd-github-option${metric === value ? ` is-active` : ``}`} aria-pressed={metric === value} onClick={() => setMetric(value)}><Icon id={`github-chart-metric-icon-${value}`} size={14} aria-hidden={`true`} />{githubMetrics[value]}</button>;
            })}</div>
            <div id={`github-presentation`} className={`dd-github-toggle`} aria-label={`Activity Presentation`}>{([`chart`, `list`] as const).map(value => {
              const Icon = value === `chart` ? ChartNoAxesCombined : List;
              return <button key={value} type={`button`} id={`github-presentation-${value}`} className={`dd-github-option${presentation === value ? ` is-active` : ``}`} aria-pressed={presentation === value} onClick={() => setPresentation(value)}><Icon id={`github-presentation-icon-${value}`} size={14} aria-hidden={`true`} />{value === `chart` ? `Chart` : `Daily Data`}</button>;
            })}</div>
          </div>
        </div>
        <p id={`github-activity-coverage`} className={`dd-github-caption`}>{report.sections[metric].message}</p>
        {presentation === `chart` ? <GitHubTrend points={report.trend} metric={metric} /> : <div id={`github-daily-scroll`} className={`dd-github-table-scroll`}><table id={`github-daily-data`} className={`dd-github-table`}><caption id={`github-daily-caption`} className={`dd-github-caption`}>Daily Data · UTC · — Means No Measurement</caption><thead id={`github-daily-head`}><tr id={`github-daily-head-row`}>{dailyColumns.map(({ label, Icon }, index) => <th key={label} id={`github-daily-column-${index}`} scope={`col`}><span id={`github-daily-column-label-${index}`} className={`dd-github-label`}><Icon id={`github-daily-column-icon-${index}`} size={14} aria-hidden={`true`} />{label}</span></th>)}</tr></thead><tbody id={`github-daily-body`}>{report.trend.map(point => <tr key={point.date} id={`github-daily-row-${point.date}`}><th id={`github-daily-date-${point.date}`} scope={`row`}><span id={`github-daily-date-label-${point.date}`} className={`dd-github-label`}><CalendarDays id={`github-daily-date-icon-${point.date}`} size={14} aria-hidden={`true`} />{formatGitHubDate(point.date)}</span></th>{([`commits`, `views`, `uniqueVisitors`, `clones`, `uniqueCloners`] as const).map(key => <td key={key} id={`github-daily-${key}-${point.date}`}>{formatGitHubCount(point[key])}</td>)}</tr>)}</tbody></table></div>}
      </div>
      <div id={`github-distributions`} className={`dd-github-columns`}>
        <div id={`github-languages`} className={`dd-github-panel`}>
          <h3 id={`github-languages-title`} className={`dd-github-title`}><Code2 id={`github-languages-icon`} size={16} aria-hidden={`true`} />Languages</h3>
          <p id={`github-languages-caption`} className={`dd-github-caption`}>Current Repository Code Bytes</p>
          <ul id={`github-language-list`} className={`dd-github-ranking`}>{report.languages.map((language, index) => {
            const identity = getGitHubLanguageIdentity(language.name);
            return <li key={language.name} id={`github-language-${index}`} className={`dd-github-ranking-row`}>
              <span id={`github-language-name-${index}`} className={`dd-github-label dd-github-row-label`}><GitHubIdentity id={`github-language-icon-${index}`} kind={`language`} name={language.name} /><span id={`github-language-color-${index}`} className={`dd-github-color-key`} aria-hidden={`true`} style={{ backgroundColor: identity?.color === `currentColor` ? `var(--ink)` : identity?.color }} /><span id={`github-language-text-${index}`}>{language.name}</span></span>
              <strong id={`github-language-value-${index}`} className={`dd-github-caption`}>{languageTotal ? (language.bytes / languageTotal * 100).toFixed(1) : `0`}% · {formatGitHubCount(language.bytes)} Bytes</strong>
              <span id={`github-language-track-${index}`} className={`dd-github-bar-track`} aria-hidden={`true`}><span id={`github-language-bar-${index}`} className={`dd-github-bar`} style={{ width: `${languageTotal ? language.bytes / languageTotal * 100 : 0}%`, backgroundColor: identity?.color === `currentColor` ? `var(--ink)` : identity?.color }} /></span>
            </li>;
          })}</ul>
          {!report.languages.length && <p id={`github-languages-empty`} className={`dd-github-caption`}>{report.sections.languages.status === `ready` ? `No Language Data Reported` : report.sections.languages.message}</p>}
        </div>
        <div id={`github-authors`} className={`dd-github-panel`}>
          <h3 id={`github-authors-title`} className={`dd-github-title`}><Users id={`github-authors-icon`} size={16} aria-hidden={`true`} />Commit Authors</h3>
          <p id={`github-authors-caption`} className={`dd-github-caption`}>{formatGitHubCount(listedAuthorCommits)} Commit(s) By Listed Authors · Selected Range · Top {Math.min(10, report.contributors.length)} Authors Shown</p>
          <ul id={`github-author-list`} className={`dd-github-ranking`}>{report.contributors.slice(0, 10).map((author, index) => <li key={`${author.name}-${index}`} id={`github-author-${index}`} className={`dd-github-ranking-row`}>
            <span id={`github-author-name-${index}`} className={`dd-github-label dd-github-row-label`}><GitHubIdentity id={`github-author-avatar-${index}`} kind={`author`} name={author.name} avatarUrl={author.avatarUrl} /><span id={`github-author-text-${index}`}>{author.name}</span></span>
            <strong id={`github-author-value-${index}`} className={`dd-github-caption`}>{formatGitHubCount(author.commits)} Commit(s)</strong>
            <span id={`github-author-track-${index}`} className={`dd-github-bar-track`} aria-hidden={`true`}><span id={`github-author-bar-${index}`} className={`dd-github-bar`} style={{ width: `${author.commits / authorMaximum * 100}%` }} /></span>
          </li>)}</ul>
          {!report.contributors.length && <p id={`github-authors-empty`} className={`dd-github-caption`}>{report.sections.commits.status === `ready` ? `No Commits In This Range` : report.sections.commits.message}</p>}
        </div>
      </div>
      <div id={`github-releases`} className={`dd-github-panel`}>
        <h3 id={`github-releases-title`} className={`dd-github-title`}><Tag id={`github-releases-icon`} size={16} aria-hidden={`true`} />Release Versions</h3>
        <p id={`github-releases-caption`} className={`dd-github-caption`}>{report.sections.releases.message} Download counts cover release assets; source archive downloads are excluded.</p>
        {report.releases.length ? <div id={`github-release-scroll`} className={`dd-github-table-scroll`}><table id={`github-release-table`} className={`dd-github-table`}>
          <thead id={`github-release-head`}><tr id={`github-release-head-row`}>{releaseColumns.map(({ label, Icon }, index) => <th key={label} id={`github-release-column-${index}`} scope={`col`}><span id={`github-release-column-label-${index}`} className={`dd-github-label`}><Icon id={`github-release-column-icon-${index}`} size={14} aria-hidden={`true`} />{label}</span></th>)}</tr></thead>
          <tbody id={`github-release-body`}>{report.releases.map(release => {
            const ChannelIcon = release.prerelease ? FlaskConical : BadgeCheck;
            return <tr key={release.id} id={`github-release-${release.id}`}>
              <th id={`github-release-version-${release.id}`} scope={`row`}><a id={`github-release-link-${release.id}`} href={release.url} className={`dd-github-link`} target={`_blank`} rel={`noreferrer`}><Tag id={`github-release-tag-icon-${release.id}`} size={15} aria-hidden={`true`} />{release.tag}<ExternalLink size={12} aria-hidden={`true`} /></a><span id={`github-release-name-${release.id}`} className={`dd-github-caption`}>{release.name}</span></th>
              <td id={`github-release-date-${release.id}`}><span id={`github-release-date-label-${release.id}`} className={`dd-github-label`}><CalendarDays id={`github-release-date-icon-${release.id}`} size={14} aria-hidden={`true`} />{formatGitHubDate(release.publishedAt)}</span></td>
              <td id={`github-release-channel-${release.id}`}><span id={`github-release-channel-label-${release.id}`} className={`dd-github-label`}><ChannelIcon id={`github-release-channel-icon-${release.id}`} size={14} aria-hidden={`true`} />{release.prerelease ? `Pre-Release` : `Stable`}</span></td>
              <td id={`github-release-downloads-${release.id}`}><span id={`github-release-download-label-${release.id}`} className={`dd-github-label`}><Download id={`github-release-download-icon-${release.id}`} size={14} aria-hidden={`true`} />{formatGitHubCount(release.downloads)}</span></td>
            </tr>;
          })}</tbody>
        </table></div> : <p id={`github-release-empty`} className={`dd-github-caption`}>{report.sections.releases.status === `ready` ? `No Published Releases Yet` : report.sections.releases.message}</p>}
      </div>
      <div id={`github-recent-commits`} className={`dd-github-panel`}><h3 id={`github-recent-title`} className={`dd-github-title`}><GitCommitHorizontal id={`github-recent-icon`} size={16} aria-hidden={`true`} />Recent Commits</h3><p id={`github-recent-caption`} className={`dd-github-caption`}>Latest {Math.min(10, report.commits.length)} Loaded Commit(s) · {report.repository.defaultBranch} · Selected Range</p><ul id={`github-recent-list`} className={`dd-github-commits`}>{report.commits.slice(0, 10).map(commit => <li key={commit.sha} id={`github-commit-${commit.sha}`} className={`dd-github-commit`}><a id={`github-commit-link-${commit.sha}`} href={commit.url} target={`_blank`} rel={`noreferrer`} className={`dd-github-link`}><GitCommitHorizontal id={`github-commit-icon-${commit.sha}`} size={16} aria-hidden={`true`} /><code id={`github-commit-sha-${commit.sha}`}>{commit.sha.slice(0, 7)}</code><span id={`github-commit-message-${commit.sha}`} className={`dd-github-row-label`}>{commit.message}</span><ExternalLink size={12} aria-hidden={`true`} /></a><span id={`github-commit-date-${commit.sha}`} className={`dd-github-caption`}><CalendarDays id={`github-commit-date-icon-${commit.sha}`} size={14} aria-hidden={`true`} />{formatGitHubDate(commit.date, true)} UTC</span></li>)}</ul>{!report.commits.length && <p id={`github-commits-empty`} className={`dd-github-caption`}>{report.sections.commits.status === `ready` ? `No Commits In This Range` : report.sections.commits.message}</p>}</div>
      <p id={`github-source`} className={`dd-github-caption`}><GitHubIdentity id={`github-source-icon`} kind={`github`} />{report.source} · Fetched {formatGitHubDate(report.fetchedAt, true)} UTC · Cache Expires {formatGitHubDate(report.cacheExpiresAt, true)} UTC · Refresh Revalidates With GitHub</p>
    </>}
  </section>;
};
export default AdminGitHub;
