import { InfoRecordSubType } from "./RecordType.js";

function bytesToSring(bytes) {
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

    static async read(reader): Promise<InfoRecord>{

        let rec = new InfoRecord();
        
        rec.subType = await reader.readInt32();
        rec.size = await reader.readInt32();
        rec.count = await reader.readInt32();
        
        const byteData = await reader.readBytes(rec.size * rec.count);

        if( rec.subType === InfoRecordSubType.MachineInt32Info ){
            // describes how int32s are stored as binary
            return rec;
        }
        else if( rec.subType === InfoRecordSubType.MachineFlt64Info ){
            // describes how flt64s are stored as binary
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

            // todo: this describes measurement, width, alignment for vars

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
                byteDataStr = bytesToSring(byteDataStr);
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
            // because their content was > 255 or some long length
            // because old SPSS files couldn't support the super long length

            // if (xlong_string_map != null) {
            //     throw new Exception("Didn't expect to receive multiple very long string records");
            // }

            // // i think...
            // // this byte array is a \0\t separated list of VARNAME=LENGTH entries for string variables with length > 255?
            // // example: Z6=2283\0\tZ7P=587\0\tZ7N=685\0\tZ14P=430\0\tZ14N=460\0\tZ18N=475\0\tZ21N=702\0\tZ30P=1785\0\tZ30N=402\0\tZ33P=334\0\tZ36P=328\0\tZ36N=1066\0\tZ41P=911\0\tZ44P=323\0\tZ44N=483\0\tZ48N=285\0\tZ52N=403\0\t

            // // i don't think this can contain crazy characters, so encoding shouldn't matter
            // string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            // xlong_string_map = str1;

            // TODO!

            return rec;
        }
        else if( rec.subType === InfoRecordSubType.EncodingRecord ){
            
            let byteDataStr = byteData;
            if (typeof (byteDataStr) !== "string") {
                byteDataStr = bytesToSring(byteDataStr);
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
        else{
            
            // miscellaneous (unknown)
            // note: bytes were already read in
            
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

export class LongVarNamesInfoRecord extends InfoRecord{
    
    longNameMap: LongVarNameEntry[];
    
}
