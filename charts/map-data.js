
/* ==========================================
   SHARED MAP DATA
   FIT3179 DV2 - Behind the Plug
========================================== */

const GEO_URL =
    "https://cdn.jsdelivr.net/npm/vega-datasets@3/data/world-110m.json";

const baseStyle = {
    view: { stroke: null },
    axis: {
        labelFont: "DM Sans",
        titleFont: "DM Sans"
    },
    legend: {
        labelFont: "DM Sans",
        titleFont: "DM Sans"
    }
};

// Country name, numeric ISO code, latitude, longitude
const countryLocations = [
    ["Albania",8,41,20],
    ["Algeria",12,28,3],
    ["Angola",24,-12.5,18.5],
    ["Argentina",32,-34,-64],
    ["Armenia",51,40,45],
    ["Australia",36,-27,133],
    ["Austria",40,47.33,13.33],
    ["Azerbaijan",31,40.5,47.5],
    ["Bangladesh",50,24,90],
    ["Belarus",112,53,28],
    ["Belgium",56,50.83,4],
    ["Benin",204,9.5,2.25],
    ["Brazil",76,-10,-55],
    ["Bulgaria",100,43,25],
    ["Cambodia",116,13,105],
    ["Cameroon",120,6,12],
    ["Canada",124,60,-95],
    ["Chile",152,-30,-71],
    ["Colombia",170,4,-72],
    ["Costa Rica",188,10,-84],
    ["Cote d'Ivoire",384,8,-5],
    ["Croatia",191,45.17,15.5],
    ["Cuba",192,21.5,-80],
    ["Cyprus",196,35,33],
    ["Czech Republic",203,49.75,15.5],
    ["Democratic People's Republic of Korea",408,40,127],
    ["Democratic Republic of the Congo",180,0,25],
    ["Denmark",208,56,10],
    ["Dominican Republic",214,19,-70.67],
    ["Egypt",818,27,30],
    ["Eritrea",232,15,39],
    ["Estonia",233,59,26],
    ["Ethiopia",231,8,38],
    ["Finland",246,64,26],
    ["France",250,46,2],
    ["Gabon",266,-1,11.75],
    ["Georgia",268,42,43.5],
    ["Germany",276,51,9],
    ["Ghana",288,8,-2],
    ["Greece",300,39,22],
    ["Guatemala",320,15.5,-90.25],
    ["Guyana",328,5,-59],
    ["Haiti",332,19,-72.42],
    ["Honduras",340,15,-86.5],
    ["Hungary",348,47,20],
    ["India",356,20,77],
    ["Indonesia",360,-5,120],
    ["Iraq",368,33,44],
    ["Ireland",372,53,-8],
    ["Italy",380,42.83,12.83],
    ["Jamaica",388,18.25,-77.5],
    ["Japan",392,36,138],
    ["Jordan",400,31,36],
    ["Kazakhstan",398,48,68],
    ["Kenya",404,1,38],
    ["Kingdom of Eswatini",748,-26.5,31.5],
    ["Korea",410,37,127.5],
    ["Kyrgyzstan",417,41,75],
    ["Lao People's Democratic Republic",418,18,105],
    ["Latvia",428,57,25],
    ["Lithuania",440,56,24],
    ["Luxembourg",442,49.75,6.17],
    ["Madagascar",450,-20,47],
    ["Malaysia",458,2.5,112.5],
    ["Malta",470,35.83,14.58],
    ["Mexico",484,23,-102],
    ["Mongolia",496,46,105],
    ["Morocco",504,32,-5],
    ["Mozambique",508,-18.25,35],
    ["Namibia",516,-22,17],
    ["Nepal",524,28,84],
    ["Netherlands",528,52.5,5.75],
    ["New Zealand",554,-41,174],
    ["Nicaragua",558,13,-85],
    ["Niger",562,16,8],
    ["Nigeria",566,10,8],
    ["Pakistan",586,30,70],
    ["Paraguay",600,-23,-58],
    ["People's Republic of China",156,35,105],
    ["Peru",604,-10,-76],
    ["Philippines",608,13,122],
    ["Plurinational State of Bolivia",68,-17,-65],
    ["Poland",616,52,20],
    ["Portugal",620,39.5,-8],
    ["Republic of Moldova",498,47,29],
    ["Republic of the Congo",178,-1,15],
    ["Romania",642,46,25],
    ["Russian Federation",643,60,100],
    ["Rwanda",646,-2,30],
    ["Senegal",686,14,-14],
    ["Serbia",688,44.13,16.43],
    ["Slovak Republic",703,48.67,19.5],
    ["Slovenia",705,46.12,14.82],
    ["South Africa",710,-29,24],
    ["Spain",724,40,-4],
    ["Sri Lanka",144,7,81],
    ["Sudan",729,15,30],
    ["Suriname",740,4,-56],
    ["Sweden",752,62,15],
    ["Switzerland",756,47,8],
    ["Tajikistan",762,39,71],
    ["Thailand",764,15,100],
    ["Togo",768,8,1.17],
    ["Trinidad and Tobago",780,11,-61],
    ["Tunisia",788,34,9],
    ["Turkmenistan",795,40,60],
    ["Uganda",800,1,32],
    ["Ukraine",804,49,32],
    ["United Kingdom",826,54,-2],
    ["United Republic of Tanzania",834,-6,35],
    ["United States",840,38,-97],
    ["Uzbekistan",860,41,64],
    ["Viet Nam",704,16.17,107.83],
    ["Yemen",887,15,48],
    ["Zambia",894,-15,30],
    ["Zimbabwe",716,-20,30]
];

const mapLocations = new Map(
    countryLocations.map(
        ([country, id, lat, lon]) => [
            country,
            { country, id, lat, lon }
        ]
    )
);

async function getMapData(metric, appliance) {

    const csvText = await vega.loader().load(
        "data/iea_appliances.csv"
    );

    const rawData = vega.read(csvText, {
        type: "csv"
    });

    const latestRecords = new Map();

    rawData.forEach(row => {

        const country = String(row.country).trim();
        const rowMetric = String(row.metric).trim();
        const rowAppliance = String(row.appliance).trim();
        const year = Number(row.year);
        const value = Number(row.value);

        if (
            rowMetric.toLowerCase() !== metric.toLowerCase() ||
            rowAppliance !== appliance ||
            year < 2015 ||
            !Number.isFinite(year) ||
            !Number.isFinite(value) ||
            String(row.value).trim() === "" ||
            value < 0
        ) {
            return;
        }

        const location = mapLocations.get(country);

        if (!location) return;

        const previous = latestRecords.get(country);

        if (!previous || year > previous.year) {
            latestRecords.set(country, {
                ...location,
                year,
                value
            });
        }
    });

    return [...latestRecords.values()];
}

// Base world map for symbol and spike maps
const baseMap = {
    data: {
        url: GEO_URL,
        format: {
            type: "topojson",
            feature: "countries"
        }
    },

    mark: {
        type: "geoshape",
        fill: "#e8eef0",
        stroke: "#ffffff",
        strokeWidth: 0.5
    }
};
