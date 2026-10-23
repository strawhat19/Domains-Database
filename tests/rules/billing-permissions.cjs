const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const projectId = `domainsdatabase-e62a3`;
const now = `2026-10-23T12:00:00Z`;
const documentRoot = `/databases/(default)/documents/`;
const sourcePath = path.resolve(__dirname, `../../firestore.rules`);
const artifactDirectory = process.env.RULES_TEST_ARTIFACT_DIR || path.join(process.env.TEMP || process.cwd(), `domains-database-rules-tests`);
const featureSettingsId = `FeatureSettings_1_Global_12_00_AM_10_12_26_cb23b14255924fdd95957eac7ca7e35e`;
const providerNames = [`vercel`, `godaddy`, `hostinger`, `namecheap`, `porkbun`, `namesilo`, `squarespace`];
const appId = (type, name, number = 1) => `${type}_${number}_${name}_12_00_PM_10_23_26_rulesfixture`;
const actor = (name, options = {}) => ({
  uid: `rules-${name}`,
  role: `Subscriber`,
  active: true,
  plan: `free`,
  id: appId(`User`, name),
  ...options,
});
const paidMirror = (options = {}) => ({
  plan: `starter`,
  subscriptionStatus: `active`,
  accessUntil: `2026-11-23T12:00:00Z`,
  billingAccountId: appId(`BillingAccount`, `fixture`),
  ...options,
});
const free = actor(`free`);
const owner = actor(`owner`, { role: `Owner` });
const inactiveOwner = actor(`inactive-owner`, { role: `Owner`, active: false });
const starter = actor(`starter`, { plan: `starter`, mirror: paidMirror() });
const trialing = actor(`trialing`, { mirror: paidMirror({ subscriptionStatus: `trialing` }) });
const stale = actor(`stale`, { plan: `starter` });
const expired = actor(`expired`, { plan: `starter`, mirror: paidMirror({ accessUntil: `2026-10-22T12:00:00Z` }) });
const endingNow = actor(`ending-now`, { mirror: paidMirror({ accessUntil: now }) });
const canceled = actor(`canceled`, { mirror: paidMirror({ subscriptionStatus: `canceled` }) });
const pastDue = actor(`past-due`, { mirror: paidMirror({ subscriptionStatus: `past_due` }) });
const unpaid = actor(`unpaid`, { mirror: paidMirror({ subscriptionStatus: `unpaid` }) });
const freeMirror = actor(`free-mirror`, { mirror: paidMirror({ plan: `free` }) });
const inactiveStarter = actor(`inactive-starter`, { active: false, mirror: paidMirror() });
const administrator = actor(`administrator`, { role: `Administrator` });
const developer = actor(`developer`, { role: `Developer` });
const other = actor(`other`, { number: 2, id: appId(`User`, `other`, 2) });
const connectionId = appId(`Connection`, `fixture`);
const domainId = appId(`Domain`, `fixture`);
const auctionId = appId(`Auction`, `fixture`);
const testCases = [];

const fixturesFor = (viewer, extra = {}) => {
  const documents = { ...extra };
  if (!viewer) return documents;
  documents[`identities/${viewer.uid}`] = { id: viewer.id, number: 1, firebase_uid: viewer.uid };
  documents[`users/${viewer.id}`] = {
    id: viewer.id,
    number: 1,
    plan: viewer.plan,
    role: viewer.role,
    active: viewer.active,
    firebase_uid: viewer.uid,
  };
  if (viewer.mirror) documents[`billingUsers/${viewer.id}`] = viewer.mirror;
  return documents;
};

const mocksFor = documents => {
  const mocks = [];
  for (const [documentPath, data] of Object.entries(documents)) {
    const document = documentRoot.replace(`(default)`, `%28default%29`) + documentPath;
    mocks.push({ function: `get`, args: [{ exactValue: document }], result: { value: { data } } });
    mocks.push({ function: `exists`, args: [{ exactValue: document }], result: { value: true } });
  }
  mocks.push({ function: `get`, args: [{ anyValue: {} }], result: { undefined: {} } });
  mocks.push({ function: `exists`, args: [{ anyValue: {} }], result: { value: false } });
  mocks.push({ function: `getAfter`, args: [{ anyValue: {} }], result: { undefined: {} } });
  mocks.push({ function: `existsAfter`, args: [{ anyValue: {} }], result: { value: false } });
  return mocks;
};

const add = (name, expectation, viewer, documentPath, method = `get`, options = {}) => {
  const documents = fixturesFor(viewer, options.documents);
  const request = {
    method,
    time: now,
    path: documentRoot + documentPath,
    auth: viewer ? { uid: viewer.uid, token: options.token || {} } : null,
    ...(options.data ? { resource: { data: options.data } } : {}),
    ...(options.query ? { query: options.query } : {}),
  };
  testCases.push({ name, test: {
    request,
    expectation,
    resource: { data: options.before || {} },
    functionMocks: mocksFor(documents),
  } });
};

const connection = provider => ({ id: connectionId, number: 1, provider, values: `fixture-only` });
const connectionPath = viewer => `users/${viewer.id}/connections/${connectionId}`;
for (const viewer of [free, starter, owner]) {
  add(`${viewer.uid}: Own Billing Mirror Read`, `ALLOW`, viewer, `billingUsers/${viewer.id}`);
  add(`${viewer.uid}: Cross-Account Billing Mirror Denied`, `DENY`, viewer, `billingUsers/${other.id}`);
  add(`${viewer.uid}: Billing Mirror List Denied`, `DENY`, viewer, `billingUsers/${viewer.id}`, `list`);
  for (const method of [`create`, `update`, `delete`]) {
    add(`${viewer.uid}: Billing Mirror ${method} Denied`, `DENY`, viewer, `billingUsers/${viewer.id}`, method, { data: paidMirror() });
    add(`${viewer.uid}: Direct Domain ${method} Denied`, `DENY`, viewer, `users/${viewer.id}/domains/${domainId}`, method, { data: { id: domainId, number: 1 } });
    add(`${viewer.uid}: Direct Portfolio Snapshot ${method} Denied`, `DENY`, viewer, `users/${viewer.id}/snapshots/portfolio`, method, { data: { snapshot: { version: 1, nextNumber: 2 }, ids: [domainId], revision: 1 } });
  }
  add(`${viewer.uid}: Own Domain Remains Readable`, `ALLOW`, viewer, `users/${viewer.id}/domains/${domainId}`);
  add(`${viewer.uid}: Own Portfolio Snapshot Remains Readable`, `ALLOW`, viewer, `users/${viewer.id}/snapshots/portfolio`);
  add(`${viewer.uid}: Cross-Account Connection Denied`, `DENY`, viewer, `users/${other.id}/connections/${connectionId}`);
  add(`${viewer.uid}: Server Usage Read Denied`, `DENY`, viewer, `portfolioUsage/${viewer.id}`);
  add(`${viewer.uid}: Server Usage Write Denied`, `DENY`, viewer, `portfolioUsage/${viewer.id}`, `update`, { data: { count: 0 } });
  for (const provider of providerNames) {
    const expectation = viewer !== free || [`godaddy`, `hostinger`].includes(provider) ? `ALLOW` : `DENY`;
    add(`${viewer.uid}: ${provider} Connection Create`, expectation, viewer, connectionPath(viewer), `create`, { data: connection(provider) });
  }
}
for (const viewer of [stale, expired, endingNow, canceled, pastDue, unpaid, freeMirror, inactiveStarter, inactiveOwner, administrator, developer]) {
  add(`${viewer.uid}: Paid Provider Denied`, `DENY`, viewer, connectionPath(viewer), `create`, { data: connection(`porkbun`) });
}
add(`Trialing: Paid Provider Allowed`, `ALLOW`, trialing, connectionPath(trialing), `create`, { data: connection(`porkbun`) });
add(`Expired: Existing Paid Connection Update Denied`, `DENY`, expired, connectionPath(expired), `update`, { data: connection(`porkbun`), before: connection(`porkbun`) });
add(`Expired: Existing Paid Connection Delete Allowed`, `ALLOW`, expired, connectionPath(expired), `delete`, { before: connection(`porkbun`) });
add(`Expired: Domain Remains Readable`, `ALLOW`, expired, `users/${expired.id}/domains/${domainId}`);
add(`Expired: Portfolio Snapshot Remains Readable`, `ALLOW`, expired, `users/${expired.id}/snapshots/portfolio`);
add(`Free: Forged Token Role And Plan Do Not Grant Paid Provider`, `DENY`, free, connectionPath(free), `create`, { data: connection(`porkbun`), token: { role: `Owner`, plan: `starter` } });
add(`Guest: Billing Mirror Denied`, `DENY`, null, `billingUsers/${free.id}`);
add(`Free: Cross-Account Domain Denied`, `DENY`, free, `users/${other.id}/domains/${domainId}`);
add(`Free: Cross-Account Snapshot Denied`, `DENY`, free, `users/${other.id}/snapshots/portfolio`);
for (const collection of [`billingAccounts`, `billingCustomers`, `billingEvents`]) {
  for (const viewer of [free, owner]) {
    add(`${viewer.uid}: Private ${collection} Read Denied`, `DENY`, viewer, `${collection}/fixture`);
    add(`${viewer.uid}: Private ${collection} Write Denied`, `DENY`, viewer, `${collection}/fixture`, `create`, { data: { fixture: true } });
  }
}
for (const viewer of [free, starter, inactiveOwner]) add(`${viewer.uid}: Planned Auctions Preview Denied`, `DENY`, viewer, `users/${viewer.id}/auctionInventory/${auctionId}`);
add(`Owner: Planned Auctions Preview Allowed`, `ALLOW`, owner, `users/${owner.id}/auctionInventory/${auctionId}`);
add(`Owner: Planned Auctions Preview Save Allowed`, `ALLOW`, owner, `users/${owner.id}/auctionInventory/${auctionId}`, `create`, { data: { id: auctionId, number: 1 } });
const disabledFeatures = { [`featureSettings/${featureSettingsId}`]: { flags: { notifications: false }, audiences: { notifications: { roles: [`Guest`], plans: [`free`] } } } };
for (const viewer of [free, owner, inactiveOwner]) {
  add(`${viewer.uid}: Disabled Notification And Audience Override`, viewer === owner ? `ALLOW` : `DENY`, viewer, `notifications/fixture`, `get`, { before: { active: true }, documents: disabledFeatures });
}

const run = async () => {
  const authPath = process.env.FIREBASE_CLI_AUTH_PATH || path.join(process.env.APPDATA || ``, `npm/node_modules/firebase-tools/lib/auth.js`);
  const auth = require(authPath);
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error(`Firebase CLI Credentials Unavailable`);
  const access = await auth.getAccessToken(account.tokens.refresh_token, [`https://www.googleapis.com/auth/cloud-platform`]);
  const content = fs.readFileSync(sourcePath, `utf8`);
  const source = { files: [{ name: `firestore.rules`, content }] };
  const results = [];
  const issues = [];
  for (let offset = 0; offset < testCases.length; offset += 40) {
    const batch = testCases.slice(offset, offset + 40);
    const response = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}:test`, {
      method: `POST`,
      signal: AbortSignal.timeout(45_000),
      headers: { Authorization: `Bearer ${access.access_token}`, 'Content-Type': `application/json` },
      body: JSON.stringify({ source, testSuite: { testCases: batch.map(entry => entry.test) } }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`Rules Test API ${response.status}: ${body.error?.message || `Request Failed`}`);
    issues.push(...body.issues || []);
    if (body.testResults?.length !== batch.length) throw new Error(`Rules Test Result Count Did Not Match Request`);
    results.push(...body.testResults.map((result, index) => ({ name: batch[index].name, expectation: batch[index].test.expectation, ...result })));
    console.log(`Rules Batch ${offset / 40 + 1}: ${body.testResults.filter(result => result.state === `SUCCESS`).length}/${batch.length} Passed`);
  }
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const report = {
    projectId,
    at: new Date().toISOString(),
    sourceSha256: crypto.createHash(`sha256`).update(content).digest(`hex`),
    mode: `Firebase Rules API Inline Source And Mocked Service Functions`,
    issues,
    passed: results.filter(result => result.state === `SUCCESS`).length,
    total: results.length,
    results,
  };
  const reportPath = path.join(artifactDirectory, `billing-rules-results.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + `\n`);
  console.log(JSON.stringify({ total: report.total, passed: report.passed, issues, reportPath, failures: results.filter(result => result.state !== `SUCCESS`) }, null, 2));
  if (issues.some(issue => issue.severity === `ERROR`) || report.passed !== report.total) process.exitCode = 1;
};

run().catch(error => { console.error(error.message); process.exitCode = 1; });
