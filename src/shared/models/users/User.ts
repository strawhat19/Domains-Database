import { isAppCollectionID } from '../../common/ids';
import { capWords, toTimestamp } from '../../common/values';
import { Data, type JSONValue, type DataColor } from '../Data';
import { Roles, Types, Providers } from '../../../types/types';

export const minRole = (currentRole: Roles | string, requiredRole: Roles | string) => {
  const roles = Object.values(Roles);
  const current = roles.indexOf(currentRole as Roles);
  const required = roles.indexOf(requiredRole as Roles);
  return current >= 0 && required >= 0 && current >= required;
};

interface ProviderUser {
  uid?: string;
  email?: string;
  photoURL?: string;
  providerId?: string;
  displayName?: string;
  emailVerified?: boolean;
  metadata?: Record<string, JSONValue>;
}

export type UserInput = Omit<Partial<User>, `id`> & {
  id?: string | number;
  user?: ProviderUser;
  imageUrl?: string;
  firebaseUser?: ProviderUser;
  userCredential?: { user?: ProviderUser };
};

export type ProfilePrivacy = `public` | `private`;
export interface PublicProfile {
  id: string;
  name: string;
  description: string;
  color: DataColor;
  photoURL?: string;
  publicDomains: boolean;
  profilePrivacy: ProfilePrivacy;
}

export interface ProfileInput {
  name?: string;
  description?: string;
  publicDomains?: boolean;
  profilePrivacy?: ProfilePrivacy;
}

export class User extends Data {
  plan: string;
  active: boolean;
  source: string;
  verified: boolean;
  signedIn: boolean;
  anonymous: boolean;
  publicDomains: boolean;
  profilePrivacy: ProfilePrivacy;
  phone?: string;
  image?: string;
  avatar?: string;
  imageURL?: string;
  photoURL?: string;
  firebase_uid?: string;
  value?: string | number;
  userIDs: string[];
  roles: (Roles | string)[];
  role: Roles | string;
  roleLevel: number;
  provider: Providers | string;
  providerId?: string;
  displayName: string;
  emailVerified: boolean;
  creationTime: string;
  lastSignIn?: string;
  lastUpdated?: string;
  lastRefresh?: string;
  validSince?: string;
  lastRefreshAt?: string;
  lastSignInTime?: string;
  lastAuthenticated?: string;
  uploads: JSONValue[];
  paymentMethods: JSONValue[];
  data: Record<string, JSONValue>;
  meta: Record<string, JSONValue>;
  media: Record<string, JSONValue>;
  metadata: Record<string, JSONValue>;

  constructor(data: UserInput = {}) {
    const auth = data.userCredential?.user ?? data.firebaseUser ?? data.user;
    const email = data.email || auth?.email || ``;
    const name = data.name || data.displayName || auth?.displayName || capWords(email.split(`@`)[0] ?? ``);
    const appID = isAppCollectionID(data.id, Types.User);
    super({ ...data, name, email, type: Types.User, id: appID ? String(data.id) : undefined, uid: data.uid || auth?.uid });
    this.role = data.role || data.roles?.[0] || Roles.Subscriber;
    this.roles = data.roles?.length ? [...data.roles] : [this.role];
    this.roleLevel = Object.values(Roles).indexOf(this.role as Roles);
    this.providerId = data.providerId || auth?.providerId || (!appID && data.id !== undefined ? String(data.id) : undefined);
    this.provider = data.provider || (this.providerId?.includes(`google`) ? Providers.Google : auth ? Providers.Firebase : Providers.Local);
    this.source = data.source || this.provider;
    this.plan = data.plan || `free`;
    this.firebase_uid = data.firebase_uid || auth?.uid;
    this.phone = data.phone;
    this.active = data.active ?? true;
    this.anonymous = data.anonymous ?? false;
    this.publicDomains = data.publicDomains === true;
    this.profilePrivacy = data.profilePrivacy === `public` ? `public` : `private`;
    this.signedIn = data.signedIn ?? false;
    this.emailVerified = data.emailVerified ?? auth?.emailVerified ?? data.verified ?? false;
    this.verified = this.emailVerified;
    this.displayName = data.displayName || this.name;
    this.photoURL = data.photoURL || auth?.photoURL || data.avatar || data.imageURL || data.imageUrl || data.image;
    this.avatar = data.avatar || this.photoURL;
    this.imageURL = data.imageURL || data.imageUrl || this.avatar;
    this.image = data.image || this.imageURL;
    this.userIDs = [...(data.userIDs ?? [])];
    this.data = { ...data.data };
    this.meta = { ...data.meta };
    this.media = { ...data.media };
    this.metadata = { ...(data.metadata ?? auth?.metadata) };
    this.uploads = [...(data.uploads ?? [])];
    this.paymentMethods = [...(data.paymentMethods ?? [])];
    this.creationTime = toTimestamp(data.creationTime || this.metadata.creationTime, this.created);
    this.lastSignIn = data.lastSignIn || data.lastSignInTime || String(this.metadata.lastSignInTime || ``) || undefined;
    this.lastSignInTime = data.lastSignInTime || this.lastSignIn;
    this.lastAuthenticated = data.lastAuthenticated;
    this.lastUpdated = data.lastUpdated || this.updated;
    this.lastRefresh = data.lastRefresh;
    this.lastRefreshAt = data.lastRefreshAt;
    this.validSince = data.validSince;
    this.value = data.value;
    this.refreshProperties();
  }
}
