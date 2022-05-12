import { VariableRecord } from "./VariableRecord";

export class ValueLabelEntry{
    val: number | string;
    label: string;
    _valBytes?: any;
}

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

    static async read(reader, vrecs: VariableRecord[]): Promise<ValueLabelRecord>{

        let set = new ValueLabelRecord();

        // determine the number of value/label pairs
        const count = await reader.readInt32();

        // read the value/label pairs
        for( let i = 0; i < count; i++ ){

            // get value
            //const val = await reader.readDouble();
            const _valBytes = await reader.readBytes(8);
            const val = bytesToDouble(_valBytes);
            

            // get label
            const labelLen = await reader.readByte();
            const label = labelLen > 0 ? await reader.readString(labelLen) : "";
            if ((labelLen + 1) % 8 !== 0) {
                const padding = 8 - ((labelLen + 1) % 8);
                await reader.readString(padding);
            }

            set.entries.push({
                val,
                _valBytes,
                label
            });

        }

        // check to see if next record is a value label variable record
        const next_rec_type = await reader.peekByte();
        if( next_rec_type == 4 ){

            // value label variable record
            // this records tells us the variables which should use the preceding valuelabelset

            await reader.readInt32(); // consume record type
            const nbVars = await reader.readInt32();

            // read in vars
            for (let i = 0; i < nbVars; i++) {

                // read varindex
                const varIndex = await reader.readInt32(); // 1-based var index

                // find variable
                const vrec = vrecs[varIndex - 1];
                set._appliesToShortNames.push(vrec.shortName);

            }

            return set;
        }

        return null; // ignore, because it didn't apply to any vars
    }

}

const bytesToDouble = (buf): number => {

    if (buf.length !== 8) throw Error("not enough bytes read for Double");
    
    var ab = new ArrayBuffer(8);
    var bufView = new Uint8Array(ab);
    bufView[0] = buf[7];
    bufView[1] = buf[6];
    bufView[2] = buf[5];
    bufView[3] = buf[4];
    bufView[4] = buf[3];
    bufView[5] = buf[2];
    bufView[6] = buf[1];
    bufView[7] = buf[0];
    let dv = new DataView(ab);
    let d = dv.getFloat64(0);

    return d;

}