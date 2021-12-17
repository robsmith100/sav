var DisplayFormat = require('../DisplayFormat');

/**
 * Immediately following the header must come the variable records. There must be one
 * variable record for every variable and every 8 characters in a long string beyond
 * the first 8; i.e., there must be exactly as many variable records as the value
 * specified for case_size in the file header record. 
 * 
 */
class VariableRecord{

    static async read(reader){

        let r = reader;

        // Variable type code. Set to 0 for a numeric variable. For a short string variable
        // or the first part of a long string variable, this is set to the width of the string.
        // For the second and subsequent parts of a long string variable, set to -1, and the
        // remaining fields in the structure are ignored.
        let type = await r.readInt32();

        // If this variable has a variable label, set to 1; otherwise, set to 0.
        let hasLabel = (await r.readInt32()) == 1;

        // If the variable has no missing values, set to 0. If the variable has one, two, or
        // three discrete missing values, set to 1, 2, or 3, respectively. If the variable
        // has a range for missing variables, set to -2; if the variable has a range for
        // missing variables plus a single discrete value, set to -3. 
        let n_missing_values = await r.readInt32();

        // Print format for this variable. See below.
        let printFormat = await r.readInt32();

        // Write format for this variable. See below.
        let writeFormat = await r.readInt32();

        // (8 chars)
        // Variable name. The variable name must begin with a capital letter or the
        // at-sign (@). Subsequent characters may also be octothorpes (#), dollar signs ($),
        // underscores (_), or full stops (.). The variable name is padded on the right with
        // spaces.
        let shortName = await r.readString(8, true);


        let label = null;
        if( hasLabel ){

            // These field are present only if has_var_label is true
            
            // The length, in characters, of the variable label, which must be a number between 0 and 120.
            let labelLen = await r.readInt32();

            // This field has length label_len, rounded up to the nearest multiple of 32 bits.
            // The first label_len characters are the variable's variable label.
            label = await r.readString(labelLen);

            // consume the padding as explained above
            let padding = 4 - (labelLen % 4);
            if( padding < 4 ){
                await r.readString(padding);
            }
        }



        // missing values
        // This field is present only if n_missing_values is not 0. It has the same number of
        // elements as the absolute value of n_missing_values. For discrete missing values,
        // each element represents one missing value. When a range is present, the first element
        // denotes the minimum value in the range, and the second element denotes the maximum
        // value in the range. When a range plus a value are present, the third element denotes
        // the additional discrete missing value. HIGHEST and LOWEST are indicated as described
        // in the chapter introduction.
        let missing = null;
        if( n_missing_values == 1 ){ // one discrete missing value
            missing = await r.readDouble();
        }
        else if( n_missing_values == 2 || n_missing_values == 3 ){ // two or three discrete missing values
            missing = [];
            for( var i = 0; i < n_missing_values; i++){
                missing.push(await r.readDouble());
            }
        }
        else if( n_missing_values == -2){ // a range for missing values
            missing = { 
                min: await r.readDouble(),
                max: await r.readDouble()
            };
        }
        else if( n_missing_values == -3 ){ // a range for missing values plus a single discrete missing value
            missing = {
                min: await r.readDouble(),
                max: await r.readDouble(),
                value: await r.readDouble()
            };
        }
        else if( n_missing_values == 0 ){ // no missing values
        }
        else{
            throw Error("unknown missing values specification: " + sysvar.nbMissingValues);
        }





        // construct simplified return structure

        let sysvar = {
            name: shortName,
            shortName: shortName,
            type: type == 0 ? 'numeric' : type > 0 ? 'string' : 'string-cont',
        };

        if( type > 0 ){ // string var
            sysvar.len = type;
        }

        if( label ){
            sysvar.label = label;
        }

        if( missing ){
            sysvar.missing = missing;
        }

        sysvar.printFormat = DisplayFormat.parseInt(printFormat);
        
        sysvar.writeFormat = DisplayFormat.parseInt(writeFormat);

        return sysvar;

    }

}

module.exports = VariableRecord;



