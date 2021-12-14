var HeaderRecord = require('./records/HeaderRecord');
var VariableRecord = require('./records/VariableRecord');
var ValueLabelRecord = require('./records/ValueLabelRecord');
var DocumentRecord = require('./records/DocumentRecord');
var DictionaryTerminationRecord = require('./records/DictionaryTerminationRecord');
var InfoRecord = require('./records/InfoRecord');

class SavMeta{

    constructor(){
        this.header = null;
        this.sysvars = [];
        this.valueLabels = [];
    }

    getValueLabels(varname){
        var vl = this.valueLabels.find(vl => vl.appliesTo.includes(varname));
        return ( vl != null ) ? vl.entries : null;
    }

}

/** Metadata for sav file. Includes variable names, labels, valuelabels, encoding, etc. */
class SavMetaLoader{

    constructor(chunkReader){
        this.reader = chunkReader;
        this.meta = new SavMeta();
    }

    async load(){

        let r = this.reader;

        // read the header record
        this.meta.header = await HeaderRecord.read(r);


        let recent_stringvar = null; // keep most recent string for easy linking of string continuation vars
        let done = false;
        do{

            let rec_type = await r.peekInt();

            if( rec_type == 2 ){
                // variable record
                await r.readInt32(); // consume peeked record type

                var sysvar = await VariableRecord.read(r);
                
                // a sysvar type of 0 means numeric variable
                // a sysvar type of -1 means string continuation variable
                // a sysvar type of > 0 means string variable with length(type)

                // if( sysvar.type === -1 ){
                //     // this is a string continuation var
                //     recent_stringvar.stringExt++;
                // }
                // else if( sysvar.type > 0 ){
                //     // this is a root string var
                //     sysvar.stringExt = 0;
                //     recent_stringvar = sysvar;
                // }
                // else if( sysvar.type == 0 ){
                //     // this is a numeric var
                // }

                if( sysvar.type === 'string' ){
                    // this is a root string var
                    sysvar.stringExt = 0;
                    recent_stringvar = sysvar;
                }
                else if( sysvar.type === 'string-cont' ){
                    // this is a string continuation var
                    recent_stringvar.stringExt++;
                }
                // else if( sysvar.type === 'numeric' ){
                //     // this is a numeric var
                // }

                this.meta.sysvars.push(sysvar);
                
            }
            else if( rec_type == 3 ){
                // value label record
                await r.readInt32(); // consume peeked record type

                // a value label record contains one set of value/label pairs and is attached to one or more variables
                let set = await ValueLabelRecord.read(r, this.meta.sysvars);
                if( set != null ){
                    this.meta.valueLabels.push(set);
                }

            }
            else if( rec_type == 6 ){
                // document record (one per file)
                await r.readInt32(); // consume peeked record type
                    
                if( this.documentRecord != null ){
                    throw new Error("Multiple document records encountered");
                }

                this.documentRecord = await DocumentRecord.read(r);

            }
            else if( rec_type == 7 ){
                // info record (many different subtypes)
                await r.readInt32(); // consume peeked record type

                await InfoRecord.read(r, this.meta);
                
            }
            else if( rec_type == 999 ){
                // dictionary termination record
                await r.readInt32(); // consume peeked record type

                await DictionaryTerminationRecord.read(r);
                done = true;
            }
            else{
                // assume implicit dictionary termination
                done = true;
            }
            

        } while( !done );

        // save the pointer
        this.meta.firstRecordPosition = r.getPosition();

        // post-process the sysvars

        // lookup weight
        if( this.meta.header.weightIndex != 0 ){
            this.meta.header.weight = this.meta.sysvars[this.meta.header.weightIndex-1].name;
        }
        delete(this.meta.header.weightIndex);

        // remove string continuation vars
        this.meta.sysvars = this.meta.sysvars.filter(x => x.type != 'string-cont');
        this.meta.header.n_vars = this.meta.sysvars.length;
        delete(this.meta.header.case_size);

        // adjust valuelabels map to refer to new names
        this.meta.valueLabels = this.meta.valueLabels.map(set => {
            var set2 = {...set};
            set2.appliesTo = set2.appliesTo.map(shortname => this.meta.sysvars.find(sysvar => sysvar.shortName == shortname).name);
            return set2;
        });

        // var-specific edits
        this.meta.sysvars = this.meta.sysvars.map(y => {
            var x = {...y};
            delete(x.shortName); // delete short name
            return x;
        });
        

    }



}

module.exports = {SavMeta, SavMetaLoader};