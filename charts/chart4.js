
/*
   CHART 4: COUNTRY RANKING DOT PLOT
   Dataset: IEA Household Appliances
   */

async function initChart4() {

    const container = document.getElementById("chart4");
    const dropdown = document.getElementById("applianceSelect");

    if (!container || !dropdown) {
        console.error("Chart 4 HTML elements not found.");
        return;
    }

    try {

        const csvText = await vega.loader().load(
            "data/iea_appliances.csv"
        );

        const rawData = vega.read(csvText, {
            type: "csv"
        });

        // Filter diffusion observations
        const data = rawData
            .filter(d =>
                String(d.metric).trim().toLowerCase() === "diffusion" &&
                d.country &&
                d.appliance &&
                Number(d.year) >= 2015 &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value))
            )
            .map(d => ({
                country: String(d.country).trim(),
                appliance: String(d.appliance).trim(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        // Latest observation for each country-appliance
        const latest = new Map();

        data.forEach(d => {
            const key = JSON.stringify([d.country, d.appliance]);
            const previous = latest.get(key);

            if (!previous || d.year > previous.year) {
                latest.set(key, d);
            }
        });

        const latestData = [...latest.values()];

        if (latestData.length === 0) {
            throw new Error("No valid diffusion data found.");
        }

        // Populate appliance dropdown
        const appliances = [
            ...new Set(latestData.map(d => d.appliance))
        ].sort();

        dropdown.innerHTML = "";

        appliances.forEach(appliance => {
            const option = document.createElement("option");

            option.value = appliance;
            option.textContent = appliance;

            dropdown.appendChild(option);
        });

        const defaultAppliance = appliances.find(a =>
            a.toLowerCase().includes("refrigerator")
        ) || appliances[0];

        dropdown.value = defaultAppliance;

        // Draw chart
        async function drawChart(appliance) {

            const filtered = latestData
                .filter(d => d.appliance === appliance)
                .sort((a, b) =>
                    b.value - a.value ||
                    a.country.localeCompare(b.country)
                )
                .slice(0, 20);

            if (!filtered.length) {
                container.textContent = "No data available.";
                return;
            }

            const spec = {

                "$schema":
                    "https://vega.github.io/schema/vega-lite/v6.json",

                width: "container",
                height: { step: 26 },

                background: "transparent",

                data: {
                    values: filtered
                },

                mark: {
                    type: "point",
                    filled: true,
                    size: 140,
                    color: "#167d83",
                    opacity: 0.9
                },

                encoding: {

                    x: {
                        field: "value",
                        type: "quantitative",
                        title: "Average appliances per dwelling",
                        scale: { zero: true },
                        axis: {
                            grid: true,
                            gridColor: "#e5e7eb"
                        }
                    },

                    y: {
                        field: "country",
                        type: "nominal",
                        title: null,
                        sort: {
                            field: "value",
                            op: "max",
                            order: "descending"
                        },
                        axis: {
                            labelLimit: 180,
                            ticks: false,
                            domain: false
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
                            field: "value",
                            type: "quantitative",
                            title: "Diffusion",
                            format: ".3f"
                        },
                        {
                            field: "year",
                            type: "quantitative",
                            title: "Reporting year",
                            format: "d"
                        }
                    ]
                },

                config: {
                    view: { stroke: null },

                    axis: {
                        labelFont: "DM Sans",
                        titleFont: "DM Sans",
                        labelFontSize: 12,
                        titleFontSize: 13
                    }
                }
            };

            await vegaEmbed("#chart4", spec, {
                renderer: "svg",
                actions: {
                    export: true,
                    source: false,
                    compiled: false,
                    editor: false
                }
            });
        }

        await drawChart(defaultAppliance);

        dropdown.addEventListener("change", async () => {
            try {
                await drawChart(dropdown.value);
            } catch (error) {
                console.error("Chart 4 update error:", error);
                container.textContent =
                    "Unable to update Chart 4.";
            }
        });

    } catch (error) {

        console.error("Chart 4 error:", error);

        container.textContent =
            "Unable to load Chart 4: " + error.message;
    }
}

initChart4();

