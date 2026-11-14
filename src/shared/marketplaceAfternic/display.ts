import type { AfternicListing } from './types';

const integer = new Intl.NumberFormat(`en-US`);
const usd = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD`, minimumFractionDigits: 0 });
const date = new Intl.DateTimeFormat(undefined, { dateStyle: `medium` });
export const afternicStatusLabel = (status: string) => status === `GODADDY` ? `GoDaddy` : status.toLowerCase().replaceAll(`_`, ` `).replace(/\b\w/g, letter => letter.toUpperCase());
export const afternicRetainedInsightsLabel = (checkedAt?: string) => checkedAt && Number.isFinite(Date.parse(checkedAt))
  ? `Some Afternic Metrics Retained From ${date.format(new Date(checkedAt))}` : ``;

export const afternicListingDetails = (listing?: AfternicListing) => {
  if (!listing) return [];
  const { insights, floorPriceCents, minimumOfferCents } = listing;
  const retainedLabel = afternicRetainedInsightsLabel(listing.retainedInsightsAt);
  const views = insights?.intakeViews;
  const leads = insights?.intakeLeads;
  const searchTotals = insights?.searchTotals;
  const uniqueSearchers = insights?.uniqueSearchers;
  const searchLabels = ([`30d`, `90d`, `365d`] as const).flatMap(window => {
    const searches = searchTotals?.[window];
    const unique = uniqueSearchers?.[window];
    if (searches == null && unique == null) return [];
    const counts = [searches == null ? `` : `${integer.format(searches)} searches`, unique == null ? `` : `${integer.format(unique)} unique`].filter(Boolean);
    return [{ id: `searches-${window}`, label: `GoDaddy ${window} · ${counts.join(` · `)}` }];
  });
  return [
    ...(views != null ? [{ id: `views`, label: `${integer.format(views)} Afternic Views` }] : []),
    ...(leads != null ? [{ id: `leads`, label: `${integer.format(leads)} Afternic Leads` }] : []),
    ...(retainedLabel ? [{ id: `retained`, label: retainedLabel }] : []),
    ...(floorPriceCents != null ? [{ id: `floor`, label: `Floor ${usd.format(floorPriceCents / 100)}` }] : []),
    ...(minimumOfferCents != null ? [{ id: `min-offer`, label: `Min. Offer ${usd.format(minimumOfferCents / 100)}` }] : []),
    ...(insights?.registrar ? [{ id: `registrar`, label: `Registrar · ${afternicStatusLabel(insights.registrar)}` }] : []),
    ...(insights?.featured ? [{ id: `featured`, label: `Featured On Afternic` }] : []),
    ...(insights?.listedAt ? [{ id: `listed`, label: `Listed · ${date.format(new Date(insights.listedAt))}` }] : []),
    ...(insights?.landingPage ? [{ id: `lander`, label: `Lander · ${afternicStatusLabel(insights.landingPage)}` }] : []),
    ...(insights?.leasingEnabled ? [{ id: `lease`, label: insights.maxLeaseMonths ? `Lease To Own · Up To ${insights.maxLeaseMonths} Months` : `Lease To Own Enabled` }] : []),
    ...(insights?.leasingEnabled && insights.leaseDownPaymentCents != null ? [{ id: `down-payment`, label: `Lease Down Payment ${usd.format(insights.leaseDownPaymentCents / 100)}` }] : []),
    ...searchLabels,
  ];
};
