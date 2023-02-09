import { bytesToString } from "./InfoRecord";
import { VariableRecord } from "./VariableRecord";

export class ValueLabelEntry{
    val: number | string;
    label: string;
    _valBytes?: any;
}

/**
 * A value label record contains one set of value/label pairs and it attached
 * to one or more variables.
 * 
 * Value label records are used for numeric and short string variables only. Long string variables
 * may have value labels, but their value labels are recorded using a different record type.
 * (see PSPP Section 1.14 [Long String Value Labels Record], page 19).
 */
export class ValueLabelRecord{

    constructor() {
        this._appliesToShortNames = [];
        this.appliesToNames = null;
        this.entries = [];
    }

    /**
     * Array of shortNames that this record applies to
     */
    _appliesToShortNames?: string[];

    /**
     * Array of var names that this record applies to
     */
     appliesToNames?: string[];

    /**
     * Array of value/label entries
     */
    entries: ValueLabelEntry[];

    static async read(reader, vRecs: VariableRecord[]): Promise<ValueLabelRecord>{

        let set = new ValueLabelRecord();

        // determine the number of value/label pairs
        const count = await reader.readInt32();

        // read the value/label pairs
        for( let i = 0; i < count; i++ ){

            // get value
            // A numeric value or a short string value padded as necessary to 8 bytes in
            // length. Its type and width cannot be determined until the following value label
            // variables record (see below) is read.
            // note: these bytes could represent a double or a very short string value
            const _valBytes = await reader.readBytes(8);
            
            // get label length
            // The label’s length, in bytes. The documented maximum length varies from 60
            // to 120 based on SPSS version. PSPP supports value labels up to 255 bytes
            // long
            const labelLen = await reader.readByte();


            // get label
            // label is label_len bytes of the actual label, followed by up to 7 bytes of padding to
            // bring label and label_len together to a multiple of 8 bytes in length.
            const label = labelLen > 0 ? await reader.readString(labelLen) : "";
            
            // consume the label padding
            if ((labelLen + 1) % 8 !== 0) {
                const padding = 8 - ((labelLen + 1) % 8);
                await reader.readString(padding);
            }

            set.entries.push({
                val: null,
                _valBytes, // we will later extract a double or string into "val"
                label
            });

        }

        // The value label record is immediately
        // followed by a value label variables record, which specifies
        // the variable(s) to which the above value labels apply.
        // WHAT IF STRING VARS WITH WIDTH > 8 BYTES ARE NOT SPECIFIED? TODO: LOOK INTO THIS.

        // check to see if next record is a value label variable record
        const next_rec_type = await reader.peekByte();
        if( next_rec_type == 4 ){
            
            // value label variable record
            // this records tells us the variables which should use the preceding valuelabelset

            // consume record type
            await reader.readInt32(); // (always set to 4)

            // read the number of variables to associate the prior valuelabels with
            const nbVars = await reader.readInt32();

            // read in vars
            // This is a list of 1-based dictionary indexes of variables to
            // which to apply the value labels. There are var_count elements.
            // ** String variables wider than 8 bytes may not be specified in this list.
            //      are they specified in a [Long String Value Labels Record]???
            for (let i = 0; i < nbVars; i++) {

                // read varindex
                const varIndex = await reader.readInt32(); // 1-based var index

                // find variable
                const vRec = vRecs[varIndex - 1];
                set._appliesToShortNames.push(vRec.shortName);

                // At this point, we know what 'type' the value is (string or numeric).
                // BUT WHAT IF STRING VARS WITH WIDTH > 8 BYTES ARE JUST NOT SPECIFIED?
                // Covert valBytes to val
                if( i == 0 ){
                    if( vRec.type == 0 ){
                        // numeric
                        for(let entry of set.entries){
                            entry.val = bytesToDouble(entry._valBytes);
                            delete entry._valBytes;
                        }
                    }
                    else{
                        // string
                        for(let entry of set.entries){
                            entry.val = bytesToString(entry._valBytes)?.trimEnd();
                            delete entry._valBytes;
                        }
                    }
                }

            }

            return set;
        }

        return null; // ignore, because it didn't apply to any vars
    }

}

export const bytesToDouble = (buf, byteOffset: number = 0, littleEndian?: boolean): number => {

    if (buf.length < byteOffset + 8) throw Error("not enough bytes available for Double");
    
    var ab = new ArrayBuffer(8);
    var bufView = new Uint8Array(ab);
    bufView[0] = buf[byteOffset + 7];
    bufView[1] = buf[byteOffset + 6];
    bufView[2] = buf[byteOffset + 5];
    bufView[3] = buf[byteOffset + 4];
    bufView[4] = buf[byteOffset + 3];
    bufView[5] = buf[byteOffset + 2];
    bufView[6] = buf[byteOffset + 1];
    bufView[7] = buf[byteOffset + 0];
    let dv = new DataView(ab);
    let d = dv.getFloat64(0, littleEndian);

    return d;

}

export const bytesToInt32 = (buf, byteOffset: number = 0, littleEndian?: boolean): number => {

    if (buf.length < byteOffset + 4) throw Error("not enough bytes available for Int32");
    
    var ab = new ArrayBuffer(4);
    var bufView = new Uint8Array(ab);
    bufView[0] = buf[byteOffset + 3];
    bufView[1] = buf[byteOffset + 2];
    bufView[2] = buf[byteOffset + 1];
    bufView[3] = buf[byteOffset + 0];
    let dv = new DataView(ab);
    let d = dv.getInt32(0, littleEndian);

    return d;

}