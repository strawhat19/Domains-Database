import type { FeedPost, CommunityProfile } from './types';

const levels = [
  { xp: 0, title: `Newcomer` },
  { xp: 50, title: `Explorer` },
  { xp: 150, title: `Contributor` },
  { xp: 350, title: `Builder` },
  { xp: 750, title: `Navigator` },
  { xp: 1500, title: `Trailblazer` },
  { xp: 3000, title: `Community Legend` },
];

export interface CommunityProgress {
  xp: number;
  level: number;
  title: string;
  progress: number;
  publicPosts: number;
  sharedDomains: number;
  receivedLikes: number;
  nextLevelXp: number | null;
  badges: { id: string; label: string }[];
}

export const buildCommunityProgress = (profile: CommunityProfile, posts: FeedPost[]): CommunityProgress => {
  const publicProfile = profile.profilePrivacy === `public`;
  const eligiblePosts = [...new Map(posts.filter(post => publicProfile
    && post.authorId === profile.id
    && post.audience === `public`
    && post.author.profilePrivacy === `public`).map(post => [post.id, post])).values()];
  const sharedDomains = publicProfile && profile.publicDomains
    ? new Set(profile.domains.map(domain => domain.name.trim().toLowerCase()).filter(Boolean)).size : 0;
  const publicPosts = eligiblePosts.length;
  const receivedLikes = eligiblePosts.reduce((total, post) => total + (Number.isFinite(post.likeCount) ? Math.max(0, Math.floor(post.likeCount)) : 0), 0);
  const xp = publicPosts * 20 + sharedDomains * 10 + receivedLikes * 2;
  const levelIndex = levels.reduce((current, level, index) => xp >= level.xp ? index : current, 0);
  const currentLevel = levels[levelIndex] ?? { xp: 0, title: `Newcomer` };
  const nextLevelXp = levels[levelIndex + 1]?.xp ?? null;
  const progress = nextLevelXp === null ? 1 : (xp - currentLevel.xp) / (nextLevelXp - currentLevel.xp);
  const badges = [
    { id: `first-post`, label: `First Update`, earned: publicPosts > 0 },
    { id: `domain-sharer`, label: `Domain Sharer`, earned: sharedDomains > 0 },
    { id: `conversation-starter`, label: `Conversation Starter`, earned: publicPosts >= 5 },
    { id: `domain-collector`, label: `Domain Collector`, earned: sharedDomains >= 10 },
    { id: `community-favorite`, label: `Community Favorite`, earned: receivedLikes >= 10 },
  ].filter(badge => badge.earned).map(({ id, label }) => ({ id, label }));
  return { xp, badges, progress, publicPosts, sharedDomains, receivedLikes, nextLevelXp, level: levelIndex + 1, title: currentLevel.title };
};
