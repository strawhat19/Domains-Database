const { existsSync } = require('node:fs');
const fileSystem = require('node:fs/promises');
const { spawnSync } = require('node:child_process');

const [nodeMajor, nodeMinor] = process.versions.node.split(`.`).map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
  console.error(`Expo SDK 57 Requires Node.js 22.13.0 Or Newer — Run nvm use 22.20.0`);
  process.exit(1);
}

if (process.platform === `darwin` && !process.env.DEVELOPER_DIR) {
  const developerDirectory = `/Applications/Xcode.app/Contents/Developer`;
  if (existsSync(`${developerDirectory}/usr/bin/simctl`)) {
    const selection = spawnSync(`xcode-select`, [`--print-path`], {
      encoding: `utf8`,
      stdio: [`ignore`, `pipe`, `ignore`],
    });
    // Expo probes the simulator even when serving the web app.
    if (selection.status === 0 && selection.stdout?.trim() === `/Library/Developer/CommandLineTools`) {
      process.env.DEVELOPER_DIR = developerDirectory;
    }
  }
}

if (process.platform === `win32`) {
  let activeOperations = 0;
  const waitingOperations = [];
  const maximumOperations = 32;

  // Metro's worker limit does not cover concurrent cache reads and source hashing
  const runFileOperation = async operation => {
    if (activeOperations < maximumOperations) activeOperations++;
    else await new Promise(resolve => waitingOperations.push(resolve));
    try { return await operation(); }
    finally {
      const nextOperation = waitingOperations.shift();
      if (nextOperation) nextOperation();
      else activeOperations--;
    }
  };

  for (const method of [`readFile`, `writeFile`]) {
    const fileOperation = fileSystem[method];
    fileSystem[method] = (...args) => runFileOperation(() => fileOperation.apply(fileSystem, args));
  }
}
