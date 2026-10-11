1. Keep canonical routes, redirects, labels, icons, and explicit allowed roles/capabilities in a shared route registry. Preserve existing minimum-role metadata where needed, but do not use enum order to grant unrelated technical or operational permissions. Thin routes render components or redirects; keep account/page logic outside router files.

2. Use shared role values and capability helpers for permissions. Profile and own private tools require an active authenticated account; Dashboard/Analytics/Observability permit the relevant Owner, Admin, and Developer capabilities. Operational administration and role assignment use narrower policies from [Admin guidance](../admin/admin.md). Public browsing, eligible profiles/feeds, authentication, styles, and policy pages remain public unless a private app is requested. Gate identity-required actions.

3. Keep conventional sign-in aliases such as log, sign, login, log-in, and sign-in pointing to signin. Point new, sign-up, register, and subscribe to signup. Use replace-style redirects where supported so the back action does not loop through aliases.

4. Preserve useful feature aliases where applicable: config and general to settings; chat, chats, and message to messages; alerts and notification to notifications; edit, account, and preferences to profile; theme, design, components, and typography to styles. Do not create unrelated feature pages just to populate this registry.

5. Point info, aboutus, company, aboutme, about-us, and about-me to about. Point contactme, contactus, getintouch, get-in-touch, contact-me, and contact-us to contact. Include terms-of-service to terms and privacy-policy to privacy. Deduplicate aliases and avoid conflicts with existing canonical routes.

6. Resolve authentication state before checking protected access. Show "Sign in to view this" with sign-in and sign-up actions on private account pages for signed-out visitors, and an appropriate access message for users below the required role. Enforce the same access rule for direct URLs and navigation. Public social routes still use service-enforced record audiences; a public route never grants access to private data.

7. Navigation, profile menus, and mobile menus should use consistent icons from the installed icon library. Keep icon identifiers or mappings in route metadata; do not install multiple libraries simply to duplicate an example. Give interactive elements descriptive IDs and classes or native equivalents.

8. About, Terms, Contact, and Privacy Policy links must navigate to pages rather than section anchors before publishing. Preserve valid internal return destinations after sign-in and reject external return targets.

9. Use the framework's supported router instead of constructing a second routing system. Refer to [structure guidance](../structure/structure.md) for module boundaries, [authentication guidance](../authentication/authentication.md) for sessions and roles, and [social guidance](../social/social.md) for public profiles, feeds, and private conversations.

10. A requested [full App System](../app-system/SKILL.md) adds public Pricing, Blog/article/category routes, private participant chat, and authorized plans/blog management to its existing shared route registry. Reuse canonical URLs and aliases already present; conventional new paths may be /pricing, /blog, /blog/[slug], /blog/category/[slug], /profile/chats, /admin/chats, /admin/plans, and /admin/blog. The registry exposes only supported sections and applies the same capability/participant boundary to direct URLs as navigation. Public article routes cannot reveal drafts; pricing routes do not create entitlements.
