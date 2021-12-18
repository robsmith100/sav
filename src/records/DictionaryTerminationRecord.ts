export class DictionaryTerminationRecord{

    static async read(reader): Promise<DictionaryTerminationRecord>{

        await reader.readInt32(); // read filler
        return {};
        
    }

}

