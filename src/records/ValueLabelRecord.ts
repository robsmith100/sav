import { VariableRecord } from "./VariableRecord";

export class ValueLabelEntry{
    val: number;
    label: string;
}

export class ValueLabelRecord{

    constructor() {
        this.appliesToShortNames = [];
        this.entries = [];
    }

    /**
     * Array of shortNames that this record applies to
     */
    appliesToShortNames: string[];

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
            const val = await reader.readDouble();

            // get label
            const labelLen = await reader.readByte();
            const label = labelLen > 0 ? await reader.readString(labelLen) : "";
            if ((labelLen + 1) % 8 !== 0) {
                const padding = 8 - ((labelLen + 1) % 8);
                await reader.readString(padding);
            }

            set.entries.push({
                val,
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
                set.appliesToShortNames.push(vrec.shortName);

            }

            return set;
        }

        return null; // ignore, because it didn't apply to any vars
    }

}

