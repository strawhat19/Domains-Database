# AdSense Submission Preparation

Prepared for the primary website, `https://domaindatabases.com`. Submit this content site to AdSense; the other domain names currently redirect here and are not separate content sites.

## Prepared In Source

- Eight existing first-party domain guides include full articles, sources, related reading, dates, illustrations, and article metadata. The Reddit/YouTube resource links remain supplementary, rather than being represented as original articles.
- Privacy and Terms render their complete policies as readable sections on web and native. About, Blog, and Contact are linked from the public header navigation; the footer links to Terms and Privacy. Contact retains a readable public introduction while its form settings load or the intake form is unavailable.
- Privacy explains Google advertising cookies, partner data use, personalization choices, Google Privacy & messaging controls, and the signed-in Starter/Owner exclusion. It distinguishes external Google preferences from this site's consent controls and does not claim that ads are currently being delivered.
- Public pages receive canonical URLs using the primary domain. Account, administration, authentication, subscription, and other app-workflow pages receive `noindex, follow` when rendered through PageMeta. Error pages retain their explicit noindex setting.
- `/robots.txt` allows public crawling, leaves rendering assets accessible, excludes API endpoints, and advertises `/sitemap.xml`. HTML pages remain crawlable so search engines can see their noindex metadata; robots.txt does not replace authentication.
- `/sitemap.xml` includes the seven public informational/marketing routes and eight actual guide URLs. It excludes account/admin URLs, sign-in, billing, APIs, and redirected duplicate aliases.
- A valid configured publisher ID adds the `google-adsense-account` meta tag to the exported HTML head and supplies the matching Google record at `/ads.txt`. An absent, malformed, or all-zero placeholder ID emits neither a verification tag nor a fabricated seller record; `/ads.txt` returns 404 until configured.

## Publisher Configuration

Set the public variable in the ignored project `.env` and Vercel Production:

```dotenv
EXPO_PUBLIC_ADSENSE_PUBLISHER_ID=pub-8379301195677583
```

The account's public publisher ID, `pub-8379301195677583`, is configured in the ignored project `.env` and Vercel Production. The parser accepts a `pub-` ID or `ca-pub-` client ID followed by its sixteen digits. This identifier is public and is expected to appear in HTML and ads.txt. Rebuild and redeploy after changing it because Expo public variables are included at build time.

Google supports meta-tag verification without loading the AdSense script. The initial submission used that method. The subsequent guarded Auto ads implementation is described below; it does not activate an advertising SDK in native apps.

## Before Requesting Review

1. Finish the AdSense account setup using the actual account holder's details. Add `domaindatabases.com` in Sites.
2. Confirm the real publisher ID is configured for the production build and deploy the prepared changes. The source preparation was committed in `c473dd580968065e8ec5ba9bba85c1c3be150c7b`.
3. Confirm the live homepage HTML contains the matching meta tag, `/ads.txt` returns the matching plain-text Google seller record, and `/robots.txt` and `/sitemap.xml` return their proper content types. Check that the complete public policies, contact introduction, and all guide URLs load without signing in.
4. Select **Meta tag** as the verification method in AdSense, verify ownership, and request the site review. These are account actions in AdSense; the app does not automatically submit itself or accept Google's account terms.
5. Review the actual content for accuracy, originality, ownership, clear navigation, and working links. There is no guaranteed approval, fixed article count, traffic threshold, or approval date promised by this implementation. Google reviews the site and determines eligibility.

## Guarded Auto Ads

The web-only AdSense controller loads the official publisher script after Firebase identity, trusted billing, and the realtime Ads feature setting resolve successfully. Eligible visitors are settled guests or signed-in accounts with a server-confirmed Free state. Starter and active Owner accounts are excluded. Loading, errors, cached or pending billing snapshots, malformed records, and unresolved paid/subscription state suppress loading. Signing out removes the ability to recognize a subscription.

Loading is restricted to HTTPS on `domaindatabases.com`, with no query string or fragment, on Home, About, Blog, and the eight actual first-party guide URLs. Account/private data, authentication, pricing, payments, contact/policies, administration, portfolio/search/community/notifications, unknown articles, and errors are excluded. Local development, preview domains, and native views do not load Google advertising code.

Requests begin paused. Google's published Privacy & messaging CMP must supply a resolved TCF decision and US opt-out status before requests can resume. EEA/UK/Swiss requests require storage and Google vendor consent; personalization additionally requires the applicable personalization purposes. A refusal, US opt-out, unknown status, or failed CMP keeps requests paused. Non-personalized requests still require the applicable consent. Subsequent consent changes, route/identity changes, loss of eligibility, and restored pages pause requests and reset the document so already-executed advertising code does not persist into a private or ad-free view. Authentication transitions stay paused until settled, preserving sign-in flows.

Google Auto ads was observed On for this site. The existing database Ads flag was enabled. A European message and a US message are published for this site; the European message offers Do not consent and uses the correct HTTPS Privacy URL. The US message covers all current and future supported US states. Google's existing account-wide partner selection was left unchanged. The app does not implement a custom consent banner or hide served ads with CSS.

Once this source is released, no further app change is intended solely to turn serving on after Google approves the site. Serving still depends on Google's approval, account eligibility, ad availability, the Ads setting, and each visitor's identity and consent. No filled ad has been verified while the site remains Getting ready.

## Evidence And Remaining Work

The initial submission preparation was committed in `c473dd580968065e8ec5ba9bba85c1c3be150c7b`, and the real publisher ID is configured locally and in Vercel Production. See [the dated submission record](deployments/adsense-submission-2026-10-23.md) for that release and [the Auto ads activation record](deployments/adsense-activation-2026-10-23.md) for source, consent settings, feature state, checks, and release status. A submitted review request is not Google approval or proof of ad delivery. The earlier billing release and its checks are recorded separately under `docs/deployments/`.

## Official References

- [Connect your site and choose meta-tag verification](https://support.google.com/adsense/answer/7584263?hl=en)
- [Site ownership and Ready status](https://support.google.com/adsense/answer/12131223?hl=en)
- [Prepare unique content and clear navigation](https://support.google.com/adsense/answer/7299563?hl=en)
- [Required advertising privacy disclosures](https://support.google.com/adsense/answer/1348695?hl=en)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en-GB)
- [Auto ads setup](https://support.google.com/adsense/answer/9261307?hl=en)
- [Pause ad requests](https://support.google.com/adsense/answer/9042142?hl=en)
- [Google Privacy & messaging API](https://developers.google.com/funding-choices/fc-api-docs)
- [Ads on screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en)
- [Replicated content policy](https://support.google.com/publisherpolicies/answer/11190248?hl=en)
- [Allow crawling so noindex can be read](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
