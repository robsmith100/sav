class InfoRecord{

    static async read(reader, meta){
        
        let r = reader;

        let subType = await r.readInt32();
        let size = await r.readInt32();
        let count = await r.readInt32();
        let byteData = await r.readBytes(size * count);

        let record = {
            recType: 7,
            recTypeStr: 'Info record',
            subType,
            size,
            count,
            byteData
        };

        if( subType == 3 ){
            record.subTypeStr = 'machine int32 info';
            // machine int32 info record
            // describes how int32s are stored as binary
            delete(record.byteData);
            return record;
        }
        else if( subType == 4 ){
            record.subTypeStr = 'machine flt64 info';
            // machine flt64 info record
            // describes how flt64s are stored as binary
            delete(record.byteData);
            return record;
        }
        else if( subType == 7 ){
            record.subTypeStr = 'multiple response sets (todo)';
            // multiple response sets
            // todo!
            //string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            //Trace.WriteLine(str1);

            // multiple lines separated by char(10)
            // each line contains:

            //$
            //set name
            //=
            //D1  (dichotomies, counted value=1)
            //space? char(32)
            //1 (category labels source = variable labels?)
            //space? char(32)
            //label length
            //space? char(32)
            //label
            //space? char(32)
            //space-separated list of var names; space is char(32)
            //newline (char dec 10)
            delete(record.byteData);
            return record;
        }
        else if( subType == 11 ){
            record.subTypeStr = 'auxilliary variable parameter';
            // auxilliary variable parameter (one per system file)

            // todo: this describes measurement, width, alignment for vars
            delete(record.byteData);
            record.byteData = 'TODO!';

            return record;
        }
        else if( subType == 13 ){
            record.subTypeStr = 'long variable names record';
            // long variable names record
            record.longNames = {};

            // this is very interesting, because the "long" name isn't even necessarily longer than the original (perhaps lower-case letters force a long name to be generated?)
            // actually, yeah the spec doesn't let a varname start with a lowercase letter i think, so if you want your vars to have the correct casing, you'll need to set up a long name.

            // tab separated list of NAME=LONGNAME entries
            // i don't think these can contain crazy characters, so encoding shouldn't matter
            let longVarNames = record.byteData.trimEnd(); // System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            //string longvarnames = System.Text.ASCIIEncoding.GetEncoding(1252).GetString(bytedata);
            delete(record.byteData);

            let pairs = longVarNames.split('\t'); //Split(new char[] { '\t' }, StringSplitOptions.RemoveEmptyEntries);
            for( let p in pairs) {
                let pair = pairs[p];

                let pcs = pair.split('=');
                let name = pcs[0];
                let longName = pcs[1];

                record.longNames[name] = longName;

                let sysvar = meta.sysvars.find(x => x.shortName === name);
                if( sysvar != null ){
                    sysvar.name = longName;
                }

            }
            return record;
        }
        else if( subType == 14 ){
            record.subTypeStr = 'super long string variables record';
            // // this records helps piece together string variables that were separated because their content was > 255 or some long length

            // if (xlong_string_map != null) {
            //     throw new Exception("Didn't expect to receive multiple very long string records");
            // }

            // // i think...
            // // this byte array is a \0\t separated list of VARNAME=LENGTH entries for string variables with length > 255?
            // // example: Z6=2283\0\tZ7P=587\0\tZ7N=685\0\tZ14P=430\0\tZ14N=460\0\tZ18N=475\0\tZ21N=702\0\tZ30P=1785\0\tZ30N=402\0\tZ33P=334\0\tZ36P=328\0\tZ36N=1066\0\tZ41P=911\0\tZ44P=323\0\tZ44N=483\0\tZ48N=285\0\tZ52N=403\0\t

            // // i don't think this can contain crazy characters, so encoding shouldn't matter
            // string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            // xlong_string_map = str1;
            return record;
        }
        else if( subType == 20 ){
            record.subTypeStr = 'encoding record';
            record.encoding = record.byteData.trimEnd();

            meta.header.encoding = record.encoding;

            delete(record.byteData);

            // // encoding (?)
            // string str1 = System.Text.ASCIIEncoding.UTF8.GetString(bytedata);
            // if (str1 == "windows-1252" || str1 == "WINDOWS-1252" || str1 == "CP1252") {
            //     schemainfo.encoding = Encoding.GetEncoding(1252);
            // }
            // else if (str1 == "UTF-7") {
            //     schemainfo.encoding = Encoding.UTF7;
            // }
            // else if (str1 == "UTF-8") {
            //     schemainfo.encoding = Encoding.UTF8;
            // }
            // else if (str1 == "UTF-32") {
            //     schemainfo.encoding = Encoding.UTF32;
            // }
            // else {
            //     // unrecognized encoding
            //     MessageBox.Show("Unrecognized encoding \"" + str1 + "\".  Please report to Metric Studios.");
            // }
            return record;
        }
        else{
            record.subTypeStr = 'miscellaneous (unknown) record';
            // miscellaneous (unknown)
            // remember: bytes were already read in
            // spss might ignore it
            return record;
        }

    }

}

module.exports = InfoRecord;