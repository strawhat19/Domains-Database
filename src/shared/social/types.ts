import type { DomainRecord } from '../types';
import type { PublicProfile } from '../models/users/User';
import type { PostAudience, PostInput } from '../models/posts/Post';

export type { PostAudience, PostInput };
export type FeedView = `public` | `following` | `mine`;
export type PublicDomain = Pick<DomainRecord,
  `id` | `tld` | `mvp` | `name` | `future` | `created` | `registrar` | `expiresAt` | `createdAt` | `difficulty` | `description` | `projectStatus`
>;
export interface PublicPost {
  id: string;
  body: string;
  number: number;
  created: string;
  updated: string;
  authorId: string;
  audience: PostAudience;
}
export interface CommunityProfile extends PublicProfile { following: boolean; domains: PublicDomain[] }
export interface FeedPost extends PublicPost {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  author: PublicProfile;
}
export interface FeedComment {
  id: string;
  body: string;
  number: number;
  postId: string;
  created: string;
  updated: string;
  authorId: string;
  author: PublicProfile;
}
export interface PostComments {
  hasMore: boolean;
  comments: FeedComment[];
}
export interface CommunitySnapshot {
  hasMore: boolean;
  coverage: string;
  posts: FeedPost[];
  source: `firebase` | `local`;
  viewerId: string | null;
  progressPosts: FeedPost[];
  profiles: CommunityProfile[];
  followingIds: string[];
  storageEnabled: boolean;
}
