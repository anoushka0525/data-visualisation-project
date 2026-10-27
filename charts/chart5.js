
/* 
   CHART 5: GEOGRAPHIC SPIKE MAP

   Refrigerator Household Penetration
   Dataset: IEA Household Appliances

   Taller spikes = higher ownership %
*/

async function initChart5() {

    const container = document.getElementById("chart5");

    if (!container) {
        console.error("Chart 5 container not found.");
        return;
    }

    try {

        // =====================================
        // 1. LOAD DATA
        // =====================================

        const rows = await getMapData(
            "Penetration",
            "Refrigerators"
        );

        if (!rows.length) {
            throw new Error(
                "No refrigerator penetration data found."
            );
        }

        // =====================================
        // 2. PREPARE SPIKE DATA
        // =====================================

        // Penetration is stored between 0 and 1.
        // Convert it to percentages.

        const data = rows
            .filter(d =>
                Number.isFinite(d.lat) &&
                Number.isFinite(d.lon) &&
                Number.isFinite(d.value) &&
                d.value >= 0 &&
                d.value <= 1
            )
            .map(d => ({

                country: d.country,

                lon: d.lon,

                lat: d.lat,

                year: d.year,

                percentage: d.value * 100,

                // End latitude for spike
                topLat: Math.min(
                    85,
                    d.lat + d.value * 14
                )

            }));

        if (!data.length) {
            throw new Error(
                "No valid geographic observations."
            );
        }

        // Create two geographic points per spike:
        // the base and the upper endpoint.

        const spikePoints = [];

        data.forEach(d => {

            spikePoints.push({
                country: d.country,
                lon: d.lon,
                lat: d.lat,
                order: 0,
                percentage: d.percentage,
                year: d.year
            });

            spikePoints.push({
                country: d.country,
                lon: d.lon,
                lat: d.topLat,
                order: 1,
                percentage: d.percentage,
                year: d.year
            });

        });

        // =====================================
        // 3. CREATE VEGA-LITE MAP
        // =====================================

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega-lite/v6.json",

            width: "container",

            height: 420,

            background: "transparent",

            projection: {
                type: "equalEarth"
            },

            layer: [

                // ---------------------------------
                // WORLD MAP BACKGROUND
                // ---------------------------------

                {
                    data: {
                        url: GEO_URL,
                        format: {
                            type: "topojson",
                            feature: "countries"
                        }
                    },

                    mark: {
                        type: "geoshape",
                        fill: "#e8eef0",
                        stroke: "#ffffff",
                        strokeWidth: 0.5
                    }
                },

                // ---------------------------------
                // GEOGRAPHIC SPIKES
                // ---------------------------------

                {
                    data: {
                        values: spikePoints
                    },

                    mark: {
                        type: "line",
                        color: "#D55E00",
                        strokeWidth: 3,
                        opacity: 0.9
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

                        detail: {
                            field: "country",
                            type: "nominal"
                        },

                        order: {
                            field: "order",
                            type: "quantitative"
                        },

                        tooltip: [
                            {
                                field: "country",
                                type: "nominal",
                                title: "Country"
                            },
                            {
                                field: "percentage",
                                type: "quantitative",
                                title: "Household Ownership (%)",
                                format: ".1f"
                            },
                            {
                                field: "year",
                                type: "quantitative",
                                title: "Reporting Year",
                                format: "d"
                            }
                        ]
                    }
                },

                // ---------------------------------
                // BASE LOCATION DOTS
                // ---------------------------------

                {
                    data: {
                        values: data
                    },

                    mark: {
                        type: "circle",
                        color: "#172c34",
                        size: 35,
                        opacity: 0.9
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

                        tooltip: [
                            {
                                field: "country",
                                type: "nominal",
                                title: "Country"
                            },
                            {
                                field: "percentage",
                                type: "quantitative",
                                title: "Household Ownership (%)",
                                format: ".1f"
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

            config: {

                view: {
                    stroke: null
                },

                axis: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans"
                },

                legend: {
                    labelFont: "DM Sans",
                    titleFont: "DM Sans"
                }
            }
        };

        // =====================================
        // 4. RENDER MAP
        // =====================================

        await vegaEmbed("#chart5", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 5 error:", error);

        container.textContent =
            "Unable to load Chart 5: " +
            error.message;
    }
}

initChart5();
