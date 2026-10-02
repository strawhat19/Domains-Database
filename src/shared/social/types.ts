import type { PublicProfile } from '../models/users/User';
import type { PostAudience, PostInput } from '../models/posts/Post';

export type { PostAudience, PostInput };
export type FeedView = `public` | `following` | `mine`;
export interface PublicDomain { id: string; name: string; registrar: string }
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
export interface FeedPost extends PublicPost { author: PublicProfile }
export interface CommunitySnapshot {
  posts: FeedPost[];
  viewerId: string | null;
  profiles: CommunityProfile[];
  followingIds: string[];
  storageEnabled: boolean;
}
