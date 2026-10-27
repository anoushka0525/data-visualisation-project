
/*
   CHART 8: STOCK DISTRIBUTION SANKEY
   IEA Household Appliances - 2022

   Bands show quantities by appliance and
   country, NOT physical flows.
   */

async function initChart8() {

    const target = document.getElementById("chart8");
    if (!target) return;

    try {

        // 1. LOAD IEA DATA
        const csv = await vega.loader().load(
            "data/iea_appliances.csv"
        );

        const raw = vega.read(csv, {
            type: "csv"
        });

        const year = 2022;

        const rows = raw.filter(d =>
            String(d.metric).trim().toLowerCase() === "stocks" &&
            Number(d.year) === year &&
            d.country &&
            d.appliance &&
            String(d.value).trim() !== "" &&
            Number.isFinite(Number(d.value)) &&
            Number(d.value) > 0
        ).map(d => ({
            country: String(d.country).trim(),
            appliance: String(d.appliance).trim(),
            value: Number(d.value)
        }));

        if (!rows.length) {
            throw new Error("No valid stock data for 2022.");
        }

        // 2. CHOOSE SIX COUNTRIES
        // Ranked by their reported stock totals.

        const countryTotals = new Map();

        rows.forEach(d => {
            countryTotals.set(
                d.country,
                (countryTotals.get(d.country) || 0) + d.value
            );
        });

        const countries = [...countryTotals.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(d => d[0]);

        const selectedRows = rows.filter(d =>
            countries.includes(d.country)
        );

        // 3. SUM STOCKS BY APPLIANCE

        const applianceTotals = new Map();

        selectedRows.forEach(d => {
            applianceTotals.set(
                d.appliance,
                (applianceTotals.get(d.appliance) || 0) + d.value
            );
        });

        const appliances = [...applianceTotals.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(d => d[0]);

        const total = selectedRows.reduce(
            (sum, d) => sum + d.value, 0
        );

        if (total <= 0) {
            throw new Error("No positive stocks to plot.");
        }

        // 4. LAYOUT AND ACCESSIBLE COLOURS

        const W = Math.max(
            650,
            Math.min(target.clientWidth || 880, 1100)
        );

        const H = 540;
        const top = 26;
        const bottom = 470;

        const leftX = 205;
        const rightX = W - 180;
        const nodeW = 12;
        const gap = 8;

        const countMax = Math.max(
            appliances.length,
            countries.length
        );

        const scale = (
            bottom - top - (countMax - 1) * gap
        ) / total;

        const colours = [
            "#0072B2",
            "#E69F00",
            "#CC79A7",
            "#56B4E9",
            "#009E73",
            "#D55E00",
            "#555555",
            "#332288",
            "#999933"
        ];

        const categories = new Map(
            appliances.map((a, i) => [
                a,
                colours[i % colours.length]
            ])
        );

        // 5. CREATE APPLIANCE AND COUNTRY NODES

        const leftNodes = new Map();
        const rightNodes = new Map();

        let cursor = top;

        appliances.forEach(a => {
            const amount = applianceTotals.get(a);
            const height = amount * scale;

            leftNodes.set(a, {
                name: a,
                x: leftX,
                y: cursor,
                height,
                total: amount,
                offset: 0,
                colour: categories.get(a),
                side: "left"
            });

            cursor += height + gap;
        });

        cursor = top;

        countries.forEach(c => {

            const amount = selectedRows
                .filter(d => d.country === c)
                .reduce((sum, d) => sum + d.value, 0);

            const height = amount * scale;

            rightNodes.set(c, {
                name: c,
                x: rightX,
                y: cursor,
                height,
                total: amount,
                offset: 0,
                colour: "#607E88",
                side: "right"
            });

            cursor += height + gap;
        });

        // 6. CREATE CONNECTING BANDS

        const links = [];

        appliances.forEach(a => {
            countries.forEach(c => {

                const value = selectedRows
                    .filter(d =>
                        d.appliance === a &&
                        d.country === c
                    )
                    .reduce((sum, d) => sum + d.value, 0);

                if (value <= 0) return;

                const s = leftNodes.get(a);
                const t = rightNodes.get(c);

                const h = value * scale;

                const x0 = leftX + nodeW;
                const x1 = rightX;
                const dx = (x1 - x0) * 0.48;

                const y0 = s.y + s.offset;
                const y1 = t.y + t.offset;

                // Curved ribbon
                const path =
                    `M${x0},${y0} ` +
                    `C${x0 + dx},${y0} ` +
                    `${x1 - dx},${y1} ${x1},${y1} ` +
                    `L${x1},${y1 + h} ` +
                    `C${x1 - dx},${y1 + h} ` +
                    `${x0 + dx},${y0 + h} ` +
                    `${x0},${y0 + h} Z`;

                links.push({
                    source: a,
                    target: c,
                    value,
                    path,
                    colour: categories.get(a),
                    tooltip:
                        `${a} → ${c}: ` +
                        `${value.toFixed(2)} million units (2022)`
                });

                s.offset += h;
                t.offset += h;
            });
        });

        // 7. PREPARE NODE LABELS

        const nodes = [
            ...leftNodes.values(),
            ...rightNodes.values()
        ].map(n => ({
            ...n,

            labelX: n.side === "left"
                ? n.x - 8
                : n.x + nodeW + 8,

            align: n.side === "left"
                ? "right"
                : "left",

            tooltip:
                `${n.name}: ` +
                `${n.total.toFixed(2)} million units (2022)`
        }));

        // 8. VEGA SPECIFICATION

        const spec = {

            "$schema":
                "https://vega.github.io/schema/vega/v6.json",

            width: W,
            height: H,
            padding: 0,

            background: "transparent",

            data: [
                {
                    name: "links",
                    values: links
                },
                {
                    name: "nodes",
                    values: nodes
                }
            ],

            marks: [

                // Sankey ribbons
                {
                    type: "path",

                    from: {
                        data: "links"
                    },

                    encode: {
                        enter: {
                            path: {
                                field: "path"
                            },

                            fill: {
                                field: "colour"
                            },

                            fillOpacity: {
                                value: 0.48
                            },

                            stroke: {
                                value: "#ffffff"
                            },

                            strokeWidth: {
                                value: 0.25
                            },

                            tooltip: {
                                field: "tooltip"
                            }
                        },

                        hover: {
                            fillOpacity: {
                                value: 0.84
                            }
                        }
                    }
                },

                // Appliance and country nodes
                {
                    type: "rect",

                    from: {
                        data: "nodes"
                    },

                    encode: {
                        enter: {
                            x: { field: "x" },
                            y: { field: "y" },

                            width: { value: nodeW },
                            height: { field: "height" },

                            fill: { field: "colour" },

                            tooltip: {
                                field: "tooltip"
                            }
                        }
                    }
                },

                // Node labels
                {
                    type: "text",

                    from: {
                        data: "nodes"
                    },

                    encode: {
                        enter: {
                            x: { field: "labelX" },

                            y: {
                                signal:
                                    "datum.y + datum.height / 2"
                            },

                            text: { field: "name" },

                            align: { field: "align" },

                            baseline: {
                                value: "middle"
                            },

                            font: {
                                value: "DM Sans"
                            },

                            fontSize: {
                                value: 11
                            },

                            fill: {
                                value: "#243740"
                            },

                            tooltip: {
                                field: "tooltip"
                            }
                        }
                    }
                },

                // Left column heading
                {
                    type: "text",

                    encode: {
                        enter: {
                            x: { value: leftX },
                            y: { value: 10 },

                            text: {
                                value: "APPLIANCE CATEGORIES"
                            },

                            align: {
                                value: "center"
                            },

                            fontSize: {
                                value: 12
                            },

                            fontWeight: {
                                value: "bold"
                            },

                            fill: {
                                value: "#52636b"
                            }
                        }
                    }
                },

                // Right column heading
                {
                    type: "text",

                    encode: {
                        enter: {
                            x: { value: rightX },
                            y: { value: 10 },

                            text: {
                                value: "COUNTRIES"
                            },

                            align: {
                                value: "center"
                            },

                            fontSize: {
                                value: 12
                            },

                            fontWeight: {
                                value: "bold"
                            },

                            fill: {
                                value: "#52636b"
                            }
                        }
                    }
                }
            ]
        };

        // 9. RENDER SANKEY DIAGRAM

        await vegaEmbed("#chart8", spec, {

            renderer: "svg",

            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

    } catch (error) {

        console.error("Chart 8 error:", error);

        target.textContent =
            "Unable to load Chart 8: " + error.message;
    }
}

initChart8();
