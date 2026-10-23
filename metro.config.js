const { getDefaultConfig } = require(`expo/metro-config`);

const config = getDefaultConfig(__dirname);
if (process.platform === `win32`) config.maxWorkers = Math.min(config.maxWorkers, 2);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const environment = context.customResolverOptions?.environment;
  if ([`node`, `react-server`].includes(environment) && (moduleName === `firebase-admin` || moduleName.startsWith(`firebase-admin/`))) {
    // Firebase Admin's ESM wrappers expect Node's CommonJS default interop.
    return context.resolveRequest({ ...context, isESMImport: false }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
