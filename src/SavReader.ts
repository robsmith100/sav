import * as stream from "stream";
import { AsyncChunkReader } from "./internal-readers/AsyncChunkReader.js";
import { AsyncReader } from "./internal-readers/AsyncReader.js";
import { CommandReader } from "./internal-readers/CommandReader.js";
import { SavIndexedRow } from "./SavIndexedRow.js";
import { SavMeta } from "./SavMeta.js";
import { SavMetaLoader } from "./SavMetaLoader.js";
import { SysVarType } from "./SysVar.js";

const isValid = (x) => x !== null && x !== undefined;

/** 
 * Reads schema and records from .sav file
 */
export class SavReader{

    reader: CommandReader;
    meta: SavMeta;
    rowIndex: number = 0;

    constructor(readable: stream.Readable){
        const r1 = new AsyncReader(readable);
        const r2 = new AsyncChunkReader(r1, 1024); // 1 kb
        this.reader = new CommandReader(r2);
    }

    /**
     * Opens the file and loads all metadata (var names, labels, valuelabels, etc). Doesn't load any records.
     */
    async open() {
        
        // check file rec_type
        // Record type code, either ‘$FL2’ for system files with uncompressed data or data
        // compressed with simple bytecode compression, or ‘$FL3’ for system files with
        // ZLIB compressed data.
        // This is truly a character field that uses the character encoding as other strings.
        // Thus, in a file with an ASCII-based character encoding this field contains 24 46
        // 4c 32 or 24 46 4c 33, and in a file with an EBCDIC-based encoding this field
        // contains 5b c6 d3 f2. (No EBCDIC-based ZLIB-compressed files have been
        // observed.)
        const rec_type = await this.reader.readString(4);

        if (rec_type != "$FL2" && rec_type != '$FL3') {
            throw new Error("Not a valid .sav file:"+ rec_type);
        }

        if (rec_type == '$FL3') {
            throw new Error("ZLIB compressed data not supported");
        }

        // load metadata (variable names, # of cases (if specified), variable labels, value labels, etc.)
        this.meta = await SavMetaLoader.readMeta(this.reader);

        this.rowIndex = 0;
        
    }

    async resetRows(){
        throw Error('not implemented');
    }

    async readAllRows(includeNulls = false): Promise<any[]> {

        if (this.rowIndex !== 0)
            throw Error("Row pointer already advanced. Cannot read all rows.")

        let rows = [];
        let row = null;
        do {
            row = await this.readNextRow(includeNulls);
            if (row) {
                rows.push(row);
            }
        }
        while (row !== null)
        return rows;

    }
    
    /** Read the next row of data */
    async readNextRow(includeNulls = false): Promise<any>{

        let row: any = {}

        // check for eof
        try {
            let b = await this.reader.peekByte(); // may throw Error upon EOF
            if (b === null || b === undefined) {
                return null;
            }
        }
        catch(err){
            if( !this.reader.isAtEnd() ){
                throw Error(err);
            }
            return null;
        }

        for( let v of this.meta.sysvars ){

            if( v.type === SysVarType.numeric ){
                const d = await this.reader.readDouble2(this.meta.header.compression);
                if( includeNulls || isValid(d))
                    row[v.name] = d;
            }
            else if( v.type === SysVarType.string ){

                let all_sysvars = [v, ...(v.__child_string_sysvars || [])];

                let str = "";
                for( let sv of all_sysvars ){

                    let varStr = "";
                    
                    // read root
                    varStr += await this.reader.read8CharString(this.meta.header.compression);

                    // read string continuations if any
                    for( var j = 0; j < sv.__nb_string_contin_recs; j++ ){
                        varStr += await this.reader.read8CharString(this.meta.header.compression);
                    }

                    if( varStr.length > 255 ){
                        varStr = varStr.substring(0, 255);
                    }
                    str += varStr;

                    // for testing
                    // if( all_sysvars.length > 1 ){
                    //     str += "|";
                    // }
                                
                }

                const strVal = str != null ? str.trimEnd() : null;
                if (includeNulls || isValid(strVal)) {
                    row[v.name] = strVal;
                }
            }

        }

        this.rowIndex++;
        return row;

    }
   

}


