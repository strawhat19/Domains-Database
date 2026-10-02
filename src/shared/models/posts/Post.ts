import { Data } from '../Data';
import { Types } from '../../../types/types';

export type PostAudience = `public` | `followers` | `private`;
export interface PostInput { body: string; audience: PostAudience }

export class Post extends Data {
  body: string;
  authorId: string;
  audience: PostAudience;

  constructor(data: Partial<Post> = {}) {
    super({ ...data, type: Types.Post, name: `Post`, email: `` });
    this.body = data.body ?? ``;
    this.authorId = data.authorId ?? ``;
    this.audience = data.audience ?? `private`;
    this.refreshProperties();
  }
}
