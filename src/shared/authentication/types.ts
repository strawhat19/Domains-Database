import type { User } from '../models/users/User';

export type AccountAction = `deactivate` | `delete-data` | `delete-data-connections` | `delete-account`;

export class AccountDeactivatedError extends Error {
  constructor() {
    super(`Account Is Deactivated — Reactivate To Sign In`);
    this.name = `AccountDeactivatedError`;
  }
}

export class AccountDataCleanupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `AccountDataCleanupError`;
  }
}

export interface SignInInput {
  email: string;
  password: string;
  reactivate?: boolean;
}

export interface SignUpInput extends SignInInput {
  name?: string;
}

export interface PasswordCredential {
  salt: string;
  hash: string;
  iterations: number;
  algorithm: `PBKDF2-SHA256`;
}

export interface AuthenticationResult {
  user: User;
  expiresAt: number;
  claimLegacy: boolean;
}

export interface LocalAccount {
  user: User;
  credential: PasswordCredential;
  sessionTokenHash?: string;
  legacyPortfolioClaimed?: boolean;
}

export interface AccountSnapshot {
  version: 1;
  nextNumber: number;
  accounts: LocalAccount[];
}

export interface LocalSession {
  version: 1;
  token: string;
  userId: string;
  expiresAt: number;
}
