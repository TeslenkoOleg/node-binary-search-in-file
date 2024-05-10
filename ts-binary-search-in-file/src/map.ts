import fs from 'fs/promises';
export class Map {
    public filename: string;
    public primaryIndex: number;
    public secondaryIndex: number;
    constructor(filename: string, primaryIndex: number, secondaryIndex: number) {
        this.filename = filename;
        this.primaryIndex = primaryIndex;
        this.secondaryIndex = secondaryIndex;
    }
    async run() {
        const fileHandle = await fs.open(this.filename, 'r');
        for await (const line of fileHandle.readLines()) {
            const splitLine = line.split(',');
            const ip = splitLine[this.primaryIndex];
            const fraudPercentage = splitLine[this.secondaryIndex];
            process.stdout.write(ip + '\t' + fraudPercentage + '\n')
        }
    }
}

