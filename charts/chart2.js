/*
   CHART 2: INSTALLED APPLIANCE STOCK
   Type: Stacked Area Chart
   Dataset: IEA Household Appliances
*/

const chart2Data = "data/iea_appliances.csv";

async function initChart2() {

    const countrySelect =
        document.getElementById("stocksCountrySelect");

    const chartContainer =
        document.getElementById("chart2");

    try {

        // Load the CSV file
        const loader = vega.loader();

        const csvText = await loader.load(chart2Data);

        const data = vega.read(csvText, {
            type: "csv"
        });

        // Keep only Stocks observations
        const stocksData = data
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
                "No valid Stocks records found."
            );
        }

        // Extract country names
        const countries = [
            ...new Set(
                stocksData.map(d => d.country)
            )
        ].sort();

        countrySelect.innerHTML = "";

        countries.forEach(country => {

            const option =
                document.createElement("option");

            option.value = country;
            option.textContent = country;

            countrySelect.appendChild(option);

        });

        // Australia as the default
        const defaultCountry =
            countries.find(c =>
                c.toLowerCase() === "australia"
            ) || countries[0];

        countrySelect.value = defaultCountry;


        // Render chart for selected country
        async function renderChart(country) {

            const countryData = stocksData.filter(
                d => d.country === country
            );

            // Identify years with reported data
            const years = [
                ...new Set(
                    countryData.map(d => d.year)
                )
            ].sort((a, b) => a - b);

            // Keep categories with an observation
            // in every selected year.
            // This avoids treating missing data as 0.
            const categories = [
                ...new Set(
                    countryData.map(d => d.appliance)
                )
            ];

            const completeCategories =
                categories.filter(appliance => {

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

            const filtered = countryData.filter(d =>
                completeCategories.includes(d.appliance)
            );

            if (!filtered.length) {

                chartContainer.textContent =
                    "No complete appliance series " +
                    "available for this country.";

                return;
            }

            const spec = {

                $schema:
                    "https://vega.github.io/schema/vega-lite/v6.json",

                width: "container",
                height: 400,

                autosize: {
                    type: "fit",
                    contains: "padding"
                },

                background: "transparent",

                data: {
                    values: filtered
                },

                mark: {
                    type: "area",
                    opacity: 0.9,
                    interpolate: "linear"
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
                            grid: false,
                            labelAngle: 0
                        }
                    },

                    y: {
                        field: "value",
                        type: "quantitative",
                        aggregate: "sum",
                        stack: "zero",

                        title:
                            "Installed appliance stock (millions)",

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
                            columns: 2,
                            labelLimit: 300
                        },

                        scale: {
                            scheme: "tableau10"
                        }
                    },

                    order: {
                        field: "appliance",
                        type: "nominal",
                        sort: "ascending"
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
                            type: "quantitative",
                            aggregate: "sum",
                            title: "Stock (millions)",
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

            await vegaEmbed("#chart2", spec, {

                actions: {
                    export: true,
                    source: false,
                    compiled: false,
                    editor: false
                },

                renderer: "svg"

            });
        }

        // Display initial chart
        await renderChart(defaultCountry);

        // Update chart when country changes
        countrySelect.addEventListener(
            "change",
            async () => {
                try {
                    await renderChart(
                        countrySelect.value
                    );
                } catch (error) {
                    console.error(
                        "Chart 2 rendering error:",
                        error
                    );
                }
            }
        );

    } catch (error) {

        console.error("Chart 2 error:", error);

        chartContainer.textContent =
            "Unable to load Chart 2. " +
            "Check the CSV file and console.";

    }
}

initChart2();

