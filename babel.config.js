module.exports = api => {
  api.cache(true);
  return {
    presets: [require.resolve(`expo/internal/babel-preset`)],
    plugins: [require.resolve(`./scripts/babel-lucide-imports.cjs`)],
  };
};
