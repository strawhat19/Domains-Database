const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, `..`);
const exportRoot = path.resolve(projectRoot, process.env.EXPO_WEB_EXPORT_DIR || `dist`);
const cases = [
  { route: `billing/status`, method: `GET`, status: 401 },
  { route: `admin/payments`, method: `GET`, status: 401 },
  { route: `billing/portal`, method: `POST`, status: 401, body: {} },
  { route: `portfolio/commit`, method: `POST`, status: 401, body: {} },
  { route: `registrars/search`, method: `GET`, importOnly: true },
  { route: `registrars/sync`, method: `POST`, status: 401, errorField: `error`, body: { provider: `godaddy`, values: `GODADDY_PAT=fixture` } },
  { route: `marketplace/afternic`, method: `POST`, status: 401, errorField: `error`, body: { action: `status` } },
  { route: `domain-dns`, method: `POST`, status: 401, errorField: `error`, body: {} },
  { route: `domain-parking`, method: `POST`, status: 401, errorField: `error`, body: {} },
  { route: `auction-availability`, method: `POST`, status: 401, errorField: `error`, body: {} },
  { route: `website-insights`, method: `POST`, status: 401, errorField: `error`, body: {} },
  { route: `billing/reconcile`, method: `POST`, status: 401, body: { sessionId: `cs_live_negativefixture` } },
  { route: `billing/checkout`, method: `POST`, status: 401, body: { planId: `Plan_5_Starter_12_42_AM_10_19_26_a2a2b86106e44cfbb7a70a10526ea9e9`, priceCents: 133, currency: `USD`, billingInterval: `month` } },
  { route: `billing/webhook`, method: `POST`, status: 400, signature: true, body: { id: `evt_negativefixture`, livemode: true, type: `invoice.paid`, data: { object: {} } } },
];
const smoke = `
  const assert = require('node:assert/strict');
  const item = JSON.parse(process.argv[2]);
  const forbid = () => { throw new Error('Provider Network Access Is Forbidden In Startup Checks'); };
  global.fetch = forbid;
  for (const name of ['http', 'https', 'http2', 'net', 'tls']) {
    const library = require('node:' + name);
    for (const key of ['request', 'get', 'connect', 'createConnection']) if (library[key]) library[key] = forbid;
  }
  const handler = require(process.argv[1]);
  assert.equal(typeof handler[item.method], 'function');
  if (!item.importOnly) (async () => {
    const headers = { origin: 'https://domaindatabases.com', 'content-type': 'application/json' };
    if (item.signature) headers['stripe-signature'] = 't=1,v1=' + '0'.repeat(64);
    const response = await handler[item.method](new Request('https://domaindatabases.com/api/' + item.route, {
      method: item.method, headers, ...(item.body ? { body: JSON.stringify(item.body) } : {}),
    }));
    assert.equal(response.status, item.status);
    assert.match(response.headers.get('content-type'), /application\\/json/);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(typeof (await response.json())[item.errorField || 'code'], 'string');
  })().catch(error => { console.error(error); process.exitCode = 1; });
`;

for (const item of cases) test(`Exported ${item.route} Starts And ${item.importOnly ? `Exports Its Handler` : `Rejects Untrusted Requests`}`, () => {
  const filename = path.join(exportRoot, `server/_expo/functions/api/${item.route}+api.js`);
  assert.ok(fs.existsSync(filename), `Run npm run export:web Before Exported Startup Checks`);
  const result = spawnSync(process.execPath, [`-e`, smoke, filename, JSON.stringify(item)], {
    cwd: projectRoot,
    encoding: `utf8`,
    timeout: 20_000,
    env: {
      ...process.env,
      ...(process.env.EXPO_WEB_EXPORT_DIR ? { NODE_PATH: [path.join(projectRoot, `node_modules`), process.env.NODE_PATH].filter(Boolean).join(path.delimiter) } : {}),
      FIREBASE_SERVICE_ACCOUNT_JSON: ``,
      STRIPE_SECRET_KEY: `sk_live_negativefixture`,
      STRIPE_WEBHOOK_SECRET: `whsec_negativefixture`,
      EXPO_PUBLIC_SITE_URL: `https://domaindatabases.com`,
    },
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
