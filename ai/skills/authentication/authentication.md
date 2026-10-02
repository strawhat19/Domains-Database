1. Start authentication with a loose, simple local sign-in and sign-up flow using the shared useLocalStorage flag, true by default. Keep the same interface when it is false; if a real backend is not connected, submission should show a concise toast asking the user to connect it instead of pretending to authenticate.

2. Keep authentication operations in a shared service and expose current-user state through React Context, or the existing framework's equivalent. Forms, menus, and protected pages should use that shared state instead of reading storage themselves. Hydrate the session before deciding whether a protected route is accessible. Public browsing remains available unless a private app is requested; show sign-in and sign-up when an action requires identity.

3. Use the shared User model, Roles enum, ID helpers, and storage adapter. New sign-ups default to Subscriber, profile visibility defaults to private, and optional public sharing starts disabled. Do not silently assign Owner to the first sign-up. Whitelist editable profile fields so ordinary updates cannot change roles, record identity, or account ownership. Preserve supported provider profile data when adapting a real backend.

4. Local authentication is a demo on the current device. Keep credentials separate from public user records and avoid saving plaintext passwords. Revoke persisted sessions on sign-out, expire them while the app is open, and clear account scopes and cached state when a session ends or account loading fails. A real backend must enforce authentication and roles independently of client-side route controls.

5. After sign-in, always show an avatar in the app shell: use the provider photo when present, otherwise a colored circle with the first letter of the user's name capitalized. Match the app's navigation and mobile menu styling.

6. Open the profile menu by click or tap, with hover support where useful. Include consistent icons, a Profile link, and Sign Out at the bottom. Allow keyboard use and dismiss the menu when navigation or sign-out completes.

7. Give the current user's account Profile its own authenticated page with a Profile side menu or the mobile equivalent. If unauthenticated, show "Sign in to view this" with sign-in and sign-up actions. Public social profiles use separate safe projections and audience rules. Account connection settings belong to the profile management flow but keep credentials in separate private account-scoped storage. Keep access rules in shared route metadata.

8. Protect Dashboard for Owner and show useful application and user statistics or charts using available data. Do not invent activity or silently seed accounts to populate a dashboard.

9. Expose loading, error, and submission state through the shared service or context. Use skeletons while account data loads and concise Title Case toasts for outcomes. Keep the current user and persisted user record consistent after a profile change.

10. Apply [database guidance](../database/database.md) when persisting users or sessions, [API guidance](../api/api.md) for service operations, [social guidance](../social/social.md) for public profiles, privacy, and authenticated social actions, and [route guidance](../routes/routes.md) for roles and redirects. Follow the chosen framework and preserve existing user data during adoption.
