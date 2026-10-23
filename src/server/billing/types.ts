export class BillingError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export interface BillingActor {
  id: string;
  name: string;
  role: string;
  email: string;
  userId: string;
  owner: boolean;
  active: true;
  firebaseUid: string;
}

export interface BillingStatus {
  owner: boolean;
  plan: `free` | `starter`;
  portalAvailable: boolean;
  checkoutAvailable: boolean;
  subscription: null | {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  };
}

export interface CheckoutInput {
  planId: string;
  currency: string;
  priceCents: number;
  billingInterval: string;
}
