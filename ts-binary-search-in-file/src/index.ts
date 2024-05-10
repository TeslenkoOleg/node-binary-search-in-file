import {Map} from "./map";
import {Searcher} from "./searcher";

export async function map(filename: string, primaryIndex: number, secondaryIndex: number){
    const map = new Map(filename, primaryIndex, secondaryIndex);
    await map.run();
}

export async function search(filename: string, searchValue: string, delimiter: string, chunkSize: number){
    const searcher: any = new Searcher(filename, searchValue, delimiter, chunkSize);
    return await searcher.binarySearchInFile();
}
