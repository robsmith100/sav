class ValueLabelRecord{

    static async read(reader, sysvars){

        let r = reader;

        let set = {
            appliesTo: [],
            entries: []
        }


        // determine the number of value/label pairs
        let count = await r.readInt32();

        // read the value/label pairs
        for( let i = 0; i < count; i++ ){

            // get value
            let val = await r.readDouble();

            // get label
            let labelLen = await r.readByte();
            let label = await r.readString(labelLen);
            if ((labelLen + 1) % 8 != 0) {
                let padding = 8 - ((labelLen + 1) % 8);
                await r.readString(padding);
            }

            set.entries.push({
                val: val,
                label
            });

        }

        
        // check to see if next record is a value label variable record
        let next_rec_type = await r.peekByte();
        if( next_rec_type == 4 ){

            // value label variable record
            // this records tells us the variables which should use the preceding valuelabelset

            await r.readInt32(); // consume record type
            let nbVars = await r.readInt32();

            // read in vars
            for (let i = 0; i < nbVars; i++) {

                // read varindex
                let varIndex = await r.readInt32(); // 1-based var index

                // find variable
                let sysvar = sysvars[varIndex - 1];
                set.appliesTo.push(sysvar.shortName);

            }

            return set;
        }

        return null; // because it didn't apply to any vars
    }

}

module.exports = ValueLabelRecord;