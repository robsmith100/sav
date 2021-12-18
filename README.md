# sav
Javascript library to read .sav data files.

This is my first Javascript project, first npm project, first typescript package, etc. So take that fwiw.

Credits to [GNU PSPP](https://www.gnu.org/software/pspp/) for documenting most of the .sav file format. I reverse engineered a few missing specs, such as extreme length string vars.

## Motivation

I needed a way to analyze the records in a local .sav file, without opening the whole file into memory. The library only loads
the metadata (see below) into memory. The records are enumerated upon request. If the file is kept open, the record pointer
can be reset to the first record for another table scan if needed (excluding the need to re-parse the metadata).

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

or

yarn add sav-reader
```


## Example Usage

See test.js for a working example, just in case there are typos here.

```javascript

import { SavFileReader } from "./sav-reader";

// note: there's a SavBufferReader you can use if you already have the file read into memory
// import { SavBufferReader } from "./sav-reader";

async function test1(){

    const sav = new SavFileReader(filename);

    // alternative:
    // const sav = new SavBufferReader(myBuf); // where myBuf is a Buffer

    // this opens the file and loads all metadata (but not the records a.k.a. cases)
    await sav.open()

    // print the header, which contains number of cases, encoding, etc.
    console.log(sav.meta.header)

    // print the vars
    sav.meta.sysvars.map(v => {

        // print the var, type, label and missing values specifications
        console.log(v)

        // find and print value labels for this var if any
        const valueLabels = sav.meta.getValueLabels(v.name)
        if (valueLabels){
            console.log(valueLabels)
        }

    })

  // object to collect test frequencies of variable Q1
  let test_frequencies = {};

  // row iteration (only one row is used at a time)
  let row = null;
  do{
      row = await sav.readNextRow();
      if( row != null ){

          // print the row index and value of variable 'uuid' every 1000 records
          if( row.index % 1000 === 0 ){
              console.log(row.index, row.data['uuid']);
          }

          // collect frequencies of variable 'Q1'
          if( row.data.Q1 != null ){
              q1_frequencies[row.data.Q1] = (q1_frequencies[row.data.Q1] || 0) + 1;
          }
      }
  } while( row != null );

  // print the frequencies
  console.log(q1_frequencies);

}


```

