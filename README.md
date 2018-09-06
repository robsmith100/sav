# sav
Javascript library to read .sav data files.

This is my first javascript project, and my first GitHub submit, so i don't know what i'm doing yet.

Upon opening a file, it reads the metadata into memory. Records are not immediately loaded into memory, becuase large files don't fit in memory.  Metadata contains the following:

#### Header

Metadata contains a file header. Here's an example:

```javascript
// meta.header
{
    product: '@(#) IBM SPSS STATISTICS 64-bit MS Windows 23.0.0.0',
    layout_code: 2,
    n_vars: 50,
    n_cases: 21504,
    weight: null,
    compressed: true,
    compressionBias: 100,
    created: '2015-08-04 14:51:32z',
    fileLabel: '',
    encoding: 'UTF-8' 
}
```

#### Variables & Value Labels

Metadata contains variables and valuelabels:

```javascript
// example numeric var
{
    name: 'q1',
    type: 'numeric',
    label: 'Please specify your country of residence.',
    missing: 999
},

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

Hi mom.


## Installation

Download from GitHub and put it somewhere.

## Example Usage

```javascript

// import it
var SavReader = require('./SavReader')


async function test1(){

    var sav = new SavReader('testfile.sav')

    // this opens the file and loads all metadata
    await sav.open()

    // print the header, which contains number of cases, encoding, etc.
    console.log(sav.meta.header)
    
    // print the vars
    sav.meta.sysvars.map(v => {

        // print the var, type, label and missing values specifications
        console.log(v)

        // find and print value labels for this var if any
        let valueLabels = sav.meta.getValueLabels(v.name)
        if (valueLabels){
            console.log(valueLabels)
        }

    })

}


```

