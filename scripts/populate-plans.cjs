const path = require('node:path');
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { stripTypeScriptTypes } = require('node:module');

const repository = path.resolve(__dirname, `..`);
const catalog = JSON.parse(readFileSync(path.join(repository, `plans-catalog.json`), `utf8`));
const projectIndex = process.argv.indexOf(`--project`);
const project = projectIndex < 0 ? `` : process.argv[projectIndex + 1];
if (!project || !/^[a-z][a-z0-9-]+$/.test(project)) throw new Error(`Pass The Firebase Project With --project`);

const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString(`base64`)}`;
const sharedIds = async () => {
  const types = stripTypeScriptTypes(readFileSync(path.join(repository, `src/types/types.ts`), `utf8`), { mode: `transform` });
  const ids = stripTypeScriptTypes(readFileSync(path.join(repository, `src/shared/common/ids.ts`), `utf8`));
  // Execute the app's ID helper with Node's UUID source; no app bundle is built.
  return import(dataUrl(ids.replace(`'expo-crypto'`, `'node:crypto'`).replace(`'../../types/types'`, JSON.stringify(dataUrl(types)))));
};
const encode = value => {
  if (typeof value === `string`) return { stringValue: value };
  if (typeof value === `boolean`) return { booleanValue: value };
  if (Number.isSafeInteger(value)) return { integerValue: `${value}` };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  throw new Error(`Unsupported Catalog Value`);
};
const fields = record => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, encode(value)]));
const previousNumber = (counter, getAppCollectionIDNumber) => {
  if (!counter) return 0;
  const number = Number(counter.fields?.number?.integerValue);
  const id = counter.fields?.lastPlanId?.stringValue;
  if (Object.keys(counter.fields ?? {}).length !== 2 || !Number.isSafeInteger(number) || number < 1
    || getAppCollectionIDNumber(id, `Plan`) !== number) throw new Error(`Saved Plan Counter Needs Attention`);
  return number;
};
const populate = async () => {
  const firebaseRoot = path.join(execFileSync(`npm`, [`root`, `-g`], { encoding: `utf8` }).trim(), `firebase-tools/lib`);
  const { Client } = require(path.join(firebaseRoot, `apiv2`));
  const { firestoreOrigin } = require(path.join(firebaseRoot, `api`));
  const { requireAuth } = require(path.join(firebaseRoot, `requireAuth`));
  const { getProjectDefaultAccount, setActiveAccount } = require(path.join(firebaseRoot, `auth`));
  const options = { project, nonInteractive: true };
  const account = getProjectDefaultAccount(repository);
  if (account) setActiveAccount(options, account);
  await requireAuth(options);

  const { genID, getAppCollectionIDNumber } = await sharedIds();
  const client = new Client({ auth: true, apiVersion: `v1`, urlPrefix: firestoreOrigin() });
  const documents = `projects/${project}/databases/(default)/documents`;
  const counterPath = `${documents}/counters/plans`;
  const results = [];
  for (const plan of catalog.plans) {
    const slugPath = `${documents}/planSlugs/${plan.slug}`;
    const snapshot = await client.post(`${documents}:batchGet`, { documents: [counterPath, slugPath] });
    const counter = snapshot.body.find(entry => entry.found?.name === counterPath)?.found;
    const reservation = snapshot.body.find(entry => entry.found?.name === slugPath)?.found;
    if (reservation) {
      results.push({ name: plan.name, status: `Kept Existing Plan`, id: reservation.fields?.id?.stringValue });
      continue;
    }
    const number = previousNumber(counter, getAppCollectionIDNumber) + 1;
    const identity = genID(`Plan`, number, plan.name);
    const record = { ...plan, number, id: identity.id, type: `Plan` };
    const writes = [
      {
        currentDocument: { exists: false },
        update: { name: `${documents}/plans/${record.id}`, fields: fields(record) },
        updateTransforms: [`created`, `updated`].map(fieldPath => ({ fieldPath, setToServerValue: `REQUEST_TIME` })),
      },
      {
        currentDocument: counter ? { updateTime: counter.updateTime } : { exists: false },
        update: { name: counterPath, fields: fields({ number, lastPlanId: record.id }) },
      },
      {
        currentDocument: { exists: false },
        update: { name: slugPath, fields: fields({ id: record.id, slug: plan.slug }) },
      },
    ];
    // Compare-and-set the counter and reserve the slug in the same atomic commit.
    const saved = await client.post(`${documents}:commit`, { writes });
    const result = { name: plan.name, status: `Published`, number, id: record.id, priceCents: plan.priceCents, committedAt: saved.body.commitTime };
    results.push(result);
    console.log(JSON.stringify(result));
  }
  console.log(JSON.stringify({ project, results }, null, 2));
};

populate().catch(failure => { console.error(failure.message); process.exitCode = 1; });
