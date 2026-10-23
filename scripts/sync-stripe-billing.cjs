const fs = require('node:fs');
const path = require('node:path');
const Stripe = require('stripe');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const root = path.resolve(__dirname, `..`);
const envPath = path.join(root, `.env`);
process.loadEnvFile(envPath);
const projectId = `domainsdatabase-e62a3`;
const origin = `https://domaindatabases.com`;
const accountId = `acct_1URo3231gDNPwfDr`;
const marker = `domains_database_live_billing`;
const plans = [
  { slug: `free`, amount: 0, id: `Plan_1_Free_8_32_AM_10_11_26_f5c65d69fe7442b7b1b224e3c4e9f02d` },
  { slug: `starter`, amount: 133, id: `Plan_5_Starter_12_42_AM_10_19_26_a2a2b86106e44cfbb7a70a10526ea9e9` },
];
const events = [
  `invoice.paid`, `invoice.voided`, `invoice.payment_failed`,
  `invoice.marked_uncollectible`, `invoice.payment_action_required`,
  `checkout.session.expired`, `checkout.session.completed`,
  `checkout.session.async_payment_failed`, `checkout.session.async_payment_succeeded`,
  `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`,
];
const saveEnv = values => {
  let text = fs.readFileSync(envPath, `utf8`);
  for (const [name, value] of Object.entries(values)) {
    if (!/^[A-Z_]+$/.test(name) || /[\r\n]/.test(value)) throw new Error(`Invalid Environment Value`);
    const line = `${name}=${value}`;
    const matcher = new RegExp(`^${name}=.*$`, `m`);
    text = matcher.test(text) ? text.replace(matcher, line) : `${text.trimEnd()}\n${line}\n`;
    process.env[name] = value;
  }
  fs.writeFileSync(envPath, text);
};
const listAll = async resource => {
  const result = [];
  for await (const item of resource.list({ limit: 100 })) {
    result.push(item);
    if (result.length > 1000) throw new Error(`Catalog Exceeds The Setup Review Limit`);
  }
  return result;
};
const main = async () => {
  if (!/^rk_live_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY ?? ``)) throw new Error(`A Restricted Live Stripe Key Is Required`);
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? `{}`);
  if (credential.project_id !== projectId) throw new Error(`Unexpected Firebase Project`);
  const database = getFirestore(initializeApp({ projectId, credential: cert(credential) }));
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, appInfo: { name: `DomainsDatabase_hvzqewpa` } });
  const products = await listAll(stripe.products);
  const prices = await listAll(stripe.prices);
  const output = { accountId, plans: [] };
  for (const plan of plans) {
    const data = (await database.doc(`plans/${plan.id}`).get()).data();
    if (data?.slug !== plan.slug || data?.active !== true || data?.priceCents !== plan.amount
      || data?.currency?.toLowerCase() !== `usd` || data?.billingInterval !== `month`) throw new Error(`Published ${plan.slug} Does Not Match The Approved Offer`);
    const matches = products.filter(item => item.metadata?.app_project === projectId && item.metadata?.app_plan_id === plan.id);
    if (matches.length > 1) throw new Error(`Duplicate ${plan.slug} Products Need Review`);
    const metadata = { app_project: projectId, app_plan_id: plan.id, app_plan_slug: plan.slug, integration_identifier: `DomainsDatabase_hvzqewpa` };
    const marketing = (data.features ?? []).map(item => typeof item === `string` ? item : item?.name ?? item?.text ?? item?.label).filter(Boolean);
    if (marketing.length > 20 || marketing.some(item => item.length > 80)) throw new Error(`Plan Feature Copy Exceeds Stripe Limits`);
    const productParams = { metadata, active: true, name: data.name, marketing_features: marketing.map(name => ({ name })) };
    const product = matches[0]
      ? await stripe.products.update(matches[0].id, productParams)
      : await stripe.products.create(productParams, { idempotencyKey: `${marker}_${plan.slug}_product_v1` });
    const lookupKey = `domains_database_${plan.slug}_usd_month_${plan.amount}_v1`;
    const existing = prices.filter(item => item.lookup_key === lookupKey);
    if (existing.length > 1) throw new Error(`Duplicate ${plan.slug} Prices Need Review`);
    let price = existing[0];
    if (!price) price = await stripe.prices.create({
      metadata, lookup_key: lookupKey, currency: `usd`, product: product.id,
      unit_amount: plan.amount, recurring: { interval: `month`, interval_count: 1 },
    }, { idempotencyKey: `${marker}_${plan.slug}_price_v1` });
    if (!price.livemode || !price.active || price.product !== product.id || price.currency !== `usd`
      || price.unit_amount !== plan.amount || price.recurring?.interval !== `month` || price.recurring?.interval_count !== 1) throw new Error(`Existing ${plan.slug} Price Does Not Match`);
    await stripe.products.update(product.id, { default_price: price.id });
    saveEnv({ [`STRIPE_${plan.slug.toUpperCase()}_PRICE_ID`]: price.id });
    output.plans.push({ slug: plan.slug, productId: product.id, priceId: price.id, priceCents: price.unit_amount, interval: price.recurring.interval });
  }
  const portals = (await listAll(stripe.billingPortal.configurations)).filter(item => item.metadata?.app_project === projectId);
  if (portals.length > 1) throw new Error(`Duplicate Billing Portal Configurations Need Review`);
  const portalParams = {
    metadata: { app_project: projectId, integration_identifier: `DomainsDatabase_hvzqewpa` },
    default_return_url: `${origin}/subscription?plan=starter&billing=updated`,
    business_profile: { headline: `Manage Your Domains Database Subscription`, privacy_policy_url: `${origin}/privacy`, terms_of_service_url: `${origin}/terms` },
    features: {
      invoice_history: { enabled: true },
      subscription_update: { enabled: false },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: `at_period_end` },
      customer_update: { enabled: true, allowed_updates: [`name`, `email`, `address`] },
    },
  };
  const portal = portals[0]
    ? await stripe.billingPortal.configurations.update(portals[0].id, { ...portalParams, active: true })
    : await stripe.billingPortal.configurations.create(portalParams, { idempotencyKey: `${marker}_portal_v1` });
  saveEnv({ STRIPE_BILLING_PORTAL_CONFIGURATION_ID: portal.id, EXPO_PUBLIC_SITE_URL: origin });
  output.portalId = portal.id;
  const url = `${origin}/api/billing/webhook`;
  const webhooks = (await listAll(stripe.webhookEndpoints)).filter(item => item.url === url);
  if (webhooks.length > 1) throw new Error(`Duplicate Billing Webhooks Need Review`);
  let webhook = webhooks[0];
  if (webhook) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error(`Existing Webhook Secret Must Be Recovered Before Continuing`);
    if (webhook.api_version !== Stripe.API_VERSION) throw new Error(`Existing Webhook API Version Needs Review`);
    webhook = await stripe.webhookEndpoints.update(webhook.id, { disabled: false, enabled_events: events });
  } else {
    webhook = await stripe.webhookEndpoints.create({
      url, enabled_events: events, api_version: Stripe.API_VERSION,
      description: `Domains Database Live Subscription Entitlements`,
      metadata: { app_project: projectId, integration_identifier: `DomainsDatabase_hvzqewpa` },
    }, { idempotencyKey: `${marker}_webhook_v1` });
    if (!webhook.secret) throw new Error(`Stripe Did Not Return A Webhook Secret`);
    saveEnv({ STRIPE_WEBHOOK_SECRET: webhook.secret });
  }
  output.webhook = { id: webhook.id, url: webhook.url, status: webhook.status, apiVersion: webhook.api_version, events: webhook.enabled_events };
  const [tax, registrations] = await Promise.all([stripe.tax.settings.retrieve(), stripe.tax.registrations.list({ limit: 100 })]);
  output.tax = { status: tax.status, activeRegistrations: registrations.data.filter(item => item.status === `active`).length, automaticTaxEnabledBySetup: false };
  console.log(JSON.stringify(output, null, 2));
};
main().catch(error => { console.error(`${error.code ?? error.type ?? `Setup Error`}: ${error.message}`); process.exitCode = 1; });
