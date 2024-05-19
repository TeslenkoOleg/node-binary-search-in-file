const fs = require('fs');
const DEFAULT_COMPARE_FN = (searchValue, candidateValue) => {
  if (searchValue > candidateValue) {
    return 1;
  } else if (searchValue < candidateValue) {
    return -1;
  } else {
    return 0;
  }
};

function readChunk({ fileHandle, chunkSize, position }) {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.alloc(Number(chunkSize));
        fs.read(fileHandle, buffer, 0, Number(chunkSize), Number(position), (err, bytesRead, chunkBuffer) => {
            if (err) {
                reject(err);
            } else {
                if (bytesRead === Number(chunkSize)) {
                    resolve(chunkBuffer);
                } else {
                    const bufferCorrectSize = Buffer.allocUnsafe(bytesRead);
                    chunkBuffer.copy(bufferCorrectSize, 0, 0, bytesRead);
                    resolve(bufferCorrectSize);
                }
            }
        });
    });
}

function binarySearchInFile(filePath, searchValue, chunkSize = 1024, callback) {
    let foundRecord = {found: false};
    fs.open(filePath, 'r', (err, fileDescriptor) => {
        if (err) {
            return void callback(err);
        }
        fs.stat(filePath, async (err, stats) => {
            if (err) {return void callback(err);}
            let start = 0;
            let end = stats.size;
            while (start < end) {
                let mid = Math.floor((start + end) / 2);
                let readMore = true;
                let data = '';
                let parts = [];
                let position = mid;
                while (readMore) {
                    data += await readChunk({fileHandle: fileDescriptor, chunkSize, position});
                    parts = data.split('\n');
                    position += chunkSize;
                    readMore = (mid === 0 && parts.length < 2) || parts.length < 3;
                    if (position > stats.size) {
                        fs.close(fileDescriptor, () => {});
                        return void callback(null, foundRecord); // void return undefined and exit the function /// better optimization
                    }
                }
                const midLine = mid === 0 ? parts[0] : parts[1];
                const splitMidLine = midLine.split('\t');
                const cmpResult = DEFAULT_COMPARE_FN(searchValue, splitMidLine[0]);
                if (cmpResult === 0) {
                    fs.close(fileDescriptor, () => {});
                    foundRecord = {found: true, key: splitMidLine[0], value: splitMidLine[1]};
                    return void callback(null, foundRecord);
                } else if (cmpResult === 1) {
                    start = mid;
                } else if (cmpResult === -1) {
                    end = mid;
                } else {
                    return void callback(new Error('"compareFn" should return 0|1|-1'));
                }
                if (start === mid && (end - start) === 1) {
                    fs.close(fileDescriptor, () => {});
                    return void callback(null, foundRecord);
                }
            }
            fs.close(fileDescriptor, () => {});
            callback(null, foundRecord); // void not necessarily  because it is the last statement
        });
    });
}
async function wrappedBinarySearchPromise(filePath, valueToSearch, chunkSize = 1024) {
    return new Promise((resolve, reject) => {
        binarySearchInFile(filePath, valueToSearch, chunkSize,(err, record) => {
            if (err) {
                reject(err);
            } else {
                resolve(record);
            }
        });
    });
}

module.exports.wrappedBinarySearchPromise = wrappedBinarySearchPromise;
