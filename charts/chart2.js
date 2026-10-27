
/* 
   CHART 2: INSTALLED APPLIANCE STOCK

   Type: Stacked Area Chart
   Dataset: IEA Household Appliances
 */

async function initChart2() {

    const container =
        document.getElementById("chart2");

    const dropdown =
        document.getElementById("stocksCountrySelect");

    if (!container || !dropdown) {
        console.error("Chart 2 HTML elements not found.");
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

        // Keep valid Stocks observations
        const stocksData = rawData
            .filter(d =>
                String(d.metric).trim().toLowerCase()
                    === "stocks" &&
                d.country &&
                d.appliance &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value)) &&
                Number(d.value) >= 0 &&
                Number.isInteger(Number(d.year))
            )
            .map(d => ({
                country: String(d.country).trim(),
                appliance: String(d.appliance).trim(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        if (!stocksData.length) {
            throw new Error(
                "No valid Stocks observations found."
            );
        }

        // =====================================
        // 2. COUNTRY DROPDOWN
        // =====================================

        const countries = [
            ...new Set(
                stocksData.map(d => d.country)
            )
        ].sort();

        dropdown.innerHTML = "";

        countries.forEach(country => {

            const option =
                document.createElement("option");

            option.value = country;
            option.textContent = country;

            dropdown.appendChild(option);
        });

        const defaultCountry =
            countries.find(c =>
                c.toLowerCase() === "australia"
            ) || countries[0];

        dropdown.value = defaultCountry;

        // =====================================
        // 3. ACCESSIBLE COLOUR PALETTE
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
            "#117733",
            "#999933"
        ];

        const allAppliances = [
            ...new Set(stocksData.map(d => d.appliance))
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
        // 4. DRAW STACKED AREA CHART
        // =====================================

        async function renderChart(country) {

            const countryData = stocksData.filter(
                d => d.country === country
            );

            const years = [
                ...new Set(
                    countryData.map(d => d.year)
                )
            ].sort((a, b) => a - b);

            // Keep only categories reported
            // in every available year.
            // Missing records are not treated as zero.

            const completeCategories =
                applianceOrder.filter(appliance => {

                    const observedYears = new Set(
                        countryData
                            .filter(d =>
                                d.appliance === appliance
                            )
                            .map(d => d.year)
                    );

                    return years.every(year =>
                        observedYears.has(year)
                    );
                });

            if (!completeCategories.length) {
                container.textContent =
                    "No complete appliance stock series " +
                    "available for this country.";
                return;
            }

            // =================================
            // 5. AGGREGATE STOCK VALUES
            // =================================

            const aggregated = new Map();

            countryData.forEach(d => {

                if (!completeCategories.includes(
                    d.appliance
                )) {
                    return;
                }

                const key = JSON.stringify([
                    d.year,
                    d.appliance
                ]);

                aggregated.set(
                    key,
                    (aggregated.get(key) || 0) + d.value
                );
            });

            // =================================
            // 6. CALCULATE STACK BOUNDARIES
            // =================================

            // Explicit y0 and y1 boundaries
            // prevent gaps between stacked areas.

            const stackedData = [];

            years.forEach(year => {

                let cumulative = 0;

                completeCategories.forEach(appliance => {

                    const key = JSON.stringify([
                        year,
                        appliance
                    ]);

                    const stock =
                        aggregated.get(key) || 0;

                    const y0 = cumulative;
                    const y1 = cumulative + stock;

                    stackedData.push({
                        year: year,
                        appliance: appliance,
                        stock: stock,
                        y0: y0,
                        y1: y1
                    });

                    cumulative = y1;
                });
            });

            // =================================
            // 7. VEGA-LITE SPECIFICATION
            // =================================

            const spec = {

                "$schema":
                    "https://vega.github.io/schema/vega-lite/v6.json",

                width: "container",
                height: 420,

                background: "transparent",

                data: {
                    values: stackedData
                },

                mark: {
                    type: "area",
                    opacity: 1,
                    interpolate: "linear",
                    strokeWidth: 0
                },

                encoding: {

                    x: {
                        field: "year",
                        type: "quantitative",
                        title: "Year",

                        scale: {
                            zero: false
                        },

                        axis: {
                            format: "d",
                            tickMinStep: 1,
                            labelAngle: 0,
                            grid: false
                        }
                    },

                    // Upper boundary of area
                    y: {
                        field: "y1",
                        type: "quantitative",

                        title:
                            "Installed appliance stock (millions)",

                        scale: {
                            zero: true
                        },

                        axis: {
                            grid: true,
                            gridColor: "#e5e7eb",
                            tickCount: 7
                        }
                    },

                    // Lower boundary of area
                    y2: {
                        field: "y0"
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
                            symbolSize: 140
                        }
                    },

                    detail: {
                        field: "appliance",
                        type: "nominal"
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
                            field: "stock",
                            type: "quantitative",
                            title: "Stock (millions)",
                            format: ",.2f"
                        },
                        {
                            field: "y1",
                            type: "quantitative",
                            title: "Cumulative stock",
                            format: ",.2f"
                        }
                    ]
                },

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

            // =================================
            // 8. RENDER CHART
            // =================================

            await vegaEmbed("#chart2", spec, {

                renderer: "svg",

                actions: {
                    export: true,
                    source: false,
                    compiled: false,
                    editor: false
                }
            });
        }

        // =====================================
        // 9. INITIAL DISPLAY
        // =====================================

        await renderChart(defaultCountry);

        // Update when country changes
        dropdown.addEventListener(
            "change",
            async () => {

                try {
                    await renderChart(dropdown.value);
                } catch (error) {

                    console.error(
                        "Chart 2 update error:",
                        error
                    );

                    container.textContent =
                        "Unable to update Chart 2.";
                }
            }
        );

    } catch (error) {

        console.error("Chart 2 error:", error);

        container.textContent =
            "Unable to load Chart 2: " + error.message;
    }
}

initChart2();
