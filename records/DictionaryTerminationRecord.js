class DictionaryTerminationRecord{

    static async read(reader){

        await reader.readInt32(); // read filler
        
    }

}

module.exports = DictionaryTerminationRecord;