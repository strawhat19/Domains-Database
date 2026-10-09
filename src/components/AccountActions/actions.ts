import { useLocalStorage } from '../../shared/config';
import { firebaseEnabled } from '../../shared/firebase/config';
import type { AccountAction } from '../../shared/authentication/types';

interface ActionSection {
  id: string;
  title: string;
  items: readonly string[];
}
interface AccountActionOption {
  id: AccountAction;
  copy: string;
  label: string;
  outcome: string;
  sections: readonly ActionSection[];
}

export const cloudAccountActions = firebaseEnabled && !useLocalStorage;
const savedData = [
  `All saved portfolio domain records, including manually added, imported and synced domains`,
  `Every saved domain property value: notes, descriptions, owner/contact details, tags, stars, links, prices, project status, difficulty, MVP/future plans, imported CSV values and custom metadata. Saved site icons, website insights and renewal estimates are included`,
  `Collections and custom groups, including names, descriptions, properties, membership, tags, links, project details, visibility, stars, votes, sorting and saved ordering`,
  `Watching lists and their saved domain availability and registrar-price snapshots`,
  `Recent domain search history and saved account notifications`,
  ...(cloudAccountActions ? [`Your private saved auction inventory`] : [`Your Community posts and follow relationships involving your account, including followers and following`]),
];
const displaySettings = [
  `Portfolio view returns to Table. Grouping, hidden groups and saved ordering reset; visible columns, column widths and flexible columns return to defaults`,
  `Your account theme preference returns to Dark`,
  `Registrar verification/status and sync history reset. Automatic sync pauses until you explicitly sync or save a connection again`,
];
const profileSettings = [
  `Your bio is cleared, profile visibility becomes Private and public domain sharing turns off`,
  ...displaySettings,
];
const retainedAccount = `${cloudAccountActions ? `Your account and Google or email sign-in access` : `Your account and sign-in email/password`}. Display name, avatar/color, plan, role and other profile fields are kept, except the bio and privacy/sharing settings listed above`;
const retainedData = [
  cloudAccountActions ? `Other accounts' saved data; guest data and local data on this device` : `Other local accounts' profiles, portfolios and posts; guest data and shared auction data`,
  `Previously exported/downloaded files and the app's built-in property fields and tag choices`,
];
const savedConnections = cloudAccountActions
  ? `Saved registrar connection entries and their API keys, tokens, usernames, client IDs and secrets in this account's private Firestore database records`
  : `Saved registrar connection entries and their locally stored API keys, tokens, usernames, client IDs and secrets`;
const signInAfterCleanup = cloudAccountActions
  ? `You are signed out and sent to Sign In. You can sign in again with the same Google account or email and password`
  : `You are signed out and sent to Sign In. You can sign in again with the same email and password`;

export const accountActionScope = cloudAccountActions
  ? `This applies to this Firebase account's saved data across devices. Your domains remain registered at their registrars; registrar renewal/DNS settings, provider accounts, hosting and websites are unaffected. Provider API keys are not revoked. Previously cached or downloaded data on other devices may remain until those devices refresh`
  : `This applies to this account in this browser or device. Your domains remain registered at their registrars; registrar renewal/DNS settings, provider accounts, hosting and websites are unaffected. Provider API keys are not revoked, and data on other devices is not removed`;

const allAccountActions: AccountActionOption[] = [
  {
    id: `deactivate`,
    label: `Deactivate Account`,
    copy: `Temporarily deactivate this account while keeping its saved data`,
    outcome: `Nothing is deleted. Reactivate later by signing in again`,
    sections: [
      { id: `changes`, title: `What Changes`, items: [
        `Your account becomes inactive and its public profile and Community content stop appearing to other users`,
        `Your current session ends and you are signed out`,
      ] },
      { id: `kept`, title: `Kept`, items: [
        `All saved domains and every property/custom metadata value; collections, custom groups, Watching lists and saved search history`,
        `Your posts, followers/following, saved notifications, profile, email/password, theme and portfolio settings`,
        savedConnections,
        ...retainedData,
      ] },
      { id: `next`, title: `After Confirmation`, items: [
        `You are sent to Sign In. Enter the same email and password, then choose Reactivate Account to restore access`,
      ] },
    ],
  },
  {
    id: `delete-data`,
    label: `Delete Account Data`,
    copy: `Clear this account's saved app data while keeping its login and registrar connections`,
    outcome: `This action has no Undo. Registrar sync can fetch provider data again, but app-only notes, custom metadata, groups and collections are not restored by sync`,
    sections: [
      { id: `deleted`, title: `Deleted`, items: savedData },
      { id: `reset`, title: `Reset`, items: profileSettings },
      { id: `kept`, title: `Kept`, items: [retainedAccount, savedConnections, ...retainedData] },
      { id: `next`, title: `After Confirmation`, items: [
        signInAfterCleanup,
        `Explicitly sync your retained connections to fetch registrar domain records again. Recreate app-only values, groups and collections separately`,
      ] },
    ],
  },
  {
    id: `delete-data-connections`,
    label: `Delete Account Data + Connections`,
    copy: `Clear this account's saved app data and registrar connections while keeping its login`,
    outcome: `This action has no Undo. Removed app-only notes, custom metadata, groups, collections and ${cloudAccountActions ? `saved` : `locally saved`} credentials are not restored automatically`,
    sections: [
      { id: `deleted`, title: `Deleted`, items: [...savedData, savedConnections] },
      { id: `reset`, title: `Reset`, items: profileSettings },
      { id: `kept`, title: `Kept`, items: [retainedAccount, ...retainedData] },
      { id: `next`, title: `After Confirmation`, items: [
        signInAfterCleanup,
        `Add registrar connections again before syncing their domain records. Recreate app-only values, groups and collections separately`,
      ] },
    ],
  },
  {
    id: `delete-account`,
    label: `Delete Account`,
    copy: `Permanently remove this local account, its saved app data and its registrar connections`,
    outcome: `This action has no Undo. This account cannot be reactivated, and its deleted local data is not restored automatically`,
    sections: [
      { id: `deleted`, title: `Deleted`, items: [
        ...savedData,
        savedConnections,
        `The complete stored account and profile, including its name, email, avatar and password credential`,
      ] },
      { id: `reset`, title: `Reset During Cleanup`, items: displaySettings },
      { id: `kept`, title: `Kept`, items: retainedData },
      { id: `next`, title: `After Confirmation`, items: [
        `You are signed out and sent to Sign In. This account's login no longer exists; create a new account or sign in with another existing account`,
      ] },
    ],
  },
];

export const accountActions = cloudAccountActions
  ? allAccountActions.filter(action => action.id === `delete-data` || action.id === `delete-data-connections`)
  : allAccountActions;
