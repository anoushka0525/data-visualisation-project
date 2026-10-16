
/* ==========================================================
   BEHIND THE PLUG
   HOME APPLIANCES DATA VISUALISATION

   FIT3179 - Data Visualisation 2
   Vega-Lite + Vega-Embed

   CHART 1: Appliance Ownership Over Time
   CHART 2: Appliance Stocks Over Time
   CHART 3: Country Comparison Heatmap
   CHART 4: Country Ranking Dot Plot
   CHART 5: Household Penetration Heatmap
   CHART 6: Price vs Customer Rating
   CHART 7: Brand Ratings Comparison
========================================================== */


/* ==========================================================
   1. GLOBAL SETTINGS
========================================================== */

const DATA_URL = "data/iea_appliances.csv";
const PRODUCT_URL = "data/products.csv";

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

const commonConfig = {

    width: "container",
    height: 350,

    background: "white",

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
            titleFontSize: 13,
            labelColor: "#586676"
        },

        range: {
            category: palette
        }
    }
};


// Global dataset variables

let rows = [];
let latest = [];
let products = [];


/* ==========================================================
   2. HELPER FUNCTIONS
========================================================== */

// Return the latest observation for each group.

function latestPer(items, keys) {

    const result = new Map();

    for (const row of items) {

        const key = keys
            .map(field => row[field])
            .join("||");

        if (
            !result.has(key) ||
            row.year > result.get(key).year
        ) {
            result.set(key, row);
        }
    }

    return [...result.values()];
}


// Populate dropdown options.

function fillDropdown(id, values, preferred) {

    const dropdown = document.getElementById(id);

    if (!dropdown) return null;

    dropdown.innerHTML = "";

    values.forEach(value => {

        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;

        dropdown.appendChild(option);

    });

    if (values.includes(preferred)) {
        dropdown.value = preferred;
    }

    return dropdown;
}


// Create a placeholder for charts without data.

function showPlaceholder(id, message) {

    const element = document.getElementById(id);

    if (!element) return;

    element.innerHTML = "";

    const box = document.createElement("div");

    box.style.cssText = `
        min-height: 230px;
        width: 100%;
        border: 1px dashed #b8cbc5;
        background: #f6fbf9;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px;
        text-align: center;
        color: #56716b;
        line-height: 1.8;
    `;

    box.textContent = message;

    element.appendChild(box);
}


// Render Vega-Lite charts.

async function renderChart(id, specification) {

    const element = document.getElementById(id);

    if (!element) return;

    const spec = {

        $schema:
            "https://vega.github.io/schema/vega-lite/v6.json",

        ...commonConfig,
        ...specification
    };

    try {

        await vegaEmbed(
            "#" + id,
            spec,
            {
                actions: false,
                renderer: "svg"
            }
        );

    } catch (error) {

        console.error(
            "Error rendering " + id,
            error
        );

        showPlaceholder(
            id,
            "Unable to render this chart. Check the browser console."
        );
    }
}


/* ==========================================================
   3. CHART 1 - APPLIANCE OWNERSHIP OVER TIME

   Chart type: Multi-line chart

   Question:
   How has appliance diffusion changed over time?

   Interaction:
   Country dropdown + tooltips
========================================================== */

function drawChart1() {

    const dropdown =
        document.getElementById("countrySelect");

    const selectedCountry = dropdown.value;

    const chartData = rows.filter(row =>
        row.country === selectedCountry &&
        row.metric === "Diffusion"
    );

    if (!chartData.length) {

        showPlaceholder(
            "chart1",
            "No diffusion data for this country."
        );

        return;
    }

    const spec = {

        height: 380,

        data: {
            values: chartData
        },

        mark: {
            type: "line",
            point: {
                filled: true,
                size: 30
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
                title: "Average Appliances per Dwelling",

                scale: {
                    zero: true
                }
            },

            color: {
                field: "appliance",
                type: "nominal",
                title: "Appliance Type"
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
                    format: "d",
                    title: "Year"
                },
                {
                    field: "value",
                    type: "quantitative",
                    format: ".3f",
                    title: "Units per Dwelling"
                }
            ]
        }
    };

    renderChart("chart1", spec);
}


/* ==========================================================
   4. CHART 2 - APPLIANCE STOCK OVER TIME

   Chart type: Stacked area chart

   Question:
   How has the installed appliance stock changed?

   Interaction:
   Country dropdown + tooltips
========================================================== */

function drawChart2() {

    const selectedCountry =
        document.getElementById("stocksCountrySelect").value;

    const countryData = rows.filter(row =>
        row.country === selectedCountry &&
        row.metric === "Stocks"
    );

    // Stacked areas require comparable years.
    // Keep appliance series with all observed years
    // in the selected country.

    const years = [
        ...new Set(countryData.map(row => row.year))
    ];

    const appliances = [
        ...new Set(countryData.map(row => row.appliance))
    ];

    const completeAppliances = appliances.filter(appliance => {

        const reportedYears = new Set(
            countryData
                .filter(row => row.appliance === appliance)
                .map(row => row.year)
        );

        return years.every(year =>
            reportedYears.has(year)
        );
    });

    const chartData = countryData.filter(row =>
        completeAppliances.includes(row.appliance)
    );

    if (!chartData.length) {

        showPlaceholder(
            "chart2",
            "No complete stock series available for this country."
        );

        return;
    }

    const spec = {

        height: 390,

        data: {
            values: chartData
        },

        mark: {
            type: "area",
            interpolate: "linear",
            opacity: 0.9
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
                aggregate: "sum",
                stack: "zero",

                title: "Appliance Stock (Million Units)"
            },

            color: {
                field: "appliance",
                type: "nominal",
                title: "Appliance Type"
            },

            tooltip: [
                {
                    field: "year",
                    type: "quantitative",
                    title: "Year",
                    format: "d"
                },
                {
                    field: "appliance",
                    type: "nominal",
                    title: "Appliance"
                },
                {
                    field: "value",
                    aggregate: "sum",
                    type: "quantitative",
                    title: "Stock (Millions)",
                    format: ",.2f"
                }
            ]
        }
    };

    renderChart("chart2", spec);
}


/* ==========================================================
   5. CHART 3 - COUNTRY COMPARISON

   Chart type: Heatmap

   Question:
   Which appliances are most common across countries?

   Interaction:
   Hover tooltips

   Note:
   Latest available observations may have
   different reporting years.
========================================================== */

function drawChart3() {

    const selectedCountries = [
        "Australia",
        "United States",
        "United Kingdom",
        "Japan",
        "Germany",
        "France",
        "Canada",
        "Italy",
        "Spain",
        "Korea",
        "Sweden",
        "Netherlands"
    ];

    const chartData = latest.filter(row =>
        row.metric === "Diffusion" &&
        selectedCountries.includes(row.country)
    );

    if (!chartData.length) {

        showPlaceholder(
            "chart3",
            "No country comparison data available."
        );

        return;
    }

    const spec = {

        height: 420,

        data: {
            values: chartData
        },

        mark: {
            type: "rect",
            cornerRadius: 2
        },

        encoding: {

            x: {
                field: "appliance",
                type: "nominal",
                title: null,

                axis: {
                    labelAngle: -35,
                    labelLimit: 145
                }
            },

            y: {
                field: "country",
                type: "nominal",
                title: null,
                sort: selectedCountries
            },

            color: {
                field: "value",
                type: "quantitative",

                title: "Units per Dwelling",

                scale: {
                    scheme: "tealblues"
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
                    title: "Reporting Year",
                    format: "d"
                },
                {
                    field: "value",
                    type: "quantitative",
                    title: "Units per Dwelling",
                    format: ".3f"
                }
            ]
        }
    };

    renderChart("chart3", spec);
}


/* ==========================================================
   6. CHART 4 - COUNTRY RANKING

   Chart type: Dot plot

   Question:
   Which countries have the highest diffusion
   for a selected appliance?

   Interaction:
   Appliance dropdown + tooltips
========================================================== */

function drawChart4() {

    const selectedAppliance =
        document.getElementById("applianceSelect").value;

    const chartData = latest

        .filter(row =>
            row.metric === "Diffusion" &&
            row.appliance === selectedAppliance &&
            row.year >= 2015
        )

        .sort((a, b) => b.value - a.value)

        .slice(0, 22);

    if (!chartData.length) {

        showPlaceholder(
            "chart4",
            "No recent data available for this appliance."
        );

        return;
    }

    const spec = {

        height: Math.max(
            340,
            chartData.length * 22
        ),

        data: {
            values: chartData
        },

        mark: {
            type: "circle",
            size: 135,
            color: "#00897f"
        },

        encoding: {

            y: {
                field: "country",
                type: "nominal",
                sort: "-x",
                title: null
            },

            x: {
                field: "value",
                type: "quantitative",

                title: "Latest Units per Dwelling",

                scale: {
                    zero: true
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
                    title: "Reporting Year",
                    format: "d"
                },
                {
                    field: "value",
                    type: "quantitative",
                    title: "Units per Dwelling",
                    format: ".3f"
                }
            ]
        }
    };

    renderChart("chart4", spec);
}


/* ==========================================================
   7. CHART 5 - HOUSEHOLD PENETRATION

   Chart type: Heatmap

   Question:
   Where are household appliances widely owned?

   Interaction:
   Hover tooltips

   Important:
   Penetration is stored between 0 and 1.
========================================================== */

function drawChart5() {

    const penetrationData = latest.filter(row =>
        row.metric === "Penetration" &&
        row.year >= 2015 &&
        row.value >= 0 &&
        row.value <= 1
    );

    // Select countries with the most
    // available appliance categories.

    const counts = {};

    penetrationData.forEach(row => {

        counts[row.country] =
            (counts[row.country] || 0) + 1;

    });

    const selectedCountries = Object.keys(counts)

        .sort((a, b) =>
            counts[b] - counts[a]
        )

        .slice(0, 18);

    const chartData = penetrationData.filter(row =>
        selectedCountries.includes(row.country)
    );

    if (!chartData.length) {

        showPlaceholder(
            "chart5",
            "No penetration data available."
        );

        return;
    }

    const spec = {

        height: 500,

        data: {
            values: chartData
        },

        mark: {
            type: "rect",
            cornerRadius: 2
        },

        encoding: {

            x: {
                field: "appliance",
                type: "nominal",
                title: null,

                axis: {
                    labelAngle: -35,
                    labelLimit: 145
                }
            },

            y: {
                field: "country",
                type: "nominal",
                title: null,
                sort: selectedCountries
            },

            color: {
                field: "value",
                type: "quantitative",

                title: "Household Penetration",

                scale: {
                    scheme: "tealblues",
                    domain: [0, 1]
                },

                legend: {
                    format: ".0%"
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
                    title: "Reporting Year",
                    format: "d"
                },
                {
                    field: "value",
                    type: "quantitative",
                    title: "Ownership Percentage",
                    format: ".1%"
                }
            ]
        }
    };

    renderChart("chart5", spec);
}


/* ==========================================================
   8. CHART 6 - PRICE VS CUSTOMER RATING

   Chart type: Bubble scatterplot

   Question:
   Do more expensive appliances receive
   better customer ratings?

   Interaction:
   Category dropdown + tooltips

   Dataset:
   data/products.csv
========================================================== */

function drawChart6() {

    const selectedCategory =
        document.getElementById(
            "productCategorySelect"
        ).value;

    const chartData = products.filter(product =>
        selectedCategory === "All categories" ||
        product.category === selectedCategory
    );

    if (!chartData.length) {

        showPlaceholder(
            "chart6",
            "No product data available for this category."
        );

        return;
    }

    const spec = {

        height: 390,

        data: {
            values: chartData
        },

        mark: {
            type: "circle",
            opacity: 0.6,
            stroke: "white",
            strokeWidth: 0.5
        },

        encoding: {

            x: {
                field: "price",
                type: "quantitative",

                title: "Listed Price (USD)",

                scale: {
                    zero: false
                }
            },

            y: {
                field: "rating",
                type: "quantitative",

                title: "Average Customer Rating",

                scale: {
                    domain: [0, 5]
                }
            },

            color: {
                field: "category",
                type: "nominal",
                title: "Product Category"
            },

            size: {
                field: "review_count",
                type: "quantitative",

                title: "Review Count",

                scale: {
                    range: [35, 850]
                }
            },

            tooltip: [
                {
                    field: "title",
                    type: "nominal",
                    title: "Product"
                },
                {
                    field: "brand",
                    type: "nominal",
                    title: "Brand"
                },
                {
                    field: "category",
                    type: "nominal",
                    title: "Category"
                },
                {
                    field: "price",
                    type: "quantitative",
                    title: "Price",
                    format: "$,.2f"
                },
                {
                    field: "rating",
                    type: "quantitative",
                    title: "Rating",
                    format: ".2f"
                },
                {
                    field: "review_count",
                    type: "quantitative",
                    title: "Reviews",
                    format: ",d"
                }
            ]
        }
    };

    renderChart("chart6", spec);
}


/* ==========================================================
   9. CHART 7 - BRAND RATINGS COMPARISON

   Chart type: Horizontal bar chart

   Question:
   Which brands have higher customer ratings?

   Method:
   Review-weighted average ratings.

   Note:
   Only brands with at least 10 recorded
   reviews are included in this draft.
========================================================== */

function drawChart7() {

    const brandData = {};

    products.forEach(product => {

        if (
            !product.brand ||
            product.review_count < 1
        ) {
            return;
        }

        if (!brandData[product.brand]) {

            brandData[product.brand] = {
                brand: product.brand,
                weightedTotal: 0,
                reviewCount: 0,
                productCount: 0
            };
        }

        const brand = brandData[product.brand];

        brand.weightedTotal +=
            product.rating * product.review_count;

        brand.reviewCount += product.review_count;
        brand.productCount += 1;

    });

    const chartData = Object.values(brandData)

        .filter(brand =>
            brand.reviewCount >= 10
        )

        .map(brand => ({

            brand: brand.brand,

            rating:
                brand.weightedTotal /
                brand.reviewCount,

            reviews: brand.reviewCount,

            products: brand.productCount

        }))

        .sort((a, b) =>
            b.reviews - a.reviews
        )

        .slice(0, 12);

    if (!chartData.length) {

        showPlaceholder(
            "chart7",
            "Insufficient review data for brand comparisons."
        );

        return;
    }

    const spec = {

        height: 360,

        data: {
            values: chartData
        },

        mark: {
            type: "bar",
            color: "#00897f",
            cornerRadiusEnd: 4
        },

        encoding: {

            y: {
                field: "brand",
                type: "nominal",
                title: null,
                sort: "-x"
            },

            x: {
                field: "rating",
                type: "quantitative",

                title: "Review-Weighted Average Rating",

                scale: {
                    domain: [0, 5]
                }
            },

            tooltip: [
                {
                    field: "brand",
                    type: "nominal",
                    title: "Brand"
                },
                {
                    field: "rating",
                    type: "quantitative",
                    title: "Average Rating",
                    format: ".2f"
                },
                {
                    field: "reviews",
                    type: "quantitative",
                    title: "Review Count",
                    format: ",d"
                },
                {
                    field: "products",
                    type: "quantitative",
                    title: "Number of Products"
                }
            ]
        }
    };

    renderChart("chart7", spec);
}


/* ==========================================================
   10. LOAD SECOND DATASET

   Required columns in products.csv:

   title
   brand
   category
   price
   rating
   review_count
========================================================== */

async function loadProducts() {

    try {

        const response = await fetch(PRODUCT_URL);

        if (!response.ok) {
            throw new Error(
                "Product dataset not uploaded yet."
            );
        }

        const csvText = await response.text();

        const parsed = vega.read(csvText, {
            type: "csv"
        });

        products = parsed.map(row => ({

            title: row.title,
            brand: row.brand,
            category: row.category,

            price: Number(row.price),
            rating: Number(row.rating),

            review_count: Number(row.review_count)

        })).filter(row =>

            Number.isFinite(row.price) &&
            row.price > 0 &&

            Number.isFinite(row.rating) &&
            row.rating >= 0 &&
            row.rating <= 5 &&

            Number.isFinite(row.review_count) &&
            row.review_count >= 1

        );

        if (!products.length) {
            throw new Error("No valid product records.");
        }

        const categories = [
            "All categories",
            ...new Set(
                products
                    .map(row => row.category)
                    .filter(Boolean)
            )
        ];

        const categoryDropdown = fillDropdown(
            "productCategorySelect",
            categories,
            "All categories"
        );

        categoryDropdown.onchange = drawChart6;

        document.getElementById(
            "productNotice"
        ).textContent =
            products.length.toLocaleString() +
            " product listings loaded. Ratings and prices " +
            "reflect the source dataset, not live sales data.";

        drawChart6();
        drawChart7();

    } catch (error) {

        console.log(
            "Product dataset not available:",
            error.message
        );

        showPlaceholder(
            "chart6",
            "Chart 6 will appear after products.csv is uploaded."
        );

        showPlaceholder(
            "chart7",
            "Chart 7 will appear after products.csv is uploaded."
        );
    }
}


/* ==========================================================
   11. MAIN FUNCTION - LOAD IEA DATA
========================================================== */

async function startWebsite() {

    try {

        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(
                "IEA CSV could not be loaded."
            );
        }

        const csvText = await response.text();

        const parsed = vega.read(csvText, {
            type: "csv"
        });

        rows = parsed.map(row => ({

            country: row.country,
            metric: row.metric,
            appliance: row.appliance,

            year: Number(row.year),
            value: Number(row.value)

        })).filter(row =>

            Number.isFinite(row.year) &&
            Number.isFinite(row.value)

        );

        console.log(
            "IEA records loaded:",
            rows.length
        );

        // Latest record for each combination.

        latest = latestPer(
            rows,
            ["country", "metric", "appliance"]
        );


        /* ------------------------------------------
           SET UP CHART 1 COUNTRY DROPDOWN
        ------------------------------------------ */

        const diffusionCountries = [
            ...new Set(
                rows
                    .filter(row =>
                        row.metric === "Diffusion"
                    )
                    .map(row => row.country)
            )
        ].sort();

        const countrySelect = fillDropdown(
            "countrySelect",
            diffusionCountries,
            "Australia"
        );

        countrySelect.onchange = drawChart1;


        /* ------------------------------------------
           SET UP CHART 2 COUNTRY DROPDOWN
        ------------------------------------------ */

        const stockCountries = [
            ...new Set(
                rows
                    .filter(row =>
                        row.metric === "Stocks"
                    )
                    .map(row => row.country)
            )
        ].sort();

        const stocksSelect = fillDropdown(
            "stocksCountrySelect",
            stockCountries,
            "Australia"
        );

        stocksSelect.onchange = drawChart2;


        /* ------------------------------------------
           SET UP CHART 4 APPLIANCE DROPDOWN
        ------------------------------------------ */

        const appliances = [
            ...new Set(
                latest
                    .filter(row =>
                        row.metric === "Diffusion"
                    )
                    .map(row => row.appliance)
            )
        ].sort();

        const applianceSelect = fillDropdown(
            "applianceSelect",
            appliances,
            "Dish washers"
        );

        applianceSelect.onchange = drawChart4;

       
/* ==========================================================
   CHART 6 — APPLIANCE DIFFUSION CHANGE
   Type: Dumbbell Chart
   Earliest vs Latest Observations
========================================================== */

function drawChart6() {

    const country = "Australia";

    const data = rows.filter(row =>
        row.country === country &&
        row.metric === "Diffusion"
    );

    const groups = {};

    data.forEach(row => {
        if (!groups[row.appliance]) {
            groups[row.appliance] = [];
        }
        groups[row.appliance].push(row);
    });

    const chartData = [];

    Object.entries(groups).forEach(([appliance, records]) => {

        records.sort((a, b) => a.year - b.year);

        const first = records[0];
        const last = records[records.length - 1];

        if (first.year === last.year) return;

        chartData.push({
            appliance: appliance,
            firstValue: first.value,
            lastValue: last.value,
            firstYear: first.year,
            lastYear: last.year,
            change: last.value - first.value
        });
    });

    if (!chartData.length) {
        showPlaceholder(
            "chart6",
            "Insufficient observations for change comparison."
        );
        return;
    }

    const spec = {

        height: 340,

        data: {
            values: chartData
        },

        layer: [

            // Connecting line
            {
                mark: {
                    type: "rule",
                    strokeWidth: 3,
                    color: "#b8c8cb"
                },

                encoding: {
                    y: {
                        field: "appliance",
                        type: "nominal",
                        sort: {
                            field: "change",
                            order: "descending"
                        },
                        title: null
                    },

                    x: {
                        field: "firstValue",
                        type: "quantitative",
                        title: "Average Appliances per Dwelling"
                    },

                    x2: {
                        field: "lastValue"
                    }
                }
            },

            // Earliest observation
            {
                mark: {
                    type: "point",
                    filled: true,
                    color: "#e9a255",
                    size: 110
                },

                encoding: {
                    y: {
                        field: "appliance",
                        type: "nominal",
                        sort: {
                            field: "change",
                            order: "descending"
                        },
                        title: null
                    },

                    x: {
                        field: "firstValue",
                        type: "quantitative"
                    },

                    tooltip: [
                        {
                            field: "appliance",
                            title: "Appliance"
                        },
                        {
                            field: "firstYear",
                            title: "First Year",
                            format: "d"
                        },
                        {
                            field: "firstValue",
                            title: "Initial Diffusion",
                            format: ".3f"
                        }
                    ]
                }
            },

            // Latest observation
            {
                mark: {
                    type: "point",
                    filled: true,
                    color: "#00897f",
                    size: 110
                },

                encoding: {
                    y: {
                        field: "appliance",
                        type: "nominal",
                        sort: {
                            field: "change",
                            order: "descending"
                        },
                        title: null
                    },

                    x: {
                        field: "lastValue",
                        type: "quantitative"
                    },

                    tooltip: [
                        {
                            field: "appliance",
                            title: "Appliance"
                        },
                        {
                            field: "lastYear",
                            title: "Latest Year",
                            format: "d"
                        },
                        {
                            field: "lastValue",
                            title: "Latest Diffusion",
                            format: ".3f"
                        },
                        {
                            field: "change",
                            title: "Change",
                            format: "+.3f"
                        }
                    ]
                }
            }
        ]
    };

    renderChart("chart6", spec);
}


/* ==========================================================
   CHART 7 — INTERNATIONAL DISTRIBUTION
   Type: Box Plot
   Latest Appliance Diffusion by Country
========================================================== */

function drawChart7() {

    const data = latest.filter(row =>
        row.metric === "Diffusion" &&
        row.year >= 2015
    );

    if (!data.length) {
        showPlaceholder(
            "chart7",
            "No recent diffusion observations available."
        );
        return;
    }

    const spec = {

        height: 390,

        data: {
            values: data
        },

        mark: {
            type: "boxplot",
            extent: 1.5,
            size: 28
        },

        encoding: {

            x: {
                field: "appliance",
                type: "nominal",
                title: "Appliance Category",

                axis: {
                    labelAngle: -35,
                    labelLimit: 160
                }
            },

            y: {
                field: "value",
                type: "quantitative",
                title: "Appliances per Dwelling",

                scale: {
                    zero: true
                }
            },

            color: {
                value: "#16877d"
            }
        }
    };

    renderChart("chart7", spec);
}


/* ==========================================================
   CHART 8 — STOCK VS DIFFUSION
   Type: Bubble Scatterplot

   Compares matching country, appliance and year records.
   Each country-appliance pair contributes its latest
   matching observation.
========================================================== */

function drawChart8() {

    const diffusion = rows.filter(row =>
        row.metric === "Diffusion"
    );

    const stocks = rows.filter(row =>
        row.metric === "Stocks"
    );

    // Index stock records for matching observations
    const stockMap = new Map();

    stocks.forEach(row => {

        const key = [
            row.country,
            row.appliance,
            row.year
        ].join("|");

        stockMap.set(key, row.value);
    });

    const matches = [];

    diffusion.forEach(row => {

        const key = [
            row.country,
            row.appliance,
            row.year
        ].join("|");

        const stock = stockMap.get(key);

        if (
            stock !== undefined &&
            stock > 0 &&
            row.value > 0 &&
            row.year >= 2015
        ) {
            matches.push({
                country: row.country,
                appliance: row.appliance,
                year: row.year,
                diffusion: row.value,
                stock: stock
            });
        }
    });

    // Keep the latest matched observation per
    // country and appliance.
    const chartData = latestPer(
        matches,
        ["country", "appliance"]
    );

    if (!chartData.length) {
        showPlaceholder(
            "chart8",
            "No matching stock and diffusion observations."
        );
        return;
    }

    const spec = {

        height: 420,

        data: {
            values: chartData
        },

        mark: {
            type: "circle",
            opacity: 0.65,
            stroke: "#ffffff",
            strokeWidth: 0.5
        },

        encoding: {

            x: {
                field: "diffusion",
                type: "quantitative",
                title: "Average Appliances per Dwelling"
            },

            y: {
                field: "stock",
                type: "quantitative",
                title: "Appliance Stock (Millions)",
                scale: {
                    type: "log"
                }
            },

            color: {
                field: "appliance",
                type: "nominal",
                title: "Appliance"
            },

            size: {
                field: "stock",
                type: "quantitative",
                title: "Stock (Millions)",
                scale: {
                    range: [35, 550]
                }
            },

            tooltip: [
                {
                    field: "country",
                    title: "Country"
                },
                {
                    field: "appliance",
                    title: "Appliance"
                },
                {
                    field: "year",
                    title: "Year",
                    format: "d"
                },
                {
                    field: "diffusion",
                    title: "Units per Dwelling",
                    format: ".3f"
                },
                {
                    field: "stock",
                    title: "Stock (Millions)",
                    format: ",.2f"
                }
            ]
        }
    };

    renderChart("chart8", spec);
}


        /* ------------------------------------------
           RENDER ALL IEA CHARTS
        ------------------------------------------ */

        drawChart1();
        drawChart2();
        drawChart3();
        drawChart4();
        drawChart5();

        // Load product visualisations separately.

        drawChart6();
        drawChart7();
        drawChart8();

    } catch (error) {

        console.error(
            "Website loading error:",
            error
        );

        for (let i = 1; i <= 7; i++) {

            showPlaceholder(
                "chart" + i,
                "Unable to load data. Check your CSV path."
            );
        }
    }
}


/* ==========================================================
   12. INITIALISE WEBSITE
========================================================== */

startWebsite();
