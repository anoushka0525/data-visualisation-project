
/* ==========================================
   CHART 7: APPLIANCE DIFFUSION DISTRIBUTION

   Type: Horizontal Box Plot
   Dataset: IEA Household Appliances

   Features:
   - Colourblind-friendly palette
   - Consistent appliance colours
   - Median, quartiles and outliers
   - Latest observations from 2015 onwards
========================================== */

async function initChart7() {

    const container = document.getElementById("chart7");

    if (!container) {
        console.error("Chart 7 container not found.");
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

        // Keep valid diffusion observations
        const diffusionData = rawData
            .filter(d =>
                String(d.metric).trim().toLowerCase()
                    === "diffusion" &&
                d.country &&
                d.appliance &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value)) &&
                Number(d.value) >= 0 &&
                Number.isInteger(Number(d.year)) &&
                Number(d.year) >= 2015
            )
            .map(d => ({
                country: String(d.country).trim(),
                appliance: String(d.appliance).trim(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        if (!diffusionData.length) {
            throw new Error(
                "No valid diffusion observations found."
            );
        }

        // =====================================
        // 2. SELECT LATEST OBSERVATIONS
        // =====================================

        // One observation per country and appliance
        const latestRecords = new Map();

        diffusionData.forEach(d => {

            const key = JSON.stringify([
                d.country,
                d.appliance
            ]);

            const previous = latestRecords.get(key);

            if (!previous || d.year > previous.year) {
                latestRecords.set(key, d);
            }
        });

        const latestData = [...latestRecords.values()];

        if (!latestData.length) {
            throw new Error(
                "No latest observations available."
            );
        }

        // =====================================
        // 3. COLOURBLIND-FRIENDLY PALETTE
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

        // Support additional appliance categories
        const extraColours = [
            "#332288",
            "#88CCEE",
            "#AA4499",
            "#999933"
        ];

        const allAppliances = [
            ...new Set(
                latestData.map(d => d.appliance)
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
        // 4. BOX PLOT SPECIFICATION
        // =====================================

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 48
            },

            background: "transparent",

            data: {
                values: latestData
            },

            mark: {
                type: "boxplot",
                extent: 1.5,
                size: 26,

                box: {
                    opacity: 0.85
                },

                median: {
                    color: "#172c34",
                    strokeWidth: 2.5
                },

                outliers: {
                    size: 45,
                    opacity: 0.75
                }
            },

            encoding: {

                // X-axis: Diffusion values
                x: {
                    field: "value",
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

                // Y-axis: Appliance categories
                y: {
                    field: "appliance",
                    type: "nominal",

                    title: null,
                    sort: applianceOrder,

                    axis: {
                        labelLimit: 300,
                        labelFontSize: 12,
                        ticks: false,
                        domain: false
                    }
                },

                // Consistent appliance colours
                color: {
                    field: "appliance",
                    type: "nominal",

                    scale: {
                        domain: applianceOrder,
                        range: applianceOrder.map(
                            a => colourLookup.get(a)
                        )
                    },

                    legend: null
                }
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
                }
            }
        };

        // =====================================
        // 5. RENDER CHART
        // =====================================

        await vegaEmbed("#chart7", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 7 error:", error);

        container.textContent =
            "Unable to load Chart 7: " + error.message;
    }
}

initChart7();

