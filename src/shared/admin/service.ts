import { useLocalStorage } from '../config';
import { User } from '../models/users/User';
import { FirebaseError } from 'firebase/app';
import { Roles, Types } from '../../types/types';
import { Domain } from '../models/domains/Domain';
import { firebaseEnabled } from '../firebase/config';
import type { AdminSnapshot, UserAccessInput } from './types';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { subscribeAdminNotifications } from '../notifications/service';
import { projectPublicProfile } from '../publicDirectory/profiles';
import { createFirestoreCollection, type CollectionPage } from '../firebase/collection';
import { canAccessAdmin, canManageRoles, canInspectAccounts, canManageAccountStatus } from './permissions';
import { getUsersPage as getLocalUsersPage, restoreSession, subscribeAuthState, subscribeUsersPage as subscribeLocalUsersPage } from '../authentication/service';
import { doc, query, limit, orderBy, Timestamp, collection, onSnapshot, runTransaction, collectionGroup, serverTimestamp, type DocumentData } from 'firebase/firestore';

const cloudEnabled = firebaseEnabled && !useLocalStorage;
const userLimit = 100;
const domainLimit = 500;
let cachedActor: User | null = null;
const errorFromFailure = (failure: unknown) => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Admin Data Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Admin Access Was Denied — Check Your Role And Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Admin Data Needs The Firestore Indexes In This Repository`);
  if (failure.code === `resource-exhausted`) return new Error(`Firestore Quota Exceeded — Try Again Later`);
  return new Error(`Admin Data Is Unavailable — Try Again`);
};
const timestamp = (value: unknown): string | undefined => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value === undefined || typeof value === `string`) return value;
  throw new Error(`Saved Record Date Could Not Be Read`);
};
const readUser = (record: DocumentData, id: string) => {
  if (record?.id !== id || getAppCollectionIDNumber(id, Types.User) < 1 || getAppCollectionIDNumber(id, Types.User) !== record?.number
    || !Object.values(Roles).includes(record?.role) || typeof record?.active !== `boolean`) throw new Error(`Saved User Data Could Not Be Read`);
  return new User({ ...record, created: timestamp(record.created), updated: timestamp(record.updated), lastUpdated: timestamp(record.lastUpdated) });
};
const requireActor = async (inspect = false) => {
  const user = (await restoreSession())?.user;
  if (!canAccessAdmin(user) || (inspect && !canInspectAccounts(user))) throw new Error(`Admin Access Is Required`);
  if (cloudEnabled && (!user?.firebase_uid || getFirebaseAuth().currentUser?.uid !== user.firebase_uid)) throw new Error(`Sign In Again To View Admin Data`);
  cachedActor = user ?? null;
  return user!;
};
const assertActor = (firebaseUid: string) => {
  if (getFirebaseAuth().currentUser?.uid !== firebaseUid || cachedActor?.firebase_uid !== firebaseUid || !canInspectAccounts(cachedActor)) throw new Error(`Your Admin Session Changed — Try Again`);
};
const subscribeActor = (listener: () => void) => {
  let active = true;
  const stop = subscribeAuthState(() => {
    if (getFirebaseAuth().currentUser?.uid !== cachedActor?.firebase_uid) { cachedActor = null; listener(); return; }
    void restoreSession().then(session => {
      if (!active) return;
      cachedActor = session?.user ?? null;
      listener();
    }).catch(() => { if (active) { cachedActor = null; listener(); } });
  });
  return () => { active = false; stop(); };
};
const usersCollection = createFirestoreCollection(
  () => collection(getFirebaseDb(), `users`),
  snapshot => snapshot.docs.map(record => readUser(record.data(), record.id)),
  async () => (await requireActor(true)).firebase_uid!,
  assertActor,
  subscribeActor,
  errorFromFailure,
);

export const getUsersPage = async (cursor: number | null = null): Promise<CollectionPage<User>> => {
  await requireActor(true);
  return cloudEnabled ? usersCollection.getPage(cursor) : getLocalUsersPage(cursor);
};
export const subscribeUsersPage = (onValue: (page: CollectionPage<User>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
  if (cloudEnabled) return usersCollection.subscribePage(onValue, onError, cursor);
  let active = true;
  let stop: () => void = () => undefined;
  void requireActor(true).then(() => {
    if (active) stop = subscribeLocalUsersPage(onValue, onError, cursor);
  }).catch(failure => { if (active) onError?.(errorFromFailure(failure)); });
  return () => { active = false; stop(); };
};

export const subscribeAdminSnapshot = (onValue: (snapshot: AdminSnapshot) => void, onError?: (failure: Error) => void) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(errorFromFailure(failure)); } };
  const initialTimeout = cloudEnabled ? setTimeout(() => fail(new Error(`Could Not Confirm Live Admin Data — Check Your Connection And Refresh`)), 20_000) : undefined;
  if (initialTimeout) stops.push(() => clearTimeout(initialTimeout));
  void requireActor().then(actor => {
    if (!active) return;
    const inspect = canInspectAccounts(actor);
    const state: AdminSnapshot = {
      users: [], domains: [], notifications: [], notificationError: ``, notificationCoverage: null, updatedAt: ``, registeredAccounts: null,
      mode: cloudEnabled ? `firebase` : `local`, canInspectAccounts: inspect,
      userCoverage: { loaded: 0, limit: userLimit, hasMore: false },
      domainCoverage: { loaded: 0, limit: domainLimit, hasMore: false },
    };
    const ready = new Set<string>();
    const expected = cloudEnabled ? inspect ? 4 : 1 : inspect && actor.role === Roles.Owner ? 2 : 1;
    const deliver = (source: string) => {
      ready.add(source);
      if (active && ready.size === expected) {
        clearTimeout(initialTimeout);
        onValue({ ...state, updatedAt: new Date().toISOString() });
      }
    };
    if (inspect) stops.push(subscribeAdminNotifications(page => {
      if (!active) return;
      state.notifications = page.records;
      state.notificationError = ``;
      state.notificationCoverage = { loaded: page.records.length, limit: 50, hasMore: page.nextCursor !== null };
      deliver(`notifications`);
    }, failure => {
      if (!active) return;
      state.notifications = [];
      state.notificationCoverage = null;
      state.notificationError = failure.message;
      deliver(`notifications`);
    }));
    if (!cloudEnabled) {
      if (actor.role !== Roles.Owner) { if (!inspect) deliver(`local`); return; }
      stops.push(subscribeLocalUsersPage(page => {
        state.users = page.records;
        state.userCoverage = { loaded: page.records.length, limit: 50, hasMore: page.nextCursor !== null };
        deliver(`local`);
      }, fail));
      return;
    }
    const firebaseUid = actor.firebase_uid!;
    stops.push(subscribeAuthState(() => {
      if (getFirebaseAuth().currentUser?.uid !== firebaseUid) { fail(new Error(`Your Account Changed — Try Again`)); return; }
      void restoreSession().then(session => {
        if (active && (!canAccessAdmin(session?.user) || (inspect && !canInspectAccounts(session?.user)))) fail(new Error(`Your Admin Access Changed — Refresh This Page`));
      }).catch(fail);
    }));
    stops.push(onSnapshot(doc(getFirebaseDb(), `counters`, `users`), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      const number = snapshot.data()?.number;
      if (snapshot.exists() && (!Number.isSafeInteger(number) || number < 1)) { fail(new Error(`Saved User Counter Could Not Be Read`)); return; }
      if (getFirebaseAuth().currentUser?.uid !== firebaseUid) { fail(new Error(`Your Account Changed — Try Again`)); return; }
      state.registeredAccounts = snapshot.exists() ? number : 0;
      deliver(`counter`);
    }, fail));
    if (!inspect) return;
    stops.push(onSnapshot(query(collection(getFirebaseDb(), `users`), orderBy(`number`, `desc`), limit(userLimit + 1)), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        state.users = snapshot.docs.slice(0, userLimit).map(record => readUser(record.data(), record.id));
        state.userCoverage = { loaded: state.users.length, limit: userLimit, hasMore: snapshot.size > userLimit };
        deliver(`users`);
      } catch (failure) { fail(failure); }
    }, fail));
    stops.push(onSnapshot(query(collectionGroup(getFirebaseDb(), `domains`), orderBy(`number`, `desc`), limit(domainLimit + 1)), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        state.domains = snapshot.docs.slice(0, domainLimit).map(record => {
          const data = record.data();
          const ownerId = record.ref.parent.parent?.id;
          if (data?.id !== record.id || data?.uid !== ownerId || getAppCollectionIDNumber(ownerId, Types.User) < 1
            || getAppCollectionIDNumber(record.id, Types.Domain) < 1 || getAppCollectionIDNumber(record.id, Types.Domain) !== data?.number
            || typeof data?.name !== `string` || typeof data?.owner !== `string` || typeof data?.expiresAt !== `string`
            || typeof data?.registrar !== `string` || typeof data?.autoRenew !== `boolean`
            || typeof data?.renewalPrice !== `number` || !Number.isFinite(data.renewalPrice) || data.renewalPrice < 0) throw new Error(`Saved Domain Data Could Not Be Read`);
          return new Domain({ ...data, created: timestamp(data.created), updated: timestamp(data.updated) });
        });
        state.domainCoverage = { loaded: state.domains.length, limit: domainLimit, hasMore: snapshot.size > domainLimit };
        deliver(`domains`);
      } catch (failure) { fail(failure); }
    }, fail));
  }).catch(fail);
  return stop;
};

export const updateUserAccess = async (id: string, input: UserAccessInput): Promise<User> => {
  if (!cloudEnabled) throw new Error(`Connect Firebase To Manage User Access`);
  if (getAppCollectionIDNumber(id, Types.User) < 1 || !input || Object.keys(input).some(key => ![`role`, `active`].includes(key))
    || (!(`role` in input) && !(`active` in input)) || (input.role !== undefined && !Object.values(Roles).includes(input.role))
    || (input.active !== undefined && typeof input.active !== `boolean`)) throw new Error(`Choose Valid User Access Settings`);
  const session = await requireActor(true);
  const database = getFirebaseDb();
  const actorRef = doc(database, `users`, session.id);
  const targetRef = doc(database, `users`, id);
  const counterRef = doc(database, `counters`, `adminAudits`);
  try {
    return await runTransaction(database, async transaction => {
      if (getFirebaseAuth().currentUser?.uid !== session.firebase_uid) throw new Error(`Your Account Changed — Try Again`);
      const [actorRecord, targetRecord, counterRecord] = await Promise.all([transaction.get(actorRef), transaction.get(targetRef), transaction.get(counterRef)]);
      if (!actorRecord.exists() || !targetRecord.exists()) throw new Error(`Account Could Not Be Found`);
      const actor = readUser(actorRecord.data(), session.id);
      const target = readUser(targetRecord.data(), id);
      if (!canInspectAccounts(actor) || actor.firebase_uid !== session.firebase_uid || actor.id === target.id) throw new Error(`Another Active Admin Must Update Your Access`);
      if (input.role !== undefined && !canManageRoles(actor)) throw new Error(`Owner Access Is Required To Change Roles`);
      if (input.active !== undefined && !canManageAccountStatus(actor, target)) throw new Error(`Owner Access Is Required To Change This Account Status`);
      const role = input.role ?? target.role;
      const activeStatus = input.active ?? target.active;
      if (role === target.role && activeStatus === target.active) return target;
      const previous = counterRecord.exists() ? counterRecord.data()?.number : 0;
      if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(previous + 1)) throw new Error(`Saved Admin Audit Counter Could Not Be Read`);
      const now = new Date();
      const number = previous + 1;
      const auditId = genID(`AdminAudit`, number, `UserAccess`, now).id;
      const auditRef = doc(database, `adminAudits`, auditId);
      transaction.set(counterRef, { number, lastAuditId: auditId });
      transaction.set(auditRef, {
        id: auditId, number, targetId: id, actorId: actor.id, type: `AdminAudit`,
        action: `user_access`, actorFirebaseUid: session.firebase_uid,
        beforeRole: target.role, afterRole: role, beforeActive: target.active, afterActive: activeStatus,
        created: serverTimestamp(),
      });
      transaction.update(targetRef, { role, active: activeStatus, roles: [role], adminLastAuditId: auditId, updated: serverTimestamp(), lastUpdated: serverTimestamp() });
      if (activeStatus !== target.active) transaction.set(doc(database, `publicProfiles`, id), projectPublicProfile({ ...target, active: activeStatus, photoURL: typeof targetRecord.data().photoURL === `string` ? targetRecord.data().photoURL : `` }));
      return new User({ ...target, role, active: activeStatus, roles: [role], updated: now.toISOString(), lastUpdated: now.toISOString() });
    });
  } catch (failure) { throw errorFromFailure(failure); }
};
