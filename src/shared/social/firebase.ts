import { api } from '../../api';
import { FirebaseError } from 'firebase/app';
import { requireStarterAccess } from '../planAccess/service';
import { Types } from '../../types/types';
import { Post } from '../models/posts/Post';
import { projectPublicProfile, readPublicProfile } from '../publicDirectory/profiles';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import type { User, PublicProfile } from '../models/users/User';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { socialIdentity, validateComment } from './records';
import { validatePostContent } from './content';
import type { FeedView, FeedPost, PostInput, PublicPost, FeedComment, CommunitySnapshot } from './types';
import { doc, query, limit, where, orderBy, Timestamp, collection, onSnapshot, runTransaction, serverTimestamp, getDocFromServer, getDocsFromServer, type Query, type Transaction, type DocumentData, type DocumentReference } from 'firebase/firestore';

export const COMMUNITY_PROFILE_LIMIT = 24;
export const COMMUNITY_POST_LIMIT = 40;
export const COMMUNITY_AUTHOR_POST_LIMIT = 8;
const FOLLOW_LIMIT = 200;
const COMMENT_AUTHOR_LIMIT = 10;
const COMMENT_LIMIT = 50;

export const communityError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Community Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Community Access Was Denied — Check Profile Privacy And Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Community Needs The Firestore Indexes In This Repository`);
  if (failure.code === `unavailable`) return new Error(`Community Could Not Connect To Firestore — Try Again`);
  if (failure.code === `resource-exhausted`) return new Error(`Community Database Quota Reached — Try Again Later`);
  return new Error(`Community Request Failed (${failure.code})`);
};
const operation = async <T,>(action: () => Promise<T>): Promise<T> => {
  try { return await action(); } catch (failure) { throw communityError(failure); }
};
const readQuery = async (reference: Query<DocumentData>) => {
  const snapshot = await getDocsFromServer(reference);
  if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) throw new Error(`Community Is Waiting For Confirmed Cloud Data — Refresh To Retry`);
  return snapshot;
};
const readDocument = async (reference: DocumentReference<DocumentData>) => {
  const snapshot = await getDocFromServer(reference);
  if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) throw new Error(`Community Is Waiting For Confirmed Cloud Data — Refresh To Retry`);
  return snapshot;
};
const assertActor = (uid: string | null) => {
  if ((getFirebaseAuth().currentUser?.uid ?? null) !== uid) throw new Error(`Your Account Changed — Try Again`);
};
const requireActor = async (expectedViewerId?: string | null) => {
  const user = await requireStarterAccess(expectedViewerId);
  if (!user?.active || !user.firebase_uid) throw new Error(`Sign In To Use Community`);
  if (expectedViewerId !== undefined && user.id !== expectedViewerId) throw new Error(`Your Account Changed — Try Again`);
  assertActor(user.firebase_uid);
  return user;
};
const transactionActor = async (transaction: Transaction, actor: User) => {
  assertActor(actor.firebase_uid!);
  const saved = await transaction.get(doc(getFirebaseDb(), `users`, actor.id));
  if (!saved.exists() || saved.data().firebase_uid !== actor.firebase_uid || saved.data().active !== true) throw new Error(`Your Account Is Unavailable`);
  return saved.data();
};
const postRef = (id: string) => doc(getFirebaseDb(), `communityPosts`, id);
const counterRef = (kind: `Posts` | `Follows` | `Likes` | `Comments`) => doc(getFirebaseDb(), `counters`, `community${kind}`);
const followingRef = (actorId: string, profileId: string) => doc(getFirebaseDb(), `users`, actorId, `socialFollowing`, profileId);
const likeActorRef = (postId: string, actorId: string) => doc(getFirebaseDb(), `communityPosts`, postId, `likeActors`, actorId);
const commentRef = (postId: string, id: string) => doc(getFirebaseDb(), `communityPosts`, postId, `comments`, id);
const nextNumber = (data?: DocumentData) => {
  const previous = data?.number ?? 0;
  if (!Number.isSafeInteger(previous) || previous < 0 || previous >= Number.MAX_SAFE_INTEGER) throw new Error(`Saved Community Counter Is Invalid`);
  return previous + 1;
};
const timestamp = (value: unknown) => {
  if (!(value instanceof Timestamp)) throw new Error(`Saved Community Date Is Invalid`);
  return value.toDate().toISOString();
};
const safeProfile = projectPublicProfile;
const readProfile = readPublicProfile;
const readPost = (data: DocumentData, id: string): PublicPost & { likeCount: number; commentCount: number } => {
  if (data.id !== id || getAppCollectionIDNumber(id, Types.Post) !== data.number
    || ![`public`, `followers`, `private`].includes(data.audience) || typeof data.authorId !== `string`
    || typeof data.body !== `string` || data.body.length > 8000
    || !Number.isSafeInteger(data.likeCount) || data.likeCount < 0 || !Number.isSafeInteger(data.commentCount) || data.commentCount < 0) throw new Error(`Saved Post(s) Could Not Be Read`);
  return { id, number: data.number, authorId: data.authorId, body: data.body.trim(), audience: data.audience, created: timestamp(data.created), updated: timestamp(data.updated), likeCount: data.likeCount, commentCount: data.commentCount };
};
const profileQuery = () => query(collection(getFirebaseDb(), `publicProfiles`), where(`profilePrivacy`, `==`, `public`), orderBy(`__name__`), limit(COMMUNITY_PROFILE_LIMIT));
const profileTargetQuery = (id: string) => query(collection(getFirebaseDb(), `publicProfiles`), where(`__name__`, `==`, id), where(`profilePrivacy`, `==`, `public`), limit(1));
const followingQuery = (actorId: string) => query(collection(getFirebaseDb(), `users`, actorId, `socialFollowing`), orderBy(`number`, `desc`), limit(FOLLOW_LIMIT));
const authorPostsQuery = (authorId: string, own: boolean, following: boolean) => query(
  collection(getFirebaseDb(), `communityPosts`),
  where(`authorId`, `==`, authorId),
  ...(own ? [] : [where(`audience`, `in`, following ? [`public`, `followers`] : [`public`])]),
  orderBy(`number`, `desc`),
  limit(COMMUNITY_AUTHOR_POST_LIMIT),
);
const communityAuthors = (profiles: PublicProfile[], actor: User | undefined) => {
  const authors = profiles.filter(profile => profile.id !== actor?.id && profile.profilePrivacy === `public`);
  if (actor) authors.push(safeProfile(actor));
  return authors;
};
const selectFeedPosts = (sourcePosts: FeedPost[], actorId: string | undefined, followed: Set<string>, view: FeedView, profileId?: string) => {
  const unique = [...new Map(sourcePosts.map(post => [post.id, post])).values()].sort((a, b) => b.number - a.number);
  const perAuthor = new Map<string, number>();
  const sampled = unique.filter(post => { const count = (perAuthor.get(post.authorId) ?? 0) + 1; perAuthor.set(post.authorId, count); return count <= COMMUNITY_AUTHOR_POST_LIMIT; });
  return sampled.filter(post => !profileId || post.authorId === profileId).filter(post =>
    view === `mine` ? post.authorId === actorId : view === `following` ? post.authorId === actorId || followed.has(post.authorId)
      : post.authorId === actorId || post.audience === `public`).slice(0, COMMUNITY_POST_LIMIT);
};
const composeCommunity = async (profiles: PublicProfile[], actor: User | undefined, followingIds: string[], sourcePosts: FeedPost[], likedIds: Set<string>, view: FeedView, profileId?: string, publicSourcePosts = sourcePosts): Promise<CommunitySnapshot> => {
  const ids = profiles.filter(profile => profile.publicDomains && profile.profilePrivacy === `public`).map(profile => profile.id);
  const domains = await api.getPublicDomainSummaries(ids);
  assertActor(actor?.firebase_uid ?? null);
  const followed = new Set(followingIds);
  const eligible = selectFeedPosts(sourcePosts, actor?.id, followed, view, profileId);
  return {
    source: `firebase`,
    coverage: `Recent Activity: Up To 24 Directory Profiles, 24 Followed Profiles, 8 Posts Per Author And 40 Feed Posts; Progress Reflects Loaded Public Activity`,
    hasMore: profiles.length >= COMMUNITY_PROFILE_LIMIT || eligible.length > COMMUNITY_POST_LIMIT || sourcePosts.some(post => sourcePosts.filter(item => item.authorId === post.authorId).length >= COMMUNITY_AUTHOR_POST_LIMIT),
    progressPosts: publicSourcePosts.filter(post => post.author.profilePrivacy === `public` && post.audience === `public`),
    posts: eligible.sort((a, b) => b.number - a.number).slice(0, COMMUNITY_POST_LIMIT).map(post => ({ ...post, liked: likedIds.has(post.id) })),
    viewerId: actor?.id ?? null,
    followingIds,
    storageEnabled: true,
    profiles: profiles.map(profile => ({ ...profile, following: followed.has(profile.id), domains: domains.filter(domain => domain.userId === profile.id) })),
  };
};
const requestedProfile = async (profileId: string | undefined, profiles: PublicProfile[], actor: User | undefined) => {
  if (profileId && profileId !== actor?.id && !profiles.some(profile => profile.id === profileId)) {
    const saved = await readQuery(profileTargetQuery(profileId));
    if (saved.docs[0]) profiles.push(readProfile(saved.docs[0].data(), saved.docs[0].id));
  }
};
const getViewer = () => requireStarterAccess();

export const getCommunity = (view: FeedView = `public`, profileId?: string): Promise<CommunitySnapshot> => operation(async () => {
  if (![`public`, `following`, `mine`].includes(view)) throw new Error(`Choose A Community Feed`);
  const actor = await getViewer();
  const [publicProfiles, follows] = await Promise.all([
    readQuery(profileQuery()),
    actor ? readQuery(followingQuery(actor.id)) : Promise.resolve(null),
  ]);
  assertActor(actor?.firebase_uid ?? null);
  const profiles = publicProfiles.docs.map(record => readProfile(record.data(), record.id));
  if (actor && !profiles.some(profile => profile.id === actor.id)) profiles.push(safeProfile(actor));
  await requestedProfile(profileId, profiles, actor);
  const followingIds = follows?.docs.map(record => record.id) ?? [];
  const followedTargets = await Promise.all(followingIds.slice(0, COMMUNITY_PROFILE_LIMIT).filter(id => !profiles.some(profile => profile.id === id)).map(id => readQuery(profileTargetQuery(id))));
  for (const target of followedTargets) if (target.docs[0]) profiles.push(readProfile(target.docs[0].data(), target.docs[0].id));
  const followed = new Set(followingIds);
  const authors = communityAuthors(profiles, actor);
  const publicSources = await Promise.all(authors.filter(author => author.profilePrivacy === `public`).map(async author => {
    const result = await readQuery(authorPostsQuery(author.id, false, false));
    return result.docs.map(record => ({ ...readPost(record.data(), record.id), author, liked: false }));
  }));
  const extraSources = await Promise.all(authors.filter(author => author.id === actor?.id || view === `following` && followed.has(author.id)).map(async author => {
    const result = await readQuery(authorPostsQuery(author.id, author.id === actor?.id, true));
    return result.docs.map(record => ({ ...readPost(record.data(), record.id), author, liked: false }));
  }));
  const posts = [...new Map([...publicSources.flat(), ...extraSources.flat()].map(post => [post.id, post])).values()];
  const liked = actor ? await Promise.all(selectFeedPosts(posts, actor.id, followed, view, profileId).map(async post => (await readDocument(likeActorRef(post.id, actor.id))).exists() ? post.id : null)) : [];
  return composeCommunity(profiles, actor, followingIds, posts, new Set(liked.filter((id): id is string => Boolean(id))), view, profileId, publicSources.flat());
});

export const subscribeCommunity = (onValue: (snapshot: CommunitySnapshot) => void, onError?: (failure: Error) => void, view: FeedView = `public`, profileId?: string) => {
  let active = true;
  let generation = 0;
  let emission = 0;
  let actor: User | undefined;
  let directory: PublicProfile[] | null = null;
  let profiles: PublicProfile[] = [];
  let followingIds: string[] | null = null;
  let requested: PublicProfile | null = null;
  let requestedReady = !profileId;
  let followingReady = false;
  let followingRevision = 0;
  const rootStops: (() => void)[] = [];
  const sourceStops = new Map<string, () => void>();
  const likeStops = new Map<string, () => void>();
  const followedStops: (() => void)[] = [];
  const followedProfiles = new Map<string, PublicProfile | null>();
  const sources = new Map<string, FeedPost[] | null>();
  const liked = new Map<string, boolean | null>();
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Live Community — Check Your Connection And Refresh`)), 20_000);
  const stop = () => {
    active = false; generation++; emission++;
    clearTimeout(timeout);
    rootStops.splice(0).forEach(unsubscribe => unsubscribe());
    followedStops.splice(0).forEach(unsubscribe => unsubscribe());
    sourceStops.forEach(unsubscribe => unsubscribe()); sourceStops.clear();
    likeStops.forEach(unsubscribe => unsubscribe()); likeStops.clear();
  };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(communityError(failure)); } };
  const confirmed = (metadata: { fromCache: boolean; hasPendingWrites: boolean }) => !metadata.fromCache && !metadata.hasPendingWrites;
  const emit = () => {
    if (!active || !directory || !followingIds || !followingReady || !requestedReady || [...sources.values()].some(value => value === null)) return;
    const sourcePosts = [...new Map([...sources.values()].flatMap(value => value ?? []).map(post => [post.id, post])).values()];
    const publicSourcePosts = [...sources].filter(([key]) => key.endsWith(`:public`)).flatMap(([, value]) => value ?? []);
    const posts = selectFeedPosts(sourcePosts, actor?.id, new Set(followingIds), view, profileId);
    const visible = new Set(posts.map(post => post.id));
    for (const [id, unsubscribe] of likeStops) if (!visible.has(id)) { unsubscribe(); likeStops.delete(id); liked.delete(id); }
    if (actor) for (const post of posts) if (!likeStops.has(post.id)) {
      const scope = generation;
      liked.set(post.id, null);
      likeStops.set(post.id, onSnapshot(likeActorRef(post.id, actor.id), { includeMetadataChanges: true }, snapshot => {
        if (!active || scope !== generation || !confirmed(snapshot.metadata)) return;
        liked.set(post.id, snapshot.exists()); emit();
      }, failure => recoverAuthor(post.author, scope, failure)));
    }
    if (actor && posts.some(post => liked.get(post.id) == null)) return;
    const request = ++emission;
    void composeCommunity(profiles, actor, followingIds, sourcePosts, new Set([...liked].filter(([, value]) => value).map(([id]) => id)), view, profileId, publicSourcePosts).then(snapshot => {
      if (!active || request !== emission) return;
      clearTimeout(timeout); onValue(snapshot);
    }).catch(failure => { if (active && request === emission) fail(failure); });
  };
  const recoverAuthor = (author: PublicProfile, scope: number, failure: unknown) => {
    if (!active || scope !== generation) return;
    if (!(failure instanceof FirebaseError) || failure.code !== `permission-denied` || author.id === actor?.id) { fail(failure); return; }
    emission++;
    void readQuery(profileTargetQuery(author.id)).then(async current => {
      if (!active || scope !== generation) return;
      if (current.empty) {
        directory = directory?.filter(profile => profile.id !== author.id) ?? null;
        followedProfiles.set(author.id, null);
        if (requested?.id === author.id) requested = null;
        rebuild();
      } else if (author.publicDomains && current.docs[0]?.data().publicDomains === false) {
        const profile = readProfile(current.docs[0].data(), current.docs[0].id);
        directory = directory?.map(item => item.id === author.id ? profile : item) ?? null;
        if (followedProfiles.has(author.id)) followedProfiles.set(author.id, profile);
        if (requested?.id === author.id) requested = profile;
        rebuild();
      } else if (actor && followingIds?.includes(author.id) && !(await readDocument(followingRef(actor.id, author.id))).exists()) {
        if (!active || scope !== generation) return;
        followingIds = followingIds.filter(id => id !== author.id); rebuild();
      } else fail(failure);
    }).catch(fail);
  };
  const rebuild = () => {
    if (!active || !directory || !followingIds || !followingReady || !requestedReady) return;
    generation++; emission++;
    sourceStops.forEach(unsubscribe => unsubscribe()); sourceStops.clear(); sources.clear();
    likeStops.forEach(unsubscribe => unsubscribe()); likeStops.clear(); liked.clear();
    const merged = new Map(directory.map(profile => [profile.id, profile]));
    followedProfiles.forEach(profile => { if (profile) merged.set(profile.id, profile); });
    if (requested) merged.set(requested.id, requested);
    if (actor) merged.set(actor.id, safeProfile(actor));
    profiles = [...merged.values()];
    const scope = generation;
    const authors = communityAuthors(profiles, actor);
    const followed = new Set(followingIds);
    const attachSource = (author: PublicProfile, own: boolean, following: boolean, key: string) => {
      sourceStops.set(key, onSnapshot(authorPostsQuery(author.id, own, following), { includeMetadataChanges: true }, snapshot => {
        if (!active || scope !== generation || !confirmed(snapshot.metadata)) return;
        try { sources.set(key, snapshot.docs.map(record => ({ ...readPost(record.data(), record.id), author, liked: false }))); emit(); }
        catch (failure) { fail(failure); }
      }, failure => recoverAuthor(author, scope, failure)));
    };
    for (const author of authors) {
      if (author.profilePrivacy === `public`) sources.set(`${author.id}:public`, null);
      if (author.id === actor?.id || view === `following` && followed.has(author.id)) sources.set(`${author.id}:feed`, null);
    }
    for (const author of authors) {
      if (author.profilePrivacy === `public`) attachSource(author, false, false, `${author.id}:public`);
      if (author.id === actor?.id || view === `following` && followed.has(author.id)) attachSource(author, author.id === actor?.id, true, `${author.id}:feed`);
      if (author.profilePrivacy === `public` && author.publicDomains) {
        let initial = true;
        sourceStops.set(`${author.id}:domains`, onSnapshot(query(collection(getFirebaseDb(), `publicProfiles`, author.id, `domains`), limit(101)), { includeMetadataChanges: true }, snapshot => {
          if (!active || scope !== generation || !confirmed(snapshot.metadata)) return;
          if (initial) { initial = false; return; }
          emit();
        }, failure => recoverAuthor(author, scope, failure)));
      }
    }
    emit();
  };
  void getViewer().then(viewer => {
    if (!active) return;
    actor = viewer;
    if (profileId === actor?.id) requestedReady = true;
    rootStops.push(onSnapshot(profileQuery(), { includeMetadataChanges: true }, snapshot => {
      if (!active || !confirmed(snapshot.metadata)) return;
      try { assertActor(actor?.firebase_uid ?? null); directory = snapshot.docs.map(record => readProfile(record.data(), record.id)); rebuild(); }
      catch (failure) { fail(failure); }
    }, fail));
    if (profileId && profileId !== actor?.id) rootStops.push(onSnapshot(profileTargetQuery(profileId), { includeMetadataChanges: true }, snapshot => {
      if (!active || !confirmed(snapshot.metadata)) return;
      try { requested = snapshot.docs[0] ? readProfile(snapshot.docs[0].data(), snapshot.docs[0].id) : null; requestedReady = true; rebuild(); }
      catch (failure) { fail(failure); }
    }, fail));
    if (!actor) { followingIds = []; followingReady = true; rebuild(); return; }
    rootStops.push(onSnapshot(followingQuery(actor.id), { includeMetadataChanges: true }, snapshot => {
      if (!active || !confirmed(snapshot.metadata)) return;
      followingIds = snapshot.docs.map(record => record.id);
      const followingScope = ++followingRevision;
      followedStops.splice(0).forEach(unsubscribe => unsubscribe()); followedProfiles.clear();
      const targets = followingIds.slice(0, COMMUNITY_PROFILE_LIMIT);
      const pending = new Set(targets);
      followingReady = pending.size === 0;
      for (const id of targets) followedStops.push(onSnapshot(profileTargetQuery(id), { includeMetadataChanges: true }, target => {
        if (!active || followingScope !== followingRevision || !confirmed(target.metadata)) return;
        try {
          followedProfiles.set(id, target.docs[0] ? readProfile(target.docs[0].data(), target.docs[0].id) : null);
          pending.delete(id); followingReady = pending.size === 0; rebuild();
        } catch (failure) { fail(failure); }
      }, fail));
      rebuild();
    }, fail));
  }).catch(fail);
  return stop;
};

export const createPost = (input: PostInput, expectedViewerId?: string | null): Promise<PublicPost> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  const body = validatePostContent(input?.body);
  if (![`public`, `followers`, `private`].includes(input?.audience)) throw new Error(`Choose Who Can See Your Post`);
  const created = await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const savedCounter = await transaction.get(counterRef(`Posts`));
    const number = nextNumber(savedCounter.data());
    const identity = genID(Types.Post, number, `Post`);
    const model = new Post({ ...identity, number, body, authorId: actor.id, audience: input.audience, created: identity.date, updated: identity.date });
    const record = model.toRecord();
    transaction.set(counterRef(`Posts`), { number, lastRecordId: identity.id });
    transaction.set(postRef(identity.id), { id: record.id, number, type: Types.Post, body: record.body, authorId: record.authorId, audience: record.audience, likeCount: 0, commentCount: 0, created: serverTimestamp(), updated: serverTimestamp() });
    return identity.id;
  });
  assertActor(actor.firebase_uid!);
  const saved = await readDocument(postRef(created));
  assertActor(actor.firebase_uid!);
  return readPost(saved.data()!, saved.id);
});

export const updatePost = (id: string, input: PostInput, expectedViewerId?: string | null): Promise<PublicPost> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  const body = validatePostContent(input?.body);
  if (![`public`, `followers`, `private`].includes(input?.audience)) throw new Error(`Choose Who Can See Your Post`);
  await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const saved = await transaction.get(postRef(id));
    if (!saved.exists() || saved.data().authorId !== actor.id) throw new Error(`Only Your Own Post(s) Can Be Edited`);
    if (saved.data().body === body && saved.data().audience === input.audience) return;
    transaction.update(postRef(id), { body, audience: input.audience, updated: serverTimestamp() });
  });
  assertActor(actor.firebase_uid!);
  const saved = await readDocument(postRef(id));
  assertActor(actor.firebase_uid!);
  return readPost(saved.data()!, saved.id);
});
export const deletePost = (id: string, expectedViewerId?: string | null): Promise<void> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const saved = await transaction.get(postRef(id));
    if (!saved.exists() || saved.data().authorId !== actor.id) throw new Error(`Only Your Own Post(s) Can Be Deleted`);
    transaction.delete(postRef(id));
  });
  assertActor(actor.firebase_uid!);
});

export const setFollowing = (profileId: string, following: boolean, expectedViewerId?: string | null): Promise<void> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  if (typeof following !== `boolean` || getAppCollectionIDNumber(profileId, Types.User) < 1 || profileId === actor.id) throw new Error(`Choose Another Public Profile`);
  await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const mappingRef = followingRef(actor.id, profileId);
    const mapping = await transaction.get(mappingRef);
    if (mapping.exists() === following) return;
    if (!following) {
      transaction.delete(doc(getFirebaseDb(), `communityFollows`, mapping.data()!.id));
      transaction.delete(mappingRef);
      return;
    }
    const profile = await transaction.get(doc(getFirebaseDb(), `publicProfiles`, profileId));
    const counter = await transaction.get(counterRef(`Follows`));
    if (!profile.exists() || profile.data().profilePrivacy !== `public`) throw new Error(`This Profile Is Private Or Unavailable`);
    const number = nextNumber(counter.data());
    const identity = genID(Types.Follow, number, `Follow`);
    transaction.set(counterRef(`Follows`), { number, lastRecordId: identity.id });
    transaction.set(doc(getFirebaseDb(), `communityFollows`, identity.id), { id: identity.id, number, type: Types.Follow, followerId: actor.id, followingId: profileId, created: serverTimestamp() });
    transaction.set(mappingRef, { id: identity.id, number, followerId: actor.id, followingId: profileId });
  });
  assertActor(actor.firebase_uid!);
});

export const setLiked = (postId: string, isLiked: boolean, expectedViewerId?: string | null): Promise<void> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  if (typeof isLiked !== `boolean`) throw new Error(`Choose A Like Action`);
  await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const saved = await transaction.get(postRef(postId));
    const lookup = await transaction.get(likeActorRef(postId, actor.id));
    if (!saved.exists()) throw new Error(`This Post Is Private Or Unavailable`);
    if (isLiked && saved.data().authorId === actor.id) throw new Error(`Like Another Member’s Post`);
    if (lookup.exists() === isLiked) return;
    const post = readPost(saved.data(), saved.id);
    let recordId = lookup.data()?.id as string | undefined;
    if (isLiked) {
      const counter = await transaction.get(counterRef(`Likes`));
      const number = nextNumber(counter.data());
      const identity = socialIdentity(`PostLike`, number);
      recordId = identity.id;
      transaction.set(counterRef(`Likes`), { number, postId, lastRecordId: recordId });
      transaction.set(doc(getFirebaseDb(), `communityPosts`, postId, `likes`, recordId), { id: recordId, number, postId, type: `PostLike`, actorId: actor.id, created: serverTimestamp() });
      transaction.set(likeActorRef(postId, actor.id), { id: recordId, number, actorId: actor.id, postId });
    } else {
      transaction.delete(doc(getFirebaseDb(), `communityPosts`, postId, `likes`, recordId!));
      transaction.delete(likeActorRef(postId, actor.id));
    }
    transaction.update(postRef(postId), { likeCount: post.likeCount + (isLiked ? 1 : -1), engagement: { kind: isLiked ? `like-add` : `like-remove`, recordId } });
  });
  assertActor(actor.firebase_uid!);
});

export const getPostComments = (postId: string): Promise<{ comments: FeedComment[]; hasMore: boolean }> => operation(async () => {
  const actor = await getViewer();
  const [post, profileSnapshot] = await Promise.all([readDocument(postRef(postId)), readQuery(profileQuery())]);
  if (!post.exists()) throw new Error(`This Post Is Unavailable`);
  const profiles = profileSnapshot.docs.map(record => readProfile(record.data(), record.id));
  await requestedProfile(post.data().authorId, profiles, actor);
  if (actor && !profiles.some(profile => profile.id === actor.id)) profiles.push(safeProfile(actor));
  const pages = await Promise.all(profiles.map(async author => {
    const snapshot = await readQuery(query(collection(getFirebaseDb(), `communityPosts`, postId, `comments`), where(`authorId`, `==`, author.id), orderBy(`number`, `desc`), limit(COMMENT_AUTHOR_LIMIT + 1)));
    return { hasMore: snapshot.size > COMMENT_AUTHOR_LIMIT, comments: snapshot.docs.slice(0, COMMENT_AUTHOR_LIMIT).map(record => readComment(record.data(), record.id, postId, author)) };
  }));
  assertActor(actor?.firebase_uid ?? null);
  const comments = pages.flatMap(page => page.comments).sort((a, b) => b.number - a.number);
  return { comments: comments.slice(0, COMMENT_LIMIT).reverse(), hasMore: comments.length > COMMENT_LIMIT || pages.some(page => page.hasMore) || profileSnapshot.size === COMMUNITY_PROFILE_LIMIT };
});
const readComment = (data: DocumentData, id: string, postId: string, author: PublicProfile): FeedComment => {
  if (data.id !== id || getAppCollectionIDNumber(id, `PostComment`) !== data.number || data.postId !== postId || data.authorId !== author.id
    || typeof data.body !== `string` || data.body.length > 1000) throw new Error(`Saved Comment(s) Could Not Be Read`);
  return { id, postId, number: data.number, authorId: author.id, author, body: data.body.trim(), created: timestamp(data.created), updated: timestamp(data.updated) };
};
export const addComment = (postId: string, input: string, expectedViewerId?: string | null): Promise<FeedComment> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  const body = validateComment(input);
  const id = await runTransaction(getFirebaseDb(), async transaction => {
    const account = await transactionActor(transaction, actor);
    const post = await transaction.get(postRef(postId));
    const counter = await transaction.get(counterRef(`Comments`));
    if (account.profilePrivacy !== `public`) throw new Error(`Make Your Profile Public To Join The Discussion`);
    if (!post.exists()) throw new Error(`This Post Is Private Or Unavailable`);
    const number = nextNumber(counter.data());
    const identity = socialIdentity(`PostComment`, number);
    const data = readPost(post.data(), post.id);
    transaction.set(counterRef(`Comments`), { number, postId, lastRecordId: identity.id });
    transaction.set(commentRef(postId, identity.id), { id: identity.id, number, type: `PostComment`, body, postId, authorId: actor.id, created: serverTimestamp(), updated: serverTimestamp() });
    transaction.update(postRef(postId), { commentCount: data.commentCount + 1, engagement: { kind: `comment-add`, recordId: identity.id } });
    return identity.id;
  });
  assertActor(actor.firebase_uid!);
  const saved = await readDocument(commentRef(postId, id));
  assertActor(actor.firebase_uid!);
  return readComment(saved.data()!, id, postId, safeProfile(actor));
});
export const deleteComment = (postId: string, id: string, expectedViewerId?: string | null): Promise<void> => operation(async () => {
  const actor = await requireActor(expectedViewerId);
  await runTransaction(getFirebaseDb(), async transaction => {
    await transactionActor(transaction, actor);
    const post = await transaction.get(postRef(postId));
    const comment = await transaction.get(commentRef(postId, id));
    if (!comment.exists() || comment.data().authorId !== actor.id) throw new Error(`Only Your Own Comment(s) Can Be Deleted`);
    if (!post.exists()) throw new Error(`This Post Is Unavailable`);
    const data = readPost(post.data(), post.id);
    transaction.delete(commentRef(postId, id));
    transaction.update(postRef(postId), { commentCount: data.commentCount - 1, engagement: { kind: `comment-remove`, recordId: id } });
  });
  assertActor(actor.firebase_uid!);
});
