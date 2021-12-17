

/** There must be no more than one document record per system file. Document
    records must follow the variable records and precede the dictionary termination record.  
    */
class DocumentRecord{

    static async read(reader){

        // Number of lines of documents present.
        let n_lines = await reader.readInt32();

        // Document lines. The number of elements is defined by n_lines. Lines shorter than 80 characters are padded on the right with spaces. 
        let lines = [];
        for( let i = 0; i < n_lines; i++ ){
            doc.lines.push(await r.readString(80, true));
        }

        return {
            n_lines,
            lines
        }

    }

}

module.exports = DocumentRecord;