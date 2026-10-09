import { api } from '../../api';
import type { PublicDomainSummary } from '../../api';
import { Types } from '../../types/types';
import { authAPI } from '../../api/auth';
import { genID } from '../common/ids';
import { useLocalStorage } from '../config';
import { SOCIAL_STORAGE_KEY } from '../accountData/keys';
import { Post } from '../models/posts/Post';
import { Follow } from '../models/relationships/Follow';
import { validatePostContent } from './content';
import { getAppCollectionIDNumber } from '../common/ids';
import type { PublicProfile } from '../models/users/User';
import type { FeedView, FeedPost, PostInput, PublicPost, PublicDomain, CommunitySnapshot } from './types';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';

export { SOCIAL_STORAGE_KEY } from '../accountData/keys';
const serialize = createOperationQueue(SOCIAL_STORAGE_KEY);
interface SocialStore { version: 1; posts: Post[]; follows: Follow[]; nextPostNumber: number; nextFollowNumber: number }
const emptyStore = (): SocialStore => ({ version: 1, posts: [], follows: [], nextPostNumber: 1, nextFollowNumber: 1 });
const projectPost = (post: Post): PublicPost => ({ id: post.id, body: post.body, number: post.number, created: post.created, updated: post.updated, authorId: post.authorId, audience: post.audience });
const publicProfile = (profile: PublicProfile): PublicProfile => ({ id: profile.id, name: profile.name, description: profile.description, color: { ...profile.color }, photoURL: profile.photoURL, publicDomains: profile.publicDomains, profilePrivacy: profile.profilePrivacy });
const publicDomain = (domain: PublicDomainSummary): PublicDomain => ({
  id: domain.id,
  tld: domain.tld,
  mvp: domain.mvp,
  name: domain.name,
  future: domain.future,
  created: domain.created,
  registrar: domain.registrar,
  expiresAt: domain.expiresAt,
  createdAt: domain.createdAt,
  difficulty: domain.difficulty,
  description: domain.description,
  projectStatus: domain.projectStatus,
});
const requireUser = async (expectedViewerId?: string | null) => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Use Community`);
  const session = await authAPI.restoreSession();
  if (!session?.user) throw new Error(`Sign In To Use Community`);
  if (expectedViewerId !== undefined && session.user.id !== expectedViewerId) throw new Error(`Your Account Changed — Try Again`);
  return session.user;
};
const readStore = async (): Promise<SocialStore> => {
  if (!useLocalStorage) return emptyStore();
  const raw = await readStorage(SOCIAL_STORAGE_KEY);
  if (!raw) return emptyStore();
  let stored: SocialStore;
  try { stored = JSON.parse(raw); } catch { throw new Error(`Saved Community Data Could Not Be Read`); }
  if (stored?.version !== 1 || !Array.isArray(stored.posts) || !Array.isArray(stored.follows)
    || !Number.isSafeInteger(stored.nextPostNumber) || stored.nextPostNumber < 1 || !Number.isSafeInteger(stored.nextFollowNumber) || stored.nextFollowNumber < 1) throw new Error(`Saved Community Data Has An Unsupported Format`);
  const postIds = new Set<string>();
  const postNumbers = new Set<number>();
  stored.posts = stored.posts.map(value => {
    if (!value || !Number.isSafeInteger(value.number) || value.number < 1 || getAppCollectionIDNumber(value.id, Types.Post) !== value.number || postIds.has(value.id) || postNumbers.has(value.number)
      || typeof value.authorId !== `string` || !value.authorId || ![`public`, `followers`, `private`].includes(value.audience)
      || typeof value.created !== `string` || !Number.isFinite(Date.parse(value.created)) || !Number.isFinite(Date.parse(value.updated))) throw new Error(`Saved Post(s) Could Not Be Read`);
    const body = validatePostContent(value.body);
    postIds.add(value.id); postNumbers.add(value.number);
    return new Post({ id: value.id, number: value.number, authorId: value.authorId, body, audience: value.audience, created: value.created, updated: value.updated });
  });
  const followIds = new Set<string>();
  const followNumbers = new Set<number>();
  const relationships = new Set<string>();
  stored.follows = stored.follows.map(value => {
    const pair = `${value?.followerId}:${value?.followingId}`;
    if (!value || !Number.isSafeInteger(value.number) || value.number < 1 || getAppCollectionIDNumber(value.id, Types.Follow) !== value.number || followIds.has(value.id) || followNumbers.has(value.number) || relationships.has(pair)
      || typeof value.followerId !== `string` || !value.followerId || typeof value.followingId !== `string` || !value.followingId || value.followerId === value.followingId
      || !Number.isFinite(Date.parse(value.created)) || !Number.isFinite(Date.parse(value.updated))) throw new Error(`Saved Follow(s) Could Not Be Read`);
    followIds.add(value.id); followNumbers.add(value.number); relationships.add(pair);
    return new Follow({ id: value.id, number: value.number, followerId: value.followerId, followingId: value.followingId, created: value.created, updated: value.updated });
  });
  stored.nextPostNumber = Math.max(stored.nextPostNumber, ...stored.posts.map(post => post.number + 1));
  stored.nextFollowNumber = Math.max(stored.nextFollowNumber, ...stored.follows.map(follow => follow.number + 1));
  return stored;
};
const saveStore = async (store: SocialStore, userId: string) => {
  if ((await requireUser()).id !== userId) throw new Error(`Your Account Changed — Try Again`);
  await writeStorage(SOCIAL_STORAGE_KEY, JSON.stringify(store));
};

export const getCommunity = (view: FeedView = `public`): Promise<CommunitySnapshot> => serialize(async () => {
  if (![`public`, `following`, `mine`].includes(view)) throw new Error(`Choose A Community Feed`);
  const session = await authAPI.restoreSession();
  const viewerId = session?.user.id ?? null;
  const [store, candidates] = await Promise.all([readStore(), authAPI.getPublicProfiles()]);
  const profiles = candidates.filter(profile => profile.profilePrivacy === `public` || profile.id === viewerId).map(publicProfile);
  const visibleIds = new Set(profiles.map(profile => profile.id));
  const followingIds = viewerId ? store.follows.filter(follow => follow.followerId === viewerId && visibleIds.has(follow.followingId)).map(follow => follow.followingId) : [];
  const followed = new Set(followingIds);
  const authors = new Map(profiles.map(profile => [profile.id, profile]));
  const posts: FeedPost[] = [];
  for (const post of store.posts) {
    const author = authors.get(post.authorId);
    if (!author) continue;
    const own = viewerId === post.authorId;
    const isFollowing = followed.has(post.authorId);
    if (view === `mine` && !own || view === `following` && !own && !isFollowing) continue;
    const visible = own || author.profilePrivacy === `public` && (post.audience === `public` || view === `following` && post.audience === `followers` && isFollowing);
    if (visible) posts.push({ ...projectPost(post), author });
  }
  const domainResults = await api.getPublicDomainSummaries(profiles.filter(profile => profile.profilePrivacy === `public` && profile.publicDomains).map(profile => profile.id));
  return {
    viewerId,
    followingIds,
    storageEnabled: useLocalStorage,
    posts: posts.sort((a, b) => Date.parse(b.created) - Date.parse(a.created) || b.number - a.number),
    profiles: profiles.map(profile => ({ ...profile, following: followed.has(profile.id), domains: domainResults.filter(domain => domain.userId === profile.id).map(publicDomain) })),
  };
});

export const createPost = (input: PostInput, expectedViewerId?: string | null): Promise<PublicPost> => serialize(async () => {
  const user = await requireUser(expectedViewerId);
  const body = validatePostContent(input?.body);
  if (![`public`, `followers`, `private`].includes(input?.audience)) throw new Error(`Choose Who Can See Your Post`);
  const store = await readStore();
  const number = store.nextPostNumber;
  const identity = genID(Types.Post, number, `Post`);
  const post = new Post({ ...identity, number, body, authorId: user.id, audience: input.audience, created: identity.date, updated: identity.date });
  store.posts.push(post); store.nextPostNumber += 1;
  await saveStore(store, user.id);
  return projectPost(post);
});

export const deletePost = (id: string, expectedViewerId?: string | null): Promise<void> => serialize(async () => {
  const user = await requireUser(expectedViewerId);
  const store = await readStore();
  const post = store.posts.find(item => item.id === id);
  if (!post || post.authorId !== user.id) throw new Error(`Only Your Own Post(s) Can Be Deleted`);
  store.posts = store.posts.filter(item => item.id !== id);
  await saveStore(store, user.id);
});

export const updatePost = (id: string, input: PostInput, expectedViewerId?: string | null): Promise<PublicPost> => serialize(async () => {
  const user = await requireUser(expectedViewerId);
  const body = validatePostContent(input?.body);
  if (![`public`, `followers`, `private`].includes(input?.audience)) throw new Error(`Choose Who Can See Your Post`);
  const store = await readStore();
  const original = store.posts.find(post => post.id === id);
  if (!original || original.authorId !== user.id) throw new Error(`Only Your Own Post(s) Can Be Edited`);
  const post = new Post({ ...original, body, audience: input.audience, updated: new Date().toISOString() });
  store.posts = store.posts.map(current => current.id === id ? post : current);
  await saveStore(store, user.id);
  return projectPost(post);
});

export const setFollowing = (profileId: string, following: boolean, expectedViewerId?: string | null): Promise<void> => serialize(async () => {
  const user = await requireUser(expectedViewerId);
  if (typeof following !== `boolean` || typeof profileId !== `string` || profileId === user.id) throw new Error(`Choose Another Public Profile`);
  const store = await readStore();
  const existing = store.follows.find(item => item.followerId === user.id && item.followingId === profileId);
  if (following) {
    const profile = (await authAPI.getPublicProfiles()).find(item => item.id === profileId && item.profilePrivacy === `public`);
    if (!profile) throw new Error(`This Profile Is Private Or Unavailable`);
    if (!existing) {
      const number = store.nextFollowNumber;
      const identity = genID(Types.Follow, number, `Follow`);
      store.follows.push(new Follow({ ...identity, number, followerId: user.id, followingId: profileId, created: identity.date, updated: identity.date }));
      store.nextFollowNumber += 1;
    }
  } else store.follows = store.follows.filter(item => item.id !== existing?.id);
  await saveStore(store, user.id);
});
