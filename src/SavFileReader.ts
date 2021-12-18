import * as fs from "fs";
import { SavReader } from "./SavReader.js";

export class SavFileReader extends SavReader{

    filename: string;

    constructor(filename: string) {
        
        const readable = fs.createReadStream(filename, {
            encoding: null,
            highWaterMark: 1024 * 1024 // 1024 kb
        });
        super(readable);

        this.filename = filename;
    }

}

