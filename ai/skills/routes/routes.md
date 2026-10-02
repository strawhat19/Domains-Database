1. Keep canonical routes, redirects, minimum roles, labels, and icon identifiers in a shared route registry. Thin route files should render a component or redirect; keep authentication and page logic outside the router files.

2. Use the shared Roles enum for permissions. Account Profile, private settings, messages, and notifications require at least Subscriber when those features exist; Dashboard requires Owner. Public browsing, eligible social profiles and feeds, sign-in, sign-up, styles, About, Contact, Terms, and Privacy remain public unless the user requests a private app. Gate identity-required actions rather than automatically guarding every page.

3. Keep conventional sign-in aliases such as log, sign, login, log-in, and sign-in pointing to signin. Point new, sign-up, register, and subscribe to signup. Use replace-style redirects where supported so the back action does not loop through aliases.

4. Preserve useful feature aliases where applicable: config and general to settings; chat, chats, and message to messages; alerts and notification to notifications; edit, account, and preferences to profile; theme, design, components, and typography to styles. Do not create unrelated feature pages just to populate this registry.

5. Point info, aboutus, company, aboutme, about-us, and about-me to about. Point contactme, contactus, getintouch, get-in-touch, contact-me, and contact-us to contact. Include terms-of-service to terms and privacy-policy to privacy. Deduplicate aliases and avoid conflicts with existing canonical routes.

6. Resolve authentication state before checking protected access. Show "Sign in to view this" with sign-in and sign-up actions on private account pages for signed-out visitors, and an appropriate access message for users below the required role. Enforce the same access rule for direct URLs and navigation. Public social routes still use service-enforced record audiences; a public route never grants access to private data.

7. Navigation, profile menus, and mobile menus should use consistent icons from the installed icon library. Keep icon identifiers or mappings in route metadata; do not install multiple libraries simply to duplicate an example. Give interactive elements descriptive IDs and classes or native equivalents.

8. About, Terms, Contact, and Privacy Policy links must navigate to pages rather than section anchors before publishing. Preserve valid internal return destinations after sign-in and reject external return targets.

9. Use the framework's supported router instead of constructing a second routing system. Refer to [structure guidance](../structure/structure.md) for module boundaries, [authentication guidance](../authentication/authentication.md) for sessions and roles, and [social guidance](../social/social.md) for public profiles, feeds, and private conversations.
