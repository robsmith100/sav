import { SavFileReader } from "..";

//const sampleFilesFolder: string = "C:\\Program Files\\IBM\\SPSS Statistics\\Samples\\English";
const sampleFilesFolder: string = "C:\\Users\\robth\\OneDrive\\Desktop";
console.log("sampleFilesFolder", sampleFilesFolder);

const filename = `${sampleFilesFolder}/string valuelabel test.sav`;
//const filename = `${sampleFilesFolder}/aflatoxin.sav`;


const run = async () => {

    // open the file
    const sav = new SavFileReader(filename);
    await sav.open();

    

    console.log("firstRecordPosition", sav.meta.firstRecordPosition);
    console.log("pos", sav.reader.getPosition());

    // console.log(sav.meta.header);
    // console.log(sav.meta.sysvars);
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
    do {
        row = await sav.readNextRow();
        if (row && (sav.rowIndex < 5 || sav.rowIndex > 310)) {
            console.log(sav.rowIndex, row);
        }

        // if (row && sav.rowIndex >= 10) {
            
        // }
    }
    while( row  )

}
run();