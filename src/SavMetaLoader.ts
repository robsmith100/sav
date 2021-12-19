import { DictionaryTerminationRecord } from "./records/DictionaryTerminationRecord.js";
import { DocumentRecord } from "./records/DocumentRecord.js";
import { HeaderRecord } from "./records/HeaderRecord.js";
import { EncodingInfoRecord, InfoRecord, LongVarNameEntry, LongVarNamesInfoRecord } from "./records/InfoRecord.js";
import { InfoRecordSubType, RecordType } from "./records/RecordType.js";
import { ValueLabelRecord } from "./records/ValueLabelRecord.js";
import { VariableRecord } from "./records/VariableRecord.js";
import { SavMeta } from "./SavMeta.js";

export class SavMetaLoader{


    /**
     * Reads and returns sav meta from the chunkreader.
     * @param reader A ChunkReader please (todo: type strictify this)
     */

    static async readMeta(reader: any): Promise<SavMeta> {

        let meta = new SavMeta();
        

        // read the header record
        meta.header = await HeaderRecord.read(reader);

        // keep most recent string for easy linking of string continuation vars
        let vrecs: VariableRecord[] = [];
        let recent_string_vrec: VariableRecord = null; 
        let documentRecord: DocumentRecord;
        let longVariableNamesMap: LongVarNameEntry[];
        

        let done = false;
        do{

            const rec_type = await reader.peekInt();

            if( rec_type === RecordType.VariableRecord ){
                
                await reader.readInt32(); // consume peeked record type

                const vrec = await VariableRecord.read(reader);

                if( vrec.type > 0 ){
                    // (root string var) a vrec type of > 0 means string variable with length(type)
                    vrec.stringExt = 0;
                    recent_string_vrec = vrec;
                }
                else if( vrec.type === -1 ){
                    // a vrec type of -1 means string continuation variable
                    recent_string_vrec.stringExt++;
                }
                else if( vrec.type === 0 ){
                    // a vrec type of 0 means numeric variable
                }
                vrecs.push(vrec);
                
            }
            else if( rec_type === RecordType.ValueLabelRecord ){
                
                await reader.readInt32(); // consume peeked record type

                // a value label record contains one set of value/label pairs and is attached to one or more variables
                const set = await ValueLabelRecord.read(reader, vrecs); // TODO: make sure these guys are matched app (see appliesTo aka appliesToShortName)
                if( set != null ){
                    meta.valueLabels.push(set);
                }

            }
            else if( rec_type === RecordType.DocumentRecord ){
                
                await reader.readInt32(); // consume peeked record type
                    
                // there should be only one document record per file
                if( documentRecord != null ){
                    throw new Error("Multiple document records encountered");
                }
                documentRecord = await DocumentRecord.read(reader);

            }
            else if( rec_type === RecordType.InfoRecord ){
                
                await reader.readInt32(); // consume peeked record type

                // info record has many different subtypes
                const rec = await InfoRecord.read(reader);

                if( rec.subType === InfoRecordSubType.EncodingRecord){
                    // grab encoding from it
                    meta.header.encoding = (rec as EncodingInfoRecord).encoding;
                }
                else if (rec.subType === InfoRecordSubType.LongVariableNamesRecord) {
                    // grab long names from it
                    longVariableNamesMap = (rec as LongVarNamesInfoRecord).longNameMap;
                }

            }
            else if( rec_type === RecordType.DictionaryTerminationRecord ){
                
                await reader.readInt32(); // consume peeked record type

                await DictionaryTerminationRecord.read(reader); // rec is discarded
                done = true;
            }
            else{
                // assume implicit dictionary termination
                done = true;
            }
            

        } while( !done );

        // save the pointer
        meta.firstRecordPosition = reader.getPosition();

        // post-process the vrecs into sysvars
        meta.sysvars =
            vrecs
            .map(vrec => vrec.toSysVar())
            .filter(vrec => vrec) // filter out nulls because some vrecs (string continuation vrecs) can't be converted to sysvars
        
        // lookup weight (important to do this before assigning long var names)
        if (meta.header.weightIndex) {
            const weight_vrec = vrecs[meta.header.weightIndex - 1];
            const weight_shortName = weight_vrec.shortName;
            meta.header.weight = meta.sysvars.find(sysvar => sysvar.name === weight_shortName);
        }
        delete(meta.header.weightIndex); // (don't want weightIndex to confuse anyone since it's an index into vrecs, not sysvars)

        // assign long variable names
        if (longVariableNamesMap) {
            for (let entry of longVariableNamesMap) {
                const findvar = meta.sysvars.find(sysvar => sysvar.name === entry.shortName);
                if (findvar) {
                    findvar.name = entry.longName;
                }
            }
        }

        meta.header.n_vars = meta.sysvars.length;
        delete(meta.header.case_size); // (dont want to confuse anyone because it's the number of vrecs, not sysvars)

        // // adjust valuelabels map to refer to new names
        // this.meta.valueLabels = this.meta.valueLabels.map(set => {
        //     var set2 = {...set};
        //     set2.appliesToShortNames = set2.appliesToShortNames.map(shortname => this.meta.sysvars.find(sysvar => sysvar.shortName == shortname).name);
        //     return set2;
        // });
        
        return meta;

    }



}

