1. Use a reusable shared core and keep feature-specific data and behavior separate. For new apps, prefer Expo, React Native, TypeScript, and Sass for web and mobile; adapt these boundaries to an existing framework rather than replacing it. Routes stay thin, components own their rendering and styles, and shared services own persistence and authentication.

2. The reusable core follows this structure. Feature models, services, pages, and components extend it where the requested app needs them; the tree intentionally omits application-specific feature names.

```text
app/
  _layout.tsx
  index.tsx
  signin.tsx
  signup.tsx
  profile.tsx
  profile/
    connections.tsx
  dashboard.tsx
  community.tsx
  about.tsx
  terms.tsx
  contact.tsx
  privacy.tsx
src/
  api/
    auth.ts
    index.ts
    notifications.ts
    social.ts
    connections.ts
  types/
    types.ts
  styles/
    global.scss
    theme/
      theme.ts
  shared/
    config.ts
    routes.ts
    common/
      ids.ts
      values.ts
      storage.ts
      collection.ts
      scripts/
        globals.ts
    models/
      Data.ts
      index.ts
      users/
        User.ts
      notifications/
        Notification.ts
      posts/
        Post.ts
      relationships/
        Follow.ts
    authentication/
      types.ts
      password.ts
      service.ts
      userScope.ts
    authContext/
      useAuth.ts
      AuthContext.tsx
    themeContext/
      theme.ts
      useTheme.ts
      ThemeContext.tsx
    social/
      types.ts
      content.ts
      service.ts
      useSocial.ts
      SocialContext.tsx
    connections/
      types.ts
      values.ts
      service.ts
  components/
    AppShell/
      index.tsx
      useAppShell.ts
      index.web.tsx
      index.native.tsx
      styles.scss
      styles.native.ts
    AuthForm/
    UserMenu/
    AccountPage/
    ProtectedRoute/
    ProfileSettings/
      index.tsx
      useProfileSettings.ts
      index.web.tsx
      index.native.tsx
      styles.scss
      styles.native.ts
    AccountConnections/
      index.tsx
      useAccountConnections.ts
      index.web.tsx
      index.native.tsx
      styles.scss
      styles.native.ts
    Toast/
      index.tsx
      index.web.tsx
      index.native.tsx
      styles.scss
      styles.native.ts
    AuthFeedback/
      index.tsx
      useAuthFeedback.ts
    Community/
      index.tsx
      useCommunity.ts
      index.web.tsx
      index.native.tsx
      PostCard.tsx
      ProfileCard.tsx
      styles.scss
      styles.native.ts
    RichTextEditor/
      index.tsx
      useRichTextEditor.ts
      index.web.tsx
      index.native.tsx
      RichTextContent.tsx
      RichTextContent.web.tsx
      RichTextContent.native.tsx
      styles.scss
      styles.native.ts
ai/
  goals/
    goals.md
  prompts/
    prompts.md
  skills/
    api/
      SKILL.md
      api.md
    routes/
      SKILL.md
      routes.md
    database/
      SKILL.md
      database.md
    structure/
      SKILL.md
      structure.md
    authentication/
      SKILL.md
      authentication.md
    social/
      SKILL.md
      social.md
    admin/
      SKILL.md
      admin.md
      layout.md
    app-system/
      SKILL.md
      system.md
      references/
        chats.md
        plans.md
        blog.md
```

3. app/ is the framework's routing entrypoint. Its layout composes providers and the app shell; page files render component entrypoints or redirects. In another framework, use its existing router directory with the same separation.

4. src/types/types.ts owns shared enums such as Roles, Providers, and Types. src/shared/models owns typed reusable records, with Data as the common base and a small index.ts export barrel. Extend the base for feature models without adding feature fields to unrelated models. Data.toRecord() produces plain storage records shared by connected and explicitly chosen local adapters.

5. src/shared/common/ids.ts owns app-owned IDs, values.ts owns general value helpers, and storage.ts owns browser or device persistence and operation queues. collection.ts is the reusable collection factory for repeated typed CRUD, preserving per-account storage and monotonic numbers; use it when several models need the same operations. Keep scripts/globals.ts as a compatibility export barrel while callers migrate; new callers should import the focused module they need. Do not copy legacy helper implementations into several files.

6. src/styles/theme/theme.ts owns typed shared colors, ThemePalette, and themePalettes. The theme context owns selected theme state; platform rendering consumes those values rather than defining a second unrelated palette. Keep src/shared/themeContext/theme.ts as a compatibility export barrel when existing imports rely on it.

7. shared/authentication owns auth operations/types and account scopes; shared/firebase owns connected SDK initialization and adapters. Firebase manages connected credentials; retain password helpers only for an explicit existing demo. AuthContext and useAuth expose the hydrated account and loading state through api/auth.ts or its equivalent. Forms, avatar menus, account pages, and gates consume services. Separate public profile projections, private accounts, and connection credentials.

8. src/api/index.ts is the app's internal asynchronous service or backend boundary. Use focused facades such as src/api/auth.ts for authentication and src/api/notifications.ts for shared notification CRUD. Reusable model operations may use the common collection factory while feature operations remain in the API layer. Components and contexts consume this boundary; do not imply that a local service directory is an HTTP server.

9. Give each component its own folder. Use a shared hook or logic module, an index.tsx entrypoint, index.web.tsx with styles.scss for web, and index.native.tsx with styles.native.ts for native when the platforms need distinct views. Shared components can use one rendering file when splitting it would only duplicate code. Toast owns feedback rendering; AuthFeedback and useAuthFeedback bind shared authentication notices and errors to that view.

Use the existing framework's supported SCSS module loading. When its Sass compileString pipeline lacks a source URL, importer, or load path for relative resolution, load shared global SCSS through web component side-effect imports rather than a relative Sass @use used only to emit CSS. Load shared base styles before component overrides, preserving that semantic order when arranging imports. Sass @use remains appropriate for Sass modules or shared CSS emission when the installed pipeline supports the required resolution; do not change bundler configuration merely to copy another framework's style-loading pattern.

10. The shared route registry keeps canonical paths, aliases, labels, icons, and allowed roles/capabilities. Profile and Admin navigation consume that registry and the same capability helpers as direct routes. Preserve framework conventions and current URLs; avoid unrelated pages or empty scaffolds.

11. ai/ contains portable instructions and shared integration patterns. Keep app-specific schemas, branding, cloud IDs, credentials, owner bootstrap details, and historical plans in project configuration/documentation outside ai/. Each SKILL.md links to its focused reference. ai/README.md indexes adoption, ai/skills/admin/ describes the connected account/admin/reporting system, and [App System](../app-system/SKILL.md) orchestrates a requested complete starter with focused chat/plans/blog references.

12. Follow the complete data flow: shared enums and helpers support Data, reusable models extend Data, services import those models, contexts consume the service facades, component hooks consume context, and thin routes import component entrypoints. The model index.ts re-exports models; keep service operations in their focused API or service modules. Serialize with toRecord() at the persistence boundary and return public records without credential fields.

13. Compose the Expo shell as SafeAreaProvider, ThemeProvider, AuthProvider, optional per-account feature providers, AppShell, and Slot. Wait for authentication hydration before mounting account-dependent providers; key or reset their state when the account changes. Keep optional feature providers within their own feature folders and omit feature names from portable guidance.

14. Add social modules when requested: Post and Follow extend Data, shared/social owns typed operations and content normalization, api/social.ts exposes its facade, and SocialContext with useSocial shares eligible records. Community owns the feed view, and RichTextEditor with RichTextContent shares formatted input and safe output across platforms. User owns ProfilePrivacy with public and private choices, private by default, and optional public sharing stays disabled until chosen. authAPI.getPublicProfiles returns allowlisted display fields and updateProfile accepts only editable profile fields. Public profile projections, private account settings, and participant-only messages remain separate service boundaries.

15. ProfileSettings and useProfileSettings own authenticated profile editing; AccountConnections and useAccountConnections own private connection settings. shared/connections/types.ts defines the private snapshot, values.ts normalizes supported input, and service.ts owns account-scoped persistence. api/connections.ts exposes getConnections, saveConnections, and clearConnections. Keep provider-specific fields in the app's configuration, and keep all credentials separate from public User records regardless of profile visibility.

16. Read [database guidance](../database/database.md) before persistence changes, [API guidance](../api/api.md) before service changes, [authentication guidance](../authentication/authentication.md) for sessions, [social guidance](../social/social.md) for profiles/privacy, [route guidance](../routes/routes.md) for access, then [Admin guidance](../admin/admin.md) for connected profiles, roles, sidebars, dashboards, and reports. Follow AGENTS.md and leave verification to the user unless requested.

17. For the requested full core, map these additional modules to the existing architecture; names below are examples of reusable boundaries, not replacements for working folders. Read [the App System feature map](../app-system/system.md) and its focused contracts. Reuse Firebase, auth/capabilities, IDs, theme, and account shell while keeping private and public data separate.

| Module | Shared Models/Service Boundary | Components/Routes |
| --- | --- | --- |
| Admin/Reports | shared/admin, shared/analytics, shared/observability; focused API facades | AdminDashboard, AdminRecords, AnalyticsCharts, ObservabilityPanel |
| Notifications/Contacts | shared/notifications and shared/formSubmissions; notification/contact facades | Public bell/cards/Contact, private notification manager/request viewer |
| Private Chat | shared/models/chats and shared/chats; chat facade | ChatInbox/ChatThread/composer and participant-private account/admin routes |
| Plans/Pricing | shared/models/plans and shared/plans; plans facade | Public Pricing/Home cards and authorized AdminPlans |
| Blog | shared/models/blog and shared/blog; published-content/authoring facades | BlogIndex/BlogArticle/categories/search and authorized AdminBlog |

Give each view its own logic/rendering/styles where the platforms differ. Thin route files compose the component and capability boundary; shared subscriptions/persistence never live inside route JSX.
