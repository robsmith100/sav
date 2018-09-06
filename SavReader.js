var ChunkReader = require('./ChunkReader');
var Meta = require('./SavMeta');


/** 
 * Read schema and records from .sav file
 */
class SavReader{

    constructor(fileName){
        this.fileName = fileName;
    }

    /** Opens the file and loads all metadata (var names, labels, valuelabels, etc). Doesn't load any records */
    async open(){

        this.reader = new ChunkReader(this.fileName);
        //await this.reader.open();

        // check file type
        if( await this.reader.readString(4) != "$FL2" ){
            throw new Error("Not a valid .sav file");
        }

        // load metadata (variable names, # of cases (if specified), variable labels, value labels, etc.)
        let metaLoader = new Meta.SavMetaLoader(this.reader);
        await metaLoader.load();
        this.meta = metaLoader.meta;

        this.rowIndex = 0;
        
    }

    async resetRows(){
        throw Error('not implemented');
    }

    /** Read the next row of data */
    async readNextRow(){

        let r = this.reader;

        var row = {
            data: {},
            index: this.rowIndex
        };


        let compression = this.meta.header.compression;


        // check for eof
        try{
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

            if( v.type == 'numeric' ){
                var d = await r.readDouble2(compression);
                row.data[v.name] = d;
            }
            else if( v.type == 'string' ){
                // read root
                let str = await r.read8CharString(compression);

                // read string continuations if any
                for( var j = 0; j < v.stringExt; j++ ){
                    str += await r.read8CharString(compression);

                }

                row.data[v.name] = str != null ? str.trimEnd() : null;
            }


        }

        this.rowIndex++;
        return row;

    }
   

}

module.exports = SavReader;