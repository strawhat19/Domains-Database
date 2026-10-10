import { Data } from '../models/Data';
import { persistenceEnabled } from '../config';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from './storage';

interface CollectionSnapshot<T> {
  version: 1;
  records: T[];
  nextNumber: number;
}

export const createCollection = <T extends Data>(key: string, model: new (data: Partial<T>) => T, getUserId: () => Promise<string>) => {
  const serialize = createOperationQueue(key);
  const restore = (saved: string | null, userId: string) => {
    let snapshot: CollectionSnapshot<T>;
    try {
      snapshot = saved ? JSON.parse(saved) : { version: 1, records: [], nextNumber: 1 };
    } catch {
      throw new Error(`Saved Record(s) Could Not Be Read`);
    }
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.records) || !Number.isSafeInteger(snapshot.nextNumber) || snapshot.nextNumber < 1) throw new Error(`Saved Record(s) Could Not Be Read`);
    const ids = new Set<string>();
    const numbers = new Set<number>();
    snapshot.records = snapshot.records.map(record => {
      if (!record?.id || record.uid !== userId || ids.has(record.id) || numbers.has(record.number) || !Number.isSafeInteger(record.number) || record.number < 1) throw new Error(`Saved Record(s) Could Not Be Read`);
      const restored = new model(record);
      if (restored.id !== record.id) throw new Error(`Saved Record ID Could Not Be Read`);
      ids.add(restored.id);
      numbers.add(restored.number);
      return restored;
    });
    snapshot.nextNumber = Math.max(snapshot.nextNumber, ...snapshot.records.map(record => record.number + 1));
    return snapshot;
  };
  const read = async () => {
    if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Record(s)`);
    const userId = await getUserId();
    const storageKey = accountStorageKey(key, userId);
    const saved = await readStorage(storageKey);
    if (await getUserId() !== userId) throw new Error(`Your Account Changed — Try Again`);
    return { storageKey, userId, snapshot: restore(saved, userId) };
  };
  const save = async (key: string, snapshot: CollectionSnapshot<T>, userId: string) => {
    if (await getUserId() !== userId) throw new Error(`Your Account Changed — Try Again`);
    await writeStorage(key, JSON.stringify(snapshot));
  };
  return {
    get: () => serialize(async () => (await read()).snapshot.records),
    subscribe: (onValue: (records: T[]) => void, onError?: (error: Error) => void) => {
      let active = true;
      let revision = 0;
      let unsubscribe: () => void = () => undefined;
      const fail = (failure: unknown) => {
        if (active) onError?.(failure instanceof Error ? failure : new Error(`Saved Record(s) Could Not Be Read`));
      };
      void getUserId().then(userId => {
        if (!active) return;
        if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Record(s)`);
        unsubscribe = subscribeStorage(accountStorageKey(key, userId), saved => {
          const request = ++revision;
          void getUserId().then(currentUserId => {
            if (!active || request !== revision) return;
            if (currentUserId !== userId) throw new Error(`Your Account Changed — Try Again`);
            onValue(restore(saved, userId).records);
          }).catch(fail);
        }, fail);
      }).catch(fail);
      return () => { active = false; revision++; unsubscribe(); };
    },
    create: (input: Partial<T>) => serialize(async () => {
      const { snapshot, storageKey, userId } = await read();
      const record = new model({ ...input, id: undefined, uuid: undefined, uid: userId, number: snapshot.nextNumber, created: new Date().toISOString(), updated: undefined });
      snapshot.nextNumber += 1;
      snapshot.records.push(record);
      await save(storageKey, snapshot, userId);
      return record;
    }),
    update: (id: string, input: Partial<T>) => serialize(async () => {
      const { snapshot, storageKey, userId } = await read();
      const original = snapshot.records.find(record => record.id === id);
      if (!original) throw new Error(`Record Could Not Be Found`);
      const record = new model({ ...original, ...input, id, uid: userId, uuid: original.uuid, number: original.number, created: original.created, updated: new Date().toISOString() });
      snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
      await save(storageKey, snapshot, userId);
      return record;
    }),
    remove: (id: string) => serialize(async () => {
      const { snapshot, storageKey, userId } = await read();
      if (!snapshot.records.some(record => record.id === id)) throw new Error(`Record Could Not Be Found`);
      snapshot.records = snapshot.records.filter(record => record.id !== id);
      await save(storageKey, snapshot, userId);
    }),
  };
};
