var SavBufferReader = require('./SavBufferReader');
var fs = require('fs');

// console coloring constants
const cc = {
    Reset: "\x1b[0m", Bright: "\x1b[1m", Dim: "\x1b[2m", Underscore: "\x1b[4m", Blink: "\x1b[5m", Reverse: "\x1b[7m", Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m", FgRed: "\x1b[31m", FgGreen: "\x1b[32m", FgYellow: "\x1b[33m", FgBlue: "\x1b[34m", FgMagenta: "\x1b[35m", FgCyan: "\x1b[36m", FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m", BgRed: "\x1b[41m", BgGreen: "\x1b[42m", BgYellow: "\x1b[43m", BgBlue: "\x1b[44m", BgMagenta: "\x1b[45m", BgCyan: "\x1b[46m", BgWhite:"\x1b[47m",
}

function stream2buffer(stream) {
    return new Promise((resolve, reject) => {
        const _buf = [];
        stream.on("data", (chunk) => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(err));

    });
} 


const filename = "test-data/generic dataset 6.sav";


async function test_buf() {
    
    const stream = fs.createReadStream(filename, { encoding: null, highWaterMark: 1048576 });
    const buffer = await stream2buffer(stream);
    console.log("buffer.length", buffer.length);
    
    var sav = new SavBufferReader(buffer);
    await sav.open();

    // print the header
    console.log(cc.FgMagenta + 'File Header:' + cc.Reset)
    console.log(sav.meta.header);
    
    // print the vars
    console.log(cc.FgMagenta + 'Variables:' + cc.Reset)
    sav.meta.sysvars.map(x => {

        let namestr = `${cc.FgGreen}${x.name}`;
        let typestr = `${cc.FgCyan}[${x.type}${(x.len != null ? cc.FgWhite + '(' + x.len + ')' : '')}`;
        typestr += cc.FgYellow + ' ' + x.printFormat.typestr + ',' + x.printFormat.width + ',' + x.printFormat.nbdec;
        typestr += cc.FgCyan + ']';

        console.log(`${namestr} ${typestr} ${cc.Reset}${x.label}` );
        
        // let vl = sav.meta.getValueLabels(x.name);
        // if( vl ){
        //     console.log(vl);
        // }

    });

    

    // print the value labels
    console.log(cc.FgMagenta + 'Value Labels:' + cc.Reset)
    sav.meta.valueLabels.map(vl => {
        console.log(vl);
    })

    


    // position of first record
    console.log('firstRecordPosition:', sav.meta.firstRecordPosition);

    //throw new Error("stopped");


    // scan
    console.log(cc.FgMagenta + 'Row Scanning:' + cc.Reset)
    let row = null;
    let q1_frequencies = {};
    do{
        row = await sav.readNextRow();

        if( row != null ){
            if( row.index % 1000 == 0 ){
                console.log(row.index, row.data['uuid']);
            }

            if( row.data.Q1 != null ){
                q1_frequencies[row.data.Q1] = (q1_frequencies[row.data.Q1] || 0) + 1;
            }
        }

        //console.log(row);
        
    } while( row != null );

    console.log(cc.FgMagenta + 'Frequencies:' + cc.Reset)
    console.log(q1_frequencies);
    

}

test_buf()
    // .catch((err) => {
    //     console.error(cc.FgRed + 'error: ' + cc.Reset + err)
    // });


