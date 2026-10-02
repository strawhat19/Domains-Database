import { createSampleDomains } from '../shared/sampleDomains';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PORTFOLIO_STORAGE_KEY, useLocalStorage } from '../shared/config';
import { createDomainId, validateDomainInput } from '../shared/domainUtils';
import type { DomainInput, DomainRecord, PortfolioSnapshot } from '../shared/types';

let snapshot: PortfolioSnapshot | null = null;
let operationQueue: Promise<unknown> = Promise.resolve();

const serialize = <T,>(operation: () => Promise<T>): Promise<T> => {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
};

const copyDomains = (domains: DomainRecord[]) => domains.map(domain => ({ ...domain }));

const saveSnapshot = async (next: PortfolioSnapshot) => {
  if (useLocalStorage) {
    try {
      await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error(`Could Not Save Your Portfolio On This Device`);
    }
  }
  snapshot = next;
};

const readSnapshot = async () => {
  if (snapshot) return snapshot;
  let saved: string | null = null;
  if (useLocalStorage) {
    try {
      saved = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
    } catch {
      throw new Error(`Could Not Load Your Portfolio From This Device`);
    }
  }
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved) as PortfolioSnapshot;
      if (parsed?.version !== 1 || !Array.isArray(parsed?.domains) || !Number.isInteger(parsed?.nextNumber)) throw new Error();
      const names = new Set<string>();
      const ids = new Set<string>();
      const numbers = new Set<number>();
      const domains = parsed.domains.map(domain => {
        const input = validateDomainInput(domain);
        if (!domain?.id || !Number.isInteger(domain?.number) || domain.number < 1 || ids.has(domain.id) || numbers.has(domain.number) || names.has(input.name)) throw new Error();
        ids.add(domain.id);
        numbers.add(domain.number);
        names.add(input.name);
        return { ...input, id: domain.id, number: domain.number, isSample: domain.isSample === true };
      });
      snapshot = { version: 1, domains, nextNumber: Math.max(parsed.nextNumber, ...domains.map(domain => domain.number + 1), 1) };
      return snapshot;
    } catch {
      throw new Error(`Saved Portfolio Data Could Not Be Read`);
    }
  }
  const domains = createSampleDomains();
  const initial: PortfolioSnapshot = { version: 1, domains, nextNumber: domains.length + 1 };
  await saveSnapshot(initial);
  return initial;
};

const assertUnique = (name: string, domains: DomainRecord[], id?: string) => {
  if (domains.some(domain => domain.id !== id && domain.name.toLowerCase() === name)) throw new Error(`${name} Is Already In Your Portfolio`);
};

export const API_ROUTES = [
  `/api`,
  `/api/domains`,
  `/api/domains/:id`,
  `/api/domains/import`,
  `/api/domains/sample`,
];

export const api = {
  getRoutes: async () => ({
    ok: true,
    status: 200,
    success: true,
    title: `Domains Database`,
    routes: [...API_ROUTES],
    datetime: new Date().toISOString(),
    mode: useLocalStorage ? `Device Storage` : `Session Storage`,
    message: `Local Demo API Ready`,
  }),
  getDomains: () => serialize(async () => copyDomains((await readSnapshot()).domains)),
  createDomain: (input: DomainInput) => serialize(async () => {
    const current = await readSnapshot();
    const validated = validateDomainInput(input);
    assertUnique(validated.name, current.domains);
    const number = current.nextNumber;
    const domain: DomainRecord = { ...validated, number, id: createDomainId(number, validated.name) };
    await saveSnapshot({ version: 1, nextNumber: number + 1, domains: [...current.domains, domain] });
    return { ...domain };
  }),
  updateDomain: (id: string, input: DomainInput) => serialize(async () => {
    const current = await readSnapshot();
    const original = current.domains.find(domain => domain.id === id);
    if (!original) throw new Error(`Domain Could Not Be Found`);
    const validated = validateDomainInput(input);
    assertUnique(validated.name, current.domains, id);
    const domain: DomainRecord = { ...validated, id, number: original.number };
    await saveSnapshot({ ...current, domains: current.domains.map(record => record.id === id ? domain : record) });
    return { ...domain };
  }),
  deleteDomain: (id: string) => serialize(async () => {
    const current = await readSnapshot();
    if (!current.domains.some(domain => domain.id === id)) throw new Error(`Domain Could Not Be Found`);
    await saveSnapshot({ ...current, domains: current.domains.filter(domain => domain.id !== id) });
  }),
  importDomains: (inputs: DomainInput[]) => serialize(async () => {
    if (!inputs?.length) throw new Error(`No Domain(s) Found In The File`);
    const current = await readSnapshot();
    const domains = copyDomains(current.domains);
    let nextNumber = current.nextNumber;
    inputs.forEach((input, index) => {
      try {
        const validated = validateDomainInput(input);
        assertUnique(validated.name, domains);
        domains.push({ ...validated, number: nextNumber, id: createDomainId(nextNumber, validated.name) });
        nextNumber += 1;
      } catch (error) {
        throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : `Invalid Domain`}`);
      }
    });
    await saveSnapshot({ version: 1, domains, nextNumber });
    return inputs.length;
  }),
  resetSampleData: () => serialize(async () => {
    const current = await readSnapshot();
    const domains = createSampleDomains().map((domain, index) => {
      const number = current.nextNumber + index;
      return { ...domain, number, id: createDomainId(number, domain.name) };
    });
    await saveSnapshot({ version: 1, domains, nextNumber: current.nextNumber + domains.length });
    return copyDomains(domains);
  }),
};
