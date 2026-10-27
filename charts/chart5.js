
/* 
   CHART 5: HOUSEHOLD APPLIANCE PENETRATION
   Type: Heatmap
   Dataset: IEA Household Appliances
*/

async function initChart5() {

    const container = document.getElementById("chart5");

    if (!container) {
        console.error("Chart 5 container not found.");
        return;
    }

    try {

        // Load dataset
        const csvText = await vega.loader().load(
            "data/iea_appliances.csv"
        );

        const rawData = vega.read(csvText, {
            type: "csv"
        });

        // Filter valid penetration records
        const penetrationData = rawData
            .filter(d =>
                String(d.metric).trim().toLowerCase() ===
                    "penetration" &&
                d.country &&
                d.appliance &&
                Number(d.year) >= 2015 &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value)) &&
                Number(d.value) >= 0
            )
            .map(d => ({
                country: String(d.country).trim(),
                appliance: String(d.appliance).trim(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        // Keep latest observation for each
        // country and appliance combination
        const latestRecords = new Map();

        penetrationData.forEach(d => {

            const key = JSON.stringify([
                d.country,
                d.appliance
            ]);

            const existing = latestRecords.get(key);

            if (!existing || d.year > existing.year) {
                latestRecords.set(key, d);
            }
        });

        const latestData = [...latestRecords.values()];

        if (!latestData.length) {
            throw new Error(
                "No penetration observations found."
            );
        }

        // Rank countries by data completeness
        const countryCounts = {};

        latestData.forEach(d => {
            countryCounts[d.country] =
                (countryCounts[d.country] || 0) + 1;
        });

        // Select 10 countries with the most
        // available appliance categories
        const selectedCountries = Object.keys(countryCounts)
            .sort((a, b) =>
                countryCounts[b] - countryCounts[a] ||
                a.localeCompare(b)
            )
            .slice(0, 10);

        // Keep data for selected countries
        const selectedData = latestData.filter(d =>
            selectedCountries.includes(d.country)
        );

        // Determine percentage units
        // Supports either 0 to 1 or 0 to 100 values
        const maxValue = Math.max(
            ...selectedData.map(d => d.value)
        );

        const multiplier = maxValue <= 1 ? 100 : 1;

        selectedData.forEach(d => {
            d.percentage = d.value * multiplier;
        });

        // Get appliance categories
        const appliances = [
            ...new Set(
                selectedData.map(d => d.appliance)
            )
        ].sort();

        // Build country-appliance lookup
        const lookup = new Map(
            selectedData.map(d => [
                JSON.stringify([
                    d.country,
                    d.appliance
                ]),
                d
            ])
        );

        // Create complete heatmap grid
        // Missing observations remain null
        const fullGrid = [];

        selectedCountries.forEach(country => {

            appliances.forEach(appliance => {

                const key = JSON.stringify([
                    country,
                    appliance
                ]);

                const record = lookup.get(key);

                fullGrid.push(
                    record || {
                        country,
                        appliance,
                        year: null,
                        percentage: null
                    }
                );
            });
        });

        // Vega-Lite specification
        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 38
            },

            background: "transparent",

            data: {
                values: fullGrid
            },

            mark: {
                type: "rect",
                stroke: "#ffffff",
                strokeWidth: 2,
                cornerRadius: 3
            },

            encoding: {

                x: {
                    field: "appliance",
                    type: "nominal",
                    title: "Appliance Category",
                    sort: appliances,

                    axis: {
                        labelAngle: -35,
                        labelLimit: 180,
                        labelFontSize: 12,
                        labelPadding: 10,
                        grid: false
                    }
                },

                y: {
                    field: "country",
                    type: "nominal",
                    title: null,
                    sort: selectedCountries,

                    axis: {
                        labelFontSize: 12,
                        labelLimit: 180,
                        grid: false
                    }
                },

                color: {
                    field: "percentage",
                    type: "quantitative",

                    title: "Households owning (%)",

                    scale: {
                        scheme: "tealblues",
                        domain: [0, 100]
                    },

                    legend: {
                        orient: "bottom",
                        gradientLength: 260,
                        format: ".0f"
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
                        field: "percentage",
                        type: "quantitative",
                        title: "Households owning (%)",
                        format: ".1f"
                    },
                    {
                        field: "year",
                        type: "quantitative",
                        title: "Reporting Year",
                        format: "d"
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
                    domain: false,
                    ticks: false
                },

                legend: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans",
                    labelFontSize: 12
                }
            }
        };

        // Render heatmap
        await vegaEmbed("#chart5", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 5 error:", error);

        container.textContent =
            "Unable to load Chart 5: " + error.message;
    }
}

initChart5();

