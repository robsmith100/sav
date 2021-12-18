import * as stream from "stream";
import { AsyncChunkReader } from "./internal-readers/AsyncChunkReader.js";
import { AsyncReader } from "./internal-readers/AsyncReader.js";
import { CommandReader } from "./internal-readers/CommandReader.js";
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
    rowIndex: number;

    constructor(readable: stream.Readable){
        const r1 = new AsyncReader(readable);
        const r2 = new AsyncChunkReader(r1, 1024); // 1 kb
        this.reader = new CommandReader(r2);
    }

    /**
     * Opens the file and loads all metadata (var names, labels, valuelabels, etc). Doesn't load any records.
     */
    async open() {
        
        // check file type
        if (await this.reader.readString(4) != "$FL2") {
            throw new Error("Not a valid .sav file");
        }

        // load metadata (variable names, # of cases (if specified), variable labels, value labels, etc.)
        this.meta = await SavMetaLoader.readMeta(this.reader);

        this.rowIndex = 0;
        
    }

    async resetRows(){
        throw Error('not implemented');
    }

    /** Read the next row of data */
    async readNextRow(includeNulls = false){

        let r = this.reader;

        var row = {
            data: {},
            index: this.rowIndex
        };


        let compression = this.meta.header.compression;

        // check for eof
        try {
            // todo: might want to check for an EOF char or something rather than just planning on this throwing an error
            await r.peekByte(); 
        }
        catch(err){
            var atEnd = r.isAtEnd();
            if( !atEnd ){
                throw Error(err);
            }
            return null;
        }

        for( var i in this.meta.sysvars ){
            var v = this.meta.sysvars[i];

            if( v.type === SysVarType.numeric ){
                var d = await r.readDouble2(compression);
                if( includeNulls || isValid(d))
                    row.data[v.name] = d;
            }
            else if( v.type === SysVarType.string ){
                // read root
                let str = await r.read8CharString(compression);

                // read string continuations if any
                for( var j = 0; j < v.__nb_string_contin_recs; j++ ){
                    str += await r.read8CharString(compression);
                }

                const strVal = str != null ? str.trimEnd() : null;
                if (includeNulls || isValid(strVal)) {
                    row.data[v.name] = strVal;
                }
            }


        }

        this.rowIndex++;
        return row;

    }
   

}


