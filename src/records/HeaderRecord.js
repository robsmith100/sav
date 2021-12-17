class HeaderRecord{

    static async read(reader){

        // the product that created the file, e.g., @(#) IBM SPSS STATISTICS 64-bit MS Windows 23.0.0.0
        let product = await reader.readString(60, true);

        // I don't know what the layout code is. Somewhere I saw it suggested
        // that it determines endianness, but I thought info records determined that.
        let layout_code = await reader.readInt32();

        // Number of data elements per case. This is the number of variables, except that long string variables
        // add extra data elements (one for every 8 characters after the first 8). When reading system files, 
        // PSPP will use this value unless it is set to -1, in which case it will determine the number of data
        // elements by context. When writing system files PSPP always uses this value. 
        let case_size = await reader.readInt32();

        // true if the data in the file is compressed, false otherwise.
        let compressed = (await reader.readInt32()) == 1;

        // If one of the variables in the data set is used as a weighting variable, set to the index of that
        // variable. Otherwise, set to 0. 
        let weightIndex = await reader.readInt32();

        // Set to the number of cases in the file if it is known, or -1 otherwise. 
        // In the general case it is not possible to determine the number of cases that will be output to a
        // system file at the time that the header is written. The way that this is dealt with is by writing
        // the entire system file, including the header, then seeking back to the beginning of the file and
        // writing just the ncases field. For 'files' in which this is not valid, the seek operation fails.
        // In this case, ncases remains -1.
        let n_cases = await reader.readInt32();

        // Compression bias. Always set to 100. The significance of this value is that only numbers between
        // (1 - bias) and (251 - bias) can be compressed.
        let bias = await reader.readDouble();

        // (9 chars)
        // Set to the date of creation of the system file, in dd mmm yy format, with the month as
        // standard English abbreviations, using an initial capital letter and following with lowercase.
        // If the date is not available then this field is arbitrarily set to 01 Jan 70. 
        let creationDate = await reader.readString(9);

        // (8 chars)
        // Set to the time of creation of the system file, in hh:mm:ss format and using 24-hour time. If the
        // time is not available then this field is arbitrarily set to 00:00:00. 
        let creationTime = await reader.readString(8);

        // (64 chars)
        // Set the the file label declared by the user, if any. Padded on the right with spaces.
        let fileLabel = await reader.readString(64, true);

        // (3 chars)
        // Ignored padding bytes to make the structure a multiple of 32 bits in length. Set to zeros. 
        await reader.readString(3); // padding




        
        // now to return a readable json version of the header data read above
        var record = {
            product,
            encoding: null, // placeholder: populates later with info record
            created: new Date(creationDate + ' ' + creationTime).toISOString(),
            fileLabel,
            case_size,
            weightIndex, // 1-based index of var
            weight: null, // placeholder: populates var name during metadata post-process via lookup using weightIndex
            n_vars: null, // placeholder: populates during metadata post-process after string-continuation vars are deleted
            n_cases
        }

        if( compressed ){
            record.compression = {
                bias
            };
        }

        // delete filelabel if empty since I've rarely seen it populated
        if( record.fileLabel == '' || record.fileLabel == null ){
            delete(record.fileLabel);
        }

        return record;
    }

}

module.exports = HeaderRecord;