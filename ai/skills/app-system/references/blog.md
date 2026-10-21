# Published Blog And Genuine References

Read this for requested blog/reference features or the full App System. Keep the app's existing relevant articles/categories and public design. The full starter includes real published listing, article routes, category filtering, search, credited references, and an authorized authoring/publication flow; a focused article edit does not require adding a CMS.

## Records, Publication, And Public Views

Use typed app-owned article records with stable ID/number, unique slug, title, excerpt/description, supported body/sections, category references, author display projection, created/updated/published dates, draft/published/archived state, optional image/alt/caption, related article references, and source references. Map these fields to an existing schema instead of duplicating it. Preserve static article slugs/permalinks/content through any explicit migration; do not silently rekey or discard them.

Public queries/detail routes expose only published content and eligible category/display metadata. Draft preview requires the authoring capability. Search is either a bounded published-page search with visible coverage or a deliberately configured published-only search service; do not fetch private drafts to search them in the browser. Support category routes, article not-found/unpublished states, related articles without broken/duplicate/self links, readable dates, reading-time metadata, and accessible source links.

Default administrative authoring to active trusted Owner; grant an Admin/editor capability only when the user explicitly chooses that destination policy, without granting role management. Provide bounded realtime record lists, category/search/status filters, Add/Edit, saved Publish/Unpublish, Archive, and permitted confirmed deletion when the existing content policy supports it. Keep ID/number, ownership, and created time protected; handle unique slug reservations transactionally and define permalink redirects if slugs can change. Render validated text/Markdown through a shared safe renderer, with supported HTTPS images and useful alt text; no arbitrary scripts/HTML or uploads outside scope. Match Admin record/editor interactions and the public app's own typography/theme.

## Genuine YouTube And Reddit References

Research the destination app's actual topics. Include useful real YouTube videos/channels and Reddit posts/communities in the reference library, and relevant article citations where they support the content. Open/verify the original source before adding it; a plausible video ID, guessed Reddit post, fabricated channel, or search-result title is not a source. A channel/community link is a resource directory entry, not evidence for an unverified specific claim. If access is unavailable, retain a clearly unverified draft reference and report the missing research; do not publish invented content or claim verification.

Store the actual HTTPS URL, provider, title/label, source/channel/community name, external video/post ID when available, author/credit where available, publication date only when verified, and reviewed time/provenance. Keep provider IDs in named external fields instead of primary app IDs. Normalize supported URL forms and match allowed hosts at domain boundaries; reject script/data URLs, lookalike hosts, embedded credentials, and malformed provider IDs. Keep article-specific sources and the general resource catalog distinguishable.

Write original useful article text and summarize source material accurately. Credit and link creators, distinguish opinion/community anecdotes from verified facts, and preserve any asset/content license requirements. Use only appropriate short attributed excerpts; do not reproduce entire articles, transcripts, or threads, fabricate quotations, dates, authors, engagement statistics, or endorsements. Sources inform app-relevant content rather than becoming an automatically copied feed.

Provider source icons and links retain their accessible text, safe external navigation, and local brand provenance. Optional YouTube embeds use a supported allowlisted player URL, accessible title, and fallback link; do not inject arbitrary saved embed HTML. Follow the [official YouTube player contract](https://developers.google.com/youtube/player_parameters). Native may open the canonical source in its supported browser when an embed is unavailable.

## Optional Live Feeds

Curated verified links satisfy the reference library without requiring a live feed. If live YouTube/Reddit resources are requested or already supported, use the current authorized provider interface, server-only credentials where needed, fixed source allowlists, bounded pagination/timeouts, normalized records, deduplication, and explicit source/freshness/warnings. Recheck [YouTube API guidance](https://developers.google.com/youtube/v3/getting-started) and [Reddit API access guidance](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki); do not assume an unauthenticated JSON/RSS endpoint is a guaranteed reporting API.

On provider failure keep verified curated links available, label stale/failed feed data honestly, and offer refresh without inventing fallback posts/videos. Do not let an optional feed failure erase the published blog or silently publish imported material. Store the actual approved topic/source catalog and provider setup in project docs/configuration outside portable ai/.

