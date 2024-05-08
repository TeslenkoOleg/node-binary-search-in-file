import fs from 'fs/promises';

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log("No all arguments provided. See README.md for more information.");
  process.exit();
}
const SEARCH_VALUE = args[0];
const DEFAULT_CHUNK_SIZE = +args[1]; // depends on the data size and the system memory
const DEFAULT_COMPARE_FN = async (searchValue, candidateValue) => {
  if (searchValue > candidateValue) {
    return 1;
  } else if (searchValue < candidateValue) {
    return -1;
  } else {
    return 0;
  }
};


const DEFAULT_DELIMITER = "\n";
const FILENAME = 'sorted.data';

console.time('binarySearchInFile');
binarySearchInFile({
  filename: FILENAME,
  searchValue: SEARCH_VALUE,
})
    .then(console.log)
    .then(() => console.timeEnd('binarySearchInFile'));

export async function readChunk({ fileHandle, chunkSize, position }) {
  const { buffer, bytesRead } = await fileHandle.read({
    buffer: Buffer.alloc(Number(chunkSize)),
    length: Number(chunkSize),
    position: Number(position)
  });

  if (bytesRead === chunkSize) {
    return buffer;
  } else {
    const bufferCorrectSize = Buffer.allocUnsafe(bytesRead);
    buffer.copy(bufferCorrectSize, 0, 0, bytesRead);
    return bufferCorrectSize;
  }
}

export async function binarySearchInFile({
  filename,
  searchValue,
  compareFn = DEFAULT_COMPARE_FN,
  chunkSize = DEFAULT_CHUNK_SIZE,
  delimiter = DEFAULT_DELIMITER,
} = {}) {
  if (!filename) throw new Error('"filename" required');
  if (!searchValue) throw new Error('"searchValue" required');

  const fileHandle = await fs.open(filename, 'r');
  const stats = await fileHandle.stat();

  let start = 0;
  let end = stats.size;

  while (start < end) {
    let mid = Math.floor((start + end) / 2);

    let readMore = true;
    let data = '';
    let parts = [];
    let position = mid;

    while (readMore) {
      data += await readChunk({ fileHandle, chunkSize, position });
      parts = data.split(delimiter);
      position += chunkSize;
      readMore = (mid === 0 && parts.length < 2) || parts.length < 3;
      if (position > stats.size) {
        await fileHandle.close();
        return { found: false };
      }
    }

    const midLine = mid === 0 ? parts[0] : parts[1];
    const cmpResult = await compareFn(searchValue, midLine.split('\t')[0]);

    if (cmpResult === 0) {
      await fileHandle.close();
      return { found: true, record: midLine, searchValue };
    } else if (cmpResult === 1) {
      start = mid;
    } else if (cmpResult === -1) {
      end = mid;
    } else {
      throw new Error('"compareFn" should return 0|1|-1')
    }

    if (start === mid && (end - start) === 1) {
      await fileHandle.close();
      return { found: false, searchValue };
    }
  }

  await fileHandle.close();
  return { found: false, record: null };
}
