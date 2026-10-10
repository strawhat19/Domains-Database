import { query, limit, getDocs, orderBy, startAfter, onSnapshot, type Query, type QuerySnapshot, type DocumentData } from 'firebase/firestore';

export const collectionPageSize = 50;
export interface CollectionPage<T> {
  records: T[];
  nextCursor: number | null;
}
interface CollectionListener<T> {
  value: (page: CollectionPage<T>) => void;
  error?: (failure: Error) => void;
}
interface CollectionWatch<T> {
  stop: () => void;
  page?: CollectionPage<T>;
  listeners: Set<CollectionListener<T>>;
}

const validateCursor = (cursor: number | null) => {
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) throw new Error(`Choose A Valid Page`);
};
export const numberCollectionPage = <T extends { number: number }>(records: T[], cursor: number | null = null): CollectionPage<T> => {
  validateCursor(cursor);
  const ordered = records.filter(record => cursor === null || record.number < cursor).sort((first, second) => second.number - first.number);
  const visible = ordered.slice(0, collectionPageSize);
  return { records: visible, nextCursor: ordered.length > collectionPageSize ? visible[collectionPageSize - 1]?.number ?? null : null };
};

export const createFirestoreCollection = <T extends { number: number }>(
  reference: () => Query<DocumentData>,
  read: (snapshot: QuerySnapshot<DocumentData>, actor: string) => T[],
  requireActor: () => Promise<string>,
  assertActor: (actor: string) => void,
  subscribeActor: (listener: () => void) => () => void,
  errorFromFailure: (failure: unknown) => Error,
) => {
  const watches = new Map<string, CollectionWatch<T>>();
  const pending = new Map<string, Promise<CollectionPage<T>>>();
  const pageQuery = (cursor: number | null) => {
    validateCursor(cursor);
    return query(reference(), orderBy(`number`, `desc`), ...(cursor === null ? [] : [startAfter(cursor)]), limit(collectionPageSize + 1));
  };
  const subscribePage = (onValue: (page: CollectionPage<T>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
    let active = true;
    let release: () => void = () => undefined;
    const listener: CollectionListener<T> = {
      value: page => { if (active) onValue(page); },
      error: failure => { if (active) onError?.(failure); },
    };
    void requireActor().then(actor => {
      if (!active) return;
      assertActor(actor);
      const reference = pageQuery(cursor);
      const key = JSON.stringify([actor, cursor]);
      let watch = watches.get(key);
      if (!watch) {
        const current: CollectionWatch<T> = { stop: () => undefined, listeners: new Set([listener]) };
        watch = current;
        watches.set(key, current);
        const fail = (failure: unknown) => {
          if (watches.get(key) !== current) return;
          current.page = undefined;
          current.stop();
          watches.delete(key);
          for (const subscriber of current.listeners) subscriber.error?.(errorFromFailure(failure));
        };
        const stopSnapshot = onSnapshot(reference, snapshot => {
          if (watches.get(key) !== current) return;
          try {
            assertActor(actor);
            current.page = numberCollectionPage(read(snapshot, actor));
            for (const subscriber of current.listeners) subscriber.value(current.page);
          } catch (failure) { fail(failure); }
        }, fail);
        const stopActor = subscribeActor(() => {
          try { assertActor(actor); } catch (failure) { fail(failure); }
        });
        current.stop = () => { stopSnapshot(); stopActor(); };
      } else watch.listeners.add(listener);
      const currentWatch = watch;
      release = () => {
        currentWatch.listeners.delete(listener);
        if (currentWatch.listeners.size || watches.get(key) !== currentWatch) return;
        currentWatch.stop();
        watches.delete(key);
      };
      if (currentWatch.page) listener.value(currentWatch.page);
    }).catch(failure => listener.error?.(errorFromFailure(failure)));
    return () => { active = false; release(); };
  };
  const getPage = async (cursor: number | null = null) => {
    const actor = await requireActor();
    assertActor(actor);
    const reference = pageQuery(cursor);
    const key = JSON.stringify([actor, cursor]);
    const cached = watches.get(key)?.page;
    if (cached) return cached;
    if (watches.has(key)) return new Promise<CollectionPage<T>>((resolve, reject) => {
      let unsubscribe: () => void = () => undefined;
      unsubscribe = subscribePage(page => { unsubscribe(); resolve(page); }, failure => { unsubscribe(); reject(failure); }, cursor);
    });
    const previous = pending.get(key);
    if (previous) return previous;
    const result = getDocs(reference).then(snapshot => {
      assertActor(actor);
      return numberCollectionPage(read(snapshot, actor));
    });
    pending.set(key, result);
    try { return await result; }
    finally { if (pending.get(key) === result) pending.delete(key); }
  };
  const get = async () => (await getPage()).records;
  const subscribe = (onValue: (records: T[]) => void, onError?: (failure: Error) => void) => subscribePage(page => onValue(page.records), onError);
  return { get, getPage, subscribe, subscribePage };
};