import { SavMeta } from "../SavMeta.js";
import { InfoRecordSubType } from "./RecordType.js";
import { bytesToInt32, ValueLabelEntry, ValueLabelRecord } from "./ValueLabelRecord.js";
import { VarDisplay, VariableRecord } from "./VariableRecord.js";

/**
 * Should this offer an encoding?
 */
export function bytesToString(bytes) {
    let str = "";
    for(let i = 0, n = bytes.length; i < n; i++) {
        str += String.fromCharCode(bytes[i])
    }
    return str;
}


export class InfoRecord{

    subType: any;

    size: number;

    count: number;

    static async read(reader, vRecs: VariableRecord[], meta: SavMeta): Promise<InfoRecord>{

        let rec = new InfoRecord();
        
        // Subtype (there are a bunch of different subtypes. See below)
        rec.subType = await reader.readInt32();

        // Size of each piece of data, in bytes.
        rec.size = await reader.readInt32();

        // Number of pieces of data.
        rec.count = await reader.readInt32();

        // Read the data
        const byteData = await reader.readBytes(rec.size * rec.count);

        if( rec.subType === InfoRecordSubType.MachineInt32Info ){
            
            // describes how int32s are stored as binary
            
            const bytes = Uint8Array.from(byteData);
            let i = 0;
            
            // int32 version_major;
            const version_major = bytesToInt32(bytes, i); i += 4;

            // int32 version_minor;
            const version_minor = bytesToInt32(bytes, i); i += 4;

            // int32 version_revision;
            const version_revision = bytesToInt32(bytes, i); i += 4;

            // int32 machine_code;
            const machine_code = bytesToInt32(bytes, i); i += 4;

            // int32 floating_point_rep;
            const floating_point_rep = bytesToInt32(bytes, i); i += 4;

            // int32 compression_code;
            const compression_code = bytesToInt32(bytes, i); i += 4;

            // int32 endianness;
            const endianness = bytesToInt32(bytes, i); i += 4;

            // int32 character_code;
            const character_code = bytesToInt32(bytes, i); i += 4;

            const iiRec: MachineIntegerInfoRecord = {
                ...rec,
                version_major,
                version_minor,
                version_revision,
                machine_code,
                floating_point_rep,
                compression_code,
                endianness,
                character_code
            };
            return iiRec;

        }
        else if( rec.subType === InfoRecordSubType.MachineFlt64Info ){
            // describes how flt64s are stored as binary
            // todo
            return rec;
        }
        else if( rec.subType === InfoRecordSubType.MultipleResponseSets ){
            
            // multiple response sets
            // todo!
            //string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            //Trace.WriteLine(str1);

            // multiple lines separated by char(10)
            // each line contains:

            //$
            //set name
            //=
            //D1  (dichotomies, counted value=1)
            //space? char(32)
            //1 (category labels source = variable labels?)
            //space? char(32)
            //label length
            //space? char(32)
            //label
            //space? char(32)
            //space-separated list of var names; space is char(32)
            //newline (char dec 10)
            return rec;
        }
        else if( rec.subType === InfoRecordSubType.AuxilliaryVariableParameter ){
            
            // auxilliary variable parameter (one per system file)
            // a.k.a. Variable Display Parameter Record

            // This describes measurement, width (columns), alignment for vars
            
            // FROM PSPP: The remaining members are repeated count times, in the same order as the variable
            // records. No element corresponds to variable records that continue long string variables.
            
            // get the subset of vRecs that excludes string continuation vars
            const bytes = Uint8Array.from(byteData);
            const coreVRecs = vRecs.filter(r => r.type !== -1); // exclude string continuation vars

            let i = 0;
            for(let vRec of coreVRecs){

                vRec.display = new VarDisplay();
                
                // int32 measure
                // The measurement level of the variable:
                // 0 Unknown
                // 1 Nominal
                // 2 Ordinal
                // 3 Scale
                vRec.display.measure = bytesToInt32(bytes, i);
                i += 4;

                // int32 width ("Columns" in spss)
                // The width of the display column for the variable in characters.
                // This field is present if count is 3 times the number of non-string-contin variables in the dictionary.
                // It is omitted if count is 2 times the number of non-string-contin variables.
                if( rec.count === coreVRecs.length * 3 ){
                    vRec.display.columns = bytesToInt32(bytes, i);
                    i += 4;
                }

                // int32 alignment
                vRec.display.alignment = bytesToInt32(bytes, i);
                i += 4;

            }

            return rec;
        }
        else if( rec.subType === InfoRecordSubType.LongVariableNamesRecord ){
            
            // long variable names record
            let longNameMap: LongVarNameEntry[] = [];

            // this is very interesting, because the "long" name isn't even necessarily longer than the original (perhaps lower-case letters force a long name to be generated?)
            // actually, yeah the spec doesn't let a varname start with a lowercase letter i think, so if you want your vars to have the correct casing, you'll need to set up a long name.

            // tab separated list of NAME=LONGNAME entries
            // i don't think these can contain crazy characters, so encoding shouldn't matter (uh, it would matter: todo)
            let byteDataStr = byteData;
            if (typeof (byteDataStr) !== "string") {
                byteDataStr = bytesToString(byteDataStr);
            }
            let longVarNames = byteDataStr.trimEnd(); // System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            //let longVarNames = record.byteData.trimEnd(); // System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            //string longvarnames = System.Text.ASCIIEncoding.GetEncoding(1252).GetString(bytedata);
            

            let pairs = longVarNames.split('\t');
            for( let p in pairs) {
                let pair = pairs[p];

                let pcs = pair.split('=');
                let shortName = pcs[0];
                let longName = pcs[1];

                longNameMap.push({ shortName, longName });
            }

            const rec_ext: LongVarNamesInfoRecord = {
                ...rec,
                longNameMap
            }

            return rec_ext;
        }
        else if( rec.subType === InfoRecordSubType.SuperLongStringVariablesRecord ){

            // this records helps piece together string variables that were separated
            // because their content was > 255
            // (maybe old SPSS files couldn't support the longer length)

            // if (xlong_string_map != null) {
            //     throw new Exception("Didn't expect to receive multiple very long string records");
            // }

            // // i think...
            // // this byte array is a \0\t separated list of VARNAME=LENGTH entries for string variables with length > 255?
            // // example: Z6=2283\0\tZ7P=587\0\tZ7N=685\0\tZ14P=430\0\tZ14N=460\0\tZ18N=475\0\tZ21N=702\0\tZ30P=1785\0\tZ30N=402\0\tZ33P=334\0\tZ36P=328\0\tZ36N=1066\0\tZ41P=911\0\tZ44P=323\0\tZ44N=483\0\tZ48N=285\0\tZ52N=403\0\t

            // // i don't think this can contain special characters, so encoding shouldn't matter
            // string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            // xlong_string_map = str1;


            let entries: StringVarLengthEntry[] = [];
            try{

                let byteDataStr = byteData;
                if (typeof (byteDataStr) !== "string") {
                    byteDataStr = bytesToString(byteDataStr);
                }
                let mapStr = byteDataStr?.trimEnd();
                let mapStrArray = mapStr?.split("\0\t");
                
                for( let entryStr of mapStrArray ){
                    const pcs = entryStr.split('=');
                    const entry: StringVarLengthEntry = {
                        name: pcs?.[0],
                        length: parseInt(pcs?.[1])
                    };
                    entries.push(entry);
                }

            }
            catch(err){
                console.error(err);
                //throw Error(err);
            }

            const rec_exmap: SuperLongStringVarsRecord = {
                ...rec,
                map: entries
            }

            return rec_exmap;
        }
        else if( rec.subType === InfoRecordSubType.EncodingRecord ){
            
            let byteDataStr = byteData;
            if (typeof (byteDataStr) !== "string") {
                byteDataStr = bytesToString(byteDataStr);
            }
            
            const enc_rec: EncodingInfoRecord = {
                ...rec,
                encoding: byteDataStr.trimEnd()
            }
            return enc_rec;

            // encoding types I have seen
            // windows-1252, WINDOWS-1252, CP1252
            // UTF-7
            // UTF-8
            // UTF-32
            
        }
        else if( rec.subType == InfoRecordSubType.StringVariableValueLabelsRecord ){

            let vlrec: LongStringValueLabelsRecord = {
                ...rec,
                sets: []
            }

            // note: this was all reverse-engineered and I don't know if it's totally correct

            let pos = 0;
            while( pos < byteData.length ){

                // read var name length
                const var_name_len = getIntFromBuffer(byteData, pos);
                pos += 4;

                // read var name
                // note: this appears to be the long variable name. 
                // note: I don't know if could possibly be a comma-separated list of var names.
                const var_name = getStringFromBuffer(byteData, pos, var_name_len);
                pos += var_name_len;

                // read var size (note: why is this needed?? it appears to simply match then "width" of the string var)
                const var_size = getIntFromBuffer(byteData, pos);
                pos += 4;

                // read number of value labels
                const nb_value_labels = getIntFromBuffer(byteData, pos);
                pos += 4;

                let vlset = {
                    appliesToNames: [var_name],
                    entries: []
                };
                vlrec.sets.push(vlset);
                for( let i = 0; i < nb_value_labels; i++ ){

                    const value_len = getIntFromBuffer(byteData, pos);
                    pos += 4;

                    const value = getStringFromBuffer(byteData, pos, value_len)
                        .trimEnd();
                    pos += value_len;

                    const label_len = getIntFromBuffer(byteData, pos);
                    pos += 4;

                    const label = getStringFromBuffer(byteData, pos, label_len)
                        .trimEnd();
                    pos += label_len;

                    vlset.entries.push({ val: value, label });
                }
            }
            
            return vlrec;

        }
        else{
            
            // miscellaneous (unknown)
            // note: bytes were already read in

            // console.log(`Unknown Info Record [${rec.subType}] at ${reader.getPosition()}`)
            // console.log("byteData", byteData);
            // const str = bytesToString(byteData);
            // console.log("byteData", str);
            
            return rec;

        }

    }

}

export class EncodingInfoRecord extends InfoRecord{
    
    encoding: string;
    
}

export class LongVarNameEntry{
    shortName: string;
    longName: string;
}

export class MachineIntegerInfoRecord extends InfoRecord{

    /**
     * PSPP major version number. In version x.y.z, this is x.
     */
    version_major: number; // int32

    /**
     * PSPP minor version number. In version x.y.z, this is y.
     */
    version_minor: number; // int32

    /**
     * PSPP version revision number. In version x.y.z, this is z.
     */
    version_revision: number; // int32

    /**
     * Machine code. PSPP always set this field to value to -1, but other values may appear.
     */
    machine_code: number; // int32
    
    /**
     * Floating point representation code. For IEEE 754 systems this is 1. IBM 370 sets this to 2, and DEC VAX E to 3.
     */
    floating_point_rep: number; // int32
    
    /**
     * Compression code. Always set to 1, regardless of whether or how the file is compressed.
     */
    compression_code: number; // int32

    /**
     * Machine endianness. 1 indicates big-endian, 2 indicates little-endian.
     */
    endianness: number; // int32

    /**
     * Character code. The following values have been actually observed in system
     * files:
     * 1        EBCDIC.
     * 2        7-bit ASCII.
     * 1250     The windows-1250 code page for Central European and Eastern European languages.
     * 1252     The windows-1252 code page for Western European languages.
     * 28591    ISO 8859-1.
     * 65001    UTF-8.
     * 
     * The following additional values are known to be defined:
     * 3        8-bit “ASCII”.
     * 4        DEC Kanji.
     * Other Windows code page numbers are known to be generally valid.
     * 
     * Old versions of SPSS for Unix and Windows always wrote value 2 in this field,
     * regardless of the encoding in use. Newer versions also write the character
     * encoding as a string (see PSPP docs Section 1.13 [Character Encoding Record], page 18).
     */
    character_code: number; // int32

}

export class MachineFloatInfoRecord extends InfoRecord{
    
}


export class LongVarNamesInfoRecord extends InfoRecord{
    
    longNameMap: LongVarNameEntry[];
    
}

export class SuperLongStringVarsRecord extends InfoRecord{

    map: StringVarLengthEntry[];

}

export class LongStringValueLabelsRecord extends InfoRecord{

    sets: ValueLabelRecord[];

}



export class StringVarLengthEntry{
    name: string;
    length: number;
}

const getIntFromBuffer = (buf, pos) => 
            (buf[pos + 0]) |
            (buf[pos + 1] << 8) |
            (buf[pos + 2] << 16) |
            (buf[pos + 3] << 24);

const getStringFromBuffer = (buf, pos, len) => {
    let str = "";
    for( let i = 0; i < len; i++ ){
        str += String.fromCharCode(buf[pos + i]);
    }
    return str;
}

export enum MeasurementLevel{
    Unknown = 0,
    Nominal = 1,
    Ordinal = 2,
    Scale = 3,
}

export enum AlignmentLevel{
    Left = 0,
    Right = 1,
    Center = 2
}