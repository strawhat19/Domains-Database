import { createDomainId } from './domainUtils';
import { useSampleData } from './config';
import type { DomainRecord, Registrar } from './types';

const expiryAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, `0`)}-${String(date.getDate()).padStart(2, `0`)}`;
};

export const createSampleDomains = (): DomainRecord[] => {
  if (!useSampleData) return [];
  const examples: [string, Registrar, number, number, boolean][] = [
    [`atlasandco.com`, `GoDaddy`, 16, 21.99, true],
    [`goodfolks.org`, `Namecheap`, 243, 14.98, true],
    [`morninglight.app`, `Namecheap`, 72, 19.98, true],
    [`littleorbit.io`, `Hostinger`, 28, 39.99, false],
    [`formandfield.dev`, `Namecheap`, 116, 16.98, true],
    [`madebyalex.com`, `GoDaddy`, 188, 21.99, true],
    [`northstarstudio.net`, `Hostinger`, 305, 15.99, true],
    [`oldharbor.co`, `GoDaddy Auctions`, -4, 34.99, false],
  ];
  return examples.map(([name, registrar, days, renewalPrice, autoRenew], index) => ({
    name,
    registrar,
    autoRenew,
    renewalPrice,
    isSample: true,
    number: index + 1,
    owner: `Alex Morgan`,
    expiresAt: expiryAfter(days),
    id: createDomainId(index + 1, name),
    notes: `Fictional Sample Data For The Demo Portfolio`,
  }));
};
