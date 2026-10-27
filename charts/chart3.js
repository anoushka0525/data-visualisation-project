
/* ==========================================
   CHART 3: CHOROPLETH MAP
   Clothes Washer Diffusion
   Dataset: IEA
========================================== */

async function initChart3() {

    const container =
        document.getElementById("chart3");

    if (!container) return;

    try {

        const data = await getMapData(
            "Diffusion",
            "Clothes washers"
        );

        if (!data.length) {
            throw new Error("No diffusion data found.");
        }

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",
            height: 380,

            background: "transparent",

            projection: {
                type: "equalEarth"
            },

            data: {
                url: GEO_URL,
                format: {
                    type: "topojson",
                    feature: "countries"
                }
            },

            transform: [
                {
                    calculate: "toNumber(datum.id)",
                    as: "iso_num"
                },
                {
                    lookup: "iso_num",
                    from: {
                        data: {
                            values: data
                        },
                        key: "id",
                        fields: [
                            "country",
                            "year",
                            "value"
                        ]
                    }
                }
            ],

            mark: {
                type: "geoshape",
                stroke: "#ffffff",
                strokeWidth: 0.5
            },

            encoding: {

                color: {
                    condition: {
                        test: "isValid(datum.value)",
                        field: "value",
                        type: "quantitative",

                        scale: {
                            scheme: "blues",
                            domainMin: 0
                        },

                        legend: {
                            title: "Washers per dwelling",
                            orient: "bottom"
                        }
                    },

                    value: "#e8eef0"
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
                        title: "Washer Diffusion",
                        format: ".2f"
                    },
                    {
                        field: "year",
                        type: "quantitative",
                        title: "Reporting Year",
                        format: "d"
                    }
                ]
            },

            config: baseStyle
        };

        await vegaEmbed("#chart3", spec, {
            renderer: "svg",
            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 3 error:", error);

        container.textContent =
            "Unable to load Chart 3: " + error.message;
    }
}

initChart3();
