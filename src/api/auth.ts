import { hasSavedAccount } from '../shared/authentication/accountPresence';
import { signIn, signUp, signOut, getUsers, getHealth, getStatus, manageAccount, updateProfile, restoreSession, getPublicProfiles, completeLegacyClaim } from '../shared/authentication/service';

export const authAPI = { signIn, signUp, signOut, getUsers, getHealth, getStatus, manageAccount, updateProfile, hasSavedAccount, restoreSession, getPublicProfiles, completeLegacyClaim };
