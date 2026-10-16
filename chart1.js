
/* ============================================
   HOME APPLIANCES — VEGA-LITE
   CHART 1: OWNERSHIP OVER TIME
============================================ */

// Dataset location
const DATA_URL = "data/iea_appliances.csv";

// Chart colour palette
const palette = [
    "#00897f",
    "#e9a255",
    "#53699c",
    "#9a7dc2",
    "#69b9a5",
    "#c77878",
    "#b3a03f",
    "#728d99",
    "#9a7582"
];

// Store CSV data
let rows = [];


/* ============================================
   1. LOAD CSV DATA
============================================ */

async function loadData() {

    try {

        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(
                "Could not load CSV: " + response.status
            );
        }

        const csvText = await response.text();

        rows = vega.read(csvText, {
            type: "csv"
        }).map(row => ({

            country: row.country,
            metric: row.metric,
            appliance: row.appliance,
            year: Number(row.year),
            value: Number(row.value)

        })).filter(row =>
            Number.isFinite(row.year) &&
            Number.isFinite(row.value)
        );

        console.log("Dataset loaded:", rows.length);

        setupCountryDropdown();
        drawChart1();

    } catch (error) {

        console.error("Error loading dataset:", error);

        document.getElementById("chart1").textContent =
            "Unable to load the IEA dataset. Check the CSV file path.";

    }

}


/* ============================================
   2. SET UP COUNTRY DROPDOWN
============================================ */

function setupCountryDropdown() {

    const dropdown =
        document.getElementById("countrySelect");

    const countries = [
        ...new Set(
            rows
                .filter(row =>
                    row.metric === "Diffusion"
                )
                .map(row => row.country)
        )
    ].sort();

    dropdown.innerHTML = "";

    countries.forEach(country => {

        const option = document.createElement("option");

        option.value = country;
        option.textContent = country;

        dropdown.appendChild(option);

    });

    if (countries.includes("Australia")) {
        dropdown.value = "Australia";
    }

    dropdown.addEventListener("change", drawChart1);

}


/* ============================================
   3. DRAW CHART 1 — MULTI-LINE CHART
============================================ */

function drawChart1() {

    const selectedCountry =
        document.getElementById("countrySelect").value;

    const filteredData = rows.filter(row =>
        row.country === selectedCountry &&
        row.metric === "Diffusion"
    );

    const spec = {

        $schema:
            "https://vega.github.io/schema/vega-lite/v6.json",

        width: "container",
        height: 380,

        background: "white",

        data: {
            values: filteredData
        },

        mark: {
            type: "line",
            point: {
                filled: true,
                size: 35
            },
            strokeWidth: 2.5
        },

        encoding: {

            x: {
                field: "year",
                type: "quantitative",

                title: "Year",

                axis: {
                    format: "d",
                    tickMinStep: 1,
                    grid: false
                }
            },

            y: {
                field: "value",
                type: "quantitative",

                title: "Average appliances per dwelling",

                scale: {
                    zero: true
                }
            },

            color: {
                field: "appliance",
                type: "nominal",

                title: "Appliance Type",

                scale: {
                    range: palette
                }
            },

            tooltip: [
                {
                    field: "country",
                    type: "nominal",
                    title: "Country"
                },
                {
                    field: "appliance",
                    type: "nominal",
                    title: "Appliance"
                },
                {
                    field: "year",
                    type: "quantitative",
                    title: "Year",
                    format: "d"
                },
                {
                    field: "value",
                    type: "quantitative",
                    title: "Units per dwelling",
                    format: ".3f"
                }
            ]
        },

        config: {

            font: "DM Sans",

            view: {
                stroke: null
            },

            axis: {
                labelFontSize: 12,
                titleFontSize: 13,
                labelColor: "#586676",
                titleColor: "#263943",
                gridColor: "#edf0f1"
            },

            legend: {
                labelFontSize: 12,
                titleFontSize: 13
            }

        }

    };

    vegaEmbed("#chart1", spec, {
        actions: false,
        renderer: "svg"
    }).catch(error => {

        console.error("Chart 1 error:", error);

    });

}


/* ============================================
   4. START WEBSITE
============================================ */

loadData();
