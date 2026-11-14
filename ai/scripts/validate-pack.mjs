import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../..`);
const aiRoot = path.join(root, `ai`);
const agents = path.join(root, `AGENTS.md`);
const rootCode = path.join(root, `CODE.md`);
const errors = [];
const files = [];
const directories = new Set([aiRoot]);
const markdown = new Map();
const anchors = new Map();
const legacySkillNames = new Map([[`design`, `logo-mockup-guides`]]);
let linkCount = 0;
let skillCount = 0;
const relative = value => path.relative(root, value).split(path.sep).join(`/`);
const inside = (base, value) => value === base || value.startsWith(`${base}${path.sep}`);
const report = (file, message, line) => errors.push(`${relative(file)}${line ? `:${line}` : ``}: ${message}`);
const read = file => fs.readFileSync(file, `utf8`).replace(/^\uFEFF/, ``);
const required = file => {
  if (file !== agents && !files.includes(file) || !fs.existsSync(file)) { report(file, `Required Pack File Is Missing Or Unsafe`); return false; }
  const entry = fs.lstatSync(file);
  if (entry.isSymbolicLink()) { report(file, `Required File Must Not Be A Symlink`); return false; }
  if (!entry.isFile()) { report(file, `Required File Is Missing`); return false; }
  if (!entry.size) { report(file, `Required File Is Empty`); return false; }
  return true;
};
const walk = directory => {
  if (!fs.existsSync(directory)) { report(directory, `Required Directory Is Missing`); return; }
  if (fs.lstatSync(directory).isSymbolicLink()) { report(directory, `Pack Directory Must Not Be A Symlink`); return; }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) { report(file, `Symlinks Cannot Prove Copyable Pack Contents`); continue; }
    if (entry.isDirectory()) { directories.add(file); walk(file); }
    else if (entry.isFile()) files.push(file);
  }
};
const prose = text => {
  let fence = null;
  let frontmatter = false;
  return text.split(/\r?\n/).map((line, index) => {
    if (index === 0 && line.trim() === `---`) { frontmatter = true; return ``; }
    if (frontmatter) { if (line.trim() === `---`) frontmatter = false; return ``; }
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return ``;
    }
    return fence ? `` : line;
  });
};
const slug = text => text.replace(/<[^>]*>/g, ``).replace(/\[([^\]]+)\]\([^)]+\)/g, `$1`).replace(/&(?:amp|lt|gt|quot|apos);/g, ` `).toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, ``).trim().replace(/\s/g, `-`);
const markdownAnchors = lines => {
  const result = new Set();
  const duplicates = new Map();
  const add = heading => {
    const base = slug(heading);
    let count = duplicates.get(base) ?? 0;
    while (result.has(count ? `${base}-${count}` : base)) count++;
    result.add(count ? `${base}-${count}` : base);
    duplicates.set(base, count + 1);
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/);
    if (heading) add(heading[1]);
    else if (index > 0 && /^ {0,3}(?:=+|-+)\s*$/.test(line) && lines[index - 1].trim()) add(lines[index - 1]);
    for (const match of line.matchAll(/<(?:a|h[1-6])\b[^>]*(?:id|name)=["']([^"']+)["'][^>]*>/gi)) result.add(match[1]);
  }
  return result;
};

walk(aiRoot);
if (required(agents)) files.push(agents);
const fileSet = new Set(files);
const rootCodeStat = fs.existsSync(rootCode) ? fs.lstatSync(rootCode) : null;
if (rootCodeStat?.isFile() && !rootCodeStat.isSymbolicLink()) fileSet.add(rootCode);
for (const file of files.filter(value => value.endsWith(`.md`))) {
  const lines = prose(read(file));
  markdown.set(file, lines);
  anchors.set(file, markdownAnchors(lines));
}
const checkLink = (source, raw, line) => {
  const destination = raw.trim();
  if (!destination || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) return;
  const match = destination.match(/^<([^>]+)>|^(\S+)/);
  const value = match?.[1] ?? match?.[2];
  if (!value) return;
  let decoded;
  try { decoded = decodeURIComponent(value); }
  catch { report(source, `Malformed Local Link: ${value}`, line); return; }
  const separator = decoded.indexOf(`#`);
  const targetPath = separator < 0 ? decoded : decoded.slice(0, separator);
  const fragment = separator < 0 ? `` : decoded.slice(separator + 1);
  const target = targetPath ? path.resolve(path.dirname(source), targetPath) : source;
  linkCount++;
  if (target === rootCode && !fileSet.has(rootCode)) return;
  if (!inside(aiRoot, target) && target !== agents && target !== rootCode) { report(source, `Local Link Leaves Copyable Pack: ${value}`, line); return; }
  if (!fileSet.has(target) && !directories.has(target)) { report(source, `Missing Or Case-Mismatched Local Link: ${value}`, line); return; }
  if (fragment && markdown.has(target) && !anchors.get(target).has(fragment)) report(source, `Missing Markdown Anchor: ${value}`, line);
};
for (const [file, lines] of markdown) {
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) checkLink(file, match[1], index + 1);
    const definition = line.match(/^ {0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/);
    if (definition) checkLink(file, definition[1], index + 1);
  });
}

const names = new Set();
for (const file of files.filter(value => path.basename(value) === `SKILL.md`)) {
  skillCount++;
  const frontmatter = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter) { report(file, `Skill Frontmatter Is Missing`); continue; }
  const name = frontmatter.match(/^name:\s*["']?([a-z\d-]+)["']?\s*$/m)?.[1];
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const folder = path.basename(path.dirname(file));
  if (!name || name.length > 64 || name !== folder && legacySkillNames.get(folder) !== name) report(file, `Skill Name Must Match Its Folder Or A Documented Legacy Alias Using Lowercase Letters, Digits And Hyphens`);
  if (name && names.has(name)) report(file, `Duplicate Skill Name: ${name}`);
  if (name) names.add(name);
  if (!description || /^['"]{2}$/.test(description) || (/^[|>][-+]?\s*$/.test(description) && !/^description:[^\n]*\n[ \t]+\S/m.test(frontmatter))) report(file, `Skill Description Is Missing`);
}

const notices = [
  `ai/LICENSE`,
  `ai/README.md`,
  `ai/adoption.md`,
  `ai/skills/admin/assets/analytics/brands/LICENSE.md`,
  `ai/skills/admin/assets/analytics/brands/sources.json`,
  `ai/skills/admin/assets/analytics/flags/LICENSE.txt`,
  `ai/skills/admin/assets/analytics/flags/codes.json`,
  `ai/skills/admin/assets/analytics/flags/sources.json`,
  `ai/skills/admin/assets/analytics/languages/LICENSE.md`,
  `ai/skills/admin/assets/analytics/languages/sources.json`,
  `ai/skills/admin/assets/analytics/languages/licenses/README.md`,
  `ai/skills/admin/assets/analytics/languages/licenses/sources.json`,
  `ai/skills/admin/assets/analytics/languages/licenses/GNU-Bash-MIT-LICENSE.txt`,
  `ai/skills/admin/assets/analytics/languages/licenses/JavaScript-MIT-LICENSE.txt`,
  `ai/skills/admin/assets/analytics/languages/licenses/GNU-Bash-Assets-LICENSE.txt`,
];
for (const notice of notices) required(path.join(root, notice));
if (fileSet.has(path.join(aiRoot, `LICENSE`)) && !/MIT License[\s\S]*Copyright \(c\) 2026 strawhat19/.test(read(path.join(aiRoot, `LICENSE`)))) report(path.join(aiRoot, `LICENSE`), `Original MIT Copyright Notice Is Missing`);
if (fileSet.has(agents) && !/copyright 2026 strawhat19/i.test(read(agents))) report(agents, `Original Copyright Notice Is Missing`);

const json = file => {
  if (!required(file)) return undefined;
  try { return JSON.parse(read(file)); }
  catch { report(file, `Invalid JSON`); return undefined; }
};
const asset = (manifest, value) => {
  if (typeof value !== `string` || !value || value.includes(`\\`) || path.isAbsolute(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) { report(manifest, `Invalid Local Asset Path`); return null; }
  const target = path.resolve(path.dirname(manifest), value);
  if (!inside(path.dirname(manifest), target)) { report(manifest, `Asset Path Escapes Its Catalog: ${value}`); return null; }
  if (!fileSet.has(target)) { report(manifest, `Missing Or Case-Mismatched Catalog Asset: ${value}`); return null; }
  return target;
};
const analytics = path.join(aiRoot, `skills/admin/assets/analytics`);
for (const catalog of [`brands`, `languages`]) {
  const manifest = path.join(analytics, catalog, `sources.json`);
  const records = json(manifest);
  if (records === undefined) continue;
  if (!Array.isArray(records)) { report(manifest, `Asset Catalog Must Be An Array`); continue; }
  const listed = new Set();
  for (const record of records) {
    const target = asset(manifest, record?.file);
    if (target && listed.has(target)) report(manifest, `Duplicate Catalog Asset: ${record.file}`);
    if (target) listed.add(target);
  }
  for (const file of files.filter(value => path.dirname(value) === path.dirname(manifest) && /\.(?:svg|png|webp|jpe?g|gif)$/i.test(value))) if (!listed.has(file)) report(file, `Asset Has No Source Catalog Entry`);
}
const flagsManifest = path.join(analytics, `flags/codes.json`);
const flagCodes = json(flagsManifest);
const flagSource = json(path.join(analytics, `flags/sources.json`));
if (Array.isArray(flagCodes)) {
  const listed = new Set();
  for (const code of flagCodes) {
    if (typeof code !== `string` || !/^[a-z]{2}(?:-[a-z\d]{2,3})?$/.test(code)) { report(flagsManifest, `Invalid Country Asset Code`); continue; }
    const target = asset(flagsManifest, `${code}.svg`);
    if (target && listed.has(target)) report(flagsManifest, `Duplicate Country Asset Code: ${code}`);
    if (target) listed.add(target);
  }
  for (const file of files.filter(value => path.dirname(value) === path.dirname(flagsManifest) && value.endsWith(`.svg`))) if (!listed.has(file)) report(file, `Flag Has No Catalog Code`);
  if (!Array.isArray(flagSource?.codes) || JSON.stringify([...flagCodes].sort()) !== JSON.stringify([...flagSource.codes].sort())) report(flagsManifest, `Country Code And Source Catalogs Differ`);
} else if (flagCodes !== undefined) report(flagsManifest, `Country Codes Must Be An Array`);
const licenseManifest = path.join(analytics, `languages/licenses/sources.json`);
const licenseSources = json(licenseManifest);
if (licenseSources && typeof licenseSources === `object` && !Array.isArray(licenseSources)) for (const filename of Object.keys(licenseSources)) asset(licenseManifest, filename);
else if (licenseSources !== undefined) report(licenseManifest, `License Sources Must Be An Object`);

const assetCount = files.filter(file => inside(analytics, file)).length;
if (errors.length) {
  console.error(`Pack Integrity Failed: ${errors.length} Error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else console.log(`Pack Integrity Passed: ${skillCount} Skill(s), ${markdown.size} Markdown File(s), ${linkCount} Local Link(s), ${assetCount} Analytics Asset File(s)`);
