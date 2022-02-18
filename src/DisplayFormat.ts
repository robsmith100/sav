/**
 * The print and write members of sysfile_variable are output formats coded into int32
 * types. The LSB (least-significant byte) of the int32 represents the number of decimal
 * places, and the next two bytes in order of increasing significance represent field
 * width and format type, respectively. The MSB (most-significant byte) is not used and
 * should be set to zero. 
 * 
 */


/**
 * sysfile_variable format type
 */
enum sys_formattype {
    //Not_used: 0,
    A = 1,
    AHEX = 2,
    COMMA = 3,
    DOLLAR = 4,
    F = 5,
    IB = 6,
    PIBHEX = 7,
    P = 8,
    PIB = 9,
    PK = 10,
    RB = 11,
    RBHEX = 12,
    //Not used.=13,
    //Not used.=14,
    Z = 15,
    N = 16,
    E = 17,
    //Not used.=18,
    //Not used.=19,
    DATE = 20,
    TIME = 21,
    DATETIME = 22,
    ADATE = 23,
    JDATE = 24,
    DTIME = 25,
    WKDAY = 26,
    MONTH = 27,
    MOYR = 28,
    QYR = 29,
    WKYR = 30,
    PCT = 31,
    DOT = 32,
    CCA = 33,
    CCB = 34,
    CCC = 35,
    CCD = 36,
    CCE = 37,
    EDATE = 38,
    SDATE = 39
};


/**
 * The print and write members of sysfile_variable are output formats coded into int32
 * types. The LSB (least-significant byte) of the int32 represents the number of decimal
 * places, and the next two bytes in order of increasing significance represent field
 * width and format type, respectively. The MSB (most-significant byte) is not used and
 * should be set to zero. 
 */
export class DisplayFormat{

    type: sys_formattype;

    typestr: string;

    width: number;

    nbdec: number;
    
    static parseInt(format): DisplayFormat {

        const f = new DisplayFormat();
        f.type = (format & 0xFF0000) >> 16;
        f.typestr = sys_formattype[f.type];
        f.width = (format & 0x00FF00) >> 8;
        f.nbdec = (format & 0x0000FF);
        return f;

    }


}








