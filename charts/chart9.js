
/* 
   CHART 9: APPLIANCE MODELS BY CATEGORY
   Type: Horizontal Bar Chart
   Dataset: WattWise Running Cost Index
*/

async function initChart9() {

    const container = document.getElementById("chart9");

    if (!container) {
        console.error("Chart 9 container not found.");
        return;
    }

    try {

        // Load second dataset
        const csvText = await vega.loader().load(
            "data/wattwise-running-cost-index.csv"
        );

        const rawData = vega.read(csvText, {
            type: "csv"
        });

        // Keep records with a valid category
        const data = rawData
            .filter(d => d.category && d.slug)
            .map(d => ({
                category: String(d.category)
                    .trim()
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, c => c.toUpperCase()),

                slug: String(d.slug).trim()
            }));

        if (!data.length) {
            throw new Error(
                "No valid appliance records found."
            );
        }

        // Count model records in each category
        const categoryCounts = new Map();

        data.forEach(d => {

            categoryCounts.set(
                d.category,
                (categoryCounts.get(d.category) || 0) + 1
            );

        });

        // Convert counts to chart data
        const chartData = [...categoryCounts.entries()]
            .map(([category, count]) => ({
                category,
                count
            }))
            .sort((a, b) => b.count - a.count);

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",
            height: {
                step: 48
            },

            background: "transparent",

            data: {
                values: chartData
            },

            layer: [

                // Horizontal bars
                {
                    mark: {
                        type: "bar",
                        color: "#167d83",
                        cornerRadiusEnd: 5,
                        size: 24
                    },

                    encoding: {

                        x: {
                            field: "count",
                            type: "quantitative",
                            title: "Number of model records",
                            scale: {
                                zero: true
                            },

                            axis: {
                                grid: true,
                                gridColor: "#e5e7eb",
                                tickCount: 6,
                                format: ",d"
                            }
                        },

                        y: {
                            field: "category",
                            type: "nominal",
                            title: null,

                            sort: {
                                field: "count",
                                order: "descending"
                            },

                            axis: {
                                labelFontSize: 12,
                                labelLimit: 220,
                                ticks: false,
                                domain: false
                            }
                        },

                        tooltip: [
                            {
                                field: "category",
                                type: "nominal",
                                title: "Appliance Category"
                            },
                            {
                                field: "count",
                                type: "quantitative",
                                title: "Model Records",
                                format: ",d"
                            }
                        ]
                    }
                },

                // Numeric labels at the end of bars
                {
                    mark: {
                        type: "text",
                        align: "left",
                        baseline: "middle",
                        dx: 8,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#167d83"
                    },

                    encoding: {

                        x: {
                            field: "count",
                            type: "quantitative"
                        },

                        y: {
                            field: "category",
                            type: "nominal",
                            sort: {
                                field: "count",
                                order: "descending"
                            }
                        },

                        text: {
                            field: "count",
                            type: "quantitative",
                            format: ",d"
                        }
                    }
                }
            ],

            padding: {
                left: 5,
                right: 55,
                top: 10,
                bottom: 10
            },

            config: {

                view: {
                    stroke: null
                },

                axis: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans",
                    labelFontSize: 12,
                    titleFontSize: 13
                }
            }
        };

        await vegaEmbed("#chart9", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 9 error:", error);

        container.textContent =
            "Unable to load Chart 9: " + error.message;
    }
}

initChart9();

