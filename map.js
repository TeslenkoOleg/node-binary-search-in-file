import fs from 'fs/promises';

const filename = './data.csv';

async function main() {
  const fileHandle = await fs.open(filename, 'r');
  for await (const line of fileHandle.readLines()) {
    const splitLine = line.split(',');
    const ip = splitLine[0];
    const fraudPercentage = splitLine[2];
    process.stdout.write(ip + '\t' + fraudPercentage + '\n')
  }
}

main();
