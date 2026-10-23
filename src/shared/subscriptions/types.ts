export interface BillingActor { userId: string; firebaseUid: string }
export interface BillingSubscription {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}
export interface BillingStatus {
  owner: boolean;
  plan: `free` | `starter`;
  portalAvailable: boolean;
  checkoutAvailable: boolean;
  subscription: BillingSubscription | null;
}
