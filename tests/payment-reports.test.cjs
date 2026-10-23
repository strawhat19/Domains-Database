const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const crypto = require('node:crypto');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

global.fetch = async () => { throw new Error(`Provider Network Access Is Forbidden In Payment Report Tests`); };
const root = path.resolve(__dirname, `..`);
const load = (relative, stubs = {}) => {
  const filename = path.resolve(root, relative);
  const source = ts.transpileModule(fs.readFileSync(filename, `utf8`), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = name => Object.hasOwn(stubs, name) ? stubs[name] : name === `expo-crypto` ? { randomUUID: crypto.randomUUID } : name.startsWith(`.`) ? load(`${path.resolve(path.dirname(filename), name)}.ts`, stubs) : Module.createRequire(filename)(name);
  loaded._compile(source, filename);
  return loaded.exports;
};
const types = load(`src/server/billing/types.ts`);
const range = load(`src/server/billingReports/range.ts`);
const now = Math.floor(Date.now() / 1000);
const day = 86_400;
const account = (number = 1) => ({ id: `BillingAccount_${number}_Fixture_1_00_PM_10_23_26_account${number}`, number, userId: `User_${number}_Fixture_1_00_PM_10_23_26_user${number}`, firebase_uid: `fixture${number}`, stripe_customer_id: `cus_fixture${number}` });
const owner = { id: account().userId, userId: account().userId, firebaseUid: `fixture1`, role: `Owner`, owner: true, active: true, name: `Fixture`, email: `fixture@example.invalid` };
const subscription = (value = account()) => ({ id: `sub_fixture${value.number}`, livemode: true, status: `active`, customer: value.stripe_customer_id, created: now - 3 * day, ended_at: null, cancel_at: null, cancel_at_period_end: false, metadata: { plan_slug: `starter`, billing_account_id: value.id, app_user_id: value.userId }, items: { has_more: false, data: [{ quantity: 1, price: { id: `price_fixture`, unit_amount: 133, currency: `usd`, recurring: { interval: `month`, interval_count: 1 } } }] } });
const invoice = () => ({ id: `in_fixture`, livemode: true, status: `paid`, customer: account().stripe_customer_id, customer_email: `private@example.invalid`, hosted_invoice_url: `https://invoice.example.invalid/private`, currency: `usd`, amount_paid: 133, created: now - 120 * day, status_transitions: { paid_at: now - day }, parent: { subscription_details: { subscription: subscription().id } }, lines: { has_more: false, data: [{ currency: `usd`, pricing: { price_details: { price: `price_fixture` } }, parent: { subscription_item_details: { subscription: subscription().id } } }] } });
const fixture = () => {
  const state = { accounts: [account()], subscriptions: [subscription()], invoices: [invoice()], subscriptionPages: null, invoicePages: null, subscriptionFailure: null, invoiceFailure: null, bindingFailure: false, accountFailure: false, reads: 0, calls: [] };
  const database = {
    collection: () => ({ select: () => ({ limit: limit => ({ get: async () => { state.reads++; if (state.accountFailure) throw new Error(`Private Database Failure`); const records = state.accounts.slice(0, limit); return { size: records.length, docs: records.map(value => ({ id: value.id, data: () => ({ ...value }) })) }; } }) }) }),
    doc: name => ({ path: name }),
    getAll: async (...references) => references.filter(reference => reference?.path).map(reference => ({ data: () => ({ billingAccountId: state.bindingFailure ? `invalid` : state.accounts.find(value => [`billingCustomers/${value.stripe_customer_id}`, `billingUsers/${value.userId}`].includes(reference.path))?.id }) })),
  };
  const request = (kind, parameters, options) => {
    state.calls.push({ kind, parameters, options });
    const failure = kind === `subscriptions` ? state.subscriptionFailure : state.invoiceFailure;
    if (failure) throw failure;
    const pages = kind === `subscriptions` ? state.subscriptionPages : state.invoicePages;
    const values = kind === `subscriptions` ? state.subscriptions : state.invoices;
    if (!pages) return Promise.resolve({ data: values.filter(value => value.customer === parameters.customer), has_more: false });
    const previous = parameters.starting_after;
    const index = previous ? pages.findIndex(page => page.data.at(-1)?.id === previous) + 1 : 0;
    return Promise.resolve(pages[index] ?? { data: [], has_more: false });
  };
  const stripe = { subscriptions: { list: (parameters, options) => request(`subscriptions`, parameters, options) }, invoices: { list: (parameters, options) => request(`invoices`, parameters, options) } };
  const service = load(`src/server/billingReports/service.ts`, { '../billing/types': types, '../billing/firebase': { getBillingDatabase: () => database }, '../billing/config': { getBillingStripe: () => stripe, getStarterPriceId: () => `price_fixture` } });
  return { state, service, report: (days = 7, actor = owner) => service.getPaymentReport(actor, days) };
};

test(`Paid Invoices Use Actual Paid Time And Expose Only Aggregate Fields`, async () => {
  const value = fixture();
  const report = await value.report();
  assert.equal(report.summary.paidInvoiceAmountCents, 133);
  assert.equal(report.summary.paidInvoiceCount, 1);
  assert.equal(report.summary.activeSubscriptions, 1);
  assert.equal(report.summary.monthlyPlanValueCents, 133);
  assert.equal(report.availability, `available`);
  assert.equal(report.trend.length, 7);
  assert.match(report.definitions.paidInvoiceAmount, /Not Cash Received Or Net Revenue/);
  const json = JSON.stringify(report);
  for (const privateValue of [`private@example.invalid`, `invoice.example.invalid`, `cus_fixture1`, `sub_fixture1`, account().id, account().userId, `price_fixture`]) assert.ok(!json.includes(privateValue));
  assert.ok(value.state.calls.every(call => call.parameters.customer === `cus_fixture1` && !call.parameters.created && call.options.maxNetworkRetries === 0 && call.options.timeout <= 4000));
});
test(`Authentication And Active Owner Role Are Required Before Reads Or Cached Reports`, async () => {
  const value = fixture();
  for (const actor of [{ ...owner, active: false }, { ...owner, owner: false }, { ...owner, role: `Admin` }]) await assert.rejects(value.report(7, actor), failure => failure.status === 403);
  assert.equal(value.state.calls.length, 0);
  assert.equal(value.state.reads, 0);
  await value.report();
  const reads = value.state.reads;
  await assert.rejects(value.report(7, { ...owner, role: `Developer` }), failure => failure.status === 403);
  assert.equal(value.state.reads, reads);
});
test(`Paid Amount Excludes Outside-Range Payment Dates And Includes Real Zero And Out-Of-Band Settlements`, async () => {
  const value = fixture();
  value.state.invoices = [{ ...invoice(), id: `in_old`, status_transitions: { paid_at: now - 20 * day } }, { ...invoice(), id: `in_zero`, amount_paid: 0 }, { ...invoice(), id: `in_external`, amount_paid: 233, paid_out_of_band: true }];
  const report = await value.report();
  assert.equal(report.summary.paidInvoiceCount, 2);
  assert.equal(report.summary.paidInvoiceAmountCents, 233);
});
for (const [label, patch] of [
  [`Missing Paid Time`, value => { value.status_transitions.paid_at = null; }],
  [`Incomplete Lines`, value => { value.lines.has_more = true; }],
  [`Mixed Price Lines`, value => { value.lines.data.push({ ...value.lines.data[0], pricing: { price_details: { price: `price_other` } } }); }],
  [`Foreign Currency`, value => { value.currency = `eur`; }],
]) test(`${label} Preserves Null Paid Totals And Buckets`, async () => {
  const value = fixture();
  patch(value.state.invoices[0]);
  const report = await value.report();
  assert.equal(report.summary.paidInvoiceAmountCents, null);
  assert.equal(report.summary.paidInvoiceCount, null);
  assert.ok(report.trend.every(point => point.paidInvoiceAmountCents === null && point.paidInvoices === null));
  assert.notEqual(report.coverage.invoices.state, `complete`);
  assert.equal(report.summary.activeSubscriptions, 1);
});
test(`Other-App Subscription Metadata And Unrelated Invoices Are Excluded`, async () => {
  const value = fixture();
  value.state.subscriptions[0].metadata.app_user_id = `another-app-user`;
  const report = await value.report();
  assert.equal(report.summary.activeSubscriptions, 0);
  assert.equal(report.summary.paidInvoiceCount, 0);
  assert.equal(value.state.calls.filter(call => call.kind === `invoices`).length, 0);
});
test(`Unsupported Bound Starter Price Never Becomes An Exact Zero`, async () => {
  const value = fixture();
  value.state.subscriptions[0].items.data[0].price.id = `price_other`;
  const report = await value.report();
  assert.equal(report.summary.activeSubscriptions, null);
  assert.equal(report.summary.paidInvoiceCount, null);
});
for (const label of [`Reverse Binding`, `Invalid Account Number`, `Account Scan Limit`]) test(`${label} Prevents Provider Reads And Exact Totals`, async () => {
  const value = fixture();
  if (label === `Reverse Binding`) value.state.bindingFailure = true;
  if (label === `Invalid Account Number`) value.state.accounts[0] = { ...account(), id: `invalid`, number: 0 };
  if (label === `Account Scan Limit`) value.state.accounts = Array.from({ length: 101 }, (_, index) => account(index + 1));
  const report = await value.report();
  assert.equal(value.state.calls.length, 0);
  assert.equal(report.summary.activeSubscriptions, null);
  assert.equal(report.summary.paidInvoiceCount, null);
  assert.notEqual(report.coverage.accounts.state, `complete`);
});
test(`Provider Permission Errors Are Sanitized And Do Not Fabricate Paid Zeros`, async () => {
  const value = fixture();
  value.state.invoiceFailure = Object.assign(new Error(`Do Not Expose cus_private Customer Details`), { statusCode: 403 });
  const report = await value.report();
  assert.equal(report.summary.paidInvoiceCount, null);
  assert.equal(report.summary.activeSubscriptions, 1);
  assert.ok(report.warnings.some(message => message.includes(`Restricted Key Permissions`)));
  assert.ok(!JSON.stringify(report).includes(`cus_private`));
});
test(`History Page Limit Nulls Subscription And Invoice Coverage`, async () => {
  const value = fixture();
  value.state.subscriptionPages = Array.from({ length: 3 }, (_, index) => ({ data: [{ ...subscription(), id: `sub_page${index}` }], has_more: true }));
  const report = await value.report();
  assert.equal(report.summary.activeSubscriptions, null);
  assert.equal(report.summary.paidInvoiceCount, null);
  assert.equal(value.state.calls.length, 3);
});
test(`Request Budget Bounds A Growing App And Does Not Produce Full Zero Totals`, async () => {
  const value = fixture();
  value.state.accounts = Array.from({ length: 60 }, (_, index) => account(index + 1));
  value.state.subscriptions = [];
  const report = await value.report();
  assert.ok(value.state.calls.length <= 36);
  assert.equal(report.summary.activeSubscriptions, null);
  assert.equal(report.summary.paidInvoiceCount, null);
});
test(`Current Status Snapshot Is Independent Of Selected Lifecycle Window And Cache Is Reused`, async () => {
  const value = fixture();
  value.state.subscriptions = [{ ...subscription(), created: now - 50 * day, cancel_at_period_end: true }, { ...subscription(), id: `sub_ended`, status: `canceled`, created: now - 70 * day, canceled_at: now - 50 * day, ended_at: now - 2 * day }];
  const short = await value.report(7);
  const requests = value.state.calls.length;
  const long = await value.report(90);
  assert.equal(value.state.calls.length, requests);
  assert.equal(short.summary.activeSubscriptions, long.summary.activeSubscriptions);
  assert.equal(short.summary.scheduledCancellations, 1);
  assert.equal(short.summary.newSubscriptions, 0);
  assert.equal(long.summary.newSubscriptions, 2);
  assert.equal(short.summary.endedSubscriptions, 1);
  assert.equal(short.range.timeZone, `UTC`);
});
test(`Empty Verified Bindings Disclose That Stripe Read Access Has Not Been Exercised`, async () => {
  const value = fixture();
  value.state.accounts = [];
  const report = await value.report();
  assert.equal(report.summary.activeSubscriptions, 0);
  assert.equal(report.summary.paidInvoiceCount, 0);
  assert.ok(report.warnings.some(message => message.includes(`No Linked Billing Subscriptions`)));
  assert.equal(value.state.calls.length, 0);
});
test(`Valid Lifecycle And Paid Events After The Fixed Cutoff Do Not Invalidate The Current Snapshot`, async () => {
  const value = fixture();
  const afterCutoff = Math.floor(Date.now() / 1000) + 60;
  value.state.subscriptions = [{ ...subscription(), created: afterCutoff }, { ...subscription(), id: `sub_ended_later`, status: `canceled`, created: now - 20 * day, ended_at: afterCutoff }];
  value.state.invoices[0].status_transitions.paid_at = afterCutoff;
  const report = await value.report();
  assert.equal(report.availability, `available`);
  assert.equal(report.summary.activeSubscriptions, 1);
  assert.equal(report.summary.newSubscriptions, 0);
  assert.equal(report.summary.endedSubscriptions, 0);
  assert.equal(report.summary.paidInvoiceCount, 0);
  assert.equal(report.summary.paidInvoiceAmountCents, 0);
});
test(`Safe Integer Range Totals Preserve Unavailable Rather Than Rounding`, () => {
  const points = range.createPaymentTrend(Date.now());
  points.at(-1).paidInvoiceAmountCents = Number.MAX_SAFE_INTEGER;
  points.at(-2).paidInvoiceAmountCents = 1;
  const report = range.selectPaymentRange({ trend: points, fetchedAt: new Date().toISOString(), range: range.createPaymentRange(90, Date.now()), cache: { ageSeconds: 0, ttlSeconds: 45 }, summary: {} }, 7);
  assert.equal(report.summary.paidInvoiceAmountCents, null);
});
test(`HTTP Rejects Invalid Identity And Filters Before Provider Access With Private Responses`, async () => {
  let actor = owner;
  let requests = 0;
  const http = load(`src/server/billingReports/http.ts`, { '../billing/types': types, '../billing/firebase': { requireBillingActor: async () => { if (!actor) throw new types.BillingError(401, `billing_sign_in_required`, `Sign In`); return actor; } }, './service': { getPaymentReport: async () => { requests++; return {}; } } });
  for (const query of [`?days=8`, `?days=7&days=30`, `?price=price_foreign`, `?account=acct_foreign`]) {
    const response = await http.handlePaymentReport(new Request(`https://domaindatabases.com/api/admin/payments${query}`));
    assert.equal(response.status, 400);
    assert.match(response.headers.get(`cache-control`), /private.*no-store/);
    assert.equal(response.headers.get(`vary`), `Authorization`);
  }
  actor = null;
  assert.equal((await http.handlePaymentReport(new Request(`https://domaindatabases.com/api/admin/payments`))).status, 401);
  actor = { ...owner, role: `Developer` };
  assert.equal((await http.handlePaymentReport(new Request(`https://domaindatabases.com/api/admin/payments`))).status, 403);
  assert.equal(requests, 0);
});
