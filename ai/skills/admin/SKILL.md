---
name: admin
description: Build or update account profiles, role-controlled admin sidebars, persisted contact intake and notification/request workflows, realtime Firestore dashboards, animated charts, and server-protected Vercel analytics and observability in the current app.
---

1. Read the applicable shared guides in the order required by AGENTS.md, then read [admin.md](admin.md). Use this skill for the connected account and admin system, including its data access and reporting boundaries.

2. Follow the app's framework, feature model, theme, and installed components. For Profile, Dashboard, navigation, analytics, charts, or record editors, read [the shared layout reference](layout.md) and match its geometry, sizing, controls, and menu behavior across the account shell. Retain the destination app's colors, fonts, icons, and relevant feature labels; a theme change must not become a different layout. Inspect the reference's actual persisted actions and implement the relevant workflows, including notification CRUD/Active-Inactive controls and contact/request intake and review. Save contact submissions independently of email delivery, allow validated guest intake where public, and preserve private review capabilities. Keep public browsing available; do not copy unrelated business modules or unconfigured placeholders as working features.

3. Use Firebase Authentication and realtime Firestore for a requested connected system. Keep an explicitly chosen local demo separate, and show a connection-needed state when production configuration is missing. Client navigation checks do not grant backend permissions.

4. Keep this skill portable: no project names, credentials, fixed Firebase projects, role bootstrap emails, or deployment IDs. Put those values and the actual route/schema mapping in project configuration or project documentation outside ai/. Copy ai/ with AGENTS.md to adopt the guidance in another repository; copying instructions does not create cloud resources.

5. Recheck official provider documentation when integrating reporting because endpoint schemas and plan access change. Complete reviewable source and configuration examples within scope; follow AGENTS.md for validation, commits, deployment, and live changes.

6. For an explicitly requested complete app core with public frontend, private chat, plans/pricing, and a sourced blog, use [App System](../app-system/SKILL.md) to orchestrate those focused contracts while retaining this guide's account/admin/reporting boundaries.

7. The portable [analytics asset bundle](assets/analytics/) contains local country flags and source brand marks with their licenses/manifests. Reuse a compatible destination catalog or copy the needed bundle into its supported public/bundled asset path, preserving notices/provenance. Adapt web URLs and native static asset requires/renderers to the destination; assets in ai/ are a source bundle, not automatically served app routes.
