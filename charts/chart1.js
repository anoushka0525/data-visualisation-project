
/*
   CHART 1: APPLIANCE DIFFUSION OVER TIME
   Type: Interactive Multi-Line Chart
   Dataset: IEA Household Appliances
   */

async function initChart1() {

    const container =
        document.getElementById("chart1");

    const dropdown =
        document.getElementById("countrySelect");

    if (!container || !dropdown) {
        console.error("Chart 1 HTML elements not found.");
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
                Number.isInteger(Number(d.year))
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
        // 2. POPULATE COUNTRY DROPDOWN
        // =====================================

        const countries = [
            ...new Set(
                diffusionData.map(d => d.country)
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

        // Set Australia as the default country
        const defaultCountry =
            countries.find(c =>
                c.toLowerCase() === "australia"
            ) || countries[0];

        dropdown.value = defaultCountry;

        // =====================================
        // 3. ACCESSIBLE COLOUR PALETTE
        // =====================================

        const applianceOrder = [
            "Clothes dryers",
            "Clothes washers",
            "Dish washers",
            "Freezers",
            "PC/Information & communication",
            "Refrigerator/freezer combinations",
            "Televisions"
        ];

        // Assign consistent colours by category
        const applianceColours = [
            "#0072B2", // Blue
            "#E69F00", // Orange
            "#CC79A7", // Reddish purple
            "#56B4E9", // Sky blue
            "#009E73", // Bluish green
            "#D55E00", // Vermillion
            "#555555"  // Dark grey
        ];

        // Assign different line patterns
        const appliancePatterns = [
            [1, 0],           // Solid
            [8, 4],           // Dashed
            [3, 3],           // Short dash
            [10, 3, 2, 3],   // Dash-dot
            [2, 4],           // Dotted
            [12, 4],          // Long dash
            [6, 3, 2, 3]     // Alternating dash
        ];

        // =====================================
        // 4. RENDER CHART
        // =====================================

        async function renderChart(country) {

            const filtered = diffusionData
                .filter(d => d.country === country);

            if (!filtered.length) {
                container.textContent =
                    "No diffusion data available.";
                return;
            }

            const spec = {

                "$schema":
                    "https://vega.github.io/schema/vega-lite/v6.json",

                width: "container",
                height: 410,

                background: "transparent",

                data: {
                    values: filtered
                },

                // =================================
                // MARK DESIGN
                // =================================

                mark: {
                    type: "line",

                    strokeWidth: 2.8,

                    point: {
                        filled: true,
                        size: 55
                    }
                },

                // =================================
                // DATA ENCODING
                // =================================

                encoding: {

                    // X-Axis: Year
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

                    // Y-Axis: Diffusion
                    y: {
                        field: "value",
                        type: "quantitative",

                        aggregate: "mean",

                        title:
                            "Average appliances per dwelling",

                        scale: {
                            zero: true
                        },

                        axis: {
                            grid: true,
                            gridColor: "#e5e7eb"
                        }
                    },

                    // Colour by appliance category
                    color: {
                        field: "appliance",
                        type: "nominal",

                        title: "Appliance Category",

                        scale: {
                            domain: applianceOrder,
                            range: applianceColours
                        },

                        legend: {
                            orient: "bottom",
                            direction: "vertical",
                            columns: 2,
                            labelLimit: 350,
                            symbolStrokeWidth: 3
                        }
                    },

                    // Line patterns by appliance
                    strokeDash: {
                        field: "appliance",
                        type: "nominal",

                        scale: {
                            domain: applianceOrder,
                            range: appliancePatterns
                        },

                        legend: null
                    },

                    // Interactive tooltips
                    tooltip: [
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
                            aggregate: "mean",
                            field: "value",
                            type: "quantitative",
                            title: "Diffusion",
                            format: ".3f"
                        }
                    ]
                },

                // =================================
                // VISUAL DESIGN
                // =================================

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
                        titleFontSize: 13,
                        symbolSize: 120
                    }
                }
            };

            // =================================
            // DISPLAY VEGA-LITE CHART
            // =================================

            await vegaEmbed("#chart1", spec, {

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
        // 5. INITIALISE DEFAULT COUNTRY
        // =====================================

        await renderChart(defaultCountry);

        // Update when user changes country
        dropdown.addEventListener(
            "change",
            async () => {

                try {
                    await renderChart(dropdown.value);
                } catch (error) {
                    console.error(
                        "Chart 1 update error:",
                        error
                    );

                    container.textContent =
                        "Unable to update Chart 1.";
                }
            }
        );

    } catch (error) {

        console.error("Chart 1 error:", error);

        container.textContent =
            "Unable to load Chart 1: " + error.message;
    }
}

initChart1();
