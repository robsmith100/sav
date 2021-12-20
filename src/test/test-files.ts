import { SavFileReader } from "..";
import { SysVarType } from "../SysVar";

const sampleFilesFolder: string = "C:\\Program Files\\IBM\\SPSS Statistics\\Samples\\English";
console.log("sampleFilesFolder", sampleFilesFolder);

const cc = {
    Reset: "\x1b[0m", Bright: "\x1b[1m", Dim: "\x1b[2m", Underscore: "\x1b[4m", Blink: "\x1b[5m", Reverse: "\x1b[7m", Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m", FgRed: "\x1b[31m", FgGreen: "\x1b[32m", FgYellow: "\x1b[33m", FgBlue: "\x1b[34m", FgMagenta: "\x1b[35m", FgCyan: "\x1b[36m", FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m", BgRed: "\x1b[41m", BgGreen: "\x1b[42m", BgYellow: "\x1b[43m", BgBlue: "\x1b[44m", BgMagenta: "\x1b[45m", BgCyan: "\x1b[46m", BgWhite:"\x1b[47m",
}

const isValid = d => d !== null && d !== undefined;

const eq = (d1: number, d2: number, nbdecs: number) => {
    const scale = 10 * nbdecs;
    const rd1 = Math.round(d1 * scale) / scale;
    const rd2 = Math.round(d2 * scale) / scale;
    return rd1 === rd2;
}

const computeDescriptives = (rows, field) => {
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

const computeRange = (rows, field) => {
    const acc = rows.reduce(
        (a, r) => {
            if (isValid(r[field])) {
                a.sum += r[field];
                a.valid++;
            }
            return a;
        },
        {
            min: 0,
            max: 0,
            valid: 0
        }
    );
    return {
        avg: acc.valid > 0 ? acc.sum / acc.valid : null,
        n: acc.valid
    }
}

const tests = [
    {
        file: "accidents.sav",
        meta_check: [
            (meta) => meta.header.n_vars === 4,
            (meta) => meta.sysvars[0].name === "agecat",
            (meta) => meta.getValueLabels("agecat")[0].label === "Under 21",
            (meta) => meta.getValueLabels("agecat")[1].label === "21-25",
            (meta) => meta.getValueLabels("agecat")[2].label === "26-30",
            (meta) => meta.sysvars[1].name === "gender",
            (meta) => meta.sysvars[2].name === "accid",
            (meta) => meta.sysvars[3].name === "pop",
            (meta) => meta.sysvars[3].label === "Population at risk",
            (meta) => meta.sysvars[3].type === SysVarType.numeric
        ]
    },
    {
        file: "adl.sav",
        meta_check: [
            (meta) => meta.header.n_vars === 14,
            (meta) => meta.sysvars[12].name === "cooking",
            (meta) => meta.getValueLabels("cooking")[1].label === "Some cooking but less than normal",
            (meta) => meta.getValueLabels("cooking")[2].label === "Gets food out if prepared by other",
            (meta) => meta.getValueLabels("cooking")[3].label === "Does nothing for meals",
            (meta) => meta.getValueLabels("housekpg")[2].val === 2,
            (meta) => meta.getValueLabels("housekpg")[2].label === "Occasional dusting of small jobs"
        ]
    },
    {
        file: "advert.sav",
        meta_check: [
            m => m.header.n_vars === 2,
            m => m.header.n_cases === 24
        ],
        data_check: [
            rows => rows.length === 24
        ]
    },
    {
        file: "aflatoxin.sav",
        meta_check: [
            m => m.header.n_vars === 2,
            m => m.header.n_cases === 128
        ],
        data_check: [
            rows => rows.length === 128
        ]
    },
    {
        file: "aflatoxin20.sav",
        meta_check: [
            m => m.header.n_vars === 2,
            m => m.header.n_cases === 32
        ],
        data_check: [
            rows => rows.length === 32
        ]
    },
    {
        file: "anorectic.sav",
        meta_check: [
            m => m.header.n_vars === 22,
            m => m.header.n_cases === 217,
            m => m.sysvars.find(v => v.name === "fast").label === "Restriction of food intake (fasting)",
            m => m.sysvars.find(v => v.name === "diag").label === "Patient Diagnosis",
            m => m.getValueLabels("diag").find(vl => vl.val === 3).label === "Bullimia Nervosa after Anorexia"
        ],
        data_check: [
            rows => rows.length === 22
        ]
    },
    {
        file: "anticonvulsants.sav",
        meta_check: [
            m => m.header.n_vars === 9,
            m => m.header.n_cases === 3390
        ],
        data_check: [
            rows => rows.length === 3390
        ]
    },
    { file: "bankloan_binning.sav", },
    { file: "bankloan_cs_noweights.sav", },
    { file: "bankloan_cs.sav", },
    { file: "bankloan.sav", },
    { file: "behavior_ini.sav", },
    { file: "behavior.sav", },
    { file: "brakes.sav", },
    { file: "breakfast_overall.sav", },
    { file: "breakfast.sav", },
    { file: "broadband_1.sav", },
    { file: "broadband_2.sav", },
    { file: "cable_survey.sav", },
    { file: "car_insurance_claims.sav", },
    { file: "car_sales_unprepared.sav", },
    { file: "car_sales.sav", },
    { file: "carpet_plan.sav", },
    { file: "carpet_prefs.sav", },
    { file: "carpet.sav", },
    { file: "catalog_seasfac.sav", },
    { file: "catalog.sav", },
    { file: "cellular.sav", },
    { file: "ceramics.sav", },
    { file: "cereal.sav", },
    { file: "clothing_defects.sav", },
    { file: "coffee.sav", },
    { file: "contacts.sav", },
    { file: "credit_card.sav", },
    { file: "creditpromo.sav", },
    { file: "cross_sell.sav", },
    {
        file: "customer_dbase.sav",
        meta_check: [
            m => m.header.n_vars === 132,
            m => m.sysvars[106].name === "lnwiremon",
            m => m.sysvars[126].label === "Owns gaming system",
            m => m.header.n_cases === 5000,
            m => m.getValueLabels("card").find(vl => vl.val === 4).label === "Discover",
            m => m.getValueLabels("cardtenurecat").find(vl => vl.val === 5).label === "More than 15",
            m => m.getValueLabels("cardtenurecat").length === 5
        ],
        data_check: [
            rows => rows.find(row => row["custid"] === "8823-USCWJQ-P9J")["hourstv"] === 19,
            rows => rows.filter(row => row["region"] === 1).length === 1019,
            rows => rows.filter(row => row["region"] === 2).length === 1005,
            rows => eq(computeDescriptives(rows, "income").mean, 55.040600, 6),
            rows => computeDescriptives(rows, "income").n === 5000,
            rows => eq(computeDescriptives(rows, "lninc").mean, 3.703152, 6),
            rows => eq(computeDescriptives(rows, "lninc").min, 2.20, 2),
            rows => eq(computeDescriptives(rows, "lninc").max, 6.98, 2),
            rows => eq(computeDescriptives(rows, "lninc").sum, 18515.758042, 6),
            rows => eq(computeDescriptives(rows, "debtinc").mean, 9.957800, 6),
            rows => eq(computeDescriptives(rows, "creddebt").mean, 1.874941, 6),
            rows => eq(computeDescriptives(rows, "creddebt").sum, 9374.704337, 6),
            rows => computeDescriptives(rows, "lncreddebt").n === 4999,
            rows => eq(computeDescriptives(rows, "tollten").mean, 581.434657, 6),
            rows => eq(computeDescriptives(rows, "tollten").max, 6923.450000, 6),
            rows => eq(computeDescriptives(rows, "tollten").sum, 2906591.850000, 6),
            rows => computeDescriptives(rows, "tollten").n === 4999,
        ]
    },
    { file: "customer_information.sav", },
    { file: "customer_subset.sav", },
    { file: "debate_aggregate.sav", },
    { file: "debate.sav", },
    { file: "demo_cs_1.sav", },
    { file: "demo_cs_2.sav", },
    { file: "demo_cs.sav", },
    { file: "demo.sav", },
    { file: "diabetes_costs.sav", },
    { file: "dietstudy.sav", },
    { file: "dmdata.sav", },
    { file: "dmdata2.sav", },
    { file: "dmdata3.sav", },
    { file: "dvdplayer.sav", },
    { file: "Employee data.sav", },
    { file: "german_credit.sav", },
    { file: "glucose_length.sav", },
    { file: "glucose.sav", },
    { file: "grocery_1month_sample.sav", },
    { file: "grocery_1month.sav", },
    { file: "grocery_coupons.sav", },
    { file: "grocery.sav", },
    { file: "guttman.sav", },
    { file: "health_funding.sav", },
    { file: "hivassay.sav", },
    { file: "hourlywagedata.sav", },
    { file: "insurance_claims.sav", },
    { file: "insure.sav", },
    { file: "judges.sav", },
    { file: "kinship_dat.sav", },
    { file: "kinship_ini.sav", },
    { file: "kinship_var.sav", },
    { file: "mallcost.sav", },
    { file: "marketvalues.sav", },
    { file: "MemoryTask.sav", },
    { file: "meps1.sav", },
    { file: "nhis2000_subset.sav", },
    { file: "offer.sav", },
    { file: "ozone.sav", },
    { file: "pain_medication.sav", },
    { file: "patient_los.sav", },
    { file: "patlos_sample.sav", },
    { file: "poll_cs_sample.sav", },
    { file: "poll_cs.sav", },
    { file: "poll_jointprob.sav", },
    { file: "property_assess_cs_sample.sav", },
    { file: "property_assess_cs.sav", },
    { file: "property_assess.sav", },
    { file: "recidivism_cs_jointprob.sav", },
    { file: "recidivism_cs_sample.sav", },
    { file: "recidivism.sav", },
    {
        file: "rfm_customers.sav",
        meta_check: [
            meta => meta.header.n_cases === 39999,
            meta => meta.header.n_vars === 5,
            meta => meta.sysvars[3].name === "NumberOfPurchases",
            meta => meta.sysvars[4].label === "Days Since Last Purchase",
        ],
        data_check: [
            rows => rows.length === 39999,
            rows => eq(computeDescriptives(rows, "ID").min, 1.000000, 6),
            rows => eq(computeDescriptives(rows, "ID").max, 39999.000000, 6),
            rows => eq(computeDescriptives(rows, "ID").mean, 20000.000000, 6),
            rows => eq(computeDescriptives(rows, "TotalAmount").min, 11.000000, 6),
            rows => eq(computeDescriptives(rows, "TotalAmount").max, 2593.000000, 6),
            rows => eq(computeDescriptives(rows, "TotalAmount").mean, 938.458461, 6),
            rows => eq(computeDescriptives(rows, "NumberOfPurchases").min, 1.000000, 6),
            rows => eq(computeDescriptives(rows, "NumberOfPurchases").max, 24.000000, 6),
            rows => eq(computeDescriptives(rows, "NumberOfPurchases").mean, 9.830821, 6),
            rows => eq(computeDescriptives(rows, "PurchaseInterval").min, 2.000000, 6),
            rows => eq(computeDescriptives(rows, "PurchaseInterval").max, 1032.000000, 6),
            rows => eq(computeDescriptives(rows, "PurchaseInterval").mean, 181.412010, 6),
        ]
    },
    { file: "rfm_transactions.sav", },
    { file: "salesperformance.sav", },
    { file: "satisf.sav", },
    { file: "screws.sav", },
    { file: "shampoo_ph.sav", },
    { file: "ships.sav", },
    { file: "site.sav", },
    { file: "smalldemo.sav", },
    { file: "smokers.sav", },
    { file: "stocks.sav", },
    { file: "stroke_clean.sav", },
    { file: "stroke_invalid.sav", },
    { file: "stroke_survival.sav", },
    { file: "stroke_valid.sav", },
    { file: "survey_sample.sav", },
    { file: "tcm_kpi_upd.sav", },
    { file: "tcm_kpi.sav", },
    { file: "telco_extra.sav", },
    { file: "telco_missing.sav", },
    { file: "telco.sav", },
    { file: "test_scores.sav", },
    { file: "testmarket_1month.sav", },
    { file: "testmarket.sav", },
    { file: "tree_car.sav", },
    { file: "tree_credit.sav", },
    { file: "tree_missing_data.sav", },
    { file: "tree_score_car.sav", },
    { file: "tree_textdata.sav", },
    { file: "tv-survey.sav", },
    { file: "ulcer_recurrence_recoded.sav", },
    { file: "ulcer_recurrence.sav", },
    { file: "upgrade.sav", },
    { file: "verd1985.sav", },
    { file: "virus.sav", },
    { file: "wheeze_steubenville.sav", },
    { file: "workprog.sav", },
    { file: "worldsales.sav", },
]
    //.filter((f, i) => i < 5);
    //.filter((f, i) => f.meta_check || f.data_check);

const tryLoadingAllFileData = true;
const stopOnError = !true;

const run = async () => {
    let errors = 0;

    for (let test of tests) {

        const filename = `${sampleFilesFolder}/${test.file}`;
        console.log("file: " + test.file);


        // open the file
        const sav = new SavFileReader(filename);
        await sav.open();

        // run meta checks
        if (test.meta_check) {
            for (let meta_check of test.meta_check) {
                try {
                    const res = meta_check(sav.meta);
                    if (!res) {
                        //throw Error("meta check failed: " + meta_check);
                        console.log(`${cc.FgRed}meta check failed${cc.Reset}: ` + meta_check);
                        errors++;
                    }
                    else {
                        console.log(`${cc.FgGreen}meta check passed${cc.Reset}: ` + meta_check);
                    }
                }
                catch (err) {
                    console.log(`${cc.FgRed}meta check failed${cc.Reset}: ` + meta_check);
                    errors++;
                }
            }
        }

        // run data checks
        if (tryLoadingAllFileData || test.data_check) {
            
            console.log(`${cc.FgMagenta}reading data...${cc.Reset}`);
            const rowdata = await sav.readAllRows();

            // implicit check n_cases === rowdata.length
            const dchecks = [
                (rows, meta) => rows.length === meta.header.n_cases,
                ...(test.data_check || [])
            ]
                    
            for (let data_check of dchecks) {
                try {
                    const res = data_check(rowdata, sav.meta);
                    if (!res) {
                        //throw Error("meta check failed: " + meta_check);
                        console.log(`${cc.FgRed}meta check failed${cc.Reset}: ` + data_check);
                        errors++;
                    }
                    else {
                        console.log(`${cc.FgCyan}meta check passed${cc.Reset}: ` + data_check);
                    }
                }
                catch (err) {
                    console.log(`${cc.FgRed}data check failed${cc.Reset}: ` + data_check);
                    errors++;
                }
            }
        }


        // console.log(sav.meta.header);

        // const sysvars = sav.meta.sysvars;
        // for (let sysvar of sysvars) {
        //     console.log(sysvar);
        //     const vl = sav.meta.getValueLabels(sysvar.name);
        //     console.log(vl);
        // }

        sav.reader.close();

        if (stopOnError && errors > 0) {
            throw new Error("stop on error");
        }

        console.log();

    }

    if (errors === 0) {
        console.log(`${cc.FgGreen}All tests passed${cc.Reset}`);
    }
    else {
        console.log(`${errors} ${cc.FgRed}test(s) failed${cc.Reset}`);
    }

}
run();
