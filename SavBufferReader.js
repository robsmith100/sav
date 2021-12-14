var BufferChunkReader = require('./BufferChunkReader');
var Meta = require('./SavMeta');


// trimend polyfill hack
String.prototype.trimEnd = String.prototype.trimEnd ? String.prototype.trimEnd : function() {
	if(String.prototype.trimRight) {
		return this.trimRight();
	} else if(String.prototype.trim) {
		var trimmed = this.trim();
		var indexOfWord = this.indexOf(trimmed);
		
		return this.slice(indexOfWord, this.length);
	}
};

const isValid = (x) => x !== null && x !== undefined;

/** 
 * Read schema and records from .sav file
 */
class SavBufferReader{

    constructor(buffer){
        this.buffer = buffer;
    }

    /** Opens the file and loads all metadata (var names, labels, valuelabels, etc). Doesn't load any records */
    async open(){

        this.reader = new BufferChunkReader(this.buffer);
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
    async readNextRow(includeNulls = true){

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
                if( includeNulls || isValid(d))
                    row.data[v.name] = d;
            }
            else if( v.type == 'string' ){
                // read root
                let str = await r.read8CharString(compression);

                // read string continuations if any
                for( var j = 0; j < v.stringExt; j++ ){
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

module.exports = SavBufferReader;
