import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';
import type { PlanVote } from '../../planInterest/types';

export class PlanInterest extends Data {
  planId: string;
  userId: string;
  actorKey: string;
  migratedTo: string;
  interested: boolean;
  vote: Exclude<PlanVote, null> | `down` | `none`;

  constructor(data: Partial<PlanInterest> = {}) {
    super({ ...data, name: `Plan`, type: Types.PlanInterest });
    this.vote = data.vote ?? `none`;
    this.planId = data.planId ?? ``;
    this.userId = data.userId ?? ``;
    this.actorKey = data.actorKey ?? ``;
    this.migratedTo = data.migratedTo ?? ``;
    this.interested = data.interested ?? false;
    this.refreshProperties();
  }
  toRecord(): Record<string, JSONValue> {
    return {
      id: this.id,
      type: this.type,
      vote: this.vote,
      number: this.number,
      planId: this.planId,
      userId: this.userId,
      created: this.created,
      updated: this.updated,
      actorKey: this.actorKey,
      migratedTo: this.migratedTo,
      interested: this.interested,
    };
  }
}
