import { domainToASCII } from 'node:url';
import { parse } from 'tldts';
import { createHash, randomUUID } from 'node:crypto';
import { MarketplaceError } from './access';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { genID, isAppCollectionID } from '../../shared/common/ids';

export const invalid = (message = `Send A Valid Marketplace Request`) => new MarketplaceError(400, message);
export const notFound = (message = `Listing Not Found`) => new MarketplaceError(404, message);
export const conflict = (message: string) => new MarketplaceError(409, message);
export const safeHash = (...values: string[]) => createHash(`sha256`).update(JSON.stringify(values)).digest(`hex`);
export const requestId = (value: unknown) => {
  if (typeof value !== `string` || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) throw invalid();
  return value;
};
export const marketId = (value: unknown, type: string) => {
  if (typeof value !== `string` || value.length > 250 || /[/\u0000-\u001f\u007f]/.test(value) || !isAppCollectionID(value, type)) throw invalid();
  return value;
};
export const textValue = (value: unknown, label: string, max: number, optional = false) => {
  if (typeof value !== `string` || value.trim().length > max || (!optional && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw invalid(`Enter ${label}`);
  return value.trim();
};
export const domainValue = (value: unknown) => {
  const input = textValue(value, `A Domain Name`, 253).toLowerCase().replace(/\.$/, ``);
  if (!/^[\p{L}\p{N}.-]+$/u.test(input)) throw invalid(`Enter A Domain Name Without A URL Or Path`);
  const domain = domainToASCII(input);
  const labels = domain.split(`.`);
  if (domain.length > 253 || labels.length < 2 || /^\d+$/.test(labels.at(-1) ?? ``)
    || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw invalid(`Enter A Valid Domain Name`);
  const registered = parse(domain, { allowPrivateDomains: false });
  if (!registered.isIcann || registered.domain !== domain) throw invalid(`Enter A Registrable Domain Name Without A Subdomain`);
  return domain;
};
export const usernameValue = (value: unknown) => {
  const username = textValue(value, `A Profile URL`, 30).toLowerCase();
  if (!/^[a-z0-9]{3,30}$/.test(username) || [`admin`, `api`, `help`, `support`, `settings`, `market`, `auction`, `sellers`, `system`].includes(username)) throw invalid(`Use 3–30 Letters Or Numbers For Your Seller URL`);
  return username;
};
export const centsValue = (value: unknown) => {
  if (typeof value !== `number` || !Number.isSafeInteger(value) || value < 100 || value > 99_999_999) throw invalid(`Enter An Amount From $1 To $999,999.99`);
  return value;
};
export const safePhoto = (value: unknown) => {
  if (typeof value !== `string` || value.length > 2048) return undefined;
  try { const url = new URL(value); return url.protocol === `https:` && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
};
export const counter = async (transaction: Transaction, database: Firestore, scope: string, type: string, label: string, now: string, customPath?: string) => {
  const reference = database.doc(customPath ?? `counters/${scope}`);
  const saved = await transaction.get(reference);
  const previous = saved.data()?.number ?? 0;
  const number = previous + 1;
  if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(number)) throw new MarketplaceError(503, `Marketplace Record Numbers Are Unavailable`);
  const { id } = genID(type, number, label, new Date(now), randomUUID().replaceAll(`-`, ``));
  return { id, number, commit: () => transaction.set(reference, { number, lastId: id }) };
};
