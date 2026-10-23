import { getRequest, saveRequest } from '../shared/subscriptions/service';

export const subscriptionAPI = { getRequest, saveRequest };
export type { SubscriptionRequest } from '../shared/subscriptions/types';
export { subscriptionStorageSource } from '../shared/subscriptions/service';
