export type GitHubPeriod = 7 | 14 | 30 | 90;
export type GitHubSection = `commits` | `views` | `clones` | `releases` | `languages`;
export type GitHubCoverage = { status: `ready` | `partial` | `unavailable`; message: string };
export type GitHubTrendPoint = { date: string; commits: number | null; views: number | null; clones: number | null; uniqueVisitors: number | null; uniqueCloners: number | null };
export type GitHubRelease = { id: string; tag: string; name: string; url: string; publishedAt: string | null; prerelease: boolean; downloads: number | null };
export type GitHubCommit = { sha: string; message: string; url: string; date: string };
export interface GitHubReport {
  period: GitHubPeriod;
  source: `GitHub REST API`;
  apiVersion: string;
  fetchedAt: string;
  cacheExpiresAt: string;
  range: { from: string; to: string };
  warnings: string[];
  repository: { name: string; fullName: string; url: string; description: string; defaultBranch: string; private: boolean; stars: number; forks: number; openIssues: number; subscribers: number; pushedAt: string | null };
  totals: { commits: number | null; releases: number | null };
  traffic: { from: string; to: string; views: number | null; clones: number | null; uniqueVisitors: number | null; uniqueCloners: number | null };
  sections: Record<GitHubSection, GitHubCoverage>;
  trend: GitHubTrendPoint[];
  commits: GitHubCommit[];
  releases: GitHubRelease[];
  languages: { name: string; bytes: number }[];
  contributors: { name: string; commits: number; avatarUrl?: string | null }[];
}
