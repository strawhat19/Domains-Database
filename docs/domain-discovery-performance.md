# Domain Discovery Loading And Cache

Domain Discovery on `/search` selects a weekly batch of up to 120 names from curated word lists each Monday at 00:00 UTC, with extra candidates for `.com`. The same week’s ideas appear in Explore Domains and Trending Domains on web and native. Ideas are interleaved by extension, with a mix of Hot, Trending and New categories and short, one-word and two-word names. Availability and prices come from eligible registrar connections, so the number of results varies by filter. Value requires a confirmed eligible registration price.

## Cause Of The Delay

The client checks names sequentially within each provider, retaining the existing one-second provider pacing and four-second Namecheap pacing. Each request also includes its network/provider time. Previously, the carousel hid all received results while any check was still loading, and the sidebar withheld the first two cards. A full-page loader also waited for recent-search records. The old five-minute discovery snapshot lived only in a mounted hook and disappeared when navigating away or reloading.

## Current Behavior

The first confirmed available card renders while the other checks continue. The sidebar fills its initial empty slots with skeletons without hiding received cards. The carousel can move as soon as it has enough confirmed cards to loop. Recent-search records load within their own section.

After the first paint and account and connection readiness, Discovery starts loading for eligible signed-in accounts. Explore Domains and Trending Domains read the same in-flight or cached result across navigation. A domain search takes priority over the background queue, which resumes using completed quotes after the search settles. Visitors can load Discovery when opening `/search` if the app has a public search provider. The progress toast counts settled provider checks, including cached results, and completes after the connection checks finish.

For eligible signed-in accounts, the app starts discovery after the first paint and reuses the results when you open `/search`. An explicit domain search takes priority. **Profile → Toast Position** controls where floating progress updates appear on this device.

Confirmed registrar results have a one-hour memory/device cache in `src/shared/domainSearch/discoveryCache.ts`. It uses AsyncStorage directly, with at most 768 quotes per owner, schema validation, canonical registrar links and incremental saves. When the serialized snapshot exceeds the device storage size limit, the app keeps the newest quotes that fit. It stores confirmed availability and quote data. Storage failure falls back to the in-memory cache.

The cache is selected only after resolving current search connections and plan access. Its scope includes the account, paid/free access, actual provider modes and connection fingerprint. Connection or plan changes select another scope; stale requests cannot populate the current scope. New mounts/reloads restore confirmed cards before requesting uncached names. Ordinary submitted domain searches remain fresh because only discovery opts into the cache.

Refresh rechecks the current week’s ideas and bypasses cached quotes. Previously displayed cards from the same week remain while pending checks are replaced by actual results. The Checked time preserves the age of reused quotes. A paused or failed request retains available results within the same scope. A new week or account, connection, or plan change clears the previous view and partial results. The five-minute mounted-view snapshot remains an additional short reuse layer.

## Verification

Eleven isolated behavioral scenarios passed against the actual cache, search client and discovery transformation using fake clocks plus mocked auth/storage/provider requests. They covered progressive arrivals before completion, zero extra registrar requests on a cache hit, forced refresh, device-cache rehydration, account/plan/connection isolation, expiry/corruption, confirmed unavailable versus unconfirmed/error/pending results, stale-scope races, cancellation/retry and provider pacing. These checks made no real provider requests and did not build or launch the app.

Another 35 focused render/hook checks passed against the actual discovery components and hook with deterministic React/JSX stubs. They confirmed first/second-card rendering while loading, decreasing sidebar placeholders, preserved filters, refresh/error/pause behavior, immediate hiding of prior account/plan/connection/session data and stale-callback rejection. Web entrypoints reuse the changed native discovery components. These isolated render checks did not launch a browser or native UI session.

Browser layout, live provider timing, production deployment and a full application build are separate from these focused behavioral checks.
