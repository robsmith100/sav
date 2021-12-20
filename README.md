# sav-reader
Javascript library to read .sav data files.

Credits to [GNU PSPP](https://www.gnu.org/software/pspp/) for documenting most of the .sav file format.

## Motivation

I needed a way to analyze the records in a local .sav file, without opening the entire file into memory. The `open` command only loads the metadata (see below) into memory. The records can then be enumerated upon request using `readNextRow`. If the file is kept open, the record pointer can be reset to the first record for another table scan if needed, excluding the need to re-parse the metadata.

Depending on your usage, and if the file is small enough, you can read all records using `readAllRows` rather than reading them one at a time.

I also wanted to use this in a node express api, where the file was posted and loaded into memory as a Buffer. So I added the SavBufferReader (see example below).

## Metadata

### File Header

Metadata contains a file header. Here's an example:

```javascript
// meta.header
{ 
  product: '@(#) IBM SPSS STATISTICS 64-bit MS Windows 23.0.0.0',
  encoding: 'UTF-8',
  created: '2015-08-24T20:51:32.000Z',
  weight: null,
  n_vars: 69,
  n_cases: 21504,
  compression: { bias: 100 } 
}
```

### Variables & Value Labels

Metadata contains variables and value labels:

```javascript
// example numeric var
{
  name: 'q1',
  type: 'numeric',
  label: 'Please specify your country of residence.',
  missing: 999
}

// example numeric var with two missing values
{
  name: 'q2',
  type: 'numeric',
  label: 'What was your total household income last year in bitcoin?',
  missing: { values: [98, 99] }
}

// example value labels for the above var
[
  { val: 1, label: "0฿ to 99฿" },
  { val: 2, label: "100฿ to 499฿" },
  { val: 3, label: "500฿ to 2,000฿" },
  { val: 4, label: "2,000฿ or more" },
  { val: 98, label: "Prefer not to answer" },
  { val: 99, label: "Don't know" },
]

// example string var
{
  name: 'q2',
  type: 'string',
  len: 500,
  label: 'In 500 characters or less, please describe what you liked best about the excursion?',
}
```


# Getting Started

## Installation


```
npm i sav-reader
```


## Open a local file

```javascript

import { SavFileReader } from "sav-reader"; // import the commonjs module

// create new sav reader from local file
const sav = new SavFileReader("my data file.sav");

// this opens the file and loads all metadata (but not the data records)
await sav.open();

// print the header, vars, valuelabels, etc.
// (more info about vars and valuelabels below)
console.log(sav.meta);

```

## Read the data records (all at once)

```javascript

// read all data rows into memory
const data = await sav.readAllRows();

```

## Read the data records (iteratively)

```javascript

// row iteration (only one row is used at a time)
let row = null;
do{
    row = await sav.readNextRow();
    if( row != null ){

        // do something with the row
        // row.index contains the row index
        // row.data contains the row data

        // !!note: for simplicity i should maybe abandon the .index and .data concept and just return the row data

    }
} while( row != null );

```

## Example Usage (api method using Buffer)

```javascript

import { SavBufferReader } from "sav-reader"; // import the commonjs module

const updateFile = async (req, res, next) => {

    // grab posted file from request
    const file1 = req.files.file1;

    // get buffer
    const buffer = file1.data;

    const sav = new SavBufferReader(buffer);
    await sav.open(); // load metadata
    
    // etc...

}

```


## Print variables and value labels

```javascript

    const sav = new SavFileReader(filename);

    // this opens the file and loads all metadata (but not the data records)
    await sav.open()

    // print the header, which contains number of cases, encoding, etc.
    console.log(sav.meta.header)

    // print the vars
    sav.meta.sysvars.forEach(v => {

        // print the var, type, label and missing values specifications
        console.log(v)

        // find and print value labels for this var if any
        const valueLabels = sav.meta.getValueLabels(v.name)
        if (valueLabels){
            console.log(valueLabels)
        }

    })

```

