import type { User } from '../models/users/User';

export interface SignInInput {
  email: string;
  password: string;
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
