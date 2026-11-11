import { Roles } from '../../types/types';
import { genID } from '../../shared/common/ids';
import { getAfternicPortfolio } from './provider';
import type { BillingActor } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import { safeHash } from '../marketplace/records';
import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import type { AfternicConnectionStatus } from '../../shared/marketplaceAfternic/types';
import { assertSellerEligible, confirmMarketplaceActor, MarketplaceError } from '../marketplace/access';

const type = `AfternicConnection`;
const connectionDate = new Date(`2026-11-11T18:00:00Z`);
const { id } = genID(type, 1, `Portfolio`, connectionDate, `87d27fe8df3c45e89384e3a83d109583`);
const { id: syncStateId } = genID(`AfternicSyncState`, 1, `Portfolio`, connectionDate, `f4dcba8a130c440b8f3146052c74d82a`);
const credential = (value: unknown): value is string => typeof value === `string` && /^[!-~]{1,512}$/.test(value) && !value.includes(`:`);
const readCredentials = (key: unknown, secret: unknown) => credential(key) && credential(secret) ? { key, secret } : null;

const readCredentialInput = (value: unknown, expected: `AFTERNIC_API_KEY` | `AFTERNIC_API_SECRET`) => {
  if (typeof value !== `string`) return null;
  const input = value.trim();
  if (/[\r\n]/.test(input)) return null;
  const assignment = /^(?:export[ \t]+)?(AFTERNIC_API_KEY|AFTERNIC_API_SECRET)[ \t]*=[ \t]*(.*)$/.exec(input);
  if (!assignment) return input;
  if (assignment[1] !== expected) return null;
  const token = assignment[2]?.trim() ?? ``;
  return /^(["'])(.*)\1$/.exec(token)?.[2] ?? token;
};

const readConnection = async (transaction: Transaction, database: Firestore, actor: BillingActor) => {
  await confirmMarketplaceActor(transaction, database, actor);
  await assertSellerEligible(transaction, database, actor.id);
  const reference = database.doc(`marketplaceAfternicConnections/${id}`);
  const snapshot = await transaction.get(reference);
  const assignedSellerId = process.env.AFTERNIC_SELLER_USER_ID?.trim();
  if (snapshot.exists) {
    const saved = snapshot.data();
    const ownsBinding = saved?.id === id && saved.number === 1 && saved.type === type && saved.version === 1
      && saved.sellerId === actor.id && saved.firebaseUid === actor.firebaseUid && (!assignedSellerId || assignedSellerId === actor.id);
    return { reference, credentials: ownsBinding ? readCredentials(saved?.key, saved?.secret) : null, canConfigure: false };
  }
  const environmentCredentials = assignedSellerId ? readCredentials(process.env.AFTERNIC_API_KEY?.trim(), process.env.AFTERNIC_API_SECRET?.trim()) : null;
  return {
    reference,
    credentials: assignedSellerId === actor.id ? environmentCredentials : null,
    canConfigure: !environmentCredentials && (assignedSellerId ? assignedSellerId === actor.id : actor.role === Roles.Owner),
  };
};

type ConnectionState = Awaited<ReturnType<typeof readConnection>>;
const getConnectionState = async (actor: BillingActor) => {
  const database = getBillingDatabase();
  return database.runTransaction(transaction => readConnection(transaction, database, actor), { readOnly: true });
};

export const getAfternicConnection = async (actor: BillingActor) => {
  const { credentials, canConfigure } = await getConnectionState(actor);
  return { authorization: credentials ? `sso-key ${credentials.key}:${credentials.secret}` : null, canConfigure };
};

export const confirmAfternicSyncBinding = async (transaction: Transaction, database: Firestore, actor: BillingActor) => {
  const { reference, credentials } = await readConnection(transaction, database, actor);
  if (!credentials) throw new MarketplaceError(403, `Afternic Is Not Configured For This Seller Account`);
  const authorization = `sso-key ${credentials.key}:${credentials.secret}`;
  return { authorization, binding: safeHash(actor.id, actor.firebaseUid, authorization), reference: reference.collection(`sync`).doc(syncStateId) };
};

export const revealAfternicCredential = async (actor: BillingActor, field: unknown): Promise<{ value: string }> => {
  if (field !== `key` && field !== `secret`) throw new MarketplaceError(400, `Choose An Afternic Credential Field`);
  const { credentials } = await getConnectionState(actor);
  if (!credentials) throw new MarketplaceError(403, `Afternic Is Not Configured For This Seller Account`);
  return { value: credentials[field] };
};

const assertCanConfigure = (connection: ConnectionState) => {
  if (connection.credentials) throw new MarketplaceError(409, `Afternic Is Already Configured`);
  if (!connection.canConfigure) throw new MarketplaceError(403, `Afternic Setup Is Unavailable For This Seller Account`);
};

export const configureAfternicConnection = async (actor: BillingActor, input: Record<string, unknown>, signal: AbortSignal): Promise<AfternicConnectionStatus> => {
  const key = readCredentialInput(input.key, `AFTERNIC_API_KEY`);
  const secret = readCredentialInput(input.secret, `AFTERNIC_API_SECRET`);
  if (!credential(key) || !credential(secret)) throw new MarketplaceError(400, `Enter A Valid Afternic API Key And Secret`);

  assertCanConfigure(await getConnectionState(actor));
  await getAfternicPortfolio({ authorization: `sso-key ${key}:${secret}`, signal }, 0);

  const database = getBillingDatabase();
  await database.runTransaction(async transaction => {
    const connection = await readConnection(transaction, database, actor);
    assertCanConfigure(connection);
    if (signal.aborted) throw new MarketplaceError(504, `Afternic Setup Timed Out — Check Connection Status`);
    transaction.create(connection.reference, {
      id, key, type, secret, number: 1, version: 1, sellerId: actor.id, firebaseUid: actor.firebaseUid, createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { configured: true, canConfigure: false };
};
