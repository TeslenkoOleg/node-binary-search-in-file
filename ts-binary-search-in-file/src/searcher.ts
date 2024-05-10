import fs from 'fs/promises';
export class Searcher{

    public filename: string;
    public searchValue: string;
    public delimiter: string;
    public chunkSize: number;
    constructor(filename: string, searchValue: string, delimiter: string, chunkSize: number) {
        this.filename = filename;
        this.searchValue = searchValue;
        this.delimiter = delimiter;
        this.chunkSize = chunkSize;
    }


async readChunk(fileHandle: any, chunkSize: number, position: number ) {
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

async binarySearchInFile() {
  if (!this.filename) throw new Error('"filename" required');
  if (!this.searchValue) throw new Error('"searchValue" required');

  const fileHandle = await fs.open(this.filename, 'r');
  const stats = await fileHandle.stat();

  let start = 0;
  let end = stats.size;

  while (start < end) {
    let mid = Math.floor((start + end) / 2);

    let readMore = true;
    let data = '';
    let parts: any[] = [];
    let position = mid;

    while (readMore) {
      data += await this.readChunk(fileHandle, this.chunkSize, position);
      parts = data.split(this.delimiter);
      position += this.chunkSize;
      readMore = (mid === 0 && parts.length < 2) || parts.length < 3;
      if (position > stats.size) {
        await fileHandle.close();
        return { found: false };
      }
    }

    const midLine = mid === 0 ? parts[0] : parts[1];
    const cmpResult = await this.compareFn(this.searchValue, midLine.split('\t')[0]);

    if (cmpResult === 0) {
      await fileHandle.close();
      return { found: true, record: midLine, searchValue: this.searchValue };
    } else if (cmpResult === 1) {
      start = mid;
    } else if (cmpResult === -1) {
      end = mid;
    } else {
      throw new Error('"compareFn" should return 0|1|-1')
    }

    if (start === mid && (end - start) === 1) {
      await fileHandle.close();
      return { found: false, searchValue: this.searchValue };
    }
  }

  await fileHandle.close();
  return { found: false, record: null };
}

async compareFn(searchValue: string, candidateValue: string){
  if (searchValue > candidateValue) {
    return 1;
  } else if (searchValue < candidateValue) {
    return -1;
  } else {
    return 0;
  }
}
}
