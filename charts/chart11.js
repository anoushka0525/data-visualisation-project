
/* ==========================================
   CHART 11: ANNUAL OPERATING COST RANGES
   Type: Range Chart with Median
   Dataset: WattWise Running Cost Index
========================================== */

async function initChart11() {

    const container =
        document.getElementById("chart11");

    if (!container) {
        console.error("Chart 11 container not found.");
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

        // Filter valid annual cost observations
        const data = rawData
            .filter(d =>
                d.category &&
                String(d.annual_cost_usd).trim() !== "" &&
                Number.isFinite(Number(d.annual_cost_usd)) &&
                Number(d.annual_cost_usd) >= 0
            )
            .map(d => ({
                category: String(d.category)
                    .trim()
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, c => c.toUpperCase()),

                cost: Number(d.annual_cost_usd)
            }));

        if (!data.length) {
            throw new Error(
                "No valid operating-cost records found."
            );
        }

        // Group costs by appliance category
        const groups = new Map();

        data.forEach(d => {
            if (!groups.has(d.category)) {
                groups.set(d.category, []);
            }

            groups.get(d.category).push(d.cost);
        });

        // Calculate median
        function median(values) {

            const sorted = [...values].sort(
                (a, b) => a - b
            );

            const middle = Math.floor(sorted.length / 2);

            return sorted.length % 2 === 0
                ? (sorted[middle - 1] + sorted[middle]) / 2
                : sorted[middle];
        }

        // Calculate statistics for each category
        const chartData = [];

        groups.forEach((costs, category) => {

            chartData.push({
                category: category,
                minCost: Math.min(...costs),
                medianCost: median(costs),
                maxCost: Math.max(...costs),
                modelCount: costs.length
            });

        });

        // Rank categories by median annual cost
        chartData.sort((a, b) =>
            b.medianCost - a.medianCost ||
            a.category.localeCompare(b.category)
        );

        const categoryOrder =
            chartData.map(d => d.category);

        // Shared Y-axis
        const yEncoding = {
            field: "category",
            type: "nominal",
            title: null,
            sort: categoryOrder,

            axis: {
                labelLimit: 230,
                labelFontSize: 12,
                ticks: false,
                domain: false
            }
        };

        // Vega-Lite chart
        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 50
            },

            background: "transparent",

            data: {
                values: chartData
            },

            encoding: {
                y: yEncoding
            },

            layer: [

                // Range connecting minimum and maximum
                {
                    mark: {
                        type: "rule",
                        stroke: "#8ebfc1",
                        strokeWidth: 5,
                        strokeCap: "round"
                    },

                    encoding: {
                        x: {
                            field: "minCost",
                            type: "quantitative",
                            title:
                                "Estimated Annual Electricity Cost (USD)",

                            scale: {
                                zero: true
                            },

                            axis: {
                                format: "$,.0f",
                                grid: true,
                                gridColor: "#e5e7eb"
                            }
                        },

                        x2: {
                            field: "maxCost"
                        }
                    }
                },

                // Minimum point
                {
                    mark: {
                        type: "point",
                        filled: true,
                        color: "#66a6ac",
                        size: 90
                    },

                    encoding: {
                        x: {
                            field: "minCost",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "category",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "minCost",
                                type: "quantitative",
                                title: "Minimum Cost",
                                format: "$,.2f"
                            }
                        ]
                    }
                },

                // Maximum point
                {
                    mark: {
                        type: "point",
                        filled: true,
                        color: "#66a6ac",
                        size: 90
                    },

                    encoding: {
                        x: {
                            field: "maxCost",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "category",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "maxCost",
                                type: "quantitative",
                                title: "Maximum Cost",
                                format: "$,.2f"
                            }
                        ]
                    }
                },

                // Median point
                {
                    mark: {
                        type: "point",
                        filled: true,
                        color: "#df8645",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                        size: 210
                    },

                    encoding: {
                        x: {
                            field: "medianCost",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "category",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "minCost",
                                type: "quantitative",
                                title: "Minimum",
                                format: "$,.2f"
                            },
                            {
                                field: "medianCost",
                                type: "quantitative",
                                title: "Median",
                                format: "$,.2f"
                            },
                            {
                                field: "maxCost",
                                type: "quantitative",
                                title: "Maximum",
                                format: "$,.2f"
                            },
                            {
                                field: "modelCount",
                                type: "quantitative",
                                title: "Model Records",
                                format: ",d"
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
                    titlePadding: 12
                }
            }
        };

        await vegaEmbed("#chart11", spec, {
            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 11 error:", error);

        container.textContent =
            "Unable to load Chart 11: " + error.message;
    }
}

initChart11();
