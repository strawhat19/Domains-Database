const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

global.fetch = async () => { throw new Error(`Provider Network Access Is Forbidden In Payment Client Tests`); };
const root = path.resolve(__dirname, `..`);
const load = (relative, stubs) => {
  const filename = path.resolve(root, relative);
  const source = ts.transpileModule(fs.readFileSync(filename, `utf8`), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = name => Object.hasOwn(stubs, name) ? stubs[name] : name.startsWith(`.`) ? load(`${path.resolve(path.dirname(filename), name)}.ts`, stubs) : (() => { throw new Error(`Unexpected Payment Client Dependency: ${name}`); })();
  loaded._compile(source, filename);
  return loaded.exports;
};
const actor = { userId: `User_1_Fixture`, firebaseUid: `fixture1` };
const report = () => ({
  mode: `live`, source: `stripe`, currency: `usd`, dataset: `starter_subscriptions`, unitAmountCents: 133, availability: `available`, warnings: [],
  fetchedAt: `2026-10-23T12:00:00.000Z`, subscriptionSnapshotAt: `2026-10-23T12:00:00.000Z`, cache: { ageSeconds: 0, ttlSeconds: 45 },
  range: { days: 7, timeZone: `UTC`, start: `2026-10-17T00:00:00.000Z`, end: `2026-10-23T12:00:00.000Z`, includesPartialCurrentDay: true },
  summary: { newSubscriptions: 1, paidInvoiceCount: 1, endedSubscriptions: 0, activeSubscriptions: 1, pastDueSubscriptions: 0, trialingSubscriptions: 0, scheduledCancellations: 0, monthlyPlanValueCents: 133, paidInvoiceAmountCents: 133 },
  trend: Array.from({ length: 7 }, (_, index) => ({ date: `2026-10-${17 + index}`, paidInvoices: index === 6 ? 1 : 0, paidInvoiceAmountCents: index === 6 ? 133 : 0, newSubscriptions: index === 6 ? 1 : 0, endedSubscriptions: 0 })),
  statuses: [`active`, `paused`, `unpaid`, `trialing`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`].map(status => ({ status, count: status === `active` ? 1 : 0 })),
  coverage: Object.fromEntries([`accounts`, `invoices`, `lifecycle`, `subscriptions`].map(key => [key, { state: `complete`, scanned: 1, limit: 1000 }])),
  definitions: { paidInvoiceAmount: `Paid Invoice Amount, Not Net Revenue`, subscriptionSnapshot: `Current Statuses`, monthlyPlanValue: `Active Base Price, Not MRR` },
});
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const fixture = () => {
  const state = { calls: [], tokenReads: 0, sessionReads: 0, os: `web`, data: report(), response: null };
  const auth = { currentUser: { uid: actor.firebaseUid, isAnonymous: false, getIdToken: async () => { state.tokenReads++; return `fixture_token`; } } };
  state.account = { id: actor.userId, firebase_uid: actor.firebaseUid, role: `Owner`, active: true, anonymous: false };
  global.fetch = async (url, options) => {
    assert.ok([`/api/admin/payments?days=7`, `https://domaindatabases.com/api/admin/payments?days=7`].includes(url), `External Requests Are Forbidden`);
    state.calls.push({ url, options });
    return state.response ?? { ok: true, status: 200, json: async () => state.data };
  };
  const client = load(`src/shared/payments/client.ts`, {
    'react-native': { Platform: { get OS() { return state.os; } } },
    '../config': { useLocalStorage: false },
    '../firebase/config': { firebaseEnabled: true },
    '../firebase/client': { getFirebaseAuth: () => auth },
    '../authentication/service': { restoreSession: async () => { state.sessionReads++; return { user: state.account }; } },
  });
  return { auth, state, client, request: signal => client.getPaymentReport(actor, 7, signal) };
};

test(`An Active Owner Sends A Private Authenticated Request And Keeps Only Safe Aggregate Fields`, async () => {
  const value = fixture();
  const privateValue = `private@example.invalid`;
  value.state.data.customer_email = privateValue;
  value.state.data.invoices = [{ hosted_invoice_url: privateValue }];
  for (const object of [value.state.data.summary, value.state.data.cache, value.state.data.range, value.state.data.definitions, value.state.data.trend[0], value.state.data.statuses[0], value.state.data.coverage.accounts]) object.private_customer = privateValue;
  value.state.data.coverage.customer_private = { state: `complete`, scanned: 1, limit: 1, email: privateValue };
  const result = await value.request();
  assert.equal(value.state.calls.length, 1);
  assert.equal(value.state.tokenReads, 1);
  const { url, options } = value.state.calls[0];
  assert.equal(url, `/api/admin/payments?days=7`);
  assert.equal(options.method, `GET`);
  assert.equal(options.cache, `no-store`);
  assert.equal(options.credentials, `omit`);
  assert.equal(options.headers.Authorization, `Bearer fixture_token`);
  assert.equal(options.headers.Accept, `application/json`);
  assert.equal(result.summary.paidInvoiceAmountCents, 133);
  assert.ok(!JSON.stringify(result).includes(privateValue));
  assert.equal(Object.keys(result.coverage).length, 4);
});
test(`Inactive, Non-Owner And Mismatched App Accounts Cannot Fetch Reports`, async () => {
  for (const patch of [{ active: false }, { role: `Subscriber` }, { role: `Admin` }, { anonymous: true }, { id: `User_2_Other` }, { firebase_uid: `other` }]) {
    const value = fixture();
    Object.assign(value.state.account, patch);
    await assert.rejects(value.request(), failure => failure.code === `payments_forbidden`);
    assert.equal(value.state.calls.length, 0);
    assert.equal(value.state.tokenReads, 0);
  }
});
test(`Missing, Anonymous Or Different Firebase Identities Are Rejected Before Session Or Fetch`, async () => {
  for (const identity of [null, { uid: `other`, isAnonymous: false }, { uid: actor.firebaseUid, isAnonymous: true }]) {
    const value = fixture();
    value.auth.currentUser = identity;
    await assert.rejects(value.request(), failure => failure.code === `payments_session_changed`);
    assert.equal(value.state.calls.length, 0);
    assert.equal(value.state.sessionReads, 0);
  }
});
test(`A Firebase Account Change During The Async Response Suppresses The Old Report`, async () => {
  const value = fixture();
  const started = deferred();
  const body = deferred();
  value.state.response = { ok: true, status: 200, json: () => { started.resolve(); return body.promise; } };
  const pending = value.request();
  await started.promise;
  value.auth.currentUser = { uid: `other`, isAnonymous: false };
  body.resolve(report());
  await assert.rejects(pending, failure => failure.code === `payments_session_changed`);
  assert.equal(value.state.calls.length, 1);
});
test(`Unavailable Metrics Keep Null Values And Missing Days Without Becoming Zero`, async () => {
  const value = fixture();
  value.state.data.availability = `partial`;
  value.state.data.summary.paidInvoiceAmountCents = null;
  value.state.data.summary.paidInvoiceCount = null;
  value.state.data.trend.forEach(point => { point.paidInvoices = null; point.paidInvoiceAmountCents = null; });
  value.state.data.coverage.invoices.state = `partial`;
  const result = await value.request();
  assert.equal(result.summary.paidInvoiceAmountCents, null);
  assert.equal(result.summary.endedSubscriptions, 0);
  assert.equal(result.trend.length, 7);
  assert.ok(result.trend.every(point => point.paidInvoices === null && point.paidInvoiceAmountCents === null));
});
test(`Malformed Metrics, Duplicate Dates, Duplicate Statuses And Foreign Currency Are Rejected`, async () => {
  for (const patch of [
    data => { data.summary.paidInvoiceAmountCents = undefined; },
    data => { data.summary.paidInvoiceAmountCents = -1; },
    data => { data.summary.paidInvoiceAmountCents = `133`; },
    data => { data.trend[0].paidInvoices = NaN; },
    data => { data.trend[0].date = data.trend[1].date; },
    data => { data.statuses[0].status = data.statuses[1].status; },
    data => { data.currency = `eur`; },
    data => { data.coverage.invoices = null; },
  ]) {
    const value = fixture();
    patch(value.state.data);
    await assert.rejects(value.request(), failure => failure.code === `payments_invalid_response`);
  }
});
test(`A Pre-Aborted Request Cannot Restore Session, Read A Token Or Fetch`, async () => {
  const value = fixture();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(value.request(controller.signal), failure => failure.code === `payments_cancelled`);
  assert.equal(value.state.calls.length, 0);
  assert.equal(value.state.tokenReads, 0);
  assert.equal(value.state.sessionReads, 0);
});
test(`Native Reports Use The Fixed Canonical Server And Provider Errors Keep Safe Copy`, async () => {
  const value = fixture();
  value.state.os = `ios`;
  await value.request();
  assert.equal(value.state.calls[0].url, `https://domaindatabases.com/api/admin/payments?days=7`);
  value.state.response = { ok: false, status: 403, json: async () => ({ error: `private@example.invalid`, customer: `cus_private` }) };
  await assert.rejects(value.request(), failure => failure.code === `payments_forbidden` && !failure.message.includes(`private`));
});
