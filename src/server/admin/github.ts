import { readProviderJson } from './provider';
import { normalizeGitHubAvatar } from '../../shared/analytics/githubIdentity';
import type { GitHubReport, GitHubPeriod, GitHubRelease, GitHubCoverage, GitHubTrendPoint } from '../../shared/analytics/github.types';

const repositoryName = `Domains-Database`;
const repositoryOwner = `strawhat19`;
const apiVersion = `2026-03-10`;
const cacheDuration = 300_000;
const repositoryPath = `/repos/${repositoryOwner}/${repositoryName}`;
const repositoryUrl = `https://github.com/${repositoryOwner}/${repositoryName}`;
const cache = new Map<GitHubPeriod, GitHubReport>();
const pending = new Map<GitHubPeriod, Promise<GitHubReport>>();
let credentialScope = ``;
let activeReports = 0;

type JsonRecord = Record<string, unknown>;
type RequestContext = { token: string; signal: AbortSignal };
type PageResult = { items: unknown[]; complete: boolean; message: string };
type TrafficDay = { date: string; count: number; uniques: number };
type TrafficResult = { days: TrafficDay[]; count: number; uniques: number; complete: boolean };
type CommitResult = { commits: GitHubReport[`commits`]; contributors: GitHubReport[`contributors`]; dates: Map<string, number>; total: number | null; coverage: GitHubCoverage };
type ReleaseResult = { releases: GitHubRelease[]; total: number | null; coverage: GitHubCoverage };

export class GitHubServiceError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const record = (value: unknown): JsonRecord | null => value && typeof value === `object` && !Array.isArray(value) ? value as JsonRecord : null;
const count = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const text = (value: unknown, maximum: number) => typeof value === `string` ? value.slice(0, maximum) : ``;
const timestamp = (value: unknown) => {
  if (typeof value !== `string` || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  const normalized = new Date(value).toISOString();
  return normalized.slice(0, 19) === value.slice(0, 19) ? normalized : null;
};
const coverage = (status: GitHubCoverage[`status`], message: string): GitHubCoverage => ({ status, message });
const failureMessage = (failure: unknown) => failure instanceof GitHubServiceError ? failure.message : `GitHub Data Is Unavailable — Try Refreshing`;
const formatDay = (value: Date) => value.toISOString().slice(0, 10);
const shiftDay = (value: Date, days: number) => { const result = new Date(value); result.setUTCDate(result.getUTCDate() + days); return result; };
const safeSum = (values: number[]) => { const total = values.reduce((sum, value) => sum + value, 0); return count(total) ? total : null; };

const requestGitHub = async (path: string, context: RequestContext) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener(`abort`, abort, { once: true });
  if (context.signal.aborted) abort();
  const timeout = setTimeout(abort, 8_000);
  try {
    const response = await fetch(`https://api.github.com${repositoryPath}${path}`, {
      cache: `no-store`,
      redirect: `error`,
      signal: controller.signal,
      headers: {
        'X-GitHub-Api-Version': apiVersion,
        Accept: `application/vnd.github+json`,
        'User-Agent': `Domains-Database-Admin-Reports`,
        ...(context.token ? { Authorization: `Bearer ${context.token}` } : {}),
      },
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      if (response.status === 429 || response.status === 403 && (response.headers.get(`x-ratelimit-remaining`) === `0` || response.headers.has(`retry-after`))) throw new GitHubServiceError(429, `github_rate_limited`, `GitHub Rate Limit Reached — Try Again Later`);
      if (response.status === 401) throw new GitHubServiceError(503, `github_credentials_invalid`, `GitHub Reporting Token Is Invalid Or Expired`);
      if (response.status === 403) throw new GitHubServiceError(503, `github_access_denied`, `GitHub Access Denied — Check Repository Permissions`);
      if (response.status === 404) throw new GitHubServiceError(503, `github_repository_unavailable`, `GitHub Repository Data Is Unavailable — Check Repository Access`);
      throw new GitHubServiceError(503, `github_provider_unavailable`, `GitHub Data Is Unavailable — Try Refreshing`);
    }
    const data = await readProviderJson(response, controller.signal);
    return { data, hasNext: response.headers.get(`link`)?.includes(`rel="next"`) === true };
  } catch (failure) {
    if (failure instanceof GitHubServiceError) throw failure;
    throw new GitHubServiceError(503, `github_request_failed`, controller.signal.aborted ? `GitHub Request Timed Out — Try Refreshing` : `GitHub Response Could Not Be Read — Try Refreshing`);
  } finally {
    clearTimeout(timeout);
    context.signal.removeEventListener(`abort`, abort);
  }
};

const readPages = async (path: string, maximumPages: number, context: RequestContext): Promise<PageResult> => {
  const items: unknown[] = [];
  for (let page = 1; page <= maximumPages; page++) {
    try {
      const response = await requestGitHub(`${path}${path.includes(`?`) ? `&` : `?`}per_page=100&page=${page}`, context);
      if (!Array.isArray(response.data) || response.data.length > 100) throw new GitHubServiceError(503, `github_invalid_response`, `GitHub Returned An Unsupported Page`);
      items.push(...response.data);
      if (!response.hasNext) return { items, complete: true, message: `` };
      if (!response.data.length) return { items, complete: false, message: `GitHub Returned An Incomplete Page` };
    } catch (failure) {
      return { items, complete: false, message: failureMessage(failure) };
    }
  }
  return { items, complete: false, message: `Pagination Limited To ${maximumPages * 100} Record(s)` };
};

const readRepository = async (context: RequestContext): Promise<GitHubReport[`repository`]> => {
  const response = await requestGitHub(``, context);
  const value = record(response.data);
  const fullName = `${repositoryOwner}/${repositoryName}`;
  if (!value || text(value.full_name, 256).toLowerCase() !== fullName.toLowerCase() || typeof value.private !== `boolean`
    || typeof value.default_branch !== `string` || !value.default_branch || value.default_branch.length > 255
    || ![value.stargazers_count, value.forks_count, value.open_issues_count, value.subscribers_count].every(count)) throw new GitHubServiceError(503, `github_invalid_repository`, `GitHub Returned Unsupported Repository Data`);
  return {
    url: repositoryUrl,
    fullName,
    name: repositoryName,
    private: value.private,
    stars: value.stargazers_count as number,
    forks: value.forks_count as number,
    subscribers: value.subscribers_count as number,
    openIssues: value.open_issues_count as number,
    pushedAt: timestamp(value.pushed_at),
    description: text(value.description, 1_000),
    defaultBranch: value.default_branch,
  };
};

const readCommits = async (branch: string, range: GitHubReport[`range`], until: string, context: RequestContext): Promise<CommitResult> => {
  const query = new URLSearchParams({ sha: branch, since: `${range.from}T00:00:00Z`, until });
  const page = await readPages(`/commits?${query}`, 10, context);
  const commits = new Map<string, GitHubReport[`commits`][number]>();
  const authors = new Map<string, number>();
  const avatars = new Map<string, string>();
  const dates = new Map<string, number>();
  let invalid = 0;
  for (const item of page.items) {
    const value = record(item);
    const commit = record(value?.commit);
    const author = record(value?.author);
    const date = timestamp(record(commit?.committer)?.date) ?? timestamp(record(commit?.author)?.date);
    const sha = text(value?.sha, 65);
    if (!date || !/^[a-f\d]{40,64}$/i.test(sha) || typeof commit?.message !== `string`) { invalid++; continue; }
    if (date.slice(0, 10) < range.from || date.slice(0, 10) > range.to || commits.has(sha)) continue;
    const login = text(author?.login, 80);
    const name = /^[a-z\d-]{1,39}(?:\[bot\])?$/i.test(login) ? login : `Unlinked Author`;
    const avatarUrl = name === `Unlinked Author` ? null : normalizeGitHubAvatar(author?.avatar_url);
    if (avatarUrl && !avatars.has(name)) avatars.set(name, avatarUrl);
    dates.set(date.slice(0, 10), (dates.get(date.slice(0, 10)) ?? 0) + 1);
    authors.set(name, (authors.get(name) ?? 0) + 1);
    commits.set(sha, { sha, date, url: `${repositoryUrl}/commit/${sha}`, message: commit.message.split(/\r?\n/, 1)?.[0]?.slice(0, 180) ?? `` });
  }
  const complete = page.complete && !invalid;
  return {
    dates,
    total: complete ? commits.size : null,
    commits: [...commits.values()].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 20),
    contributors: [...authors].map(([name, commits]) => ({ name, commits, avatarUrl: avatars.get(name) ?? null })).sort((left, right) => right.commits - left.commits || left.name.localeCompare(right.name)).slice(0, 10),
    coverage: coverage(complete ? `ready` : commits.size ? `partial` : `unavailable`, complete
      ? `Default Branch ${branch}; ${commits.size} Commit(s) In The Selected UTC Period; Top 10 GitHub Authors`
      : `${page.message || `Unsupported Commit Data Was Excluded`}; ${commits.size} Loaded Commit(s) Only; Period Total And Trend Unavailable`),
  };
};

const readReleases = async (context: RequestContext): Promise<ReleaseResult> => {
  const page = await readPages(`/releases`, 3, context);
  const releases = new Map<string, GitHubRelease>();
  let invalid = 0;
  for (const item of page.items) {
    const value = record(item);
    if (value?.draft === true) continue;
    const date = timestamp(value?.published_at);
    const tag = text(value?.tag_name, 256);
    if (!value || !count(value.id) || value.draft !== false || typeof value.prerelease !== `boolean` || !date || !tag) { invalid++; continue; }
    const assets = Array.isArray(value.assets) ? value.assets.map(asset => record(asset)?.download_count) : null;
    const downloads = assets?.every(count) ? safeSum(assets as number[]) : null;
    if (downloads === null) invalid++;
    releases.set(String(value.id), {
      tag,
      id: String(value.id),
      publishedAt: date,
      prerelease: value.prerelease,
      name: text(value.name, 256) || tag,
      downloads,
      url: `${repositoryUrl}/releases/tag/${encodeURIComponent(tag)}`,
    });
  }
  const complete = page.complete && !invalid;
  return {
    total: complete ? releases.size : null,
    releases: [...releases.values()].sort((left, right) => (right.publishedAt ?? ``).localeCompare(left.publishedAt ?? ``)).slice(0, 20),
    coverage: coverage(complete ? `ready` : releases.size ? `partial` : `unavailable`, complete
      ? `All ${releases.size} Published Release(s); Latest 20 Shown; Asset Downloads Are Lifetime Counts; Tags Without Releases Excluded`
      : `${page.message || `Unsupported Release Or Asset Data Was Excluded`}; ${releases.size} Loaded Published Release(s) Only; Total Unavailable`),
  };
};

const readTraffic = async (kind: `views` | `clones`, context: RequestContext): Promise<TrafficResult> => {
  if (!context.token) throw new GitHubServiceError(503, `github_traffic_not_configured`, `Repository Traffic Requires A Server Connection With GitHub Administration Read Access`);
  const response = await requestGitHub(`/traffic/${kind}?per=day`, context);
  const value = record(response.data);
  const source = value?.[kind];
  if (!value || !count(value.count) || !count(value.uniques) || value.uniques > value.count || !Array.isArray(source) || source.length > 32) throw new GitHubServiceError(503, `github_invalid_traffic`, `GitHub Returned Unsupported Traffic Data`);
  const days: TrafficDay[] = [];
  const seen = new Set<string>();
  const latestDate = formatDay(new Date());
  for (const item of source) {
    const day = record(item);
    const date = timestamp(day?.timestamp);
    if (!date || !date.endsWith(`T00:00:00.000Z`) || date.slice(0, 10) > latestDate
      || !count(day?.count) || !count(day?.uniques) || day.uniques > day.count || seen.has(date.slice(0, 10))) throw new GitHubServiceError(503, `github_invalid_traffic`, `GitHub Returned Unsupported Traffic Buckets`);
    seen.add(date.slice(0, 10));
    days.push({ date: date.slice(0, 10), count: day.count, uniques: day.uniques });
  }
  return { days, count: value.count, uniques: value.uniques, complete: safeSum(days.map(day => day.count)) === value.count };
};

const readLanguages = async (context: RequestContext) => {
  const response = await requestGitHub(`/languages`, context);
  const value = record(response.data);
  if (!value || Object.keys(value).length > 200 || Object.entries(value).some(([name, bytes]) => !name || name.length > 80 || !count(bytes))) throw new GitHubServiceError(503, `github_invalid_languages`, `GitHub Returned Unsupported Language Data`);
  return Object.entries(value).map(([name, bytes]) => ({ name, bytes: bytes as number })).sort((left, right) => right.bytes - left.bytes || left.name.localeCompare(right.name));
};

const createReport = async (period: GitHubPeriod, token: string): Promise<GitHubReport> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const context = { token, signal: controller.signal };
  try {
    const now = new Date();
    const day = new Date(`${formatDay(now)}T00:00:00Z`);
    const range = { to: formatDay(now), from: formatDay(shiftDay(day, 1 - period)) };
    const repository = await readRepository(context);
    const sections: GitHubReport[`sections`] = {
      views: coverage(`unavailable`, `GitHub Views Are Unavailable`),
      clones: coverage(`unavailable`, `GitHub Clones Are Unavailable`),
      commits: coverage(`unavailable`, `GitHub Commits Are Unavailable`),
      releases: coverage(`unavailable`, `GitHub Releases Are Unavailable`),
      languages: coverage(`unavailable`, `GitHub Languages Are Unavailable`),
    };
    const result: { commits: CommitResult | null; releases: ReleaseResult | null; views: TrafficResult | null; clones: TrafficResult | null; languages: GitHubReport[`languages`] } = {
      views: null,
      clones: null,
      commits: null,
      releases: null,
      languages: [],
    };
    const tasks = [
      async () => { result.commits = await readCommits(repository.defaultBranch, range, now.toISOString(), context); sections.commits = result.commits.coverage; },
      async () => { result.releases = await readReleases(context); sections.releases = result.releases.coverage; },
      async () => { result.views = await readTraffic(`views`, context); },
      async () => { result.clones = await readTraffic(`clones`, context); },
      async () => { result.languages = await readLanguages(context); sections.languages = coverage(`ready`, `Current Language Bytes Reported By GitHub`); },
    ];
    const keys = [`commits`, `releases`, `views`, `clones`, `languages`] as const;
    let nextTask = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (nextTask < tasks.length) {
        const index = nextTask++;
        try { await tasks[index]?.(); }
        catch (failure) { sections[keys[index]!] = coverage(`unavailable`, failureMessage(failure)); }
      }
    }));
    const retainedDates = [result.views, result.clones].flatMap(value => value?.days.map(point => point.date) ?? []).sort();
    const retainedBoundary = formatDay(shiftDay(day, -14));
    const retainedFrom = retainedDates[0] && retainedDates[0] < retainedBoundary ? retainedDates[0] : retainedBoundary;
    const trafficFrom = retainedFrom > range.from ? retainedFrom : range.from;
    const warnings = [
      `Commits And Contributors Use The Selected UTC Period On The Current Default Branch; Recent Commits Are Limited To 20`,
      `Traffic Is Limited To GitHub’s Rolling 14-Day Retention And Can Touch 15 UTC Dates; Older History Is Not Stored`,
      `Stars, Forks, Open Issues + PRs, Watchers, Languages And Release Asset Downloads Are Current Or Lifetime Values`,
    ];
    if (!token) warnings.push(`Public Repository Data Uses GitHub’s Unauthenticated API Limits; Configure A Server Token For Private Traffic`);
    const trafficTotals = (kind: `views` | `clones`, result: TrafficResult | null) => {
      if (!result) return { count: null, uniques: null };
      const included = result.days.filter(point => point.date >= trafficFrom && point.date <= range.to);
      const wholeWindow = trafficFrom <= retainedFrom && included.length === result.days.length;
      const total = wholeWindow ? result.count : result.complete ? safeSum(included.map(point => point.count)) : null;
      const latestBucket = result.days.reduce((latest, point) => point.date > latest ? point.date : latest, ``);
      sections[kind] = coverage(result.complete ? `ready` : `partial`, `${trafficFrom} To ${range.to} UTC; ${wholeWindow ? `Unique Total Supplied By GitHub` : `Unique Total Unavailable For A Shortened Window`}${latestBucket && latestBucket < range.to ? `; Latest Supplied Day ${latestBucket} UTC — Later Days Have No Measurement` : ``}${result.complete ? `` : `; Daily Buckets Do Not Reconcile With The Provider Total`}`);
      if (!wholeWindow) warnings.push(`${kind === `views` ? `Unique Visitors` : `Unique Cloners`} Are Unavailable For This Shortened Traffic Window; Daily Unique Counts Are Not Added Together`);
      return { count: total, uniques: wholeWindow ? result.uniques : null };
    };
    const viewTotals = trafficTotals(`views`, result.views);
    const cloneTotals = trafficTotals(`clones`, result.clones);
    const viewDays = new Map(result.views?.days.map(point => [point.date, point]) ?? []);
    const cloneDays = new Map(result.clones?.days.map(point => [point.date, point]) ?? []);
    const trend: GitHubTrendPoint[] = Array.from({ length: period }, (_, index) => {
      const date = formatDay(shiftDay(day, index + 1 - period));
      return {
        date,
        views: viewDays.get(date)?.count ?? null,
        clones: cloneDays.get(date)?.count ?? null,
        uniqueVisitors: viewDays.get(date)?.uniques ?? null,
        uniqueCloners: cloneDays.get(date)?.uniques ?? null,
        commits: result.commits?.coverage.status === `ready` ? result.commits.dates.get(date) ?? 0 : null,
      };
    });
    const fetchedAt = new Date().toISOString();
    return {
      period,
      range,
      trend,
      sections,
      warnings,
      fetchedAt,
      apiVersion,
      repository,
      source: `GitHub REST API`,
      languages: result.languages,
      commits: result.commits?.commits ?? [],
      releases: result.releases?.releases ?? [],
      contributors: result.commits?.contributors ?? [],
      cacheExpiresAt: new Date(Date.parse(fetchedAt) + cacheDuration).toISOString(),
      totals: { commits: result.commits?.total ?? null, releases: result.releases?.total ?? null },
      traffic: { to: range.to, from: trafficFrom, views: viewTotals.count, clones: cloneTotals.count, uniqueVisitors: viewTotals.uniques, uniqueCloners: cloneTotals.uniques },
    };
  } finally { clearTimeout(timeout); }
};

export const getGitHubAnalytics = async (period: GitHubPeriod, refresh = false): Promise<GitHubReport> => {
  const token = process.env.GITHUB_ANALYTICS_TOKEN?.trim() ?? ``;
  if (token && (token.length > 2_048 || !/^[\x21-\x7e]+$/.test(token))) throw new GitHubServiceError(503, `github_credentials_invalid`, `GitHub Reporting Token Has An Invalid Format`);
  if (credentialScope !== token) { cache.clear(); pending.clear(); credentialScope = token; }
  const inflight = pending.get(period);
  if (inflight) return inflight;
  const saved = cache.get(period);
  if (!refresh && saved && Date.parse(saved.cacheExpiresAt) > Date.now()) return saved;
  if (activeReports >= 2) throw new GitHubServiceError(429, `github_reports_busy`, `GitHub Reports Are Busy — Try Again Shortly`);
  activeReports++;
  const operation: Promise<GitHubReport> = createReport(period, token).then(report => {
    if (credentialScope === token) cache.set(period, report);
    return report;
  }).finally(() => {
    activeReports--;
    if (pending.get(period) === operation) pending.delete(period);
  });
  pending.set(period, operation);
  return operation;
};
