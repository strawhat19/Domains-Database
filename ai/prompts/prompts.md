1. For a focused change: Read the relevant instructions and current implementation, preserve uncommitted edits, make the smallest readable change that completes the request, and describe the result. Leave validation to the user unless explicitly requested.

2. For a new app or page: Follow the chosen framework and shared structure, separate component logic from rendering and styles, use descriptive element identifiers, and support the requested web and mobile targets. Reuse the app shell, theme, navigation, and existing components.

3. For local CRUD: Use the existing typed models, shared ID and storage helpers, and one useLocalStorage flag. Expose operations through the internal API or equivalent service, preserve saved records, and show skeletons, empty states, and errors in the consuming components.

4. For authentication: Read the authentication, database, API, and route guidance, plus social guidance when public profiles are involved. Add simple local sign-in and sign-up with Subscriber as the default role, shared session state, an avatar menu, authenticated account Profile, and Owner-only Dashboard when requested. Keep public browsing available and prompt for identity at account actions. Keep the UI ready for a real backend without claiming one is connected.

5. For a reusable refactor: Preserve behavior and user preferences, consolidate duplicated shared logic, and keep feature-specific data out of reusable modules and instructions. Document the resulting structure using actual paths and explain each boundary briefly.

6. For social features: Read the social guidance and implement only the requested profiles, posts, follows, or messages. Enforce visibility and ownership through the service, keep account connection credentials separate from public profiles, and use safe formatted text with public HTTPS image URLs rather than uploads. Use the shared storage switch, models, theme, and component structure.

7. For publishing work: Prepare concrete, reviewable output within the authorized scope. Ensure public policy pages, internal navigation, common redirects, dynamic copyright year, and the Piratechs link are present. Perform external publishing only when authorized.
