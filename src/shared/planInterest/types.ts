export type PlanVote = `up` | `down` | null;
export interface PlanInterestState { planId: string; vote: PlanVote; interested: boolean }
export interface PlanInterestSummary {
  up: number;
  down: number;
  planId: string;
  updated: string;
  planName: string;
  interested: number;
}
export const planInterestLimit = 200;
