import { SavFileReader, DateHelper } from "..";

//const sampleFilesFolder: string = "C:\\Program Files\\IBM\\SPSS Statistics\\Samples\\English";
//const sampleFilesFolder: string = "C:\\Users\\robth\\OneDrive\\Desktop";
const sampleFilesFolder: string = "C:\\Users\\robth\\Source\\robsmith100\\sav-reader\\test-data";
console.log("sampleFilesFolder", sampleFilesFolder);

//const filename = `${sampleFilesFolder}/string valuelabel test.sav`;
//const filename = `${sampleFilesFolder}/aflatoxin.sav`;
const filename = `${sampleFilesFolder}/testing display.sav`;


const run = async () => {


    // var checks = [0, 13560348821, 13560399288, 13548592882, 12219379200, 13797216000];
    // checks.forEach(n => {
    //     var dt = DateHelper.dateFromNumber(n);
    //     var n2 = DateHelper.dateToNumber(dt);
    //     console.log(n, dt, n2, n2-n);
    // })
    //return;

    // open the file
    const sav = new SavFileReader(filename);
    await sav.open();

    

    console.log("firstRecordPosition", sav.meta.firstRecordPosition);
    console.log("pos", sav.reader.getPosition());

    console.log("integerInfo", sav.meta.integerInfo);
    //return;

    // console.log(sav.meta.header);
    console.log("vars");
    console.log(sav.meta.sysvars);

    console.log("valuelabels");
    //console.log(sav.meta.valueLabels);
    sav.meta.valueLabels?.forEach(vlrec => {
        console.log(vlrec);
    })

    // const rowData = await sav.readAllRows();
    // let rowIndex = 1;
    // for (let row of rowData) {
    //     console.log(rowIndex++, row);
    // }

    let row = null;
    console.log("first 10 rows");
    do {
        row = await sav.readNextRow();
        if (row && (sav.rowIndex < 10)) {
            console.log(sav.rowIndex, row);
        }

        // if (row && sav.rowIndex >= 10) {
            
        // }
    }
    while( row  )

}
run();