import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function createLineChart(width, height, margin, animation = true) {
    const parameters = [
        "HAPPINESS SCORE MIN-MAX NORMALIZATION",
        "GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION",
        "SOCIAL SUPPORT MIN-MAX NORMALIZATION",
        "HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION",
        "FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION",
        "GENEROSITY MIN-MAX NORMALIZATION",
        "PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION"
    ];

    const legendNames = {
        "HAPPINESS SCORE MIN-MAX NORMALIZATION": "Happiness",
        "GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION": "GDP",
        "SOCIAL SUPPORT MIN-MAX NORMALIZATION": "Social Support",
        "HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION": "Healthy Life",
        "FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION": "Freedom",
        "GENEROSITY MIN-MAX NORMALIZATION": "Generosity",
        "PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION": "Corruption"
    };

    const paramDescriptions = {
        "HAPPINESS SCORE": "Overall happiness score based on survey responses and statistical modeling.",
        "GDP PER CAPITA (Billions)": "GDP per capita in PPP-adjusted 2021 dollars.",
        "SOCIAL SUPPORT": "Share of population answering yes to having someone to rely on.",
        "HEALTHY LIFE EXPECTANCY": "Estimated healthy life expectancy at birth.",
        "FREEDOM TO MAKE LIFE CHOICES": "Perceived freedom to choose what to do with one's life.",
        "GENEROSITY": "Residual generosity score.",
        "PERCEPTION OF CORRUPTION": "Perceived corruption in government & business."
    };

    let svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 60) // extra para legenda
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px 12px")
        .style("border", "1px solid #aaa")
        .style("border-radius", "6px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const xOriginal = d3.scaleLinear().domain([2015, 2024]).range([0, width]);
    const x = xOriginal.copy();
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
    const color = d3.scaleOrdinal().domain(parameters).range(d3.schemeCategory10);

    svg.append("defs").append("clipPath")
        .attr("id", "line-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    const chartArea = svg.append("g")
        .attr("class", "chart-area")
        .attr("clip-path", "url(#line-clip)");

    // Eixos
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickFormat(''))
        .select(".domain").remove();

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", updateChart);

    const activeParams = {};
    const lines = [];
    const pointsGroups = [];
    let chartData = [];

    function cssSafe(str) {
        return str.replace(/\s+/g, "_").replace(/[()]/g, "_");
    }

    function toggleParameter(param) {
        activeParams[param] = !activeParams[param];
        const show = activeParams[param];

        d3.selectAll(`.line-${cssSafe(param)}`)
            .transition().duration(250)
            .attr("stroke-opacity", show ? 1 : 0.2);

        d3.selectAll(`.dots-${cssSafe(param)} circle`)
            .transition().duration(250)
            .attr("fill-opacity", show ? 1 : 0.2);

        d3.select(`#legend-${cssSafe(param)} text`).style("opacity", show ? 1 : 0.3);
        d3.select(`#legend-${cssSafe(param)} rect`).style("opacity", show ? 1 : 0.3);
    }

    function yearTicks() {
        const [d0, d1] = x.domain();
        const span = d1 - d0;
        const step = Math.max(1, Math.ceil(span / 8));
        const start = Math.floor(d0 / step) * step;
        const end = Math.ceil(d1 / step) * step;
        const ticks = [];
        for (let t = start; t <= end; t += step) {
            ticks.push(t);
        }
        return ticks;
    }

    function redraw(duration = 250) {
        lines.forEach(({ path, param }) => {
            path.transition().duration(duration)
                .attr("d", d3.line()
                    .x(d => x(d.YEAR))
                    .y(d => y(d[param]))(chartData));
        });

        pointsGroups.forEach(({ group, param }) => {
            group.selectAll("circle")
                .transition().duration(duration)
                .attr("cx", d => x(d.YEAR))
                .attr("cy", d => y(d[param]));
        });

        xAxis.transition().duration(duration)
            .call(d3.axisBottom(x)
                .tickValues(yearTicks())
                .tickFormat(d3.format("d"))
            );
    }

    function resetZoom() {
        x.domain(xOriginal.domain());
        redraw();
    }

    function updateChart(event) {
        const selection = event.selection;
        if (!selection) {
            // Ignore synthetic clear events; double-click resets separately.
            return;
        }

        const [x0, x1] = selection.map(xOriginal.invert);
        if (x0 === x1) {
            chartArea.select(".brush").call(brush.move, null);
            return;
        }

        const domain = xOriginal.domain();
        x.domain([
            Math.max(domain[0], x0),
            Math.min(domain[1], x1)
        ]);
        redraw();

        // Clear the brush without triggering a reset; ignore ensuing synthetic events.
        chartArea.select(".brush").call(brush.move, null);
    }

    d3.csv("dataset-ukrain.csv").then(data => {
        data.forEach(d => {
            d.YEAR = +d.YEAR;
            parameters.forEach(p => d[p] = +d[p]);
        });
        chartData = data;

        parameters.forEach((param, i) => {
            activeParams[param] = false;
            const safe = cssSafe(param);
            const raw = param.replace(" MIN-MAX NORMALIZATION", "");

            const dotGroup = chartArea.append("g").attr("class", `dots-${safe}`);
            dotGroup.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.YEAR))
                .attr("cy", d => y(d[param]))
                .attr("r", 5)
                .attr("fill", color(param))
                .attr("fill-opacity", 0.2)
                .style("cursor", "pointer")
                .on("click", () => toggleParameter(param))
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`<strong>${raw}</strong><br>Valor original: <strong>${d[raw]}</strong>`);
                })
                .on("mousemove", event => tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px"))
                .on("mouseout", () => tooltip.style("opacity", 0));

            const line = chartArea.append("path")
                .datum(data)
                .attr("class", `line-${safe}`)
                .attr("fill", "none")
                .attr("stroke", color(param))
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 0.2)
                .attr("d", d3.line()
                    .x(d => x(d.YEAR))
                    .y(d => y(d[param]))
                )
                .style("cursor", "pointer")
                .on("click", () => toggleParameter(param));

            lines.push({ path: line, param });
            pointsGroups.push({ group: dotGroup, param });
        });

        chartArea.append("g")
            .attr("class", "brush")
            .call(brush);

        svg.on("dblclick", resetZoom);

        // LEGENDA HORIZONTAL ABAIXO
        const legendContainer = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${height + 40})`); // 40 px abaixo do gráfico

        const legendSpacing = 120; // espaçamento horizontal

        parameters.forEach((param, i) => {
            const safe = cssSafe(param);
            const raw = param.replace(" MIN-MAX NORMALIZATION", "");

            const g = legendContainer.append("g")
                .attr("id", `legend-${safe}`)
                .attr("transform", `translate(${i * legendSpacing},0)`)
                .style("cursor", "pointer")
                .on("click", () => toggleParameter(param))
                .on("mouseover", event => {
                    tooltip.style("opacity", 1)
                        .html(`<strong>${raw}</strong><br><em>${paramDescriptions[raw] || "Sem descrição"}</em>`);
                })
                .on("mousemove", event => tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px"))
                .on("mouseout", () => tooltip.style("opacity", 0));

            g.append("rect")
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", color(param))
                .style("opacity", 0.3);

            g.append("text")
                .attr("x", 18)
                .attr("y", 10)
                .style("font-size", "12px")
                .style("opacity", 0.3)
                .text(legendNames[param]);
        });
    });
}

// CHAMADA
createLineChart(
    window.innerWidth - 240, // width
    300 - 10 - 30,           // height
    { top: 10, right: 120, bottom: 30, left: 120 },
    true
);
