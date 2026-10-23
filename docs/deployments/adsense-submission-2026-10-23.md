# AdSense Site Review Requests — 2026-10-23

This record separates the account actions observed in Chrome from deployment evidence and Google's eventual review decision. The public publisher ID for both sites is `pub-8379301195677583`. Both sites displayed **Getting ready** and **Review requested** after the requests below. No Google approval, traffic level, or consent-platform configuration is established by these requests.

The combined Sites-list screenshot, `adsense-both-reviews-requested.png`, records both **Getting ready** statuses. AdSense still displayed **Not found** for both ads.txt records at capture time, despite the successful direct HTTPS readbacks below.

## Wages Calculator

- Site requested: `https://wages-calculator.com`; the verified Vercel project is `prj_FGanaAzhnvfZ9LQrItlofHJo2lX0` and its production alias points to deployment `dpl_9ghg9vbFm8y5H3WaFzTu5Q5eLtgH`.
- The existing AdSense loader was left unchanged. This submission work did not add another advertising loader.
- The public audit returned HTTP 200 for twelve checked URLs, including six guides, methodology, and policy content. The live homepage contained the correct publisher meta tag and `/ads.txt` returned HTTP 200 with the matching Google seller record.
- The audit found content dated October 4 after the October 3 low-value-content rejection. Dates and available pages establish the observed chronology, not Google's acceptance of the changes.
- Review was requested again in Chrome at approximately 18:02 UTC / 2:02 PM EDT on October 23, 2026. AdSense then displayed **Getting ready** and **Review requested**. This is a pending review, not an approval or Ready state.
- Evidence captured by the submission session: `wages-adsense-audit/http-inventory.json`, `wages-adsense-audit/content-crawl.json`, and `wages-adsense-review-requested.png`.
- The local checkout was clean at `f4755e3cf314f0628887f6827d9dca6cc5b25d02`. The production deployment's source commit was not independently established, so this record does not equate that local commit with the deployed build.

## Domains-Database

- Primary site: `https://domaindatabases.com`. Redirecting aliases are not separate content-site submissions.
- Preparation source is committed at `c473dd580968065e8ec5ba9bba85c1c3be150c7b`.
- `EXPO_PUBLIC_ADSENSE_PUBLISHER_ID=pub-8379301195677583` is configured in the ignored local `.env` and Vercel Production. The value is public; private environment values are not recorded here.
- Production deployment `dpl_eaz4N7HA36mPZvxEtT2wDVXUDFoj` passed the production readiness gate at `2026-10-23T18:05:49.060Z`. The canonical production alias and deployed source commit `c473dd580968065e8ec5ba9bba85c1c3be150c7b` were confirmed.
- The live homepage returned HTTP 200 with the matching publisher meta tag. `/ads.txt` returned HTTP 200 as `text/plain` with the exact matching Google seller record.
- The site was added to AdSense Sites, initially showing **Requires review**, with **Meta tag** selected as the connection method. At approximately 18:06 UTC / 2:06 PM EDT, Chrome verification returned **Your site is verified**. After **Next** and **Request review**, the actual site details displayed **Getting ready** and **Review requested**.
- Domains-Database uses publisher verification metadata and `/ads.txt`; no Google advertising loader, Auto ads, or ad placements were added. Consent-platform setup and any future ad serving remain separate actions.

## Remaining Follow-Up

Wait for Google's review outcome. A request can remain pending and does not establish approval, advertising eligibility, or ad delivery. Before future personalized Google advertising in the EEA, UK, or Switzerland, complete the required Google-certified consent-platform setup and respect visitors' recorded choices. Preserve the app's exclusion of Starter and active Owner accounts and private/account/billing screens when advertising is implemented.

The reusable setup and policy references remain in [AdSense Submission Preparation](../adsense-submission.md). Earlier billing deployment evidence is recorded separately in this directory.
