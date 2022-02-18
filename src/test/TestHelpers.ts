
export const cc = {
    Reset: "\x1b[0m", Bright: "\x1b[1m", Dim: "\x1b[2m", Underscore: "\x1b[4m", Blink: "\x1b[5m", Reverse: "\x1b[7m", Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m", FgRed: "\x1b[31m", FgGreen: "\x1b[32m", FgYellow: "\x1b[33m", FgBlue: "\x1b[34m", FgMagenta: "\x1b[35m", FgCyan: "\x1b[36m", FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m", BgRed: "\x1b[41m", BgGreen: "\x1b[42m", BgYellow: "\x1b[43m", BgBlue: "\x1b[44m", BgMagenta: "\x1b[45m", BgCyan: "\x1b[46m", BgWhite:"\x1b[47m",
}

export const isValid = d => d !== null && d !== undefined;

export const eq = (d1: number, d2: number, nbdecs: number) => {
    const scale = 10 * nbdecs;
    const rounded_d1 = Math.round(d1 * scale) / scale;
    const rounded_d2 = Math.round(d2 * scale) / scale;
    return rounded_d1 === rounded_d2;
}

export const computeDescriptives = (rows, field) => {
    const acc = rows.reduce(
        (a, r) => {
            const val = r[field];
            if (isValid(val)) {
                a.valid++;
                a.sum = (a.sum || 0) + val;
                a.min = a.min ? Math.min(a.min, val) : val;
                a.max = a.max ? Math.max(a.max, val) : val;
            }
            return a;
        },
        {
            sum: null,
            min: null,
            max: null,
            valid: 0
        }
    );
    return {
        sum: acc.sum,
        mean: acc.valid > 0 ? acc.sum / acc.valid : null,
        min: acc.min,
        max: acc.max,
        n: acc.valid
    }
}

