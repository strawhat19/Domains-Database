import * as local from './service.local';
import * as firebase from './firebase';
import { useLocalStorage } from '../config';
import { SOCIAL_STORAGE_KEY } from '../accountData/keys';
import { subscribeStorage } from '../common/storage';
import type { FeedView, CommunitySnapshot } from './types';

export { SOCIAL_STORAGE_KEY } from '../accountData/keys';
export { MAX_COMMENT_LENGTH } from './records';

const service = useLocalStorage ? local : firebase;
export const getCommunity = service.getCommunity;
export const createPost = service.createPost;
export const updatePost = service.updatePost;
export const deletePost = service.deletePost;
export const setFollowing = service.setFollowing;
export const setLiked = service.setLiked;
export const addComment = service.addComment;
export const deleteComment = service.deleteComment;
export const getPostComments = service.getPostComments;
export const getComments = service.getPostComments;

export const subscribeCommunity = (onValue: (snapshot: CommunitySnapshot) => void, onError?: (failure: Error) => void, view: FeedView = `public`, profileId?: string) => {
  if (!useLocalStorage) return firebase.subscribeCommunity(onValue, onError, view, profileId);
  let active = true;
  let revision = 0;
  const refresh = () => {
    const request = ++revision;
    void local.getCommunity(view, profileId).then(snapshot => { if (active && request === revision) onValue(snapshot); })
      .catch(failure => { if (active && request === revision) onError?.(failure instanceof Error ? failure : new Error(`Community Could Not Be Loaded`)); });
  };
  const stop = subscribeStorage(SOCIAL_STORAGE_KEY, refresh, onError);
  refresh();
  return () => { active = false; revision++; stop(); };
};
