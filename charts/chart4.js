
/* ==========================================
   CHART 4: PROPORTIONAL SYMBOL MAP
   Installed Clothes Washer Stocks
   Dataset: IEA
========================================== */

async function initChart4() {

    const container =
        document.getElementById("chart4");

    if (!container) return;

    try {

        const data = await getMapData(
            "Stocks",
            "Clothes washers"
        );

        if (!data.length) {
            throw new Error("No stock data found.");
        }

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",
            height: 390,

            background: "transparent",

            projection: {
                type: "equalEarth"
            },

            layer: [

                // World map background
                baseMap,

                // Proportional circles
                {
                    data: {
                        values: data
                    },

                    mark: {
                        type: "circle",
                        color: "#0072B2",
                        opacity: 0.68,
                        stroke: "#132c3a",
                        strokeWidth: 0.6
                    },

                    encoding: {

                        longitude: {
                            field: "lon",
                            type: "quantitative"
                        },

                        latitude: {
                            field: "lat",
                            type: "quantitative"
                        },

                        size: {
                            field: "value",
                            type: "quantitative",

                            scale: {
                                type: "sqrt",
                                range: [45, 950]
                            },

                            legend: {
                                title: "Stock (millions)",
                                orient: "bottom"
                            }
                        },

                        tooltip: [
                            {
                                field: "country",
                                type: "nominal",
                                title: "Country"
                            },
                            {
                                field: "value",
                                type: "quantitative",
                                title: "Stock (millions)",
                                format: ",.2f"
                            },
                            {
                                field: "year",
                                type: "quantitative",
                                title: "Reporting Year",
                                format: "d"
                            }
                        ]
                    }
                }
            ],

            config: baseStyle
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

    } catch (error) {

        console.error("Chart 4 error:", error);

        container.textContent =
            "Unable to load Chart 4: " + error.message;
    }
}

initChart4();
