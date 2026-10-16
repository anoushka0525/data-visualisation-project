
/* ==========================================
   HOME APPLIANCES WEBSITE
   VEGA-LITE CHART LOADER
========================================== */

async function loadChart(containerId, filePath) {
    try {
        await vegaEmbed(containerId, filePath, {
            actions: false,
            renderer: "svg",
            loader: {
                baseURL: window.location.href
            }
        });

        console.log(`${filePath} loaded successfully`);

    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);

        document.querySelector(containerId).textContent =
            "Unable to load this chart.";
    }
}

/* ==========================================
   CHART 1: APPLIANCE OWNERSHIP
========================================== */

loadChart("#chart1", "charts/chart1.json");
