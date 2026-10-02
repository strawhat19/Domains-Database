import { Data } from '../Data';
import { Types } from '../../../types/types';

export class Follow extends Data {
  followerId: string;
  followingId: string;

  constructor(data: Partial<Follow> = {}) {
    super({ ...data, type: Types.Follow, name: `Follow`, email: `` });
    this.followerId = data.followerId ?? ``;
    this.followingId = data.followingId ?? ``;
    this.refreshProperties();
  }
}
