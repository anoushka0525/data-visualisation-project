
/* 
   CHART 1: APPLIANCE DIFFUSION OVER TIME
   Dataset: IEA Household Appliances
*/

const chart1Data = "data/iea_appliances.csv";

async function initChart1() {
    const countrySelect =
        document.getElementById("countrySelect");

    const chartContainer =
        document.getElementById("chart1");

    try {
        // Load the CSV
        const loader = vega.loader();

        const csvText = await loader.load(chart1Data);

        const data = vega.read(csvText, {
            type: "csv"
        });

        // Select only diffusion records
        const diffusionData = data.filter(d =>
            String(d.metric).trim().toLowerCase()
                === "diffusion" &&
            d.country &&
            d.appliance &&
            Number.isFinite(Number(d.year)) &&
            Number.isFinite(Number(d.value)) &&
            String(d.value).trim() !== ""
        );

        if (diffusionData.length === 0) {
            throw new Error(
                "No diffusion observations found."
            );
        }

        // Get unique country names
        const countries = [
            ...new Set(
                diffusionData.map(d => d.country)
            )
        ].sort();

        // Populate country dropdown
        countrySelect.innerHTML = "";

        countries.forEach(country => {
            const option =
                document.createElement("option");

            option.value = country;
            option.textContent = country;

            countrySelect.appendChild(option);
        });

        // Prefer Australia if available
        const defaultCountry =
            countries.find(c =>
                c.toLowerCase() === "australia"
            ) || countries[0];

        countrySelect.value = defaultCountry;

        // Render selected country
        function renderChart(country) {

            const filtered = diffusionData
                .filter(d => d.country === country)
                .map(d => ({
                    year: Number(d.year),
                    appliance: d.appliance,
                    value: Number(d.value)
                }));

            const spec = {
                $schema:
                    "https://vega.github.io/schema/vega-lite/v6.json",

                width: "container",
                height: 390,

                background: "transparent",

                data: {
                    values: filtered
                },

                mark: {
                    type: "line",
                    point: {
                        filled: true,
                        size: 45
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
                            labelAngle: 0,
                            grid: false
                        },
                        scale: {
                            zero: false
                        }
                    },

                    y: {
                        aggregate: "mean",
                        field: "value",
                        type: "quantitative",
                        title:
                            "Average appliances per dwelling",
                        scale: {
                            zero: true
                        }
                    },

                    color: {
                        field: "appliance",
                        type: "nominal",
                        title: "Appliance Category",
                        legend: {
                            orient: "bottom",
                            columns: 3
                        }
                    },

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
                            format: ".2f"
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
                        gridColor: "#e5e7eb"
                    },

                    legend: {
                        labelFont: "DM Sans",
                        titleFont: "DM Sans",
                        labelFontSize: 12,
                        titleFontSize: 13
                    }
                }
            };

            vegaEmbed("#chart1", spec, {
                actions: {
                    export: true,
                    source: false,
                    compiled: false,
                    editor: false
                },
                renderer: "svg"
            }).catch(console.error);
        }

        // Initial chart
        renderChart(defaultCountry);

        // Update when country changes
        countrySelect.addEventListener(
            "change",
            () => renderChart(countrySelect.value)
        );

    } catch (error) {
        console.error("Chart 1 error:", error);

        chartContainer.textContent =
            "Unable to load Chart 1. Check the CSV file and its column names.";
    }
}

initChart1();
