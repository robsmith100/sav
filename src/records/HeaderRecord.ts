
export class HeaderRecord{

    /**
     * the product that created the file, e.g., @(#) IBM SPSS STATISTICS 64-bit MS Windows 23.0.0.0
     */
    product: string;

    /**
     * placeholder: populates later with info record (todo- better docs on this)
     */
    encoding: string;

    /**
     * I don't know what the layout code is. Somewhere I saw it suggested
     * that it determines endianness, but I thought info records determined that.
     */
    layout_code: number;

    /**
     * Number of data elements per case. This is the number of variables, except that long string variables
     * add extra data elements (one for every 8 characters after the first 8). When reading system files, 
     * PSPP will use this value unless it is set to -1, in which case it will determine the number of data
     * elements by context. When writing system files PSPP always uses this value.
     */
    case_size: number;

    /**
     * true if the data in the file is compressed, false otherwise.
     */
    compressed: boolean;

    /**
     * Set to 0 if the data in the file is not compressed, 1 if the data is compressed with simple
     * bytecode compression, 2 if the data is ZLIB compressed. This field has value 2 if and only
     * if rec_type is ‘$FL3’.
     */
    compression: any;

    /**
     * If one of the variables in the data set is used as a weighting variable, set to the index of that
     * variable. Otherwise, set to 0.
     */
    weightIndex: number;

    /**
     * Set to the number of cases in the file if it is known, or -1 otherwise. 
     * In the general case it is not possible to determine the number of cases that will be output to a
     * system file at the time that the header is written. The way that this is dealt with is by writing
     * the entire system file, including the header, then seeking back to the beginning of the file and
     * writing just the ncases field. For 'files' in which this is not valid, the seek operation fails.
     * In this case, ncases remains -1.
     */
    n_cases: number;

    /**
     * Compression bias. Always set to 100. The significance of this value is that only numbers between
     * (1 - bias) and (251 - bias) can be compressed.
     */
    bias: number;

    /**
     * (9 chars)
     * Set to the date of creation of the system file, in dd mmm yy format, with the month as
     * standard English abbreviations, using an initial capital letter and following with lowercase.
     * If the date is not available then this field is arbitrarily set to 01 Jan 70. 
     */
    creationDate: string;

    /**
     * (8 chars)
     * Set to the time of creation of the system file, in hh:mm:ss format and using 24-hour time. If the
     * time is not available then this field is arbitrarily set to 00:00:00. 
     */
    creationTime: string;

    /**
     * Amalgamation of creationDate and creationTime
     */
    created: Date;

    /**
     * (64 chars)
     * Set the the file label declared by the user, if any. Padded on the right with spaces.
     */
    fileLabel: string;

    /**
     * placeholder: populates var name during metadata post-process via lookup using weightIndex
     */
    weight: string;

    /**
     * placeholder: populates during metadata post-process after string-continuation vars are deleted
     */
    n_vars: number;

    static async read(reader): Promise<HeaderRecord>{

        let record = new HeaderRecord();

        record.product = await reader.readString(60, true);

        record.layout_code = await reader.readInt32();

        record.case_size = await reader.readInt32();

        record.compressed = (await reader.readInt32()) === 1;

        record.weightIndex = await reader.readInt32();

        record.n_cases = await reader.readInt32();

        record.bias = await reader.readDouble();

        record.creationDate = await reader.readString(9);

        record.creationTime = await reader.readString(8);

        record.created = new Date(record.creationDate + ' ' + record.creationTime);

        record.fileLabel = await reader.readString(64, true);

        // (3 chars)
        // Ignore padding bytes to make the structure a multiple of 32 bits in length. Set to zeros. 
        await reader.readString(3); // padding

        // weird ??
        if( record.compressed ){
            record.compression = {
                bias: record.bias
            };
        }

        // delete filelabel if empty since I've rarely seen it populated (do i really need to delete it? - who cares)
        if( !record.fileLabel ){
            delete(record.fileLabel);
        }

        return record;
    }

}

