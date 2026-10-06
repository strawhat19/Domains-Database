const fileSystem = require('node:fs/promises');

const [nodeMajor, nodeMinor] = process.versions.node.split(`.`).map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
  console.error(`Expo SDK 57 Requires Node.js 22.13.0 Or Newer — Run nvm use 22.20.0`);
  process.exit(1);
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
