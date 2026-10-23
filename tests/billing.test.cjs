const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Module = require('node:module');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const Stripe = require('stripe');
const { Timestamp } = require('firebase-admin/firestore');

global.fetch = async () => { throw new Error(`Network Access Is Forbidden In Billing Tests`); };
const projectRoot = path.resolve(__dirname, `..`);
const actualModules = new Map();
const loadSource = (relative, stubs = {}) => {
  const filename = path.resolve(projectRoot, relative);
  const source = fs.readFileSync(filename, `utf8`);
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = specifier => {
    if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
    if (specifier === `expo-crypto`) return { randomUUID: crypto.randomUUID };
    if (specifier.startsWith(`.`)) {
      const dependency = `${path.resolve(path.dirname(filename), specifier)}.ts`;
      if (fs.existsSync(dependency)) {
        if (!actualModules.has(dependency)) actualModules.set(dependency, loadSource(dependency));
        return actualModules.get(dependency);
      }
    }
    return Module.createRequire(filename)(specifier);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
};
const types = loadSource(`src/server/billing/types.ts`);
const actualConfig = loadSource(`src/server/billing/config.ts`, { './types': types });
const { BillingError } = types;
const now = Math.floor(Date.now() / 1000);
const userId = `User_1_Fixture_1_00_PM_10_23_26_userfixture`;
const accountId = `BillingAccount_1_Fixture_1_00_PM_10_23_26_accountfixture`;
const planId = `Plan_5_Starter_1_00_PM_10_23_26_planfixture`;
const actor = { id: userId, userId, firebaseUid: `fixtureUid`, role: `Subscriber`, active: true, owner: false, name: `Fixture`, email: `fixture@example.invalid` };
const offer = { planId, priceCents: 133, currency: `USD`, billingInterval: `month` };
const price = { id: `price_fixture`, livemode: true, active: true, currency: `usd`, unit_amount: 133, type: `recurring`, recurring: { interval: `month`, interval_count: 1 } };
const metadata = { billing_account_id: accountId, app_user_id: userId, plan_slug: `starter`, plan_id: planId };
const accountFixture = () => ({ id: accountId, number: 1, name: `Fixture`, userId, firebase_uid: actor.firebaseUid, plan: `free`, accessUntil: null, subscriptionStatus: null, syncVersion: 0, created: new Date().toISOString(), updated: new Date().toISOString(), stripe_customer_id: `cus_fixture` });
const subscriptionFixture = () => ({ id: `sub_fixture`, livemode: true, created: now - 3600, status: `active`, metadata: { ...metadata }, cancel_at_period_end: false, pause_collection: null, collection_method: `charge_automatically`, trial_start: null, trial_end: null, items: { has_more: false, data: [{ id: `si_fixture`, quantity: 1, price: { ...price, recurring: { ...price.recurring } }, current_period_end: now + 86_400 }] } });
const invoiceFixture = () => ({ id: `in_fixture`, livemode: true, status: `paid`, lines: { has_more: false, data: [{ parent: { subscription_item_details: { subscription: `sub_fixture`, subscription_item: `si_fixture` } }, pricing: { price_details: { price: price.id } }, period: { start: now - 3600, end: now + 86_400 } }] } });
const sessionFixture = (extra = {}) => ({ id: `cs_live_fixture`, livemode: true, status: `open`, mode: `subscription`, customer: `cus_fixture`, client_reference_id: userId, metadata: { ...metadata }, url: `https://checkout.stripe.com/c/pay/fixture`, subscription: null, ...extra });

const createServiceFixture = () => {
  const state = { account: accountFixture(), subscriptions: [subscriptionFixture()], invoices: [invoiceFixture()], sessions: [], retrieved: null, created: [], expired: [], released: 0, finished: [], listHasMore: false, subscriptionReads: 0 };
  const stripe = {
    subscriptions: { list: async () => { state.subscriptionReads++; return { data: state.subscriptions, has_more: false }; } },
    invoices: { list: async () => ({ data: state.invoices, has_more: false }) },
    customers: { create: async () => { throw new Error(`Unexpected Customer Creation`); } },
    checkout: { sessions: {
      list: async () => ({ data: state.sessions, has_more: state.listHasMore }),
      retrieve: async () => state.retrieved,
      expire: async id => { state.expired.push(id); return {}; },
      create: async (input, options) => { state.created.push({ input, options }); return sessionFixture({ metadata: input.metadata }); },
    } },
    billingPortal: { sessions: { create: async input => { state.portalInput = input; return { url: `https://billing.stripe.com/p/session/fixture` }; } } },
  };
  const records = new Map([
    [`plans/${planId}`, { id: planId, number: 5, type: `Plan`, slug: `starter`, active: true, priceCents: 133, currency: `USD`, billingInterval: `month` }],
    [`users/${userId}`, { id: userId, active: true, firebase_uid: actor.firebaseUid, role: `Subscriber` }],
  ]);
  const database = { doc: key => ({ get: async () => ({ data: () => records.get(key) }) }) };
  const store = {
    ensureBillingAccount: async () => state.account,
    acquireBillingLock: async () => ({ token: `fixtureLock`, version: state.account.syncVersion, account: { ...state.account } }),
    releaseBillingLock: async () => { state.released++; },
    finishBillingSync: async (lock, next) => { state.finished.push(next); state.account = { ...state.account, ...next }; return state.account; },
    updateLockedAccount: async (lock, patch) => { state.account = { ...state.account, ...patch }; lock.account = { ...lock.account, ...patch }; },
    bindBillingCustomer: async () => { throw new Error(`Unexpected Customer Binding`); },
  };
  const config = { ...actualConfig, getBillingStripe: () => stripe, getBillingOrigin: () => `https://domaindatabases.com`, getStarterPriceId: () => price.id, getWebhookSecret: () => `whsec_fixture`, requireStarterPrice: async () => price, getPortalConfigurationId: () => `bpc_fixture` };
  const service = loadSource(`src/server/billing/service.ts`, { './types': types, './store': store, './config': config, './firebase': { getBillingDatabase: () => database } });
  return { state, service, store, stripe, records, config };
};

test(`Matching Paid Invoice Grants Only Through The Paid Subscription Period`, async () => {
  const fixture = createServiceFixture();
  fixture.state.invoices[0].lines.data[0].period.end += 100_000;
  const saved = await fixture.service.syncBillingAccount(fixture.state.account);
  assert.equal(saved.plan, `starter`);
  assert.equal(saved.accessUntil.toMillis(), (now + 86_400) * 1000);
  assert.equal(fixture.state.released, 1);
});
test(`Expanded Price And Invoice Data Are Accepted`, async () => {
  const fixture = createServiceFixture();
  fixture.state.invoices[0].lines.data[0].pricing.price_details.price = { id: price.id };
  assert.equal((await fixture.service.syncBillingAccount(fixture.state.account)).plan, `starter`);
});

const denials = [
  [`No Paid Invoice`, fixture => { fixture.state.invoices = []; }],
  [`Unpaid Invoice`, fixture => { fixture.state.invoices[0].status = `open`; }],
  [`Test Invoice`, fixture => { fixture.state.invoices[0].livemode = false; }],
  [`Expired Paid Period`, fixture => { fixture.state.invoices[0].lines.data[0].period.end = now - 1; }],
  [`Future Paid Period`, fixture => { fixture.state.invoices[0].lines.data[0].period.start = now + 60; }],
  [`Wrong Invoice Subscription`, fixture => { fixture.state.invoices[0].lines.data[0].parent.subscription_item_details.subscription = `sub_other`; }],
  [`Wrong Invoice Item`, fixture => { fixture.state.invoices[0].lines.data[0].parent.subscription_item_details.subscription_item = `si_other`; }],
  [`Wrong Invoice Price`, fixture => { fixture.state.invoices[0].lines.data[0].pricing.price_details.price = `price_other`; }],
  [`Wrong Subscription Price`, fixture => { fixture.state.subscriptions[0].items.data[0].price.id = `price_other`; }],
  [`Wrong Amount`, fixture => { fixture.state.subscriptions[0].items.data[0].price.unit_amount = 134; }],
  [`Wrong Quantity`, fixture => { fixture.state.subscriptions[0].items.data[0].quantity = 2; }],
  [`Wrong Currency`, fixture => { fixture.state.subscriptions[0].items.data[0].price.currency = `eur`; }],
  [`Wrong Interval`, fixture => { fixture.state.subscriptions[0].items.data[0].price.recurring.interval = `year`; }],
  [`Paused Collection`, fixture => { fixture.state.subscriptions[0].pause_collection = { behavior: `void` }; }],
  [`Manual Invoice Collection`, fixture => { fixture.state.subscriptions[0].collection_method = `send_invoice`; }],
  [`Past Due Subscription`, fixture => { fixture.state.subscriptions[0].status = `past_due`; }],
  [`Unpaid Subscription`, fixture => { fixture.state.subscriptions[0].status = `unpaid`; }],
  [`Paused Subscription`, fixture => { fixture.state.subscriptions[0].status = `paused`; }],
  [`Canceled Subscription`, fixture => { fixture.state.subscriptions[0].status = `canceled`; }],
  [`Wrong Account Metadata`, fixture => { fixture.state.subscriptions[0].metadata.app_user_id = `anotherUser`; }],
];
for (const [label, change] of denials) test(`${label} Does Not Grant Starter`, async () => {
  const fixture = createServiceFixture();
  change(fixture);
  const saved = await fixture.service.syncBillingAccount(fixture.state.account);
  assert.equal(saved.plan, `free`);
  assert.equal(saved.accessUntil, null);
});
test(`A Genuine Started Trial Is Bounded By Its Stripe End`, async () => {
  const fixture = createServiceFixture();
  Object.assign(fixture.state.subscriptions[0], { status: `trialing`, trial_start: now - 60, trial_end: now + 3600 });
  fixture.state.invoices = [];
  assert.equal((await fixture.service.syncBillingAccount(fixture.state.account)).accessUntil.toMillis(), (now + 3600) * 1000);
});
for (const [label, start, end] of [[`Future`, now + 60, now + 3600], [`Expired`, now - 3600, now - 60], [`Reversed`, now - 60, now - 3600]]) test(`${label} Trial Does Not Grant Starter`, async () => {
  const fixture = createServiceFixture();
  Object.assign(fixture.state.subscriptions[0], { status: `trialing`, trial_start: start, trial_end: end });
  fixture.state.invoices = [];
  assert.equal((await fixture.service.syncBillingAccount(fixture.state.account)).plan, `free`);
});
test(`Ambiguous Subscriptions Fail Closed And Release Their Lease`, async () => {
  const fixture = createServiceFixture();
  fixture.state.subscriptions.push({ ...subscriptionFixture(), id: `sub_duplicate` });
  await assert.rejects(fixture.service.syncBillingAccount(fixture.state.account), error => error.code === `billing_subscription_conflict`);
  assert.equal(fixture.state.finished.length, 0);
  assert.equal(fixture.state.released, 1);
});
test(`Provider Failure Does Not Commit An Entitlement`, async () => {
  const fixture = createServiceFixture();
  fixture.stripe.subscriptions.list = async () => { throw new Error(`Synthetic Provider Failure`); };
  await assert.rejects(fixture.service.syncBillingAccount(fixture.state.account));
  assert.equal(fixture.state.finished.length, 0);
  assert.equal(fixture.state.released, 1);
});

test(`Owner Checkout Does Not Create Billing Resources`, async () => {
  const fixture = createServiceFixture();
  await assert.rejects(fixture.service.createBillingCheckout({ ...actor, owner: true, role: `Owner` }, offer), error => error.code === `billing_owner_access`);
  assert.equal(fixture.state.subscriptionReads, 0);
  assert.equal(fixture.state.created.length, 0);
});
test(`Caller Price Changes Are Rejected Before Checkout`, async () => {
  const fixture = createServiceFixture();
  await assert.rejects(fixture.service.createBillingCheckout(actor, { ...offer, priceCents: 1 }), error => error.code === `billing_offer_invalid`);
  assert.equal(fixture.state.created.length, 0);
});
test(`Existing Subscription Prevents Duplicate Checkout`, async () => {
  const fixture = createServiceFixture();
  await assert.rejects(fixture.service.createBillingCheckout(actor, offer), error => error.code === `billing_subscription_exists`);
  assert.equal(fixture.state.created.length, 0);
});
test(`Uncertain 23–24 Hour Checkout Is Recovered Instead Of Duplicated`, async () => {
  const fixture = createServiceFixture();
  fixture.state.subscriptions = [];
  Object.assign(fixture.state.account, { checkoutAttemptId: `oldAttempt`, checkoutPlanId: planId, checkoutPriceId: price.id, checkoutCreatedAt: new Date(Date.now() - 23.5 * 3600_000).toISOString(), stripe_checkout_session_id: null });
  fixture.state.sessions = [sessionFixture({ metadata: { ...metadata, checkout_attempt_id: `oldAttempt` } })];
  const result = await fixture.service.createBillingCheckout(actor, offer);
  assert.equal(result.url, fixture.state.sessions[0].url);
  assert.equal(fixture.state.account.stripe_checkout_session_id, `cs_live_fixture`);
  assert.equal(fixture.state.created.length, 0);
});
test(`Uncertain Completed Checkout Waits For Its Own Subscription`, async () => {
  const fixture = createServiceFixture();
  fixture.state.subscriptions = [{ ...subscriptionFixture(), id: `sub_old`, status: `canceled` }];
  Object.assign(fixture.state.account, { checkoutAttemptId: `newAttempt`, checkoutPlanId: planId, checkoutPriceId: price.id, stripe_checkout_session_id: null });
  fixture.state.sessions = [sessionFixture({ status: `complete`, subscription: `sub_new`, metadata: { ...metadata, checkout_attempt_id: `newAttempt` } })];
  await assert.rejects(fixture.service.createBillingCheckout(actor, offer), error => error.code === `billing_confirmation_pending`);
  assert.equal(fixture.state.created.length, 0);
});
test(`A Network Failure Reuses The Persisted Checkout Idempotency Key`, async () => {
  const fixture = createServiceFixture();
  fixture.state.subscriptions = [];
  fixture.stripe.checkout.sessions.create = async (input, options) => {
    fixture.state.created.push({ input, options });
    if (fixture.state.created.length === 1) throw new Error(`Synthetic Lost Response`);
    return sessionFixture({ metadata: input.metadata });
  };
  await assert.rejects(fixture.service.createBillingCheckout(actor, offer));
  assert.equal(fixture.state.account.stripe_checkout_session_id, null);
  await fixture.service.createBillingCheckout(actor, offer);
  assert.equal(fixture.state.created[0].options.idempotencyKey, fixture.state.created[1].options.idempotencyKey);
  assert.deepEqual(fixture.state.created[0].input, fixture.state.created[1].input);
});
test(`Unbounded Checkout Recovery Fails Closed`, async () => {
  const fixture = createServiceFixture();
  fixture.state.subscriptions = [];
  fixture.state.account.checkoutAttemptId = `uncertain`;
  fixture.state.listHasMore = true;
  await assert.rejects(fixture.service.createBillingCheckout(actor, offer), error => error.code === `billing_session_conflict`);
  assert.equal(fixture.state.created.length, 0);
});
test(`New Subscription Appearing Before Checkout Lease Blocks Another Purchase`, async () => {
  const fixture = createServiceFixture();
  fixture.stripe.subscriptions.list = async () => ({ data: ++fixture.state.subscriptionReads === 1 ? [] : [subscriptionFixture()], has_more: false });
  await assert.rejects(fixture.service.createBillingCheckout(actor, offer), error => error.code === `billing_subscription_exists`);
  assert.equal(fixture.state.created.length, 0);
});
test(`Reconcile Rejects Another Account And Does Not Trust A Success URL`, async () => {
  const fixture = createServiceFixture();
  fixture.state.retrieved = sessionFixture({ client_reference_id: `anotherUser` });
  await assert.rejects(fixture.service.reconcileBillingCheckout(actor, `cs_live_fixture`), error => error.code === `billing_session_forbidden`);
  fixture.state.retrieved = sessionFixture({ status: `complete` });
  fixture.state.subscriptions = [];
  assert.equal((await fixture.service.reconcileBillingCheckout(actor, `cs_live_fixture`)).plan, `free`);
});
test(`Portal Uses Only The Bound Customer And Explicit Configuration`, async () => {
  const fixture = createServiceFixture();
  assert.equal((await fixture.service.createBillingPortal(actor)).url, `https://billing.stripe.com/p/session/fixture`);
  assert.deepEqual(fixture.state.portalInput, { customer: `cus_fixture`, configuration: `bpc_fixture`, return_url: `https://domaindatabases.com/subscription?plan=starter&billing=updated` });
});
test(`Hosted Redirects Reject Lookalike Hosts And Credentials`, () => {
  assert.equal(actualConfig.hostedStripeUrl(`https://checkout.stripe.com/c/pay/fixture`), `https://checkout.stripe.com/c/pay/fixture`);
  for (const value of [`http://checkout.stripe.com/c/pay/fixture`, `https://checkout.stripe.com.attacker.invalid/`, `https://checkout.stripe.com@attacker.invalid/`, `https://attacker@checkout.stripe.com/`]) assert.throws(() => actualConfig.hostedStripeUrl(value));
});

const memoryDatabase = records => {
  const documents = new Map(records);
  let queue = Promise.resolve();
  const snapshot = reference => ({ id: reference.id, exists: documents.has(reference.path), data: () => documents.get(reference.path) });
  const database = {
    documents,
    doc: value => ({ path: value, id: value.split(`/`).at(-1), get: async () => snapshot({ path: value, id: value.split(`/`).at(-1) }) }),
    runTransaction: operation => {
      const result = queue.then(async () => {
        const writes = [];
        const transaction = {
          get: async reference => snapshot(reference),
          getAll: async (...references) => references.map(snapshot),
          set: (reference, data, options) => writes.push(() => documents.set(reference.path, options?.merge ? { ...documents.get(reference.path), ...data } : { ...data })),
          create: (reference, data) => { assert.equal(documents.has(reference.path), false); writes.push(() => documents.set(reference.path, { ...data })); },
          update: (reference, data) => { assert.equal(documents.has(reference.path), true); writes.push(() => documents.set(reference.path, { ...documents.get(reference.path), ...data })); },
        };
        const value = await operation(transaction);
        writes.forEach(write => write());
        return value;
      });
      queue = result.catch(() => undefined);
      return result;
    },
  };
  return database;
};
const createStoreFixture = () => {
  const account = accountFixture();
  const database = memoryDatabase([
    [`billingAccounts/${accountId}`, account],
    [`billingUsers/${userId}`, { billingAccountId: accountId, plan: `free`, subscriptionStatus: null, accessUntil: null }],
    [`users/${userId}`, { id: userId, number: 1, active: true, firebase_uid: actor.firebaseUid, plan: `free` }],
    [`identities/${actor.firebaseUid}`, { id: userId, number: 1, firebase_uid: actor.firebaseUid }],
  ]);
  const store = loadSource(`src/server/billing/store.ts`, { './types': types, './firebase': { getBillingDatabase: () => database } });
  return { store, database };
};
test(`Only One Account Lease Can Be Acquired And Stale Owners Cannot Commit`, async () => {
  const { store, database } = createStoreFixture();
  const first = await store.acquireBillingLock(accountId);
  await assert.rejects(store.acquireBillingLock(accountId), error => error.code === `billing_sync_pending`);
  const saved = database.documents.get(`billingAccounts/${accountId}`);
  saved.lockUntil = Timestamp.fromMillis(Date.now() - 1);
  const second = await store.acquireBillingLock(accountId);
  await store.releaseBillingLock(first);
  assert.equal(database.documents.get(`billingAccounts/${accountId}`).lockToken, second.token);
  await assert.rejects(store.finishBillingSync(first, { plan: `free`, accessUntil: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, subscriptionStatus: null }), error => error.code === `billing_sync_pending`);
});
test(`Entitlement Writes Advance The Version And Mirror Atomically`, async () => {
  const { store, database } = createStoreFixture();
  const lock = await store.acquireBillingLock(accountId);
  const expiry = Timestamp.fromMillis((now + 3600) * 1000);
  await store.finishBillingSync(lock, { plan: `starter`, accessUntil: expiry, currentPeriodEnd: now + 3600, cancelAtPeriodEnd: false, subscriptionStatus: `active`, stripe_subscription_id: `sub_fixture` });
  assert.equal(database.documents.get(`users/${userId}`).plan, `starter`);
  assert.equal(database.documents.get(`billingAccounts/${accountId}`).syncVersion, 1);
  assert.deepEqual(Object.keys(database.documents.get(`billingUsers/${userId}`)).sort(), [`accessUntil`, `billingAccountId`, `plan`, `subscriptionStatus`]);
  assert.equal(database.documents.get(`billingUsers/${userId}`).accessUntil.toMillis(), expiry.toMillis());
  assert.equal(database.documents.get(`billingAccounts/${accountId}`).lockToken, null);
});
test(`Duplicate Events Are Deduplicated And Failed Processing Can Retry`, async () => {
  const { store } = createStoreFixture();
  const token = await store.beginBillingEvent(`evt_fixture`, `invoice.paid`);
  await assert.rejects(store.beginBillingEvent(`evt_fixture`, `invoice.paid`), error => error.code === `billing_event_pending`);
  await store.finishBillingEvent(`evt_fixture`, token, false);
  const retry = await store.beginBillingEvent(`evt_fixture`, `invoice.paid`);
  assert.notEqual(token, retry);
  await store.finishBillingEvent(`evt_fixture`, token, true);
  await assert.rejects(store.beginBillingEvent(`evt_fixture`, `invoice.paid`), error => error.code === `billing_event_pending`);
  await store.finishBillingEvent(`evt_fixture`, retry, true);
  assert.equal(await store.beginBillingEvent(`evt_fixture`, `invoice.paid`), null);
});

const createWebhookFixture = () => {
  const { store, database } = createStoreFixture();
  const state = { synced: 0, fail: false };
  const stripe = new Stripe(`sk_test_synthetic_unused`);
  const config = { getBillingStripe: () => stripe, getWebhookSecret: () => `whsec_synthetic_fixture`, getBillingOrigin: () => `https://domaindatabases.com` };
  const http = loadSource(`src/server/billing/http.ts`, {
    './types': types,
    './config': config,
    './firebase': { requireBillingActor: async () => actor },
    './store': { ...store, getCustomerBillingAccount: async () => accountFixture() },
    './service': { syncBillingAccount: async () => { state.synced++; if (state.fail) throw new Error(`Synthetic Sync Failure`); } },
  });
  const payload = (id = `evt_webhook`, live = true) => JSON.stringify({ id, object: `event`, type: `invoice.paid`, livemode: live, data: { object: { customer: `cus_fixture` } } }, null, 2);
  const request = (body, signedBody = body) => new Request(`https://domaindatabases.com/api/billing/webhook`, { method: `POST`, body, headers: { 'content-type': `application/json`, 'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload: signedBody, secret: `whsec_synthetic_fixture` }) } });
  return { state, http, database, payload, request };
};
test(`Raw Signed Webhook Bytes Verify And Duplicate Delivery Does Not Resync`, async () => {
  const fixture = createWebhookFixture();
  const body = fixture.payload();
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(body))).status, 200);
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(body))).status, 200);
  assert.equal(fixture.state.synced, 1);
});
test(`Reformatted Or Tampered Webhook Bytes Fail Signature Verification`, async () => {
  const fixture = createWebhookFixture();
  const body = fixture.payload();
  const reformatted = JSON.stringify(JSON.parse(body));
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(reformatted, body))).status, 400);
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(body.replace(`invoice.paid`, `invoice.voided`), body))).status, 400);
  assert.equal(fixture.state.synced, 0);
});
test(`Test-Mode Webhooks Cannot Grant Live Entitlements`, async () => {
  const fixture = createWebhookFixture();
  const response = await fixture.http.handleBillingWebhook(fixture.request(fixture.payload(`evt_testmode`, false)));
  assert.equal(response.status, 400);
  assert.equal(fixture.state.synced, 0);
});
test(`A Failed Webhook Sync Is Retryable And Marked Processed Only After Success`, async () => {
  const fixture = createWebhookFixture();
  fixture.state.fail = true;
  const body = fixture.payload(`evt_retry`);
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(body))).status, 503);
  assert.equal(fixture.database.documents.get(`billingEvents/evt_retry`).status, `pending`);
  fixture.state.fail = false;
  assert.equal((await fixture.http.handleBillingWebhook(fixture.request(body))).status, 200);
  assert.equal(fixture.database.documents.get(`billingEvents/evt_retry`).status, `processed`);
});
