
export class HeaderRecord{

    /**
     * Product that created the file, e.g., @(#) IBM SPSS STATISTICS 64-bit MS Windows 23.0.0.0
     * 
     * Product identification string. This always begins with the characters
     * ‘@(#) SPSS DATA FILE’. PSPP uses the remaining characters to give its
     * version and the operating system name; for example, ‘GNU pspp 0.1.4 -
     * sparc-sun-solaris2.5.2’. The string is truncated if it would be longer than
     * 60 characters; otherwise it is padded on the right with spaces.
     */
    product: string;

    /**
     * placeholder: populates later with info record (todo- better docs on this)
     */
    encoding: string;

    /**
     * I don't know what the layout code is. Somewhere I saw it suggested
     * that it determines endianness, but I thought info records determined that.
     * 
     * from PSPP docs:
     * Normally set to 2, although a few system files have been spotted in the wild
     * with a value of 3 here. PSPP use this value to determine the file’s integer
     * endianness (see Chapter 1 [System File Format], page 2).
     */
    layoutCode: number;

    /**
     * Number of data elements per case. This is the number of variables, except that
     * long string variables add extra data elements (one for every 8 characters after
     * the first 8). However, string variables do not contribute to this value beyond
     * the first 255 bytes. Further, some software always writes -1 or 0 in this field.
     * In general, it is unsafe for systems reading system files to rely upon this value.
     */
    _nominalCaseSize: number;

    /**
     * Number of final variables, excluding the string-continuation vars.
     * Populates during metadata post-process after string-continuation vars are deleted.
     */
    n_vars: number;

    /**
     * true if the data in the file is compressed, false otherwise.
     * (WHY DO I USE THIS INSTEAD OF JUST compression)
     */
    // compressed: boolean;



    /**
     * Includes type and bias (see below).
     * I haven't explored ZLIB compression yet, so maybe it could included info for that too if needed. Probably not.
     */
    compressionInfo: CompressionInfo; // includes type and bias (see below)

    /**
     * Set to 0 if the data in the file is not compressed, 1 if the data is compressed
     * with simple bytecode compression, 2 if the data is ZLIB compressed. This field
     * has value 2 if and only if rec_type is ‘$FL3’.
     */
    //compressionInfo.type: CompressionType;

    /**
     * If one of the variables in the data set is used as a weighting variable, set to
     * the dictionary index of that variable, plus 1.
     * Otherwise, set to 0.
     * 
     * Note: The dictionary index of a variable is a 1-based offset in the set of variable records,
     * including dummy variable records for long string variables. The first variable record has a
     * dictionary index of 1, the second has a dictionary index of 2, and so on.
     */
    _weightIndex: number;

    /**
     * Var name (is this the short name?) of the weight.
     * Populates during metadata post-process via lookup using weightIndex.
     */
    weightName: string;

    /**
     * Set to the number of cases in the file if it is known, or -1 otherwise.
     * In the general case it is not possible to determine the number of cases that will
     * be output to a system file at the time that the header is written. The way that
     * this is dealt with is by writing the entire system file, including the header, then
     * seeking back to the beginning of the file and writing just the ncases field. For
     * files in which this is not valid, the seek operation fails. In this case, ncases
     * remains -1.
     */
    n_cases: number;

    

    /**
     * Compression bias. Always set to 100. The significance of this value is that only numbers between
     * (1 - bias) and (251 - bias) can be compressed.
     * (todo: clarify- I think this is only used in bytecode compression)
     */
    //compressionInfo.bias: number;

    /**
     * (9 chars)
     * Set to the date of creation of the system file, in dd mmm yy format, with the month as
     * standard English abbreviations, using an initial capital letter and following with lowercase.
     * If the date is not available then this field is arbitrarily set to 01 Jan 70. 
     */
    _creationDate: string;

    /**
     * (8 chars)
     * Set to the time of creation of the system file, in hh:mm:ss format and using 24-hour time. If the
     * time is not available then this field is arbitrarily set to 00:00:00. 
     */
    _creationTime: string;

    /**
     * Amalgamation of creationDate and creationTime, as a javascript Date
     */
    created: Date;

    /**
     * (64 chars)
     * Set the the file label declared by the user, if any. Padded on the right with spaces.
     */
    fileLabel: string;
    

    static async read(reader): Promise<HeaderRecord>{

        let record = new HeaderRecord();

        
        record.product = await reader.readString(60, true);

        record.layoutCode = await reader.readInt32();

        record._nominalCaseSize = await reader.readInt32();

        const compressionType = (await reader.readInt32()) as CompressionType;

        record._weightIndex = await reader.readInt32();

        record.n_cases = await reader.readInt32();

        const compressionBias = await reader.readDouble();

        record.compressionInfo = {
            type: compressionType,
            bias: compressionBias
        };

        record._creationDate = await reader.readString(9);

        record._creationTime = await reader.readString(8);

        record.created = new Date(record._creationDate + ' ' + record._creationTime);

        record.fileLabel = await reader.readString(64, true);

        // (3 chars)
        // Ignore padding bytes to make the structure a multiple of 32 bits in length. Set to zeros. 
        await reader.readString(3); // padding

        return record;
    }

}

export enum CompressionType {
    None = 0,
    ByteCode = 1,
    ZLIB = 2
};

export class CompressionInfo{
    type: CompressionType;
    bias: number;
}