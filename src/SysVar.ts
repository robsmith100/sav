import { DisplayFormat } from "./DisplayFormat.js";

export const enum SysVarType{
    numeric,
    string
}

export class SysVar{

    type: SysVarType;

    printFormat: DisplayFormat;

    writeFormat: DisplayFormat;

    name: string;

    label: string;

    missing: any;

    /**
     * For internal use when reading data
     */
    __nb_string_contin_recs: number;

    /**
     * For internal use when reading data
     */
    __child_string_sysvars: SysVar[];

    __is_child_string_var: boolean;
    
}




