# Afternic Portfolio Connector

Under **Profile → Connections → Afternic**, the configured seller can check setup status and open **Market → Sell**. **Your Afternic Listings** loads the connected seller’s portfolio automatically, with active listings first. Eligible sellers can import selected domains into in-app drafts and send a reviewed draft or paused listing to Afternic. The connector is scoped to one configured seller account. Afternic handles its own listing review, fees, payments, and domain transfers.

The key and secret are masked in Connections. The eye button fetches that field for the signed-in seller after the server confirms the account binding. Hiding it clears the revealed value from the form.

## Connect from Profile

Create an API key under **Account Profile → Security → API Keys** in the Afternic account that owns the portfolio. An eligible seller assigned by `AFTERNIC_SELLER_USER_ID`, or an eligible app Owner when there is no assignment, can enter the key and secret in **Profile → Connections → Afternic** and select **Connect Afternic**. The server verifies access with a read-only portfolio request and saves the credentials in a server-only Firestore record bound to the seller. This setup form is for the initial connection. The account’s registrar reset covers registrar credentials. [Afternic authentication guide](https://api.afternic.com/docs/portfolio-api/guides/authentication/)

## Environment setup

For an environment-managed connection, set these values in the Expo server environment and restart or redeploy that server.

| Variable | Value |
| --- | --- |
| `AFTERNIC_API_KEY` | The Afternic API key |
| `AFTERNIC_API_SECRET` | The Afternic API secret |
| `AFTERNIC_SELLER_USER_ID` | The app-owned ID of the active seller who owns the Afternic portfolio |

Keep the credential pair in server-only environment variables. Keep the configured seller bound to the same Afternic account when rotating keys, and resolve outstanding listing holds before connecting a different portfolio. The server uses the authenticated Afternic account’s `my` portfolio and checks the app seller’s active role, plan, and listing feature settings on every request. Loading the portfolio confirms whether Afternic accepts the configured credentials.

## Sync your Domains portfolio

After startup, eligible accounts load their last private Afternic snapshot in the background and refresh it when it is more than an hour old. The main **Sync** action refreshes Afternic alongside any registrar sync you select. Open a domain’s details or settings to see its Afternic status, Buy Now price, and any estimate Afternic supplies. A completed sync with readable rows can confirm that a domain has no Afternic listing. A refresh that fails leaves the last saved snapshot available. [Afternic portfolio API](https://api.afternic.com/docs/portfolio-api/api/domains/getDomains/)

Use **Get GoValue Estimate** for an owned domain when you have a saved GoDaddy connection. GoValue can return a range, a suggested Afternic price, a wholesale estimate, annual sale probabilities at three prices, and a snapshot of your daily API usage. It requires an active GoDaddy subscription and domain read access. Estimates depend on TLD and model coverage. [GoDaddy Domain Valuation](https://developer.godaddy.com/en/docs/api-users/domains/valuation)

Use **Check Parking Metrics** in an owned domain’s details to check a separate saved GoDaddy Classic connection. The lookup saves the latest confirmed 30-day window of reported revenue, page views, visits, and ad clicks in the private domain record. A later empty result keeps the last confirmed data. Parking data reflects GoDaddy’s reporting delay and is checked on demand. [GoDaddy Parking metrics](https://developer.godaddy.com/en/docs/references/rest/parking/get-metrics-by-domain)

Select **List For Sale** on an owned domain to open the in-app Sell form. The form fills in the domain name, its saved description, and an eligible saved USD portfolio value. Review the price before saving the draft and verifying domain ownership. The Afternic snapshot stays private and is separate from your marketplace listing and public profile.

## Review account activity

Open **Market → Sell → Your Afternic Listings → Afternic Activity** from the account bound to the portfolio. Choose a 30-, 90-, or 365-day range. Account views and leads use full UTC days through yesterday and show how many daily rows Afternic reported. GoDaddy search totals on individual listings have their own Domain Pro eligibility. [Account stats reference](https://api.afternic.com/docs/portfolio-api/api/stats/getAccountStats/) · [Search Statistics](https://api.afternic.com/docs/portfolio-api/guides/search-statistics/)

Sales history starts with the newest 25 rows and **Load More Sales** continues through the selected time window. Enter a full domain to show only exact matches from Afternic’s keyword results. A page can contain no exact matches while Afternic still has more results to check. Afternic reports Buy Now and lease-to-own status, prices, tax-inclusive totals, commissions, disbursement dates, and available installment data. The two reports refresh independently and keep their last confirmed results in the open panel if a refresh fails. The reports use the connected Afternic API key and leave public listings and in-app checkout data untouched. [Sales reference](https://api.afternic.com/docs/portfolio-api/api/sales/getSales/)

After selecting a domain, **Check Domain Activity** loads its daily Afternic views and leads for the selected range. It first verifies that the domain is listed in the connected account. Per-domain date-range reports run on demand to keep portfolio sync bounded. [Domain stats reference](https://api.afternic.com/docs/portfolio-api/api/stats/getDomainStats/)

When a listing refresh omits previously confirmed analytics or valuation fields, the same connected listing can retain those fields with a previous-check label. A malformed inventory page leaves the last complete snapshot active and explains the problem. Fresh provider values, including zero, take precedence.

## Import and publish

- Use **Refresh Afternic Listings** to check for updates. **Import Draft** copies the domain and supported price and offer settings. It requires a seller URL and leaves existing in-app listing content intact. Sold and on-hold Afternic listings stay view-only.
- To send a domain to Afternic, create an in-app draft or pause its active listing. Add the draft’s ownership TXT record at the DNS provider and select **Review Listing**. Prices sent to Afternic must be in whole US dollars. When offers are enabled, the review shows Afternic’s $20 minimum offer. **List On Afternic** submits the reviewed listing after checking DNS again. The workflow applies to any registrar that supports the ownership TXT record and meets Afternic’s listing requirements. [Afternic Create domain reference](https://api.afternic.com/docs/portfolio-api/api/domains/createDomain/)
- **Check Status** reports Afternic’s listing status and Fast Transfer status separately. An imported or submitted domain is reserved against in-app publication while its Afternic record exists or while the provider result is uncertain. To move the domain back to in-app sales, remove its listing in Afternic and select **Check Status**. The app releases the reservation after Afternic confirms that the domain is absent. [Afternic listing workflow](https://api.afternic.com/docs/portfolio-api/guides/common-workflows/#check-listing-and-fast-transfer-status)

The connector does not change registrar records, nameservers, existing Afternic listings, or transfer settings. Changes made directly in Afternic take effect in this interface when the seller refreshes the portfolio or checks the listing. In-app sales and their Stripe commission apply to transactions completed in Markets.
