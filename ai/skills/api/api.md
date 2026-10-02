1. Give each app an internal API or an equivalent shared asynchronous service. Use the existing framework: HTTP handlers where a server exists, or a typed local service for Expo and client-only apps. Keep the interface stable so a backend can replace local persistence later.

2. Provide a base /api directory describing available operations, a title, a concise connection message, storage mode, timestamp, and success status. Health and status operations may return the same response. Report real uptime, CPU, and memory only when the runtime exposes them; do not fabricate server statistics in a browser or mobile app.

3. Include /api/health, /api/status, /api/users, /api/notifications, /api/visits, and applicable model CRUD operations or their service equivalents. Use typed records from shared/models. Empty collections are valid; keep sample data optional and separate from persisted user data.

4. In a server development environment, the base directory may list registered API routes. Derive paths from the actual router or an explicit operation registry, normalize them, and avoid exposing filesystem paths. Do not copy Next.js filesystem traversal into Expo, Angular, or another incompatible runtime.

5. Keep the single useLocalStorage switch in shared configuration, true by default. All persistence goes through the shared storage adapter. Honor an existing session-only CRUD mode when explicitly selected and describe it accurately. If authentication has no backend when local mode is false, return the connection-needed result rather than successful authentication.

6. Keep reusable model and authentication operations separate from feature-specific operations. Use focused service facades such as api/auth.ts, api/notifications.ts, and api/social.ts where those concerns are requested. A local service can expose getRoutes(), getHealth(), getUsers(), getNotifications(), and getVisits(), alongside the requested feature's CRUD methods. Public directory entries describe capabilities; they do not imply an HTTP server exists.

7. Model-backed cards, rows, and other repeated records should have their own components. Load them through the internal API or equivalent service, including data sourced from local storage, JSON, variables, or sample modules. Show skeletons while the operation is pending, then render the records or an honest empty or error state.

8. Keep request, response, loading, and error types consistent across local and backend implementations. Normalize data at the service boundary, preserve stable app-owned IDs, and propagate failures instead of returning success with empty data.

9. Keep backend and external-provider secrets out of client bundles, public records, and logs. User-entered local demo connection credentials belong only to private account-scoped settings, separate from public User records; a real backend owns production secrets. Social reads return explicit public or participant projections and enforce audiences before returning records. Authenticated mutations derive the actor from the session. Client-side local demo role gates do not replace backend authorization when real endpoints are connected.

10. Read [database guidance](../database/database.md) for persistence and models, [authentication guidance](../authentication/authentication.md) for users and sessions, [social guidance](../social/social.md) for profile and content audiences, and [route guidance](../routes/routes.md) for page access. Keep implementation practical and scoped to the requested operations.
