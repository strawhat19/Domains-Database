import { generateID } from '../common/ids';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';

const visitorStorageKey = `domains-database:plan-interest:visitor:v1`;
const serializeVisitor = createOperationQueue(visitorStorageKey);
export const getPlanVisitor = () => serializeVisitor(async () => {
  const saved = await readStorage(visitorStorageKey);
  if (saved !== null) {
    if (!/^[a-f0-9]{32}$/.test(saved)) throw new Error(`Saved Plan Voting Identity Needs Attention`);
    return saved;
  }
  const identity = generateID().toLowerCase();
  await writeStorage(visitorStorageKey, identity);
  if (await readStorage(visitorStorageKey) !== identity) throw new Error(`Enable Device Storage To Vote On Plans`);
  return identity;
});
