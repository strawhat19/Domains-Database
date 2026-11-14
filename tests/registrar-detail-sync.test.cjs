const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, `..`);
global.fetch = async () => { throw new Error(`Network Access Is Forbidden In Registrar Detail Tests`); };

const loadSource = (relative, stubs = {}, cache = new Map()) => {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = ts.transpileModule(fs.readFileSync(filename, `utf8`), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const loaded = new Module(filename, module);
  cache.set(filename, loaded);
  loaded.require = specifier => {
    if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
    return specifier.startsWith(`.`)
      ? loadSource(`${path.resolve(path.dirname(filename), specifier)}.ts`, stubs, cache)
      : Module.createRequire(filename)(specifier);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
};

const account = { id: `fixture-connection`, provider: `godaddy` };

test(`Namecheap Sync Reads Only The Matching Owned Registrant`, async () => {
  const list = `namecheap.domains.getList`;
  const dns = `namecheap.domains.dns.getList`;
  const contacts = `namecheap.domains.getContacts`;
  let contactId = 47;
  const calls = [];
  const { getNamecheapDomains } = loadSource(`src/server/registrars/namecheap.ts`, { './request': {
    pauseRequests: async () => undefined,
    requestRegistrar: async url => {
      const command = url.searchParams.get(`Command`);
      calls.push(command);
      const result = command === list
        ? `<DomainGetListResult><Domain ID="47" Name="fixture.com" IsExpired="false" /></DomainGetListResult><Paging><TotalItems>1</TotalItems><CurrentPage>1</CurrentPage><PageSize>100</PageSize></Paging>`
        : command === dns ? `<DomainDNSGetListResult Domain="fixture.com"><Nameserver>ns1.fixture.com</Nameserver></DomainDNSGetListResult>`
          : `<DomainContactsResult Domain="fixture.com" domainnameid="${contactId}"><Registrant><FirstName>Example</FirstName><LastName>Owner</LastName><EmailAddress>owner@example.invalid</EmailAddress><Country>us</Country><Address1>Private</Address1></Registrant><WhoisGuardContact><Registrant><FirstName>Proxy</FirstName></Registrant></WhoisGuardContact></DomainContactsResult>`;
      return `<ApiResponse Status="OK"><CommandResponse Type="${command}">${result}</CommandResponse></ApiResponse>`;
    },
  } });
  const context = { provider: `namecheap`, deadline: Date.now() + 60_000, signal: new AbortController().signal };
  const credentials = { provider: `namecheap`, username: `fixture`, clientIp: `192.0.2.1`, apiKey: `fixture` };
  const result = await getNamecheapDomains(credentials, context);
  assert.deepEqual(calls, [list, dns, contacts]);
  assert.deepEqual(result.domains[0].registrant, { name: `Example Owner`, email: `owner@example.invalid`, country: `US` });
  contactId = 48;
  const mismatched = await getNamecheapDomains(credentials, context);
  assert.equal(mismatched.domains[0].registrant, undefined);
  assert.deepEqual(mismatched.domains[0].nameservers, [`ns1.fixture.com`]);
  assert.equal(mismatched.domains[0].detailsCheckedAt, undefined);
});

test(`Afternic Domain Activity Checks Listing Before Returning A Bounded Daily Report`, async () => {
  const requests = [];
  const context = { authorization: `fixture`, signal: new AbortController().signal };
  const { getAfternicDomainStats } = loadSource(`src/server/marketplaceAfternic/activity.ts`, {
    '../marketplace/access': { MarketplaceError: class extends Error { constructor(status, message) { super(message); this.status = status; } } },
    '../marketplace/records': { domainValue: value => value.toLowerCase() },
    './provider': {
      getAfternicListing: async (_context, domain) => { requests.push(domain); return domain === `owned.com` ? { domain } : null; },
      requestAfternic: async (_context, url) => {
        requests.push(url.pathname);
        assert.equal(url.searchParams.get(`days`), `30`);
        return { stats: [{ date: url.searchParams.get(`startDate`), views: 0, leads: 2 }] };
      },
    },
  });
  await assert.rejects(getAfternicDomainStats(context, { domain: `outside.com`, days: 30 }), { status: 404 });
  const result = await getAfternicDomainStats(context, { domain: `OWNED.COM`, days: 30 });
  assert.deepEqual(requests, [`outside.com`, `owned.com`, `/v3/aftermarket/customers/my/stats/owned.com`]);
  assert.equal(result.domain, `owned.com`);
  assert.deepEqual(result.days, [{ date: result.through.slice(0, 10), views: 0, leads: 2 }]);
});

test(`Vercel External DNS Configuration Is Separate From Confirmed Registrations`, async () => {
  const external = { name: `external.com`, verified: true, serviceType: `zeit.world`, nameservers: [`ns1.vercel-dns.com`] };
  let externalRows = [external];
  const { getVercelDomains } = loadSource(`src/server/registrars/vercel.ts`, { './request': {
    requestRegistrar: async url => url.pathname === `/v5/domains` ? JSON.stringify({
      domains: [{ name: `registered.com`, id: `vercel-registration`, boughtAt: 1_700_000_000_000, serviceType: `external`, verified: true }, ...externalRows],
      pagination: { count: externalRows.length + 1, next: null },
    }) : JSON.stringify({ results: [] }),
  } });
  const credentials = { provider: `vercel`, authorization: `Bearer fixture` };
  const context = { provider: `vercel`, deadline: Date.now() + 30_000, signal: new AbortController().signal };
  const complete = await getVercelDomains(credentials, context);
  assert.deepEqual(complete.domains.map(domain => domain.name), [`registered.com`]);
  assert.equal(complete.vercelConfigurations?.[0].name, `external.com`);
  assert.deepEqual(complete.vercelConfigurations?.[0].observedNameservers, [`ns1.vercel-dns.com`]);
  assert.equal(complete.discoveredDomains, undefined);
  externalRows = [external, { name: `invalid.com` }];
  const partial = await getVercelDomains(credentials, context);
  assert.equal(partial.domains.length, 1);
  assert.equal(partial.vercelConfigurations, undefined);
});

test(`Hostinger Search Ignores Transfer Products And Reuses A Confirmed Standard Catalog Price`, async () => {
  const { searchRegistrar } = loadSource(`src/server/domainSearch/providers.ts`, { './vercel': {}, '../registrars/request': { readLimitedText: async body => new Response(body).text() } });
  const previous = global.fetch;
  const controller = new AbortController();
  const auth = { provider: `hostinger`, authorization: `Bearer fixture` };
  let catalogReads = 0;
  global.fetch = async (url, init) => {
    if (url.pathname === `/api/domains/v1/availability`) {
      const { domain } = JSON.parse(init.body);
      return Response.json([{ domain: `${domain}.com`, is_available: true, is_premium: domain === `premium` }]);
    }
    assert.equal(url.pathname, `/api/billing/v1/catalog`);
    catalogReads++;
    return Response.json([
      { category: `DOMAIN`, name: `.COM Domain`, prices: [{ currency: `USD`, price: 1699, first_period_price: 999, period: 1, period_unit: `year` }] },
      { category: `DOMAIN`, name: `.COM Domain Transfer`, prices: [] },
      { category: `DOMAIN`, name: `.COM.CO Domain`, prices: [] },
    ]);
  };
  try {
    const first = await searchRegistrar(auth, `alpha.com`, controller.signal);
    const second = await searchRegistrar(auth, `bravo.com`, controller.signal);
    const premium = await searchRegistrar(auth, `premium.com`, controller.signal);
    assert.deepEqual(first.registration, { amount: 9.99, currency: `USD`, years: 1 });
    assert.deepEqual(second.renewal, { amount: 16.99, currency: `USD`, years: 1 });
    assert.equal(premium.registration, undefined);
    assert.equal(catalogReads, 1);
  } finally { global.fetch = previous; }
});

const saveHints = (name, providerId, registrarSync, registrarConnectionId = account.id) => ({
  name, providerId, meta: { registrarSync, registrarConnectionId, registrarProvider: account.provider },
});
const makeFixture = (details, inventory = [
  { domain: `alpha.test`, domainId: 10, status: `ACTIVE`, expires: `2027-12-03` },
  { domain: `bravo.test`, domainId: 20, status: `ACTIVE`, expires: `2027-12-03` },
  { domain: `charlie.test`, domainId: 30, status: `ACTIVE`, expires: `2027-12-03` },
]) => {
  const calls = [];
  const mockRequest = {
    pauseRequests: async () => {},
    requestRegistrar: async url => {
      calls.push(url);
      if (url.pathname === `/v1/domains`) return JSON.stringify(inventory);
      const detail = details[url.pathname.split(`/`).at(-1)];
      assert.ok(detail, `Unexpected GoDaddy Detail Request`);
      return JSON.stringify(detail);
    },
  };
  const { getGoDaddyDomains } = loadSource(`src/server/registrars/godaddy.ts`, { './request': mockRequest });
  const sync = selection => getGoDaddyDomains(`Bearer fixture`, {
    provider: `godaddy`, deadline: Date.now() + 60_000, signal: new AbortController().signal,
  }, `00000000-0000-0000-0000-000000000000`, undefined, undefined, selection);
  return { calls, sync };
};

test(`GoDaddy Rotation Keeps Full Inventory And Checks Replaced Registrations`, async () => {
  const { getRegistrarDetailSelection } = loadSource(`src/shared/registrarSync/detailSelection.ts`);
  const { readRegistrarDetailSelection } = loadSource(`src/server/registrars/detailSelection.ts`);
  const checkedAt = new Date(Date.now() - 1000).toISOString();
  const hints = getRegistrarDetailSelection([
    saveHints(`alpha.test`, `11`, { detailsCheckedAt: checkedAt }),
    saveHints(`bravo.test`, `20`, { detailsCheckedAt: checkedAt }),
    saveHints(`charlie.test`, `30`, { detailsCheckedAt: checkedAt }, `unrelated-connection`),
    saveHints(`outside.test`, `99`, {}),
  ], account);
  const selection = readRegistrarDetailSelection({ ...hints, start: `charlie.test` }, account.provider);
  assert.deepEqual(selection.recent.map(([name]) => name).sort(), [`alpha.test`, `bravo.test`]);
  const fixture = makeFixture({
    'charlie.test': { domain: `charlie.test`, domainId: `30`, hostnames: [], dnssecRecords: [], renewal: { renewable: false } },
    'alpha.test': { domain: `alpha.test`, domainId: `10`, renewal: { renewable: true, price: 12_340_000, currency: `USD` } },
  });
  const result = await fixture.sync(selection);
  assert.equal(fixture.calls[0].searchParams.get(`includes`), `nameServers,contacts`);
  assert.equal(fixture.calls[1].searchParams.get(`includes`), `actions,contacts,dnssecRecords,registryStatusCodes`);
  assert.deepEqual(fixture.calls.slice(1).map(call => call.pathname.split(`/`).at(-1)), [`charlie.test`, `alpha.test`]);
  assert.deepEqual(result.domains.map(domain => domain.name), [`alpha.test`, `bravo.test`, `charlie.test`]);
  assert.equal(result.domains[1].detailsAttemptedAt, undefined);
  assert.deepEqual(result.domains[0].renewalEstimate, { amount: 12.34, currency: `USD` });
  assert.ok(Date.parse(result.domains[2].detailsCheckedAt) >= Date.parse(result.domains[2].detailsAttemptedAt));
  assert.equal(result.domains[2].dnssec, false);
  assert.deepEqual(result.domains[2].meta.registrarDetails.registeredHostnames, []);
  assert.equal(result.domains[2].meta.registrarDetails.renewable, false);
});

test(`GoDaddy Details Isolate Malformed Fields And Reject Mismatched Registration IDs`, async () => {
  const fixture = makeFixture({
    'alpha.test': { domain: `alpha.test`, domainId: `999`, status: `CANCELLED`, renewal: { price: 1_000_000, currency: `USD` } },
    'bravo.test': {
      domain: `bravo.test`, domainId: `20`, nameServers: [`NS1.Fixture.test.`, `ns1.fixture.test`],
      hostnames: [`NS1.Bravo.test.`, `ns1.bravo.test`],
      verifications: { icann: `COMPLETED`, realName: `REJECTED_DOCUMENT_OUTDATED`, domainName: `UNABLE_TO_RETRIEVE_STATUS`, unexpected: `ignored` },
      dnssecRecords: [{ algorithm: `RSASHA256`, digestType: `SHA256`, digest: `synthetic-digest` }],
      registryStatusCodes: [`CLIENT_TRANSFER_PROHIBITED`, `CLIENT_TRANSFER_PROHIBITED`],
      modifiedAt: `2026-11-01T10:01:00-04:00`, renewDeadline: `malformed-date`,
      contacts: { registrant: { nameFirst: `Example`, email: `registrant@example.invalid`, phone: `ignored`, addressMailing: { country: `US`, address1: `ignored` } } },
      renewal: { renewable: true, price: 11_000_000, currency: `USD` }, authCode: `ignored`,
    },
    'charlie.test': { renewal: { price: 1_000_000, currency: `USD` } },
  });
  const result = await fixture.sync();
  const [changed, valid, missingIdentity] = result.domains;
  assert.equal(changed.status, `ACTIVE`);
  assert.ok(Date.parse(changed.detailsAttemptedAt));
  assert.equal(changed.detailsCheckedAt, undefined);
  assert.equal(changed.renewalEstimate, undefined);
  assert.equal(missingIdentity.detailsCheckedAt, undefined);
  assert.equal(valid.updatedAt, `2026-11-01T14:01:00.000Z`);
  assert.equal(valid.dnssec, true);
  assert.deepEqual(valid.nameservers, [`ns1.fixture.test`]);
  assert.deepEqual(valid.registrant, { name: `Example`, email: `registrant@example.invalid`, country: `US` });
  assert.deepEqual(valid.meta.registrarDetails.registryStatusCodes, [`CLIENT_TRANSFER_PROHIBITED`]);
  assert.deepEqual(valid.meta.registrarDetails.registeredHostnames, [`ns1.bravo.test`]);
  assert.equal(valid.meta.registrarDetails.icannVerification, `COMPLETED`);
  assert.equal(valid.meta.registrarDetails.realNameVerification, `REJECTED`);
  assert.equal(valid.meta.registrarDetails.domainNameVerification, `UNABLE_TO_RETRIEVE_STATUS`);
  assert.equal(valid.meta.registrarDetails.renewDeadline, undefined);
  assert.equal(JSON.stringify(valid).includes(`ignored`), false);
  assert.equal(JSON.stringify(valid).includes(`synthetic-digest`), false);
  assert.match(result.warnings[0], /^2 GoDaddy Domain Detail Read/);
});

test(`GoDaddy Preserves V1 Registrant Fields When V2 Returns Partial Or Deleted Contacts`, async () => {
  const contactRegistrant = {
    nameFirst: `Legacy`, nameLast: `Contact`, email: `old@example.invalid`, organization: `Legacy LLC`, addressMailing: { country: `US` },
  };
  const inventory = [{
    domain: `alpha.test`, domainId: 10, status: `ACTIVE`, contactRegistrant,
    nameServers: [`ns1.external.test`],
    contactAdmin: { email: `private-admin@example.invalid` },
  }, { domain: `bravo.test`, domainId: 20, status: `ACTIVE`, contactRegistrant, exposeWhois: true }];
  const fixture = makeFixture({
    'alpha.test': {
      domain: `alpha.test`, domainId: `10`, nameServers: [],
      contacts: { registrant: { nameFirst: `Partial`, email: `new@example.invalid`, organization: `\u0000`, exposeRegistrantOrganization: false } },
      verifications: { icann: `APPROVED`, realName: `REJECTED_UNRECOGNIZED`, domainName: `PENDING` },
      hostnames: [`ns1.different.test`],
    },
    'bravo.test': {
      domain: `bravo.test`, domainId: `20`, contacts: { registrant: { _deleted: true, email: `deleted@example.invalid`, exposeWhois: false, exposeRegistrantOrganization: true } },
    },
  }, inventory);
  const [domain, deleted] = (await fixture.sync()).domains;
  assert.deepEqual(domain.registrant, { name: `Legacy Contact`, email: `new@example.invalid`, organization: `Legacy LLC`, country: `US` });
  assert.deepEqual(domain.nameservers, []);
  assert.deepEqual(domain.meta.registrarDetails, { domainNameVerification: `PENDING`, exposeRegistrantOrganization: false });
  assert.equal(JSON.stringify(domain).includes(`private-admin`), false);
  assert.equal(deleted.registrant.email, `old@example.invalid`);
  assert.equal(deleted.meta.registrarDetails.exposeWhois, true);
  assert.equal(deleted.meta.registrarDetails.exposeRegistrantOrganization, undefined);
  assert.equal(deleted.nameservers, undefined);
});

test(`GoDaddy Lifecycle Actions Keep Only Safe In-Progress Workflow Data`, async () => {
  const fixture = makeFixture({
    'alpha.test': { domain: `alpha.test`, domainId: `10`, actions: [
      { type: `TRANSFER_OUT`, status: `AWAITING`, createdAt: `2026-11-01T08:00:00-04:00`, startedAt: `2026-11-01T24:00:00Z`, reason: { message: `ignored` }, requestId: `ignored` },
      { type: `REGISTER`, status: `SUCCESS`, completedAt: `2026-11-02T12:00:00Z` },
      { type: `AUTH_CODE_REGENERATE`, status: `ACCEPTED`, requestId: `ignored` },
      { type: `AUTO_RENEWAL`, status: `PENDING`, modifiedAt: `2026-11-02T12:00:00Z` },
    ] },
    'bravo.test': { domain: `bravo.test`, domainId: `20`, actions: [] },
    'charlie.test': { domain: `charlie.test`, domainId: `30`, actions: [{ type: `REDEEM`, status: 3 }] },
  });
  const [alpha, bravo, charlie] = (await fixture.sync()).domains;
  assert.deepEqual(alpha.meta.registrarDetails.lifecycleActions, [
    { type: `AUTO_RENEWAL`, status: `PENDING`, modifiedAt: `2026-11-02T12:00:00.000Z` },
    { type: `TRANSFER_OUT`, status: `AWAITING`, createdAt: `2026-11-01T12:00:00.000Z` },
  ]);
  assert.deepEqual(bravo.meta.registrarDetails.lifecycleActions, []);
  assert.equal(charlie.meta?.registrarDetails?.lifecycleActions, undefined);
});

test(`GoDaddy Uses The Wire Domain As A Pagination Marker And ASCII For IDN Detail Reads`, async () => {
  const domain = (name, id) => ({ domain: name, domainId: id, status: `ACTIVE` });
  const idn = `Bücher.test`;
  const ascii = `xn--bcher-kva.test`;
  const page = Array.from({ length: 999 }, (_, index) => domain(`fixture-${index}.test`, index + 1));
  page.push(domain(idn, 1000));
  const calls = [];
  const mockRequest = {
    pauseRequests: async () => {},
    requestRegistrar: async url => {
      calls.push(url);
      if (url.searchParams.has(`marker`)) {
        assert.equal(url.searchParams.get(`marker`), idn);
        return JSON.stringify([domain(`next.test`, 1001)]);
      }
      if (url.pathname === `/v1/domains`) return JSON.stringify(page);
      assert.equal(url.pathname.split(`/`).at(-1), ascii);
      return JSON.stringify({ domain: idn, domainId: `1000`, nameServers: [`ns1.bücher.test.`], hostnames: [`ns1.bücher.test`] });
    },
  };
  const { getGoDaddyDomains } = loadSource(`src/server/registrars/godaddy.ts`, { './request': mockRequest });
  const result = await getGoDaddyDomains(`Bearer fixture`, {
    provider: `godaddy`, deadline: Date.now() + 60_000, signal: new AbortController().signal,
  }, `00000000-0000-0000-0000-000000000000`, undefined, undefined, {
    start: ascii, recent: [...page.slice(0, -1).map(row => [row.domain, String(row.domainId)]), [`next.test`, `1001`]],
  });
  assert.equal(calls.length, 3);
  assert.equal(result.domains.length, 1001);
  const registered = result.domains[999];
  assert.equal(registered.name, ascii);
  assert.equal(registered.internationalName, `bücher.test`);
  assert.deepEqual(registered.nameservers, [`ns1.${ascii}`]);
  assert.deepEqual(registered.meta.registrarDetails.registeredHostnames, [`ns1.${ascii}`]);
  assert.ok(Date.parse(registered.detailsCheckedAt));
});

test(`Registrar Details Start With Unattempted Registrations And Validate Hints`, () => {
  const { getRegistrarDetailSelection } = loadSource(`src/shared/registrarSync/detailSelection.ts`);
  const { readRegistrarDetailSelection } = loadSource(`src/server/registrars/detailSelection.ts`);
  const attemptedAt = new Date(Date.now() - 1000).toISOString();
  const result = getRegistrarDetailSelection([
    saveHints(`alpha.test`, `10`, { detailsAttemptedAt: attemptedAt }),
    saveHints(`bravo.test`, `20`, {}),
    saveHints(`aardvark.test`, `30`, {}, `unrelated-connection`),
  ], account);
  assert.deepEqual(result, { start: `bravo.test`, recent: [] });
  assert.throws(() => readRegistrarDetailSelection({ ...result, start: `not-a-domain:/alpha.test` }, account.provider), { status: 400 });
  assert.throws(() => readRegistrarDetailSelection({ ...result, recent: [[`alpha.test`, `invalid/id`]] }, account.provider), { status: 400 });
});

test(`GoDaddy DNS Lists Four Filtered Types And Reports Partial Coverage`, async () => {
  const request = loadSource(`src/server/registrars/request.ts`);
  const { getGoDaddyDns } = loadSource(`src/server/domainDns/provider.ts`, {
    '../registrars/request': { readLimitedText: request.readLimitedText, pauseRequests: async () => {} },
  });
  const previous = global.fetch;
  const calls = [];
  let nameServers = [`ns1.domaincontrol.com`, `ns2.domaincontrol.com`];
  global.fetch = async (url, init) => {
    calls.push(url);
    assert.equal(url.origin, `https://api.godaddy.com`);
    assert.equal(init.method, `GET`);
    assert.equal(init.redirect, `error`);
    if (url.pathname === `/v1/domains/fixture.test`) {
      return Response.json({ nameServers, domain: `fixture.test`, domainId: 10, status: `ACTIVE`, authCode: `ignored` });
    }
    assert.equal(url.pathname, `/v3/domains/zones/fixture.test/dns-records`);
    assert.equal(url.searchParams.get(`fields`), `name,type,data,ttl,priority`);
    const type = url.searchParams.get(`type`);
    if (type === `A`) return Response.json({ items: [{ name: `@`, type, ttl: 900, data: `192.0.2.1` }], links: [{ rel: `next`, href: `https://ignored.invalid/` }] });
    if (type === `AAAA`) return Response.json({ items: [{ name: `@`, type: `TXT`, ttl: 900, data: `fixture-secret` }], links: [] });
    if (type === `CNAME`) return Response.json({ items: [{ name: `www`, type, ttl: 900, data: `target.fixture.test.` }], links: [] });
    if (type === `MX`) return Response.json({ items: [{ name: `@`, type, ttl: 900, data: `.`, priority: 0 }], links: [] });
    assert.fail(`Unexpected Zone Record Type`);
  };
  try {
    const result = await getGoDaddyDns(`fixture.test`, `10`, `Bearer fixture`, new AbortController().signal);
    assert.deepEqual(calls.slice(1).map(url => url.searchParams.get(`type`)), [`A`, `AAAA`, `CNAME`, `MX`]);
    assert.equal(result.source, `GoDaddy DNS Zone`);
    assert.deepEqual(result.coverage.map(part => part.status), [`truncated`, `unavailable`, `complete`, `complete`]);
    assert.deepEqual(result.records.map(record => record.value), [`192.0.2.1`, `target.fixture.test`, `.`]);
    assert.equal(JSON.stringify(result).includes(`fixture-secret`), false);
    assert.equal(JSON.stringify(result).includes(`authCode`), false);
    await assert.rejects(() => getGoDaddyDns(`fixture.test`, `11`, `Bearer fixture`, new AbortController().signal), { status: 409 });
    assert.equal(calls.length, 6);
    for (const incomplete of [[`NS1.DomainControl.com.`, `ns1.domaincontrol.com`], [`ns1.domaincontrol.com`, `ns?:/broken`]]) {
      nameServers = incomplete;
      await assert.rejects(() => getGoDaddyDns(`fixture.test`, `10`, `Bearer fixture`, new AbortController().signal), { status: 422 });
      assert.equal(calls.at(-1).pathname, `/v1/domains/fixture.test`);
    }
    assert.equal(calls.length, 8);
  } finally { global.fetch = previous; }
});

test(`GoDaddy DNS Route Uses The Scoped Saved Connection And Rejects Changed Records`, async () => {
  const actor = { id: `User_1_Fixture_1_00_PM_10_23_26_scope` };
  const domainId = `Domain_1_Fixture_1_00_PM_10_23_26_record`;
  const connectionId = `Connection_1_Fixture_1_00_PM_10_23_26_connection`;
  const domain = {
    id: domainId, uid: actor.id, name: `fixture.test`, providerId: `10`, type: `Domain`, number: 1, registrar: `GoDaddy`,
    meta: { domainSource: `registrar`, registrarConnectionId: connectionId, registrarProvider: `godaddy` },
  };
  const connection = { id: connectionId, number: 1, provider: `godaddy`, values: `GODADDY_PAT=fixture` };
  for (const changedCollection of [undefined, `connections`, `domains`]) {
    const calls = [];
    const db = { doc: parent => {
      assert.equal(parent, `users/${actor.id}`);
      return { collection: name => ({ doc: id => {
        assert.equal(id, name === `domains` ? domainId : connectionId);
        let reads = 0;
        return { get: async () => {
          reads++;
          const revision = changedCollection === name && reads > 1 ? 2 : 1;
          return { data: () => name === `domains` ? domain : connection, updateTime: { revision, isEqual: saved => saved.revision === revision } };
        } };
      } }) };
    } };
    const { handleDomainDns } = loadSource(`src/server/domainDns/http.ts`, {
      'expo-crypto': {},
      '../billing/firebase': { getBillingDatabase: () => db },
      '../featureAccess/auth': { requireRegistrarAccess: async () => ({ actor }) },
      './provider': { getGoDaddyDns: async (name, id, authorization) => {
        calls.push({ name, id, authorization });
        return { source: `GoDaddy DNS Zone` };
      } },
    });
    const request = new Request(`https://fixture.test/api/domain-dns`, {
      method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ domainId }),
    });
    const response = await handleDomainDns(request);
    assert.equal(response.status, changedCollection ? 409 : 200);
    assert.match(response.headers.get(`Cache-Control`), /no-store/);
    assert.deepEqual(calls, [{ name: `fixture.test`, id: `10`, authorization: `Bearer fixture` }]);
  }
});
