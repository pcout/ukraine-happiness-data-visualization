// Logical Dimensions
const totalWidthPack = 800;
const totalHeightPack = 800;
const marginPack = { top: 20, right: 20, bottom: 20, left: 20 };
const widthPack = totalWidthPack - marginPack.left - marginPack.right;
const heightPack = totalHeightPack - marginPack.top - marginPack.bottom;

const svgPack = d3.select("#circular-packing")
  .append("svg")
    .attr("viewBox", `0 0 ${totalWidthPack} ${totalHeightPack}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", "800px")
    .style("margin", "0 auto")
    .style("display", "block")
  .append("g")
    .attr("transform", `translate(${totalWidthPack / 2},${totalHeightPack / 2})`);

const tooltipPack = d3.select("body").append("div").attr("class", "tooltip");

// Color scale
const colorPack = d3.scaleOrdinal()
  .domain(["Best", "Worst", "Ukraine"])
  .range(["#69b3a2", "#d95f5f", "#FFD700"]);

Promise.all([
  d3.csv("bestranking.csv"),
  d3.csv("worstranking.csv"),
  d3.csv("dataset-ukrain.csv")
]).then(([best, worst, ukraine]) => {

  let currentRange = [2015, 2024];

  function updatePacking(minYear, maxYear) {
    // Filter data
    const bestFiltered = best.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);
    const worstFiltered = worst.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);
    const ukraineFiltered = ukraine.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);

    // Build hierarchical structure
    const data = {
      name: "root",
      children: [
        {
          name: "Best",
          children: bestFiltered.map(d => ({
            name: `${d.Country} (${d.YEAR})`,
            value: +d["HAPPINESS SCORE"] * 10,
            country: d.Country,
            year: d.YEAR,
            score: d["HAPPINESS SCORE"],
            type: "Best"
          }))
        },
        {
          name: "Worst",
          children: worstFiltered.map(d => ({
            name: `${d.Country} (${d.YEAR})`,
            value: +d["HAPPINESS SCORE"] * 10,
            country: d.Country,
            year: d.YEAR,
            score: d["HAPPINESS SCORE"],
            type: "Worst"
          }))
        },
        {
          name: "Ukraine",
          children: ukraineFiltered.map(d => ({
            name: `${d.Country} (${d.YEAR})`,
            value: +d["HAPPINESS SCORE"] * 10,
            country: d.Country,
            year: d.YEAR,
            score: d["HAPPINESS SCORE"],
            type: "Ukraine"
          }))
        }
      ]
    };

    // Create pack layout
    const pack = d3.pack()
      .size([widthPack, heightPack])
      .padding(3);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    pack(root);

    // Clear previous
    svgPack.selectAll("*").remove();

    // Draw circles
    const node = svgPack.selectAll("circle")
      .data(root.descendants().filter(d => d.depth > 0))
      .join("circle")
      .attr("cx", d => d.x - widthPack / 2)
      .attr("cy", d => d.y - heightPack / 2)
      .attr("r", 0)
      .attr("fill", d => d.depth === 1 ? colorPack(d.data.name) : d3.color(colorPack(d.data.type)).copy({opacity: 0.7}))
      .attr("stroke", d => d.depth === 1 ? "#fff" : colorPack(d.data.type))
      .attr("stroke-width", d => d.depth === 1 ? 3 : 1)
      .style("cursor", d => d.depth === 2 ? "pointer" : "default")
      .on("mouseover", function(event, d) {
        if (d.depth === 2) {
          d3.select(this).attr("stroke-width", 3);
          tooltipPack.style("opacity", 1)
            .html(`<strong>${d.data.country}</strong><br>Year: ${d.data.year}<br>Score: ${d.data.score}`);
        }
      })
      .on("mousemove", function(event) {
        tooltipPack.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function(event, d) {
        if (d.depth === 2) {
          d3.select(this).attr("stroke-width", 1);
        }
        tooltipPack.style("opacity", 0);
      });

    // Animate
    node.transition()
      .duration(800)
      .attr("r", d => d.r);

    // Add labels for parent circles
    svgPack.selectAll("text")
      .data(root.descendants().filter(d => d.depth === 1))
      .join("text")
      .attr("x", d => d.x - widthPack / 2)
      .attr("y", d => d.y - heightPack / 2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("pointer-events", "none")
      .text(d => d.data.name)
      .style("opacity", 0)
      .transition()
      .duration(800)
      .style("opacity", 1);
  }

  // Initial draw
  updatePacking(2015, 2024);

  // Listen to slider
  document.addEventListener('yearRangeChanged', function(e) {
    currentRange = [e.detail.min, e.detail.max];
    updatePacking(e.detail.min, e.detail.max);
  });
});