import {
  setLiked,
  createPost,
  updatePost,
  deletePost,
  addComment,
  getCommunity,
  setFollowing,
  deleteComment,
  getPostComments,
  subscribeCommunity,
} from '../shared/social/service';

export const socialAPI = { setLiked, createPost, updatePost, deletePost, addComment, getCommunity, setFollowing, deleteComment, getPostComments, subscribeCommunity };
