const path = require('node:path');
const { readFileSync, existsSync } = require('node:fs');

const iconImports = new Map();
const packages = new Set([`lucide-react`, `lucide-react-native`]);

const readIconImports = packageName => {
  if (iconImports.has(packageName)) return iconImports.get(packageName);
  let packageDirectory = path.dirname(require.resolve(packageName));
  let packageDefinition;
  while (true) {
    const manifest = path.join(packageDirectory, `package.json`);
    if (existsSync(manifest)) {
      const definition = JSON.parse(readFileSync(manifest, `utf8`));
      if (definition.name === packageName) {
        packageDefinition = definition;
        break;
      }
    }
    const parentDirectory = path.dirname(packageDirectory);
    if (parentDirectory === packageDirectory) throw new Error(`Lucide Package Manifest Was Not Found: ${packageName}`);
    packageDirectory = parentDirectory;
  }
  const imports = new Map();
  const moduleFile = packageDefinition.module ?? packageDefinition.exports?.[`.`]?.import;
  if (typeof moduleFile === `string`) {
    const modulePath = path.resolve(packageDirectory, moduleFile);
    const source = readFileSync(modulePath, `utf8`);
    const exports = source.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"](\.\/icons\/[^'"]+\.mjs)['"]/g);
    for (const match of exports) {
      const iconPath = path.resolve(path.dirname(modulePath), match[2]);
      if (!existsSync(iconPath)) continue;
      const iconSource = packageName === `lucide-react-native` && packageDefinition.exports?.[`./icons/*`]
        ? `${packageName}/icons/${path.basename(iconPath, `.mjs`)}` : iconPath.replaceAll(`\\`, `/`);
      for (const specifier of match[1].split(`,`)) {
        const name = specifier.trim().match(/^default\s+as\s+([\w$]+)$/)?.[1];
        if (name) imports.set(name, iconSource);
      }
    }
  }
  iconImports.set(packageName, imports);
  return imports;
};

module.exports = ({ types }) => ({
  name: `direct-lucide-icon-imports`,
  visitor: {
    ImportDeclaration(importPath) {
      const { node } = importPath;
      if (!packages.has(node.source.value) || [`type`, `typeof`].includes(node.importKind)) return;
      const imports = readIconImports(node.source.value);
      const remaining = [];
      const replacements = [];
      for (const specifier of node.specifiers) {
        const iconSource = types.isImportSpecifier(specifier) && ![`type`, `typeof`].includes(specifier.importKind)
          ? imports.get(specifier.imported.name ?? specifier.imported.value) : undefined;
        if (!iconSource) remaining.push(specifier);
        else replacements.push(types.importDeclaration([types.importDefaultSpecifier(types.cloneNode(specifier.local))], types.stringLiteral(iconSource)));
      }
      if (!replacements.length) return;
      if (remaining.length) {
        node.specifiers = remaining;
        importPath.insertAfter(replacements);
      } else importPath.replaceWithMultiple(replacements);
    },
  },
});
