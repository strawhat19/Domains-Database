import { signIn, signUp, signOut, getUsers, getHealth, getStatus, updateProfile, restoreSession, getPublicProfiles, completeLegacyClaim } from '../shared/authentication/service';

export const authAPI = { signIn, signUp, signOut, getUsers, getHealth, getStatus, updateProfile, restoreSession, getPublicProfiles, completeLegacyClaim };
