
/* 
   CHART 3: APPLIANCE DIFFUSION HEATMAP
   Dataset: IEA Household Appliances
   Type: Heatmap
*/

async function initChart3() {

    const chartContainer =
        document.getElementById("chart3");

    try {

        // Load dataset
        const loader = vega.loader();

        const csvText = await loader.load(
            "data/iea_appliances.csv"
        );

        const data = vega.read(csvText, {
            type: "csv"
        });

        // Selected countries for comparison
        const selectedCountries = [
            "Australia",
            "Brazil",
            "Canada",
            "Germany",
            "New Zealand",
            "Philippines",
            "Spain",
            "United Kingdom",
            "United States",
            "Switzerland"
        ];

        // Filter for diffusion observations
        const diffusionData = data
            .filter(d =>
                String(d.metric).trim().toLowerCase()
                    === "diffusion" &&
                selectedCountries.includes(d.country) &&
                Number(d.year) >= 2015 &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value))
            )
            .map(d => ({
                country: d.country,
                appliance: d.appliance,
                year: Number(d.year),
                value: Number(d.value)
            }));

        // Keep latest observation per
        // country-appliance combination
        const latestRecords = new Map();

        diffusionData.forEach(d => {

            const key =
                d.country + "|" + d.appliance;

            const existing = latestRecords.get(key);

            if (
                !existing ||
                d.year > existing.year
            ) {
                latestRecords.set(key, d);
            }
        });

        const chartData = [
            ...latestRecords.values()
        ];

        if (!chartData.length) {
            throw new Error(
                "No diffusion records available."
            );
        }

        // Get appliance categories
        const appliances = [
            ...new Set(
                chartData.map(d => d.appliance)
            )
        ].sort();

        // Build full country-appliance grid.
        // Missing observations remain null.
        const lookup = new Map(
            chartData.map(d => [
                d.country + "|" + d.appliance,
                d
            ])
        );

        const fullGrid = [];

        selectedCountries.forEach(country => {
            appliances.forEach(appliance => {

                const record = lookup.get(
                    country + "|" + appliance
                );

                fullGrid.push(
                    record || {
                        country,
                        appliance,
                        year: null,
                        value: null
                    }
                );
            });
        });

        const spec = {

            $schema:
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 34
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
                        labelFontSize: 11,
                        labelLimit: 180,
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
                        labelLimit: 170,
                        grid: false
                    }
                },

                color: {
                    field: "value",
                    type: "quantitative",

                    title:
                        "Appliances per dwelling",

                    scale: {
                        scheme: "tealblues",
                        domainMin: 0 /* ensures that the colour scheme starts at 0*/
                    },

                    legend: {
                        orient: "bottom",
                        gradientLength: 240,
                        titleFontSize: 12,
                        labelFontSize: 11
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
                    titleFontSize: 13,
                    labelFontSize: 12,
                    domain: false,
                    ticks: false
                },

                legend: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans"
                },

                range: {
                    category: [
                        "#d7f0ed",
                        "#91ccc7",
                        "#4b9b9b",
                        "#1b646f"
                    ]
                }
            }
        };

        await vegaEmbed("#chart3", spec, {

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            },

            renderer: "svg"

        });

    } catch (error) {

        console.error("Chart 3 error:", error);

        chartContainer.textContent =
            "Unable to load Chart 3. " +
            "Please check the browser console.";
    }
}

initChart3();

