const { getDefaultConfig } = require(`expo/metro-config`);

const config = getDefaultConfig(__dirname);
if (process.platform === `win32`) config.maxWorkers = Math.min(config.maxWorkers, 2);

module.exports = config;
