import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { sha256 } from '@noble/hashes/sha2.js';
import type { PasswordCredential } from './types';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const PASSWORD_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const equalBytes = (actual: Uint8Array, expected: Uint8Array) => {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index]! ^ expected[index]!;
  return difference === 0;
};

export const secureRandomHex = async (length = 32) => bytesToHex(await Crypto.getRandomBytesAsync(length));

export const createSecureUuid = async () => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const derivePassword = async (password: string, salt: Uint8Array, iterations: number) => {
  const passwordBytes = utf8ToBytes(password);
  const subtle = Platform.OS === `web` ? globalThis.crypto?.subtle : undefined;
  if (subtle) {
    const key = await subtle.importKey(`raw`, Uint8Array.from(passwordBytes).buffer, `PBKDF2`, false, [`deriveBits`]);
    const result = await subtle.deriveBits({
      iterations,
      name: `PBKDF2`,
      hash: `SHA-256`,
      salt: Uint8Array.from(salt).buffer,
    }, key, HASH_BYTES * 8);
    return new Uint8Array(result);
  }
  return pbkdf2Async(sha256, passwordBytes, salt, { c: iterations, dkLen: HASH_BYTES, asyncTick: 10 });
};

export const isPasswordCredential = (value: unknown): value is PasswordCredential => {
  const credential = value as Partial<PasswordCredential> | undefined;
  return credential?.algorithm === `PBKDF2-SHA256`
    && typeof credential.salt === `string` && /^[a-f0-9]{32}$/.test(credential.salt)
    && typeof credential.hash === `string` && /^[a-f0-9]{64}$/.test(credential.hash)
    && Number.isInteger(credential.iterations) && Number(credential.iterations) >= PASSWORD_ITERATIONS && Number(credential.iterations) <= 2_000_000;
};

export const createPasswordCredential = async (password: string): Promise<PasswordCredential> => {
  const salt = await Crypto.getRandomBytesAsync(SALT_BYTES);
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return { salt: bytesToHex(salt), hash: bytesToHex(hash), algorithm: `PBKDF2-SHA256`, iterations: PASSWORD_ITERATIONS };
};

export const verifyPassword = async (password: string, credential: PasswordCredential) => {
  if (!isPasswordCredential(credential)) throw new Error(`Saved Account Credentials Are Unavailable`);
  const hash = await derivePassword(password, hexToBytes(credential.salt), credential.iterations);
  return equalBytes(hash, hexToBytes(credential.hash));
};

export const sessionTokenHash = (token: string) => bytesToHex(sha256(hexToBytes(token)));
export const verifySessionToken = (token: string, expectedHash: string) => equalBytes(hexToBytes(sessionTokenHash(token)), hexToBytes(expectedHash));
