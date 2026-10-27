# Domain Discovery Loading And Cache

The `/search` discovery names are a curated list of 27 ideas, not a live popularity feed. Availability and quotes come from the eligible registrar connections. The names therefore stay fairly stable while registrar results can change.

## Cause Of The Delay

The client checks names sequentially within each provider, retaining the existing one-second provider pacing and four-second Namecheap pacing. Each request also includes its network/provider time. Previously, the carousel hid all received results while any check was still loading, and the sidebar withheld the first two cards. A full-page loader also waited for recent-search records. The old five-minute discovery snapshot lived only in a mounted hook and disappeared when navigating away or reloading.

## Current Behavior

The first confirmed available card now renders while the other checks continue. The sidebar fills its initial empty slots with skeletons without hiding received cards; carousel movement remains paused during loading. Recent-search records load within their own section instead of blocking the discovery page.

Confirmed registrar results have a one-hour memory/device cache in `src/shared/domainSearch/discoveryCache.ts`. It uses AsyncStorage directly, with at most 256 quotes per owner, schema validation, canonical registrar links and incremental saves. It stores availability/quote data only, with no credentials and no new cloud collection. Fresh confirmed true/false results are reusable; errors, pending checks and unconfirmed availability are not cached. Storage failure falls back to the in-memory cache and does not fail the search.

The cache is selected only after resolving current search connections and plan access. Its scope includes the account, paid/free access, actual provider modes and connection fingerprint. Connection or plan changes select another scope; stale requests cannot populate the current scope. New mounts/reloads restore confirmed cards before requesting uncached names. Ordinary submitted domain searches remain fresh because only discovery opts into the cache.

Refresh explicitly bypasses cached quotes. Previously displayed cards remain during refresh/pause while their pending checks are replaced by actual results. The Checked time preserves the age of reused quotes rather than implying they were just fetched. A paused or failed request retains useful received results, and account/connection/plan changes hide the previous scope. The existing five-minute mounted-view snapshot remains an additional short reuse layer.

## Verification

Eleven isolated behavioral scenarios passed against the actual cache, search client and discovery transformation using fake clocks plus mocked auth/storage/provider requests. They covered progressive arrivals before completion, zero extra registrar requests on a cache hit, forced refresh, device-cache rehydration, account/plan/connection isolation, expiry/corruption, confirmed unavailable versus unconfirmed/error/pending results, stale-scope races, cancellation/retry and provider pacing. These checks made no real provider requests and did not build or launch the app.

Another 35 focused render/hook checks passed against the actual discovery components and hook with deterministic React/JSX stubs. They confirmed first/second-card rendering while loading, decreasing sidebar placeholders, preserved filters, refresh/error/pause behavior, immediate hiding of prior account/plan/connection/session data and stale-callback rejection. Web entrypoints reuse the changed native discovery components. These isolated render checks did not launch a browser or native UI session.

Browser layout, live provider timing, production deployment and a full application build are separate from these focused behavioral checks.
