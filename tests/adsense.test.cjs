const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const crypto = require('node:crypto');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

global.fetch = async () => { throw new Error(`External Requests Are Forbidden In Advertising Tests`); };
const root = path.resolve(__dirname, `..`);
const load = (relative, stubs = {}) => {
  const filename = path.resolve(root, relative);
  const source = ts.transpileModule(fs.readFileSync(filename, `utf8`), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = name => Object.hasOwn(stubs, name) ? stubs[name] : name.startsWith(`.`) ? load(`${path.resolve(path.dirname(filename), name)}.ts`, stubs) : (() => { throw new Error(`Unexpected Advertising Dependency: ${name}`); })();
  loaded._compile(source, filename);
  return loaded.exports;
};
const policy = load(`src/shared/adsense/policy.ts`);
const { routes } = load(`src/shared/routes.ts`);
const { blogArticles } = load(`src/shared/blog/articles.ts`);
class FakeTimestamp {
  constructor(value) { this.value = value; }
  toMillis() { return this.value; }
}
const noDatabase = () => { throw new Error(`Database Access Is Forbidden In Advertising Tests`); };
const billing = load(`src/shared/planAccess/billing.ts`, {
  'expo-crypto': { randomUUID: crypto.randomUUID },
  'firebase/firestore': { Timestamp: FakeTimestamp, doc: noDatabase, getDocFromServer: noDatabase },
  '../firebase/client': { getFirebaseDb: noDatabase, getFirebaseAuth: noDatabase },
});
const eligible = () => ({
  paid: false, owner: false, pathname: `/`, authBusy: false, authReady: true,
  adsEnabled: true, authErrorFree: true, featuresReady: true, billingLoading: false,
  featuresLoading: false, connectedFirebase: true, identityConfirmed: true,
  billingErrorFree: true, featuresErrorFree: true, canonicalHttpsOrigin: true,
  publisherConfigured: true, billingConfirmedFree: true,
});
const free = () => ({ plan: `free`, accessUntil: null, subscriptionStatus: null });

test(`Only Actual Editorial Routes And Known First-Party Articles Are Advertising Candidates`, () => {
  const editorial = new Set([`/`, `/about`, `/blog`]);
  assert.ok(blogArticles.length > 0);
  for (const route of Object.values(routes)) {
    assert.equal(policy.isAdSenseEditorialPath(route.href), editorial.has(route.href), route.href);
    if (`redirects` in route) for (const alias of route.redirects) assert.equal(policy.isAdSenseEditorialPath(`/${alias}`), editorial.has(`/${alias}`), alias);
  }
  for (const article of blogArticles) {
    assert.equal(policy.isAdSenseEditorialPath(`/blog/${article.slug}`), true, article.slug);
    assert.equal(policy.canLoadAdSense({ ...eligible(), pathname: `/blog/${article.slug}/` }), true, article.slug);
  }
  for (const pathname of [`/blog/not-a-real-article`, `/blog/resources`, `/blog/videos`, `/blog/reddit`, `/blog/history/not-found`, `/about/team`, `/api/billing/status`, `/404`]) assert.equal(policy.canLoadAdSense({ ...eligible(), pathname }), false, pathname);
  assert.equal(policy.isAdSenseEditorialPath(`/blog/${blogArticles[0].slug}`, []), false);
});
test(`Query, Hash, Encoded, Absolute And Malformed Paths Cannot Become Editorial Placements`, () => {
  for (const pathname of [``, `//`, `//about`, `/about//`, `/blog?view=resources`, `/about?token=private`, `/#private`, `/blog#resources`, `/About`, `/blog/%64omain-vs-hosting-vs-website`, `https://example.invalid/about`, null, undefined]) assert.equal(policy.canLoadAdSense({ ...eligible(), pathname }), false, String(pathname));
});
test(`Every Positive Eligibility Guard Must Be Explicitly Confirmed`, () => {
  assert.equal(policy.canLoadAdSense(eligible()), true);
  for (const key of [`authReady`, `adsEnabled`, `featuresReady`, `authErrorFree`, `connectedFirebase`, `billingErrorFree`, `identityConfirmed`, `featuresErrorFree`, `publisherConfigured`, `canonicalHttpsOrigin`, `billingConfirmedFree`]) {
    for (const value of [false, undefined, null, 1, `true`]) assert.equal(policy.canLoadAdSense({ ...eligible(), [key]: value }), false, `${key}: ${String(value)}`);
  }
  assert.equal(policy.canLoadAdSense(null), false);
});
test(`Paid, Owner, Busy And Loading States Always Suppress Advertising`, () => {
  for (const key of [`paid`, `owner`, `authBusy`, `billingLoading`, `featuresLoading`]) {
    for (const value of [true, undefined, null, 0, `false`]) assert.equal(policy.canLoadAdSense({ ...eligible(), [key]: value }), false, `${key}: ${String(value)}`);
  }
});
test(`Only Explicit Free Or Terminal Billing Mirrors Can Confirm Advertising Eligibility`, () => {
  for (const subscriptionStatus of [null, `canceled`, `incomplete_expired`]) {
    const value = { ...free(), subscriptionStatus };
    assert.equal(billing.isConfirmedFreeBilling(value), true);
    assert.equal(policy.canLoadAdSense({ ...eligible(), billingConfirmedFree: billing.isConfirmedFreeBilling(value) }), true);
  }
  assert.equal(billing.isConfirmedFreeBilling({ ...free(), billingAccountId: `BillingAccount_1_Fixture_1_00_PM_10_23_26_fixture1` }), true);
});
test(`Pending, Continuing, Paid And Malformed Mirrors Never Confirm Free Advertising`, () => {
  const values = [undefined, null, [], {}, { plan: `free` }, { ...free(), plan: `unknown` }, { ...free(), plan: `starter` },
    { ...free(), accessUntil: 0 }, { ...free(), accessUntil: new FakeTimestamp(1) }, { ...free(), subscriptionStatus: `` },
    { ...free(), billingAccountId: `invalid` }, { ...free(), unexpected: true }, { ...free(), accessUntil: undefined },
    ...[`active`, `trialing`, `incomplete`, `past_due`, `unpaid`, `paused`].map(subscriptionStatus => ({ ...free(), subscriptionStatus })),
    { plan: `starter`, subscriptionStatus: `active`, accessUntil: new FakeTimestamp(Date.now() + 60_000) }];
  for (const value of values) {
    assert.equal(billing.isConfirmedFreeBilling(value), false);
    assert.equal(policy.canLoadAdSense({ ...eligible(), billingConfirmedFree: billing.isConfirmedFreeBilling(value) }), false);
  }
});
test(`Legacy Paid-Access Normalization Cannot Be Used As Positive Free-Ad Evidence`, () => {
  const malformed = { plan: `unrecognized`, accessUntil: `unknown`, subscriptionStatus: null };
  assert.equal(billing.readBillingAccess(malformed).plan, `free`);
  assert.equal(billing.isConfirmedFreeBilling(malformed), false);
  assert.equal(billing.isConfirmedFreeBilling(undefined), false);
});

const { createAdSenseRuntime } = load(`src/shared/adsense/runtime.web.ts`);
const runtimeState = () => ({ path: `/`, identity: `guest`, eligible: true, settling: false });
const consentFixture = (publisherId = `ca-pub-1234567890123456`) => {
  const state = { scripts: [], reloads: 0, assignments: [], listeners: new Map(), removed: [], tcf: null, gpp: null, usStatus: 0 };
  const statuses = { UNKNOWN: 0, OPTED_OUT: 1, NOT_OPTED_OUT: 2, DOES_NOT_APPLY: 3 };
  const callbacks = [];
  const window = {
    location: { href: `https://domaindatabases.com/`, assign: value => { state.assignments.push(value); }, reload: () => { state.reloads++; } },
    googlefc: { callbackQueue: callbacks, usstatesoptout: { getInitialUsStatesOptOutStatus: () => state.usStatus, InitialUsStatesOptOutStatusEnum: statuses } },
    __tcfapi: (command, version, callback, id) => { if (command === `addEventListener`) state.tcf = callback; else state.removed.push([`tcf`, id]); },
    __gpp: (command, callback, id) => { if (command === `addEventListener`) state.gpp = callback; else state.removed.push([`gpp`, id]); },
    addEventListener: (name, callback) => { if (!state.listeners.has(name)) state.listeners.set(name, new Set()); state.listeners.get(name).add(callback); },
    removeEventListener: (name, callback) => { state.listeners.get(name)?.delete(callback); },
  };
  const document = {
    head: { appendChild: script => { state.scripts.push(script); } },
    createElement: tag => { assert.equal(tag, `script`); return {}; },
    getElementById: id => state.scripts.find(script => script.id === id) ?? null,
    querySelector: () => null,
  };
  const dispatch = (name, event = {}) => { for (const callback of state.listeners.get(name) ?? []) callback(event); };
  const fire = name => { for (const callback of [...callbacks]) callback[name]?.(); };
  const mount = () => createAdSenseRuntime(window, document, publisherId);
  const runtime = mount();
  const start = (initialState = runtimeState()) => { runtime.update(initialState); fire(`CONSENT_API_READY`); };
  const tcf = (data = { gdprApplies: false }, success = true) => state.tcf({ listenerId: 11, ...data }, success);
  const gpp = (signalStatus = `ready`, eventName = `listenerRegistered`, success = true) => state.gpp({ listenerId: 22, eventName, pingData: { signalStatus } }, success);
  const us = (status = statuses.NOT_OPTED_OUT) => { state.usStatus = status; fire(`INITIAL_US_STATES_OPT_OUT_DATA_READY`); };
  const allow = (initialState = runtimeState()) => { start(initialState); tcf(); gpp(); us(); };
  return { state, statuses, window, runtime, dispatch, fire, mount, start, allow, tcf, gpp, us };
};
const europeanConsent = (personalized = true) => ({ gdprApplies: true, cmpStatus: `loaded`, eventStatus: `useractioncomplete`, vendor: { consents: { 755: true } }, purpose: { consents: { 1: true, 3: personalized, 4: personalized } } });
const clickEvent = (href, target = ``, appNavigation = `true`) => {
  const anchor = { href, target, id: `fixture-navigation`, hasAttribute: () => false, closest: selector => selector === `#app-shell` ? { id: `app-shell` } : null, getAttribute: name => name === `data-app-navigation` ? appNavigation : null };
  return { button: 0, defaultPrevented: false, target: { closest: () => anchor }, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
};

test(`The Runtime Loads One Paused Script Only After Eligibility Settles`, () => {
  const value = consentFixture();
  value.runtime.update({ ...runtimeState(), eligible: false });
  value.runtime.update({ ...runtimeState(), settling: true });
  assert.equal(value.state.scripts.length, 0);
  value.runtime.update(runtimeState());
  value.runtime.update(runtimeState());
  assert.equal(value.state.scripts.length, 1);
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(value.state.scripts[0].src, `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456`);
  for (const publisherId of [``, `pub-1234567890123456`, `ca-pub-0000000000000000`, `ca-pub-invalid`]) {
    const invalid = consentFixture(publisherId);
    invalid.runtime.update(runtimeState());
    assert.equal(invalid.state.scripts.length, 0);
  }
});
test(`Unknown, Unready, Denied Or Failed Consent Never Resumes Requests`, () => {
  for (const missing of [`tcf`, `gpp`, `us`]) {
    const value = consentFixture();
    value.start();
    if (missing !== `tcf`) value.tcf();
    if (missing !== `gpp`) value.gpp();
    if (missing !== `us`) value.us();
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1, missing);
  }
  for (const cmpStatus of [`stub`, `loading`, `error`, `unknown`]) {
    const value = consentFixture();
    value.start(); value.gpp(); value.us(); value.tcf({ gdprApplies: false, cmpStatus });
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1, cmpStatus);
  }
  const denied = consentFixture();
  denied.start(); denied.gpp(); denied.us(); denied.tcf({ ...europeanConsent(), purpose: { consents: {} } });
  assert.equal(denied.window.adsbygoogle.pauseAdRequests, 1);
  const failed = consentFixture();
  failed.start(); failed.gpp(); failed.us(); failed.tcf({ gdprApplies: false }, false);
  assert.equal(failed.window.adsbygoogle.pauseAdRequests, 1);
  const optedOut = consentFixture();
  optedOut.start(); optedOut.tcf(); optedOut.gpp(); optedOut.us(optedOut.statuses.OPTED_OUT);
  assert.equal(optedOut.window.adsbygoogle.pauseAdRequests, 1);
});
test(`A Successful Minimal Non-Applicable TCF Response And Known US State Can Resume`, () => {
  const value = consentFixture();
  value.allow();
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 0);
  assert.equal(value.window.adsbygoogle.requestNonPersonalizedAds, 1);
  assert.equal(value.state.reloads, 0);
});
test(`Resolved TCF Permission Changes Reset The Document Including Across Remounts`, () => {
  const value = consentFixture();
  value.start(); value.gpp(); value.us(); value.tcf(europeanConsent());
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 0);
  assert.equal(value.window.adsbygoogle.requestNonPersonalizedAds, 0);
  value.runtime.dispose();
  const remounted = value.mount();
  remounted.update(runtimeState());
  value.fire(`CONSENT_API_READY`);
  value.gpp(); value.us(); value.tcf(europeanConsent(false));
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(value.state.reloads, 1);
  assert.equal(value.state.scripts.length, 1);
});
test(`GPP Changes, Consent Withdrawal And BFCache Restore Pause And Reset`, () => {
  const changed = consentFixture();
  changed.allow();
  changed.gpp(`not ready`, `signalStatus`);
  assert.equal(changed.window.adsbygoogle.pauseAdRequests, 1);
  changed.gpp(`ready`, `sectionChange`);
  assert.equal(changed.state.reloads, 1);
  const withdrawn = consentFixture();
  withdrawn.allow();
  withdrawn.us(withdrawn.statuses.OPTED_OUT);
  assert.equal(withdrawn.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(withdrawn.state.reloads, 1);
  const cached = consentFixture();
  cached.allow();
  cached.dispatch(`pagehide`);
  assert.equal(cached.window.adsbygoogle.pauseAdRequests, 1);
  cached.dispatch(`pageshow`, { persisted: true });
  assert.equal(cached.state.reloads, 1);
});
test(`Loaded Documents Reset On Account, Route Or Confirmed Eligibility Loss After Settling`, () => {
  for (const patch of [{ eligible: false }, { identity: `paid-account` }, { path: `/profile` }]) {
    const value = consentFixture();
    value.allow();
    value.runtime.update({ ...runtimeState(), ...patch, settling: true });
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
    assert.equal(value.state.reloads, 0);
    value.runtime.update({ ...runtimeState(), ...patch });
    assert.equal(value.state.reloads, patch.path ? 0 : 1);
    assert.deepEqual(value.state.assignments, patch.path ? [`https://domaindatabases.com${patch.path}`] : []);
  }
});
test(`A Sign-Up Route Ahead Of Browser History Navigates To Its Exact Serialized Destination`, () => {
  const value = consentFixture();
  const path = `/signup?returnTo=%2Fdomains`;
  value.allow();
  assert.equal(value.window.location.href, `https://domaindatabases.com/`);
  value.runtime.update({ ...runtimeState(), path, eligible: false, settling: true });
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(value.state.reloads, 0);
  assert.deepEqual(value.state.assignments, []);
  value.runtime.update({ ...runtimeState(), path, eligible: false });
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(value.state.assignments, [`https://domaindatabases.com/signup?returnTo=%2Fdomains`]);
  assert.equal(value.state.reloads, 0);
});
test(`Fragment-Only Router Destinations Assign And Hard Reload Including Hash Removal`, () => {
  for (const [initialPath, path] of [[`/`, `/#section`], [`/#section`, `/`]]) {
    const value = consentFixture();
    value.window.location.href = `https://domaindatabases.com${initialPath}`;
    value.allow({ ...runtimeState(), path: initialPath });
    value.runtime.update({ ...runtimeState(), path, eligible: false });
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1, path);
    assert.deepEqual(value.state.assignments, [`https://domaindatabases.com${path}`], path);
    assert.equal(value.state.reloads, 1, path);
  }
});
test(`Popstate Reloads The Actual Browser Destination Even While Router State Is Stale`, () => {
  const value = consentFixture();
  value.allow();
  value.window.location.href = `https://domaindatabases.com/signup?returnTo=%2Fdomains`;
  value.dispatch(`popstate`);
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(value.window.location.href, `https://domaindatabases.com/signup?returnTo=%2Fdomains`);
  assert.deepEqual(value.state.assignments, []);
  assert.equal(value.state.reloads, 1);
});
test(`Popstate Back To The Observed Home Wins Over A Deferred Stale Sign-Up Route`, () => {
  const value = consentFixture();
  const path = `/signup?returnTo=%2Fdomains`;
  value.allow();
  value.runtime.update({ ...runtimeState(), path, eligible: false, settling: true });
  value.window.location.href = `https://domaindatabases.com${path}`;
  value.window.location.href = `https://domaindatabases.com/`;
  value.dispatch(`popstate`);
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(value.state.assignments, []);
  assert.equal(value.state.reloads, 0);
  value.runtime.update({ ...runtimeState(), path, eligible: false });
  assert.equal(value.window.location.href, `https://domaindatabases.com/`);
  assert.deepEqual(value.state.assignments, []);
  assert.equal(value.state.reloads, 1);
});
test(`Persisted Page Restore Clears A Captured Navigation Latch And Respects Auth Settling`, () => {
  const path = `/signup?returnTo=%2Fdomains`;
  for (const settling of [false, true]) {
    const value = consentFixture();
    value.allow();
    value.dispatch(`click`, clickEvent(`https://domaindatabases.com${path}`));
    assert.deepEqual(value.state.assignments, [`https://domaindatabases.com${path}`]);
    value.dispatch(`pagehide`);
    value.runtime.update({ ...runtimeState(), path, eligible: false, settling });
    value.window.location.href = `https://domaindatabases.com/`;
    value.dispatch(`pageshow`, { persisted: true });
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1, String(settling));
    assert.equal(value.state.reloads, settling ? 0 : 1, String(settling));
    if (settling) value.runtime.update({ ...runtimeState(), path, eligible: false });
    assert.equal(value.window.location.href, `https://domaindatabases.com/`, String(settling));
    assert.deepEqual(value.state.assignments, [`https://domaindatabases.com${path}`], String(settling));
    assert.equal(value.state.reloads, 1, String(settling));
  }
});
test(`An Already-Updated Browser Destination Reloads In Place Instead Of Reassigning`, () => {
  const value = consentFixture();
  const path = `/signup?returnTo=%2Fdomains`;
  value.allow();
  value.window.location.href = `https://domaindatabases.com${path}`;
  value.runtime.update({ ...runtimeState(), path, eligible: false });
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(value.state.assignments, []);
  assert.equal(value.state.reloads, 1);
});
test(`Unsafe Or Absolute Router Paths Cannot Become External Document Navigations`, () => {
  for (const path of [`https://external.example.invalid/signup`, `https://domaindatabases.com/signup`, `http://domaindatabases.com/signup`, `//external.example.invalid/signup`, `/\\external.example.invalid/signup`, `\\external.example.invalid/signup`, `javascript:alert(1)`, `data:text/html,unsafe`]) {
    const value = consentFixture();
    value.allow();
    value.runtime.update({ ...runtimeState(), path, eligible: false });
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 1, path);
    assert.deepEqual(value.state.assignments, [], path);
    assert.equal(value.window.location.href, `https://domaindatabases.com/`, path);
  }
});
test(`Loaded Same-Origin Navigation Gets A New Document And Settling Does Not Interrupt Auth`, () => {
  const value = consentFixture();
  value.allow();
  const event = clickEvent(`https://domaindatabases.com/signup?returnTo=%2Fdomains`);
  value.dispatch(`click`, event);
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
  assert.deepEqual(value.state.assignments, [`https://domaindatabases.com/signup?returnTo=%2Fdomains`]);
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  for (const [href, target] of [[`https://external.example.invalid/`, ``], [`https://domaindatabases.com/profile`, `_blank`]]) {
    const untouched = consentFixture();
    untouched.allow();
    const click = clickEvent(href, target);
    untouched.dispatch(`click`, click);
    assert.equal(click.prevented, false);
    assert.equal(untouched.state.assignments.length, 0);
  }
  const settling = consentFixture();
  settling.allow();
  settling.runtime.update({ ...runtimeState(), settling: true });
  const login = clickEvent(`https://domaindatabases.com/signin`);
  settling.dispatch(`click`, login);
  assert.equal(login.prevented, false);
  assert.equal(settling.state.assignments.length, 0);
  assert.equal(settling.window.adsbygoogle.pauseAdRequests, 1);
  const fragment = consentFixture();
  fragment.allow();
  fragment.dispatch(`click`, clickEvent(`https://domaindatabases.com/#section`));
  assert.equal(fragment.state.reloads, 1);
});
test(`CMP And Unmarked Links Inside The App Shell Are Never Intercepted`, () => {
  for (const marker of [null, `false`, ``, true]) {
    const value = consentFixture();
    value.allow();
    const event = clickEvent(`https://domaindatabases.com/privacy`, ``, marker);
    value.dispatch(`click`, event);
    assert.equal(event.prevented, false, String(marker));
    assert.equal(event.stopped, false, String(marker));
    assert.equal(value.state.assignments.length, 0, String(marker));
    assert.equal(value.state.reloads, 0, String(marker));
    assert.equal(value.window.adsbygoogle.pauseAdRequests, 0, String(marker));
  }
});
test(`Disposed And Failed Runtimes Cannot Resume Advertising From Late Callbacks`, () => {
  const value = consentFixture();
  value.allow();
  value.runtime.dispose();
  value.tcf(); value.gpp(); value.us();
  value.runtime.update(runtimeState());
  assert.equal(value.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(value.state.removed, [[`tcf`, 11], [`gpp`, 22]]);
  assert.ok([...value.state.listeners.values()].every(listeners => listeners.size === 0));
  const failed = consentFixture();
  failed.start();
  failed.state.scripts[0].onerror();
  failed.tcf(); failed.gpp(); failed.us();
  assert.equal(failed.window.adsbygoogle.pauseAdRequests, 1);
});
