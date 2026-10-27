const path = require('node:path');
const { getDefaultConfig } = require(`expo/metro-config`);

const config = getDefaultConfig(__dirname);
if (process.platform === `win32`) config.maxWorkers = Math.min(config.maxWorkers, 2);

const excludedFolders = [`ai`, `docs`, `dist`, `tests`, `.git`, `.vercel`, `web-build`];
const folderPatterns = excludedFolders.map(folder => {
  const absolutePath = path.join(__dirname, folder).split(path.sep).map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`)).join(`[\\\\/]`);
  return new RegExp(`^${absolutePath}(?:[\\\\/]|$)`);
});
const defaultBlockList = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(defaultBlockList) ? defaultBlockList : defaultBlockList ? [defaultBlockList] : []), ...folderPatterns];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const environment = context.customResolverOptions?.environment;
  if ([`node`, `react-server`].includes(environment) && (moduleName === `firebase-admin` || moduleName.startsWith(`firebase-admin/`))) {
    // Firebase Admin's ESM wrappers expect Node's CommonJS default interop.
    return context.resolveRequest({ ...context, isESMImport: false }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
