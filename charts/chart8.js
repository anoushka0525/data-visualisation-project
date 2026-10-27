
/* 
   CHART 8: APPLIANCE STOCK VS DIFFUSION
   Type: Bubble Scatter Plot 
   Dataset: IEA Household Appliances
*/

async function initChart8() {

    const container = document.getElementById("chart8");

    if (!container) {
        console.error("Chart 8 container not found.");
        return;
    }

    try {

        // =====================================
        // 1. LOAD DATASET
        // =====================================

        const csvText = await vega.loader().load(
            "data/iea_appliances.csv"
        );

        const rawData = vega.read(csvText, {
            type: "csv"
        });

        // Filter valid diffusion and stock records
        const filteredData = rawData
            .filter(d =>
                ["diffusion", "stocks"].includes(
                    String(d.metric).trim().toLowerCase()
                ) &&
                d.country &&
                d.appliance &&
                Number(d.year) >= 2015 &&
                Number.isInteger(Number(d.year)) &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value)) &&
                Number(d.value) > 0
            )
            .map(d => ({
                country: String(d.country).trim(),
                appliance: String(d.appliance).trim(),
                metric: String(d.metric)
                    .trim().toLowerCase(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        // =====================================
        // 2. MATCH STOCKS AND DIFFUSION
        // =====================================

        // Match by country, appliance and year
        const matchedRecords = new Map();

        filteredData.forEach(d => {

            const key = JSON.stringify([
                d.country,
                d.appliance,
                d.year
            ]);

            if (!matchedRecords.has(key)) {
                matchedRecords.set(key, {
                    country: d.country,
                    appliance: d.appliance,
                    year: d.year
                });
            }

            const record = matchedRecords.get(key);

            if (d.metric === "diffusion") {
                record.diffusion = d.value;
            }

            if (d.metric === "stocks") {
                record.stocks = d.value;
            }
        });

        const validRecords = [
            ...matchedRecords.values()
        ].filter(d =>
            Number.isFinite(d.diffusion) &&
            Number.isFinite(d.stocks) &&
            d.diffusion > 0 &&
            d.stocks > 0
        );

        // Latest matching year per country-appliance
        const latestRecords = new Map();

        validRecords.forEach(d => {

            const key = JSON.stringify([
                d.country,
                d.appliance
            ]);

            const previous = latestRecords.get(key);

            if (!previous || d.year > previous.year) {
                latestRecords.set(key, d);
            }
        });

        const chartData = [...latestRecords.values()];

        if (!chartData.length) {
            throw new Error(
                "No matching stock and diffusion records."
            );
        }

        // =====================================
        // 3. ACCESSIBLE APPLIANCE COLOURS
        // =====================================

        const preferredOrder = [
            "Clothes dryers",
            "Clothes washers",
            "Dish washers",
            "Freezers",
            "PC/Information & communication",
            "Refrigerator/freezer combinations",
            "Televisions"
        ];

        const preferredColours = [
            "#0072B2", // Blue
            "#E69F00", // Orange
            "#CC79A7", // Reddish purple
            "#56B4E9", // Sky blue
            "#009E73", // Bluish green
            "#D55E00", // Vermillion
            "#555555"  // Dark grey
        ];

        const colourLookup = new Map(
            preferredOrder.map((name, index) => [
                name,
                preferredColours[index]
            ])
        );

        const extraColours = [
            "#332288",
            "#88CCEE",
            "#AA4499",
            "#999933"
        ];

        const allAppliances = [
            ...new Set(
                chartData.map(d => d.appliance)
            )
        ].sort();

        const applianceOrder = [
            ...preferredOrder.filter(a =>
                allAppliances.includes(a)
            ),
            ...allAppliances.filter(a =>
                !preferredOrder.includes(a)
            )
        ];

        let extraIndex = 0;

        applianceOrder.forEach(appliance => {

            if (!colourLookup.has(appliance)) {
                colourLookup.set(
                    appliance,
                    extraColours[
                        extraIndex % extraColours.length
                    ]
                );

                extraIndex++;
            }
        });

        // =====================================
        // 4. VEGA-LITE SPECIFICATION
        // =====================================

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",
            height: 460,

            background: "transparent",

            data: {
                values: chartData
            },

            mark: {
                type: "circle",
                opacity: 0.75,
                stroke: "#26383f",
                strokeWidth: 0.8
            },

            encoding: {

                x: {
                    field: "diffusion",
                    type: "quantitative",

                    title:
                        "Average appliances per dwelling",

                    scale: {
                        zero: true
                    },

                    axis: {
                        grid: true,
                        gridColor: "#e5e7eb",
                        tickCount: 7
                    }
                },

                y: {
                    field: "stocks",
                    type: "quantitative",

                    title:
                        "Installed appliance stock (millions)",

                    scale: {
                        type: "log"
                    },

                    axis: {
                        grid: true,
                        gridColor: "#e5e7eb",
                        format: "~g"
                    }
                },

                color: {
                    field: "appliance",
                    type: "nominal",

                    title: "Appliance Category",

                    scale: {
                        domain: applianceOrder,
                        range: applianceOrder.map(
                            a => colourLookup.get(a)
                        )
                    },

                    legend: {
                        orient: "bottom",
                        columns: 2,
                        labelLimit: 350,
                        symbolSize: 130
                    }
                },

                size: {
                    field: "stocks",
                    type: "quantitative",

                    title: "Stock (millions)",

                    scale: {
                        range: [45, 1000]
                    },

                    legend: null
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
                        field: "diffusion",
                        type: "quantitative",
                        title: "Diffusion",
                        format: ".3f"
                    },
                    {
                        field: "stocks",
                        type: "quantitative",
                        title: "Stock (millions)",
                        format: ",.2f"
                    }
                ]
            },

            // =====================================
            // 5. INTERACTIVE ZOOM
            // =====================================

            params: [
                {
                    name: "chart8Zoom",
                    select: {
                        type: "interval",
                        bind: "scales",
                        encodings: ["x", "y"]
                    }
                }
            ],

            config: {

                view: {
                    stroke: null
                },

                axis: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans",
                    labelFontSize: 12,
                    titleFontSize: 13,
                    titlePadding: 12
                },

                legend: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans",
                    labelFontSize: 12,
                    titleFontSize: 13
                }
            }
        };

        // =====================================
        // 6. RENDER CHART
        // =====================================

        await vegaEmbed("#chart8", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 8 error:", error);

        container.textContent =
            "Unable to load Chart 8: " + error.message;
    }
}

initChart8();

