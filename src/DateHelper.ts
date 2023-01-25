export class DateHelper{

    // Note: SPSS time is stored in seconds since Oct 14, 1582,
    // a.k.a. 1582-10-14T00:00:00.000Z (except that I don't think SPSS cares about time zone)
    // (Obtained by observation: saving a timestamp in spss and inspecting saved bytes)

    // Note: Javascript Dates are stores as ticks since Unix Epoch
    // Unix Epoch is Jan 1, 1970 (UTC)
    
    // Jan 1, 1970 (no time zone) in SPSS seconds is 12219379200
    // Obtained by observation (I saved a date 1970-01-01 00:00:00.00 in spss, looked at file data)
    spss_unix_epoch: 12219379200; 

    // note:
    // 0 should be 1582-10-14T00:00:00.000Z
    // 13560348821 should be 6/29/2012 11:33:41 AM
    // 13548592882 should be 2/14/2012 10:01:22 AM
    // 12219379200 should be 1970-01-01 00:00:00.00
    // 13797216000 should be 2020-01-01 00:00:00.00

    static dateToNumber(d: Date): number {
        var tickspersecond = 1000; // js ticks per second
        var js_ticks = d.getTime(); // number of ticks since unix epoch
        var js_seconds = Math.round(js_ticks / tickspersecond); // number of seconds since unix epoch
        var spss_unix_epoch = 12219379200; // spss value at unix epoch
        var n = spss_unix_epoch + js_seconds;
        return n;
    }

    static dateFromNumber(n: number): Date {
        if(n === null || n === undefined) return null;
        if(isNaN(n)) return null;
        var spss_unix_epoch = 12219379200; 
        var seconds_since_unix_epoch = (n - spss_unix_epoch);
        var tickspersecond = 1000; // js ticks per second
        var dt = new Date(seconds_since_unix_epoch * tickspersecond);
        return dt;
    }


}








