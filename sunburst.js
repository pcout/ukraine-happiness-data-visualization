// Logical Dimensions
const totalWidthSun = 800;
const totalHeightSun = 800;
const radiusSun = Math.min(totalWidthSun, totalHeightSun) / 2;

const svgSun = d3.select("#sunburst-chart")
  .append("svg")
    .attr("viewBox", `0 0 ${totalWidthSun} ${totalHeightSun}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", "800px")
    .style("margin", "0 auto")
    .style("display", "block")
  .append("g")
    .attr("transform", `translate(${totalWidthSun / 2},${totalHeightSun / 2})`);

const tooltipSun = d3.select("body").append("div").attr("class", "tooltip");

// Color scale
const colorSun = d3.scaleOrdinal()
  .domain(["Best", "Worst", "Ukraine"])
  .range(["#69b3a2", "#d95f5f", "#FFD700"]);

// Info display in center
const centerInfo = svgSun.append("g").attr("class", "center-info");
centerInfo.append("text")
  .attr("class", "center-title")
  .attr("text-anchor", "middle")
  .attr("y", -10)
  .style("font-size", "18px")
  .style("font-weight", "bold")
  .style("fill", "#333");

centerInfo.append("text")
  .attr("class", "center-value")
  .attr("text-anchor", "middle")
  .attr("y", 15)
  .style("font-size", "24px")
  .style("font-weight", "bold")
  .style("fill", "#666");

Promise.all([
  d3.csv("bestranking.csv"),
  d3.csv("worstranking.csv"),
  d3.csv("dataset-ukrain.csv")
]).then(([best, worst, ukraine]) => {

  let currentRange = [2015, 2024];

  function updateSunburst(minYear, maxYear) {
    // Filter data
    const bestFiltered = best.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);
    const worstFiltered = worst.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);
    const ukraineFiltered = ukraine.filter(d => +d.YEAR >= minYear && +d.YEAR <= maxYear);

    // Group by year
    const groupByYear = (data, type) => {
      const years = {};
      data.forEach(d => {
        if (!years[d.YEAR]) years[d.YEAR] = [];
        years[d.YEAR].push({
          name: d.Country,
          value: +d["HAPPINESS SCORE"],
          year: d.YEAR,
          type: type
        });
      });
      return Object.keys(years).map(year => ({
        name: year,
        children: years[year]
      }));
    };

    // Build hierarchical structure
    const data = {
      name: "Happiness",
      children: [
        {
          name: "Best",
          children: groupByYear(bestFiltered, "Best")
        },
        {
          name: "Worst",
          children: groupByYear(worstFiltered, "Worst")
        },
        {
          name: "Ukraine",
          children: groupByYear(ukraineFiltered, "Ukraine")
        }
      ]
    };

    // Create partition layout
    const partition = d3.partition()
      .size([2 * Math.PI, radiusSun]);

    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);

    partition(root);

    // Arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radiusSun / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    // Clear previous
    svgSun.selectAll("path").remove();

    // Draw segments
    const path = svgSun.selectAll("path")
      .data(root.descendants().filter(d => d.depth > 0))
      .join("path")
      .attr("fill", d => {
        if (d.depth === 1) return colorSun(d.data.name);
        if (d.depth === 2) return d3.color(colorSun(d.parent.data.name)).brighter(0.3);
        return d3.color(colorSun(d.parent.parent.data.name)).brighter(0.6);
      })
      .attr("fill-opacity", d => d.depth === 3 ? 0.8 : 0.9)
      .attr("d", arc)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity", 1);
        
        // Update center info
        if (d.depth === 3) {
          centerInfo.select(".center-title").text(d.data.name);
          centerInfo.select(".center-value").text(d.data.value.toFixed(2));
        } else if (d.depth === 2) {
          centerInfo.select(".center-title").text(`Year ${d.data.name}`);
          centerInfo.select(".center-value").text("");
        } else {
          centerInfo.select(".center-title").text(d.data.name);
          centerInfo.select(".center-value").text("");
        }

        tooltipSun.style("opacity", 1)
          .html(`<strong>${d.data.name}</strong><br>Value: ${d.value.toFixed(2)}`);
      })
      .on("mousemove", function(event) {
        tooltipSun.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this).attr("fill-opacity", d.depth === 3 ? 0.8 : 0.9);
        centerInfo.select(".center-title").text("Hover to explore");
        centerInfo.select(".center-value").text("");
        tooltipSun.style("opacity", 0);
      });

    // Initialize center text
    centerInfo.select(".center-title").text("Hover to explore");
  }

  // Initial draw
  updateSunburst(2015, 2024);

  // Listen to slider
  document.addEventListener('yearRangeChanged', function(e) {
    currentRange = [e.detail.min, e.detail.max];
    updateSunburst(e.detail.min, e.detail.max);
  });
});