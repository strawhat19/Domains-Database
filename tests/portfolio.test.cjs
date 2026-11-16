const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Module = require('node:module');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { Timestamp } = require('firebase-admin/firestore');

global.fetch = async () => { throw new Error(`Network Access Is Forbidden In Portfolio Tests`); };
const root = path.resolve(__dirname, `..`);
const modules = new Map();
const skipped = new Map([
  [path.resolve(root, `src/shared/firebase/client.ts`), {}],
  [path.resolve(root, `src/shared/publicDirectory/profiles.ts`), {}],
]);
const loadSource = (relative, stubs = {}) => {
  const filename = path.resolve(root, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, `utf8`), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = specifier => {
    if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
    if (specifier === `expo-crypto`) return { randomUUID: crypto.randomUUID };
    if (specifier.startsWith(`.`)) {
      const dependency = `${path.resolve(path.dirname(filename), specifier)}.ts`;
      if (skipped.has(dependency)) return skipped.get(dependency);
      if (fs.existsSync(dependency)) {
        if (!modules.has(dependency)) modules.set(dependency, loadSource(dependency));
        return modules.get(dependency);
      }
    }
    return Module.createRequire(filename)(specifier);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
};
const { Domain } = loadSource(`src/shared/models/domains/Domain.ts`);
const { WEBSITE_INSIGHTS_SOURCE } = loadSource(`src/shared/websiteInsights/types.ts`);
const { mergeWebsiteInsights, normalizeWebsiteInsights } = loadSource(`src/shared/websiteInsights/values.ts`);
const { mergeVercelConfigurations } = loadSource(`src/shared/registrarSync/vercelConfiguration.ts`);
const { parseDomainCsv } = loadSource(`src/shared/csv.ts`);
const { markDomainFieldsKnown } = loadSource(`src/shared/registrarSync/metadata.ts`);
const { readDomainParkingMetrics } = loadSource(`src/shared/domainParking/values.ts`);
const userId = `User_1_Fixture_1_00_PM_10_23_26_userfixture`;
const actor = { id: userId, userId, number: 1, firebaseUid: `fixtureUid`, active: true, role: `Subscriber`, owner: false };
const domain = number => new Domain({ id: `Domain_${number}_Fixture_1_00_PM_10_23_26_domain${number}`, number, uid: userId, name: `fixture-${number}.example`, owner: `Fixture`, notes: `Private Notes`, created: `2026-10-23T17:00:00.000Z`, updated: `2026-10-23T17:00:00.000Z`, expiresAt: ``, registrar: ``, renewalPrice: 0, autoRenew: false, projectStatus: `Idea` }).toRecord();
const hash = ids => crypto.createHash(`sha256`).update([...ids].sort().join(`\n`)).digest(`hex`);

const memoryDatabase = initial => {
  const documents = new Map(initial);
  let queue = Promise.resolve();
  const reference = value => ({ kind: `document`, path: value, id: value.split(`/`).at(-1), collection: name => collection(`${value}/${name}`) });
  const collection = (value, filters = [], maximum = Infinity) => ({ kind: `query`, path: value, filters, maximum, doc: name => reference(`${value}/${name}`), select: () => collection(value, filters, maximum), limit: limit => collection(value, filters, limit), where: (field, operator, expected) => collection(value, [...filters, { field, operator, expected }], maximum) });
  const snapshot = item => ({ id: item.id, exists: documents.has(item.path), data: () => documents.get(item.path), get: field => documents.get(item.path)?.[field] });
  const read = item => {
    if (item.kind !== `query`) return snapshot(item);
    const rows = [...documents.entries()].filter(([key, data]) => key.startsWith(`${item.path}/`) && !key.slice(item.path.length + 1).includes(`/`) && item.filters.every(filter => filter.operator === `==` && data[filter.field] === filter.expected)).slice(0, item.maximum).map(([key]) => snapshot(reference(key)));
    return { docs: rows, size: rows.length };
  };
  return {
    documents,
    doc: reference,
    runTransaction: operation => {
      const result = queue.then(async () => {
        const writes = [];
        const transaction = { get: async item => read(item), getAll: async (...items) => items.map(read), set: (item, data) => writes.push(() => documents.set(item.path, data)), delete: item => writes.push(() => documents.delete(item.path)) };
        const output = await operation(transaction);
        writes.forEach(write => write());
        return output;
      });
      queue = result.catch(() => undefined);
      return result;
    },
  };
};
const fixture = ({ count = 0, paid = false, expired = false, owner = false, usage = true, revision = 1 } = {}) => {
  const records = Array.from({ length: count }, (_, index) => domain(index + 1));
  const ids = records.map(record => record.id);
  const snapshotPath = `users/${userId}/snapshots/portfolio`;
  const usagePath = `portfolioUsage/${userId}`;
  const initial = [
    [`users/${userId}`, { id: userId, number: 1, firebase_uid: actor.firebaseUid, active: true, role: owner ? `Owner` : `Subscriber` }],
    [`identities/${actor.firebaseUid}`, { id: userId, number: 1, firebase_uid: actor.firebaseUid }],
    [snapshotPath, { revision, ids, snapshot: { version: 1, nextNumber: count + 1 } }],
    ...records.map(record => [`users/${userId}/domains/${record.id}`, record]),
  ];
  if (usage) initial.push([usagePath, { version: 1, count, revision, idsHash: hash(ids) }]);
  if (paid) initial.push([`billingUsers/${userId}`, { plan: `starter`, subscriptionStatus: `active`, accessUntil: Timestamp.fromMillis(Date.now() + (expired ? -60_000 : 3600_000)) }]);
  const database = memoryDatabase(initial);
  const { handlePortfolioCommit } = loadSource(`src/server/portfolio/http.ts`, { '../billing/firebase': { getBillingDatabase: () => database, requireBillingActor: async () => actor } });
  const commit = async input => {
    const request = new Request(`https://domaindatabases.com/api/portfolio/commit`, { method: `POST`, headers: { 'content-type': `application/json`, origin: `https://domaindatabases.com` }, body: JSON.stringify(input) });
    const response = await handlePortfolioCommit(request);
    return { status: response.status, data: await response.json() };
  };
  const add = (number = count + 1, record = domain(number)) => ({ snapshot: { version: 1, nextNumber: Math.max(count + 1, number + 1) }, ids: [...ids, record.id], changes: [{ id: record.id, record }], expectedRevision: revision });
  return { records, ids, database, commit, add, snapshotPath, usagePath, revision };
};

test(`Signed-In GoDaddy Sync Saves Provider Details And Preserves Private Portfolio Values`, async () => {
  const { database, records: [original], snapshotPath } = fixture({ count: 1, owner: true });
  const recordPath = `users/${userId}/domains/${original.id}`;
  const registrant = { name: `Saved Contact`, email: `saved@example.invalid`, organization: `Saved Organization` };
  database.documents.set(recordPath, { ...original, registrant, registrar: `GoDaddy`, renewalPrice: 25, currency: `USD`, providerId: `42` });
  const billingFirebase = loadSource(`src/server/billing/firebase.ts`, {
    'firebase-admin/app': { getApps: () => [{ name: `domains-database-billing`, options: { projectId: `domainsdatabase-e62a3` } }] },
    'firebase-admin/auth': { getAuth: () => ({ verifyIdToken: async (token, checkRevoked) => {
      assert.equal(token, `fixture-owner`);
      assert.equal(checkRevoked, true);
      return { uid: actor.firebaseUid, firebase: { sign_in_provider: `password` } };
    } }) },
    'firebase-admin/firestore': { getFirestore: () => ({ ...database, doc: key => ({
      ...database.doc(key), get: async () => ({ data: () => database.documents.get(key) }),
    }) }) },
  });
  const access = loadSource(`src/server/featureAccess/auth.ts`, { '../billing/firebase': billingFirebase });
  let expires = `2027-12-03`;
  let failDetail = false;
  const { getGoDaddyDomains } = loadSource(`src/server/registrars/godaddy.ts`, { './request': {
    pauseRequests: async () => {},
    requestRegistrar: async (url, headers) => {
      assert.equal(url.origin, `https://api.godaddy.com`);
      assert.equal(headers.Authorization, `Bearer fixture-godaddy`);
      if (url.pathname === `/v1/domains`) return JSON.stringify([{ domain: original.name, expires, domainId: 42, status: `ACTIVE` }]);
      assert.equal(url.pathname, `/v2/customers/00000000-0000-0000-0000-000000000000/domains/${original.name}`);
      if (failDetail) throw new Error(`Fixture Detail Unavailable`);
      return JSON.stringify({
        domain: original.name, domainId: `42`, nameServers: [`ns1.fixture.example`],
        renewal: { price: 17_500_000, currency: `USD`, renewable: true },
      });
    },
  } });
  const sync = loadSource(`src/server/registrars/sync.ts`, { './godaddy': { getGoDaddyDomains } });
  const { handleRegistrarSync } = loadSource(`src/server/registrars/http.ts`, { './sync': sync, '../featureAccess/auth': access });
  const { handlePortfolioCommit } = loadSource(`src/server/portfolio/http.ts`, { '../billing/firebase': billingFirebase });
  const request = (route, input, authorized = true) => new Request(`https://fixture.example${route}`, {
    method: `POST`, body: JSON.stringify(input),
    headers: { 'content-type': `application/json`, ...(authorized ? { authorization: `Bearer fixture-owner` } : {}) },
  });
  const storageKey = `domains-database:portfolio:v1`;
  let readRevision;
  const { api } = loadSource(`src/api/index.ts`, {
    './auth': { authAPI: { restoreSession: async () => ({ user: { ...actor, role: `Owner` } }) } },
    './domainData': {},
    '@react-native-async-storage/async-storage': {},
    '../shared/firebase/config': { firebaseEnabled: true },
    '../shared/firebase/storage': { clearFirestoreStorageCache: () => {} },
    '../shared/authentication/service.local': {},
    '../shared/planAccess/service': { getPlanAccess: async () => ({ user: { ...actor, role: `Owner` } }) },
    '../shared/config': { PORTFOLIO_STORAGE_KEY: storageKey, persistenceEnabled: true, useLocalStorage: false, useSampleData: false },
    '../shared/common/storage': {
      createOperationQueue: () => async operation => operation(),
      readStorage: async key => {
        assert.equal(key, `${storageKey}:user:${userId}`);
        const saved = database.documents.get(snapshotPath);
        readRevision = saved.revision;
        return JSON.stringify({ ...saved.snapshot, domains: saved.ids.map(id => database.documents.get(`users/${userId}/domains/${id}`)) });
      },
      writeStorage: async (key, value) => {
        assert.equal(key, `${storageKey}:user:${userId}`);
        const { domains, ...snapshot } = JSON.parse(value);
        const changes = domains.map(record => ({ id: record.id, record }));
        const response = await handlePortfolioCommit(request(`/api/portfolio/commit`, {
          snapshot, changes, ids: changes.map(change => change.id), expectedRevision: readRevision,
        }));
        assert.equal(response.status, 200, JSON.stringify(await response.json()));
      },
    },
  });
  const input = { provider: `godaddy`, values: `GODADDY_PAT=fixture-godaddy\nGODADDY_CUSTOMER_ID=00000000-0000-0000-0000-000000000000` };
  assert.equal((await handleRegistrarSync(request(`/api/registrars/sync`, input, false))).status, 401);
  await api.setUserScope(userId);
  const syncPortfolio = async () => {
    const response = await handleRegistrarSync(request(`/api/registrars/sync`, input));
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(await api.syncRegistrarDomains(result.domains, userId, `Fixture Owner`), 1);
    return result;
  };
  await syncPortfolio();
  const first = database.documents.get(recordPath);
  assert.equal(first.expiresAt, expires);
  assert.deepEqual(first.nameservers, [`ns1.fixture.example`]);
  const estimate = first.meta.registrarSync.renewalEstimate;
  assert.equal(estimate.amount, 17.5);
  assert.equal(estimate.currency, `USD`);

  failDetail = true;
  expires = `2028-12-03`;
  const partial = await syncPortfolio();
  assert.match(partial.warnings[0], /GoDaddy Domain Detail Read/);
  const saved = database.documents.get(recordPath);
  assert.equal(saved.expiresAt, expires);
  assert.equal(saved.id, original.id);
  assert.equal(saved.number, original.number);
  assert.equal(saved.notes, original.notes);
  assert.equal(saved.providerId, `42`);
  assert.equal(saved.renewalPrice, 25);
  assert.deepEqual(saved.registrant, registrant);
  assert.deepEqual(saved.nameservers, first.nameservers);
  assert.deepEqual(saved.meta.registrarSync.renewalEstimate, estimate);
  assert.equal(saved.meta.registrarSync.detailsCheckedAt, first.meta.registrarSync.detailsCheckedAt);
  assert.deepEqual(database.documents.get(snapshotPath).ids, [original.id]);
  assert.equal(database.documents.get(snapshotPath).revision, 3);
});

for (const [label, count, paid, expected] of [[`Free Last Slot`, 32, false, 200], [`Free Overflow`, 33, false, 403], [`Starter Last Slot`, 332, true, 200], [`Starter Overflow`, 333, true, 403]]) test(`${label} Uses Its Authoritative Quota`, async () => {
  const current = fixture({ count, paid });
  const result = await current.commit(current.add());
  assert.equal(result.status, expected);
  assert.equal(current.database.documents.get(current.usagePath).count, count + (expected === 200 ? 1 : 0));
  assert.equal(current.database.documents.get(current.snapshotPath).revision, expected === 200 ? 2 : 1);
  if (expected !== 200) assert.equal(result.data.code, `domain_limit`);
});
test(`Expired Starter Access Falls Back To The Free Limit`, async () => {
  const current = fixture({ count: 33, paid: true, expired: true });
  assert.equal((await current.commit(current.add())).data.code, `domain_limit`);
  assert.equal(current.database.documents.get(current.usagePath).count, 33);
});
test(`Current Trusted Owner Exceeds The Paid Limit Without A Plan`, async () => {
  const current = fixture({ count: 400, owner: true });
  const result = await current.commit(current.add());
  assert.equal(result.status, 200);
  assert.equal(result.data.domainCount, 401);
});
for (const paid of [false, true]) test(`${paid ? `Starter` : `Free`} Over-Limit Accounts Can Edit And Delete But Cannot Grow`, async () => {
  const count = paid ? 340 : 40;
  const current = fixture({ count, paid });
  const updated = { ...current.records[0], notes: `Updated Private Notes` };
  const change = { snapshot: { version: 1, nextNumber: count + 1 }, ids: current.ids, changes: [{ id: updated.id, record: updated }], expectedRevision: 1 };
  assert.equal((await current.commit(change)).status, 200);
  const removed = current.records[1].id;
  assert.equal((await current.commit({ ...change, ids: current.ids.filter(id => id !== removed), changes: [{ id: removed }], expectedRevision: 2 })).status, 200);
  const next = domain(count + 1);
  const growth = await current.commit({ snapshot: { version: 1, nextNumber: count + 2 }, ids: [...current.ids.filter(id => id !== removed), next.id], changes: [{ id: next.id, record: next }], expectedRevision: 3 });
  assert.equal(growth.status, 403);
  assert.equal(growth.data.code, `domain_limit`);
  assert.equal(current.database.documents.get(current.usagePath).count, count - 1);
});
test(`Bootstrap Counts Actual Stored Domains Before Enforcing The Limit`, async () => {
  const current = fixture({ count: 33, usage: false });
  assert.equal((await current.commit(current.add())).data.code, `domain_limit`);
  assert.equal(current.database.documents.has(current.usagePath), false);
});
test(`A Stale Revision Cannot Overwrite Another Commit`, async () => {
  const current = fixture({ count: 1 });
  const input = current.add();
  assert.equal((await current.commit(input)).status, 200);
  const stale = await current.commit(input);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.code, `portfolio_changed`);
  assert.equal(current.database.documents.get(current.usagePath).count, 2);
});
test(`Concurrent Requests With One Revision Have Exactly One Winner`, async () => {
  const current = fixture({ count: 32 });
  const results = await Promise.all([current.commit(current.add(33)), current.commit(current.add(34))]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.equal(current.database.documents.get(current.usagePath).count, 33);
  assert.equal(current.database.documents.get(current.snapshotPath).revision, 2);
});
for (const field of [`id`, `number`, `firebase_uid`]) test(`Fresh Identity ${field} Mismatch Is Rejected`, async () => {
  const current = fixture({ count: 1 });
  const identity = current.database.documents.get(`identities/${actor.firebaseUid}`);
  identity[field] = field === `number` ? 2 : `anotherIdentity`;
  const result = await current.commit(current.add());
  assert.equal(result.status, 403);
  assert.equal(result.data.code, `account_unavailable`);
  assert.equal(current.database.documents.get(current.usagePath).count, 1);
});
test(`Public Projections Contain Only The Public Allowlist`, async () => {
  const current = fixture();
  const goValue = { amount: 123, currency: `USD`, source: `GoDaddy GoValue`, checkedAt: `2026-11-13T14:00:00Z` };
  const registrarDetails = { transferProtected: true };
  const goDaddyParking = { checkedAt: `2026-11-13T14:00:00Z`, report: { visits: 1 } };
  const record = { ...domain(1), notes: `Private Notes`, meta: { goValue, registrarDetails, goDaddyParking, privateCredential: `synthetic_private_fixture` }, registrant: { email: `private@example.invalid` } };
  const result = await current.commit(current.add(1, record));
  assert.equal(result.status, 200);
  const privateRecord = current.database.documents.get(`users/${userId}/domains/${record.id}`);
  const projection = current.database.documents.get(`publicProfiles/${userId}/domains/${record.id}`);
  assert.equal(privateRecord.meta.privateCredential, `synthetic_private_fixture`);
  assert.deepEqual(privateRecord.meta.goValue, goValue);
  assert.deepEqual(privateRecord.meta.registrarDetails, registrarDetails);
  assert.deepEqual(privateRecord.meta.goDaddyParking, goDaddyParking);
  assert.equal(privateRecord.registrant.email, `private@example.invalid`);
  assert.deepEqual(Object.keys(projection).sort(), [`created`, `description`, `expiresAt`, `id`, `name`, `projectStatus`, `registrar`, `userId`]);
  for (const key of [`notes`, `owner`, `meta`, `registrant`, `email`, `uid`]) assert.equal(Object.hasOwn(projection, key), false);
});
test(`Rank Refresh Preserves PageSpeed And Replaces An Explicitly Unlisted Rank`, () => {
  const checkedAt = `2026-11-13T14:00:00Z`;
  const nextCheckedAt = `2026-11-14T14:00:00Z`;
  const previous = { domain: `fixture.example`, checkedAt, source: WEBSITE_INSIGHTS_SOURCE, errors: [], warnings: [],
    performance: { checkedAt, score: 84, strategy: `mobile`, source: `Google PageSpeed Insights` },
    trancoListed: true, trancoRank: 50, trancoDate: `2026-11-13`, trancoCheckedAt: checkedAt };
  const incoming = { domain: previous.domain, checkedAt: nextCheckedAt, source: WEBSITE_INSIGHTS_SOURCE, errors: [], warnings: [], trancoListed: false, trancoCheckedAt: nextCheckedAt };
  const result = mergeWebsiteInsights(incoming, previous);
  assert.deepEqual(result.performance, previous.performance);
  assert.equal(result.trancoRank, undefined);
  assert.equal(result.trancoListed, false);
  assert.equal(result.trancoCheckedAt, nextCheckedAt);
  assert.equal(mergeWebsiteInsights({ ...incoming, trancoListed: undefined, trancoCheckedAt: undefined }, previous).trancoRank, 50);
  const failures = { ...previous, errors: [`PageSpeed: Source Is Unavailable`, `Tranco: Source Is Unavailable`] };
  assert.deepEqual(mergeWebsiteInsights(incoming, failures, true).errors, [`PageSpeed: Source Is Unavailable`]);
  assert.deepEqual(mergeWebsiteInsights(incoming, failures).errors, []);
});
test(`Tranco History Survives A Rank Failure And Rejects Conflicting Days`, () => {
  const checkedAt = `2026-11-14T14:00:00Z`;
  const history = [{ date: `2026-11-14`, rank: null }, { date: `2026-11-13`, rank: 25 }];
  const base = { domain: `fixture.example`, checkedAt, source: WEBSITE_INSIGHTS_SOURCE, errors: [], warnings: [] };
  const ranked = { ...base, trancoListed: false, trancoCheckedAt: checkedAt, trancoHistory: [...history].reverse() };
  const normalized = normalizeWebsiteInsights(ranked);
  assert.deepEqual(normalized.trancoHistory, history);
  assert.deepEqual(mergeWebsiteInsights({ ...base, checkedAt: `2026-11-15T04:00:00Z`, errors: [`Tranco: Source Is Unavailable`] }, normalized).trancoHistory, history);
  assert.throws(() => normalizeWebsiteInsights({ ...ranked, trancoHistory: [history[0], { ...history[0], rank: 88 }] }), /Inconsistent Rank History/);
});
test(`Vercel DNS Configuration Can Only Change A Matching Private Portfolio Row`, () => {
  const existing = new Domain({ ...domain(1), name: `example.com`, registrar: `GoDaddy`, providerId: `40`, nameservers: [`ns1.example.net`] });
  const domains = [existing];
  const checkedAt = `2026-11-13T14:00:00Z`;
  const records = [
    { name: `example.com`, verified: true, dnsService: `zeit.world`, observedNameservers: [`ns1.vercel-dns.com`], privateKey: `ignored` },
    { name: `untracked.com`, verified: true, dnsService: `external` },
  ];
  assert.ok(mergeVercelConfigurations(domains, { connectionId: `vercel-1`, records }, userId, checkedAt));
  assert.equal(domains.length, 1);
  assert.equal(domains[0].registrar, `GoDaddy`);
  assert.equal(domains[0].providerId, `40`);
  assert.deepEqual(domains[0].nameservers, [`ns1.example.net`]);
  assert.deepEqual(domains[0].meta.vercelDomainConfiguration, { verified: true, dnsService: `zeit.world`, connectionId: `vercel-1`, observedNameservers: [`ns1.vercel-dns.com`], checkedAt });
  assert.equal(mergeVercelConfigurations(domains, { connectionId: `vercel-1`, records }, userId, checkedAt), false);
  assert.equal(mergeVercelConfigurations(domains, { connectionId: `vercel-2`, records: [] }, userId, checkedAt), false);
  assert.ok(mergeVercelConfigurations(domains, { connectionId: `vercel-1`, records: [] }, userId, checkedAt));
  assert.equal(domains[0].meta.vercelDomainConfiguration, undefined);
});
test(`Annual Cost Import Distinguishes An Omitted Value From Explicit Zero`, () => {
  const rows = parseDomainCsv(`domain,registrar,expiry,renewal_price,currency\na.example,GoDaddy,,,USD\nb.example,GoDaddy,,0,USD\nc.example,GoDaddy,,18.50,EUR`);
  assert.deepEqual(rows.map(row => row.meta.csvRenewalCostProvided), [false, true, true]);
  assert.equal(rows[2].renewalPrice, 18.5);
  assert.equal(rows[2].currency, `EUR`);
  const saved = markDomainFieldsKnown({ ...rows[1], meta: { domainSource: `registrar` } }, [`renewalPrice`]);
  assert.equal(saved.meta.registrarSync.renewalPriceKnown, true);
});
test(`Private Parking Reports Require Matching Domains And Currency For Revenue`, () => {
  const parking = { domain: `example.com`, startDate: `2026-10-11`, endDate: `2026-11-09`, checkedAt: `2026-11-13T14:00:00Z`,
    report: { visits: 0, pageViews: 0, adClicks: 0, currency: `USD`, revenueMicrounits: 0, internalReference: `ignored` } };
  assert.equal(readDomainParkingMetrics(parking, `other.example`), undefined);
  assert.equal(readDomainParkingMetrics({ ...parking, report: { ...parking.report, currency: null } }, parking.domain), undefined);
  assert.deepEqual(readDomainParkingMetrics(parking, parking.domain).report, { visits: 0, pageViews: 0, adClicks: 0, currency: `USD`, revenueMicrounits: 0 });
});
test(`Sample Records Do Not Bypass The Quota Or Publish Private Fields`, async () => {
  const current = fixture({ count: 33 });
  assert.equal((await current.commit(current.add(34, { ...domain(34), isSample: true }))).data.code, `domain_limit`);
  const empty = fixture();
  const sample = { ...domain(1), isSample: true };
  assert.equal((await empty.commit(empty.add(1, sample))).status, 200);
  assert.equal(empty.database.documents.has(`publicProfiles/${userId}/domains/${sample.id}`), false);
});
test(`Free Cannot Persist New Paid Website Insights`, async () => {
  const current = fixture();
  const result = await current.commit(current.add(1, { ...domain(1), meta: { websiteInsights: { rank: 1 } } }));
  assert.equal(result.status, 403);
  assert.equal(result.data.code, `starter_required`);
  assert.equal(current.database.documents.get(current.usagePath).count, 0);
});
test(`Snapshot Membership Cannot Hide Stored Domains`, async () => {
  const current = fixture({ count: 3 });
  const result = await current.commit({ snapshot: { version: 1, nextNumber: 4 }, ids: current.ids.slice(0, 1), changes: [], expectedRevision: 1 });
  assert.equal(result.status, 409);
  assert.equal(current.database.documents.get(current.usagePath).count, 3);
});
test(`Tampered Usage Hash Is Rejected Without Any Writes`, async () => {
  const current = fixture({ count: 1 });
  current.database.documents.get(current.usagePath).idsHash = `tampered`;
  assert.equal((await current.commit(current.add())).status, 409);
  assert.equal(current.database.documents.get(current.snapshotPath).revision, 1);
});
