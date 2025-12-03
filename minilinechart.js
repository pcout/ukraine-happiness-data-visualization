export function createMiniLineChart(width, height, margin, data, activeParams) {
    const parameters = Object.keys(activeParams).filter(p => activeParams[p]); // apenas ativos

    const x = d3.scaleLinear().domain([2015, 2024]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
    const color = d3.scaleOrdinal().domain(parameters).range(d3.schemeCategory10);

    // Seleciona nav
    d3.select("nav").selectAll("*").remove(); // limpa se já houver mini chart

    const svg = d3.select("nav")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Eixo X simples
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")))
        .select(".domain").remove();

    // Eixo Y escondido
    svg.append("g").call(d3.axisLeft(y).ticks(0).tickSize(0)).select(".domain").remove();

    // Desenha linhas ativas
    parameters.forEach(param => {
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color(param))
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.8)
            .attr("d", d3.line()
                .x(d => x(d.YEAR))
                .y(d => y(d[param]))
            );
    });
}
