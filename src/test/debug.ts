import { SavFileReader } from "..";

const sampleFilesFolder: string = "C:\\Program Files\\IBM\\SPSS Statistics\\Samples\\English";
console.log("sampleFilesFolder", sampleFilesFolder);

const filename = `${sampleFilesFolder}/aflatoxin.sav`;

const run = async () => {

    // open the file
    const sav = new SavFileReader(filename);
    await sav.open();

    console.log(sav.meta.header);
    console.log(sav.meta.sysvars);
    //console.log(sav.meta.valueLabels);

    const rowData = await sav.readAllRows();
    let rowIndex = 1;
    for (let row of rowData) {
        console.log(rowIndex++, row);
    }

}
run();