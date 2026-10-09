import { hasSavedAccount } from '../shared/authentication/accountPresence';
import { signIn, signUp, signOut, getUsers, getHealth, getStatus, manageAccount, updateProfile, restoreSession, signInWithGoogle, getPublicProfiles, subscribeAuthState, completeLegacyClaim } from '../shared/authentication/service';

export const authAPI = { signIn, signUp, signOut, getUsers, getHealth, getStatus, manageAccount, updateProfile, hasSavedAccount, restoreSession, signInWithGoogle, getPublicProfiles, subscribeAuthState, completeLegacyClaim };
