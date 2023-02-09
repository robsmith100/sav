import { DisplayFormat } from "./DisplayFormat.js";
import { VarDisplay } from "./records/VariableRecord.js";

export const enum SysVarType{
    numeric,
    string
}

export class SysVar{

    type: SysVarType;

    printFormat: DisplayFormat;

    writeFormat: DisplayFormat;

    display: VarDisplay;

    name: string;

    label: string;

    missing: any;

    /**
     * For internal use when reading data. Should probably find a better way to approach this.
     */
    __nb_string_contin_recs: number;

    /**
     * For internal use when reading data
     */
    __child_string_sysvars: SysVar[];

    __is_child_string_var: boolean;

    /**
     * For internal use when mapping valuelabels. Should find a better way to approach this.
     */
    __shortName: string;
    
}




