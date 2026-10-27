
/* ==========================================
   CHART 10: MEDIAN ANNUAL OPERATING COSTS
   Type: Lollipop Chart
   Dataset: WattWise Running Cost Index
========================================== */

async function initChart10() {

    const container =
        document.getElementById("chart10");

    if (!container) {
        console.error("Chart 10 container not found.");
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

        // Filter valid cost observations
        const data = rawData
            .filter(d =>
                d.category &&
                String(d.annual_cost_usd).trim() !== "" &&
                Number.isFinite(
                    Number(d.annual_cost_usd)
                ) &&
                Number(d.annual_cost_usd) >= 0
            )
            .map(d => ({
                category: String(d.category)
                    .trim()
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, c => c.toUpperCase()),

                annualCost: Number(d.annual_cost_usd)
            }));

        if (!data.length) {
            throw new Error(
                "No valid annual cost records found."
            );
        }

        // Group annual costs by category
        const groups = new Map();

        data.forEach(d => {

            if (!groups.has(d.category)) {
                groups.set(d.category, []);
            }

            groups.get(d.category).push(d.annualCost);
        });

        // Calculate exact median
        function calculateMedian(values) {

            const sorted = [...values].sort(
                (a, b) => a - b
            );

            const middle = Math.floor(
                sorted.length / 2
            );

            if (sorted.length % 2 === 0) {
                return (
                    sorted[middle - 1] +
                    sorted[middle]
                ) / 2;
            }

            return sorted[middle];
        }

        // Summarise each category
        const chartData = [];

        groups.forEach((costs, category) => {

            chartData.push({
                category: category,
                medianCost: calculateMedian(costs),
                modelCount: costs.length
            });

        });

        // Rank from highest to lowest median
        chartData.sort((a, b) =>
            b.medianCost - a.medianCost ||
            a.category.localeCompare(b.category)
        );

        const categoryOrder =
            chartData.map(d => d.category);

        const yEncoding = {
            field: "category",
            type: "nominal",
            title: null,
            sort: categoryOrder,

            axis: {
                labelFontSize: 12,
                labelLimit: 230,
                ticks: false,
                domain: false
            }
        };

        const xEncoding = {
            field: "medianCost",
            type: "quantitative",
            title: "Median Annual Electricity Cost (USD)",

            scale: {
                zero: true
            },

            axis: {
                grid: true,
                gridColor: "#e5e7eb",
                format: "$,.0f",
                tickCount: 6
            }
        };

        // Lollipop chart specification
        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: {
                step: 49
            },

            background: "transparent",

            data: {
                values: chartData
            },

            encoding: {
                y: yEncoding
            },

            layer: [

                // Lollipop stems
                {
                    mark: {
                        type: "rule",
                        color: "#9ac5c7",
                        strokeWidth: 3
                    },

                    encoding: {
                        x: xEncoding,

                        x2: {
                            datum: 0
                        }
                    }
                },

                // Lollipop dots
                {
                    mark: {
                        type: "circle",
                        color: "#167d83",
                        size: 230,
                        opacity: 0.95,
                        stroke: "#ffffff",
                        strokeWidth: 2
                    },

                    encoding: {

                        x: xEncoding,

                        tooltip: [
                            {
                                field: "category",
                                type: "nominal",
                                title: "Appliance"
                            },
                            {
                                field: "medianCost",
                                type: "quantitative",
                                title: "Median Annual Cost",
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
                },

                // Value labels
                {
                    mark: {
                        type: "text",
                        align: "left",
                        baseline: "middle",
                        dx: 13,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#167d83"
                    },

                    encoding: {

                        x: xEncoding,

                        text: {
                            field: "medianCost",
                            type: "quantitative",
                            format: "$,.0f"
                        }
                    }
                }
            ],

            padding: {
                left: 5,
                right: 65,
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
                    titleFontSize: 13,
                    titlePadding: 12
                }
            }
        };

        await vegaEmbed("#chart10", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 10 error:", error);

        container.textContent =
            "Unable to load Chart 10: " + error.message;
    }
}

initChart10();
