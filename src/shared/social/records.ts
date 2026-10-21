import { genID, getAppCollectionIDNumber } from '../common/ids';

export interface SocialLike {
  id: string;
  number: number;
  postId: string;
  actorId: string;
  created: string;
}

export interface SocialComment {
  id: string;
  body: string;
  number: number;
  postId: string;
  created: string;
  updated: string;
  authorId: string;
}

export const MAX_COMMENT_LENGTH = 1000;
export const validateComment = (input: string) => {
  if (typeof input !== `string` || !input.trim() || input.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Write A Comment Of 1 To ${MAX_COMMENT_LENGTH} Characters`);
  }
  return input.trim();
};

export const socialIdentity = (type: `PostLike` | `PostComment`, number: number) => {
  const identity = genID(type, number, type === `PostLike` ? `Like` : `Comment`);
  return { number, id: identity.id, created: identity.date };
};

export const validSocialIdentity = (record: { id: string; number: number }, type: string) =>
  Number.isSafeInteger(record.number) && record.number > 0 && getAppCollectionIDNumber(record.id, type) === record.number;
