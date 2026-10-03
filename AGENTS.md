# AI Instructions

Apply these preferences across projects and workspaces for the strawhat19 GitHub/Codex setup, within the requested task's scope.

1. Make practical, minimal code changes and preserve existing uncommitted work. Do not verify, test, build, or run UI checks unless I ask; let me review the diff and verify before committing. If an app is actively running, batch edits into a final save when practical, or safely stop and restart it to reduce save churn. During source reviews, look for compiler, type, lint, and editor issues where practical; use red for errors and yellow for warnings when supported.

2. Prefer Christmas-tree ordering for imports, props, object fields, arrays, and grouped declarations: shortest lines first, then longer lines. Keep imports at the top and preserve readable execution order and framework conventions. Prefer readable names and arrow functions where they fit; add comments only for non-obvious behavior.

3. Prefer SCSS over CSS where supported. Use the platform's supported style objects for native views.

4. Give HTML, JSX, and TSX elements descriptive classes and IDs. For repeated elements, include the record ID or index in the ID so I can inspect and reference each element. Use nativeID or the app's equivalent helper for native elements.

5. Prefer icons with text for buttons and clickable items, or an icon alone with an accessible label. Keep navigation icons consistent. For table statuses, use the shared users-table pattern with actionsCell, rowStatus, statusDotWrap, statusDot, and statusText classes and green, gray, or red state colors.

6. Prefer smooth transitions and respect reduced-motion settings when available.

7. Break JSX props and children onto separate lines when it improves readability. Keep simple code compact, for example:

```tsx
<Text
  {...elementProps(`action-label`, item.id)}
  style={[styles.label, { color: active ? palette.blue : palette.muted }]}
>
  {label}
</Text>
```

8. In JavaScript, TypeScript, JSX, and TSX, prefer backticks, then single quotes, with double quotes as a last resort. Use single quotes for import paths and optional chaining around nullable values, arrays, API responses, and nested model fields when practical. Use concise Title Case console labels, logs, and toasts, with (s) where useful and no trailing period unless needed.

9. For new apps, prefer Expo, React Native, TypeScript, and Sass for web and mobile unless I choose another framework. Follow the existing framework when editing an app. Preserve the model and speed selected in the Codex UI; do not override them from global config. If none is explicitly selected, prefer gpt-5.4-mini with medium reasoning. Before complex architecture, broad refactors, tricky debugging, risky migrations, security-sensitive code, or long multi-file work, recommend gpt-5.5 fast when its capability is worth the cost.

10. Each app should support web on a custom domain and either a PWA or a mobile app deployable to an app store.

11. Keep shared state under shared/: React Context for React apps, or services for Angular. Separate concerns such as the current user, users, theme, and application data. Keep public app browsing available unless I request a private app; prompt for sign-in or sign-up when an action requires identity. Account connection credentials belong to private account-scoped storage, separate from public User records. For Firestore documents, use app-owned IDs shaped Type_Number_Name_Date_UUID, with an auto-incrementing integer number matching the ID. Store external service IDs in named fields such as stripe_order_id instead of primary IDs.

12. Give each component its own folder, separating logic, rendering, and styles. Share behavior across web and native views where practical.

13. Headers should have component variable called 'sticky', default set to true, making the header top sticky so it follows user on scroll, and this includes any top bars or elements attached to the header, then when scrolling down, the header should become semi transparent with backdrop filter blur, make sure you put this backdrop filter blur after the webkit backdrop filter blur because thats how i noticed it worked. these should all be smooth transitions

14. Every App should have a smooth scroll to top button that fades in and out when the user scrolls past the hero and matches the design of the app, preferably this scroll to top button should float in the bottom right corner of the app

15. Footers must include copyright with the current year, and a link to https://piratechs.com/, the link to Piratechs should preferably be in the right or center of the footer, and towards the bottom.

16. Before publishing a completed landing page, include About, Terms, Contact, and Privacy Policy pages. Menu links should navigate to internal pages instead of section anchors; include common aliases such as about-us to about and contact-us to contact.

17. Before implementation, read the applicable guidance in this order: ai/skills/structure/structure.md, ai/skills/database/database.md, ai/skills/api/api.md, ai/skills/authentication/authentication.md when authentication is involved, ai/skills/social/social.md when profiles, posts, followers, messaging, or social privacy are involved, then ai/skills/routes/routes.md. Read only what the requested work needs, preserve the existing architecture where practical, and do not run premature validation.