/**
 * The print and write members of sysfile_variable are output formats coded into int32
 * types. The LSB (least-significant byte) of the int32 represents the number of decimal
 * places, and the next two bytes in order of increasing significance represent field
 * width and format type, respectively. The MSB (most-significant byte) is not used and
 * should be set to zero. 
 * 
 * 
 * Format types are defined as follows: 
 * 
 * 0	Not used.
 * 1	A
 * 2	AHEX
 * 3	COMMA
 * 4	DOLLAR
 * 5	F
 * 6	IB
 * 7	PIBHEX
 * 8	P
 * 9	PIB
 * 10	PK
 * 11	RB
 * 12	RBHEX
 * 13	Not used.
 * 14	Not used.
 * 15	Z
 * 16	N
 * 17	E
 * 18	Not used.
 * 19	Not used.
 * 20	DATE
 * 21	TIME
 * 22	DATETIME
 * 23	ADATE
 * 24	JDATE
 * 25	DTIME
 * 26	WKDAY
 * 27	MONTH
 * 28	MOYR
 * 29	QYR
 * 30	WKYR
 * 31	PCT
 * 32	DOT
 * 33	CCA
 * 34	CCB
 * 35	CCC
 * 36	CCD
 * 37	CCE
 * 38	EDATE
 * 39	SDATE
 * 
 */
class DisplayFormat{


  static parseInt(format) {
    let type = (format & 0xFF0000) >> 16;
    let width = (format & 0x00FF00) >> 8;
    let nbdec = (format & 0x0000FF);

    let typestr = null;

    let ft = DisplayFormat.sys_formattype;

    for( let property in ft ){
      if( ft.hasOwnProperty(property)){
        if( ft[property] == type ){
          typestr = property;
          break;
        }
      }
    }

    return {
      type,
      typestr,
      width,
      nbdec
    }
  }


}

DisplayFormat.sys_formattype = {
  //Not_used: 0,
  A: 1,
  AHEX: 2,
  COMMA: 3,
  DOLLAR: 4,
  F: 5,
  IB: 6,
  PIBHEX: 7,
  P: 8,
  PIB: 9,
  PK: 10,
  RB: 11,
  RBHEX: 12,
  //Not used.=13,
  //Not used.=14,
  Z: 15,
  N: 16,
  E: 17,
  //Not used.=18,
  //Not used.=19,
  DATE: 20,
  TIME: 21,
  DATETIME: 22,
  ADATE: 23,
  JDATE: 24,
  DTIME: 25,
  WKDAY: 26,
  MONTH: 27,
  MOYR: 28,
  QYR: 29,
  WKYR: 30,
  PCT: 31,
  DOT: 32,
  CCA: 33,
  CCB: 34,
  CCC: 35,
  CCD: 36,
  CCE: 37,
  EDATE: 38,
  SDATE: 39
}



module.exports = DisplayFormat;




