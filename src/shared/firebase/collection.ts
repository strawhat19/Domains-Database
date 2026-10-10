import { getDocs, onSnapshot, type Query, type QuerySnapshot, type DocumentData } from 'firebase/firestore';

interface CollectionListener<T> {
  value: (records: T[]) => void;
  error?: (failure: Error) => void;
}

interface CollectionWatch<T> {
  stop: () => void;
  records?: T[];
  listeners: Set<CollectionListener<T>>;
}

export const createFirestoreCollection = <T,>(
  reference: () => Query<DocumentData>,
  read: (snapshot: QuerySnapshot<DocumentData>, actor: string) => T[],
  requireActor: () => Promise<string>,
  assertActor: (actor: string) => void,
  subscribeActor: (listener: () => void) => () => void,
  errorFromFailure: (failure: unknown) => Error,
) => {
  const watches = new Map<string, CollectionWatch<T>>();
  const pending = new Map<string, Promise<T[]>>();
  const subscribe = (onValue: (records: T[]) => void, onError?: (failure: Error) => void) => {
    let active = true;
    let release: () => void = () => undefined;
    const listener: CollectionListener<T> = {
      value: records => { if (active) onValue(records); },
      error: failure => { if (active) onError?.(failure); },
    };
    void requireActor().then(actor => {
      if (!active) return;
      assertActor(actor);
      let watch = watches.get(actor);
      if (!watch) {
        const current: CollectionWatch<T> = { stop: () => undefined, listeners: new Set() };
        watch = current;
        watches.set(actor, current);
        const fail = (failure: unknown) => {
          if (watches.get(actor) !== current) return;
          current.records = undefined;
          current.stop();
          watches.delete(actor);
          for (const subscriber of current.listeners) subscriber.error?.(errorFromFailure(failure));
        };
        const stopSnapshot = onSnapshot(reference(), snapshot => {
          if (watches.get(actor) !== current) return;
          try {
            assertActor(actor);
            current.records = read(snapshot, actor);
            for (const subscriber of current.listeners) subscriber.value(current.records);
          } catch (failure) { fail(failure); }
        }, fail);
        const stopActor = subscribeActor(() => {
          try { assertActor(actor); } catch (failure) { fail(failure); }
        });
        current.stop = () => { stopSnapshot(); stopActor(); };
      }
      const currentWatch = watch;
      currentWatch.listeners.add(listener);
      release = () => {
        currentWatch.listeners.delete(listener);
        if (currentWatch.listeners.size || watches.get(actor) !== currentWatch) return;
        currentWatch.stop();
        watches.delete(actor);
      };
      if (currentWatch.records) listener.value(currentWatch.records);
    }).catch(failure => listener.error?.(errorFromFailure(failure)));
    return () => { active = false; release(); };
  };
  const get = async () => {
    const actor = await requireActor();
    assertActor(actor);
    const cached = watches.get(actor)?.records;
    if (cached) return cached;
    if (watches.has(actor)) return new Promise<T[]>((resolve, reject) => {
      let unsubscribe: () => void = () => undefined;
      unsubscribe = subscribe(records => { unsubscribe(); resolve(records); }, failure => { unsubscribe(); reject(failure); });
    });
    const previous = pending.get(actor);
    if (previous) return previous;
    const result = getDocs(reference()).then(snapshot => {
      assertActor(actor);
      return read(snapshot, actor);
    });
    pending.set(actor, result);
    try { return await result; }
    finally { if (pending.get(actor) === result) pending.delete(actor); }
  };
  return { get, subscribe };
};
