# AdSense Submission Preparation

Prepared for the primary website, `https://domaindatabases.com`. Submit this content site to AdSense; the other domain names currently redirect here and are not separate content sites.

## Prepared In Source

- Eight existing first-party domain guides include full articles, sources, related reading, dates, illustrations, and article metadata. The Reddit/YouTube resource links remain supplementary, rather than being represented as original articles.
- Privacy and Terms render their complete policies as readable sections on web and native. About, Blog, and Contact are linked from the public header navigation; the footer links to Terms and Privacy. Contact retains a readable public introduction while its form settings load or the intake form is unavailable.
- Privacy explains Google advertising cookies, partner data use, personalization choices, and consent requirements conditionally, with links to Google Privacy, My Ad Center, and industry opt-out information. It does not claim that a consent platform is already configured or that advertising is currently running.
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

Google supports meta-tag verification without loading the AdSense script. This preparation uses that method and does not make advertising requests, enable Auto ads, insert ad slots, or activate an advertising SDK in native apps.

## Before Requesting Review

1. Finish the AdSense account setup using the actual account holder's details. Add `domaindatabases.com` in Sites.
2. Confirm the real publisher ID is configured for the production build and deploy the prepared changes. The source preparation was committed in `c473dd580968065e8ec5ba9bba85c1c3be150c7b`.
3. Confirm the live homepage HTML contains the matching meta tag, `/ads.txt` returns the matching plain-text Google seller record, and `/robots.txt` and `/sitemap.xml` return their proper content types. Check that the complete public policies, contact introduction, and all guide URLs load without signing in.
4. Select **Meta tag** as the verification method in AdSense, verify ownership, and request the site review. These are account actions in AdSense; the app does not automatically submit itself or accept Google's account terms.
5. Review the actual content for accuracy, originality, ownership, clear navigation, and working links. There is no guaranteed approval, fixed article count, traffic threshold, or approval date promised by this implementation. Google reviews the site and determines eligibility.

## Before Turning Ads On

Ad serving is a separate step after Google has approved the site and marked it Ready. Configure Privacy & messaging and the appropriate Google-certified consent platform before implementing personalized advertising for visitors in the EEA, UK, and Switzerland. A custom cookie popup or a consent-mode flag alone is not a certified CMP.

Use explicit placements on eligible public editorial content. Retain the app's trusted Starter and active Owner ad exclusion, wait for authentication/entitlement resolution, and respect actual consent decisions before issuing advertising requests. Exclude account/private data, authentication, payment/subscription screens, administration, empty/search-result/error screens, and unmoderated user-generated content. Keep ads separated from navigation and account actions; never ask users to click advertisements.

No Google advertising loader or placement is added to Domains-Database by this preparation. Publisher verification metadata and ads.txt identify the account; they do not start ad serving, configure a CMP, or establish Google approval. Actual submission and deployment results are recorded separately.

## Evidence And Remaining Work

The source preparation was committed in `c473dd580968065e8ec5ba9bba85c1c3be150c7b`, and the real publisher ID is configured locally and in Vercel Production. See [the dated submission record](deployments/adsense-submission-2026-10-23.md) for deployment IDs, live readback, Sites actions, and the last observed review status. A submitted review request is not Google approval or proof of ad delivery. Actual consent setup and enabling advertising remain separate work. The earlier billing release and its checks are recorded separately under `docs/deployments/`.

## Official References

- [Connect your site and choose meta-tag verification](https://support.google.com/adsense/answer/7584263?hl=en)
- [Site ownership and Ready status](https://support.google.com/adsense/answer/12131223?hl=en)
- [Prepare unique content and clear navigation](https://support.google.com/adsense/answer/7299563?hl=en)
- [Required advertising privacy disclosures](https://support.google.com/adsense/answer/1348695?hl=en)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en-GB)
- [Ads on screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en)
- [Replicated content policy](https://support.google.com/publisherpolicies/answer/11190248?hl=en)
- [Allow crawling so noindex can be read](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
