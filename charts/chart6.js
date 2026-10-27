
/* 
   CHART 6: CHANGE IN APPLIANCE DIFFUSION
   Type: Dumbbell Chart
   Dataset: IEA Household Appliances
   Country: Australia
*/

async function initChart6() {

    const container =
        document.getElementById("chart6");

    if (!container) {
        console.error("Chart 6 container not found.");
        return;
    }

    try {

        // Load CSV
        const csvText = await vega.loader().load(
            "data/iea_appliances.csv"
        );

        const rawData = vega.read(csvText, {
            type: "csv"
        });

        // Get Australia diffusion data
        const data = rawData
            .filter(d =>
                String(d.country).trim() === "Australia" &&
                String(d.metric).trim().toLowerCase() ===
                    "diffusion" &&
                d.appliance &&
                String(d.value).trim() !== "" &&
                Number.isFinite(Number(d.value)) &&
                Number.isInteger(Number(d.year))
            )
            .map(d => ({
                appliance: String(d.appliance).trim(),
                year: Number(d.year),
                value: Number(d.value)
            }));

        if (!data.length) {
            throw new Error("No Australian data found.");
        }

        // Group by appliance category
        const groups = {};

        data.forEach(d => {
            if (!groups[d.appliance]) {
                groups[d.appliance] = [];
            }

            groups[d.appliance].push(d);
        });

        // Get earliest and latest values
        const chartData = [];

        Object.keys(groups).forEach(appliance => {

            const records = groups[appliance]
                .sort((a, b) => a.year - b.year);

            if (records.length < 2) return;

            const first = records[0];
            const last = records[records.length - 1];

            if (first.year === last.year) return;

            chartData.push({
                appliance: appliance,
                start: first.value,
                end: last.value,
                startYear: first.year,
                endYear: last.year,
                change: last.value - first.value
            });
        });

        if (!chartData.length) {
            throw new Error(
                "No suitable records for comparison."
            );
        }

        // Sort by largest change
        chartData.sort((a, b) =>
            b.change - a.change
        );

        const applianceOrder =
            chartData.map(d => d.appliance);

        // Create dumbbell chart
        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 45
            },

            background: "transparent",

            data: {
                values: chartData
            },

            encoding: {

                y: {
                    field: "appliance",
                    type: "nominal",
                    sort: applianceOrder,
                    title: null,

                    axis: {
                        labelLimit: 250,
                        labelFontSize: 12,
                        ticks: false,
                        domain: false
                    }
                }
            },

            layer: [

                // Connecting line
                {
                    mark: {
                        type: "rule",
                        color: "#a9bec2",
                        strokeWidth: 3
                    },

                    encoding: {
                        x: {
                            field: "start",
                            type: "quantitative",
                            title:
                                "Average appliances per dwelling",
                            scale: {
                                zero: true
                            }
                        },

                        x2: {
                            field: "end"
                        }
                    }
                },

                // Earliest observation
                {
                    mark: {
                        type: "point",
                        filled: true,
                        size: 180,
                        color: "#df8645"
                    },

                    encoding: {
                        x: {
                            field: "start",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "appliance",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "startYear",
                                type: "quantitative",
                                title: "Earliest Year",
                                format: "d"
                            },
                            {
                                field: "start",
                                type: "quantitative",
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
                        size: 180,
                        color: "#167d83"
                    },

                    encoding: {
                        x: {
                            field: "end",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "appliance",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "endYear",
                                type: "quantitative",
                                title: "Latest Year",
                                format: "d"
                            },
                            {
                                field: "end",
                                type: "quantitative",
                                title: "Latest Diffusion",
                                format: ".3f"
                            },
                            {
                                field: "change",
                                type: "quantitative",
                                title: "Overall Change",
                                format: "+.3f"
                            }
                        ]
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
                    gridColor: "#e5e7eb"
                }
            }
        };

        await vegaEmbed("#chart6", spec, {
            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 6 error:", error);

        container.textContent =
            "Unable to load Chart 6: " + error.message;
    }
}

initChart6();


