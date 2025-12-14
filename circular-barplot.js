// Logical Dimensions
const totalWidthCirc = 800;
const totalHeightCirc = 800;
const marginCirc = { top: 100, right: 100, bottom: 100, left: 100 };
const widthCirc = totalWidthCirc - marginCirc.left - marginCirc.right;
const heightCirc = totalHeightCirc - marginCirc.top - marginCirc.bottom;

const svgCirc = d3.select("#circular-barplot")
  .append("svg")
    .attr("viewBox", `0 0 ${totalWidthCirc} ${totalHeightCirc}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", "800px")
    .style("margin", "0 auto")
    .style("display", "block")
  .append("g")
    .attr("transform", `translate(${totalWidthCirc / 2},${totalHeightCirc / 2})`);

const tooltipCirc = d3.select("body").append("div").attr("class", "tooltip");

// Helper to convert to title case
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

Promise.all([
  d3.csv("average-best.csv"),
  d3.csv("average-worst.csv"),
  d3.csv("average-ukraine.csv")
]).then(([bestData, worstData, ukraineData]) => {

  // Get median rows
  const bestMedian = bestData.find(d => d[""] === "MEDIAN");
  const worstMedian = worstData.find(d => d[""] === "MEDIAN");
  const ukraineMedian = ukraineData.find(d => d[""] === "MEDIAN");

  if (!bestMedian || !worstMedian || !ukraineMedian) {
    console.error("Could not find MEDIAN rows");
    return;
  }

  // Parameters to visualize
  const params = [
    { key: "HAPPINESS SCORE", label: "Happiness" },
    { key: "GDP PER CAPITA (Billions)", label: "GDP" },
    { key: "SOCIAL SUPPORT", label: "Social Support" },
    { key: "HEALTHY LIFE EXPECTANCY", label: "Healthy Life" },
    { key: "FREEDOM TO MAKE LIFE CHOICES", label: "Freedom" },
    { key: "GENEROSITY", label: "Generosity" },
    { key: "PERCEPTION OF CORRUPTION", label: "Corruption" }
  ];

  // Get min and max rows for normalization
  const bestMin = bestData.find(d => d[""] === "MIN");
  const bestMax = bestData.find(d => d[""] === "MAX");
  const worstMin = worstData.find(d => d[""] === "MIN");
  const worstMax = worstData.find(d => d[""] === "MAX");
  const ukraineMin = ukraineData.find(d => d[""] === "MIN");
  const ukraineMax = ukraineData.find(d => d[""] === "MAX");

  if (!bestMin || !bestMax || !worstMin || !worstMax || !ukraineMin || !ukraineMax) {
    console.error("Could not find MIN/MAX rows");
    return;
  }

  // Normalize function - same as linechart2.js
  const normalize = (value, min, max) => {
    const val = +value || 0;
    const minVal = +min || 0;
    const maxVal = +max || 1;
    return maxVal === minVal ? 0 : (val - minVal) / (maxVal - minVal);
  };

  // Build data array with proper normalization
  const data = params.map(p => {
    const bestVal = +bestMedian[p.key] || 0;
    const worstVal = +worstMedian[p.key] || 0;
    const ukraineVal = +ukraineMedian[p.key] || 0;
    
    const bestNorm = normalize(bestVal, bestMin[p.key], bestMax[p.key]);
    const worstNorm = normalize(worstVal, worstMin[p.key], worstMax[p.key]);
    const ukraineNorm = normalize(ukraineVal, ukraineMin[p.key], ukraineMax[p.key]);
    
    return {
      param: p.label,
      best: bestVal,
      worst: worstVal,
      ukraine: ukraineVal,
      bestNorm: bestNorm,
      worstNorm: worstNorm,
      ukraineNorm: ukraineNorm
    };
  });

  // Scales - use normalized values for plotting
  const x = d3.scaleBand()
    .domain(data.map(d => d.param))
    .range([0, 2 * Math.PI])
    .padding(0.15);

  const y = d3.scaleRadial()
    .domain([0, 1]) // Normalized range 0-1
    .range([80, Math.min(widthCirc, heightCirc) / 2]);

  // Colors
  const colors = {
    best: "#69b3a2",
    worst: "#d95f5f",
    ukraine: "#FFD700"
  };

  // Draw bars for each category - use normalized values
  ["best", "worst", "ukraine"].forEach((category, idx) => {
    const angleOffset = (idx - 1) * 0.05; // Slight offset for visibility
    const normKey = category + 'Norm';

    svgCirc.selectAll(`.bar-${category}`)
      .data(data)
      .join("path")
      .attr("class", `bar-${category}`)
      .attr("fill", colors[category])
      .attr("opacity", 0.8)
      .attr("d", d3.arc()
        .innerRadius(80)
        .outerRadius(d => y(d[normKey])) // Use normalized value
        .startAngle(d => x(d.param) + angleOffset)
        .endAngle(d => x(d.param) + x.bandwidth() + angleOffset)
        .padAngle(0.01)
        .padRadius(80))
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1);
        tooltipCirc.style("opacity", 1)
          .html(`
            <strong>${toTitleCase(category)}</strong><br>
            <strong>${d.param}</strong><br>
            <hr style="margin: 4px 0; border-color: #ddd;">
            Real Value: ${d[category].toFixed(3)}<br>
            Normalized: ${d[normKey].toFixed(3)}
          `);
      })
      .on("mousemove", function(event) {
        tooltipCirc.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function() {
        d3.select(this).attr("opacity", 0.8);
        tooltipCirc.style("opacity", 0);
      });
  });

  // Add labels
  svgCirc.selectAll(".label")
    .data(data)
    .join("g")
    .attr("class", "label")
    .attr("text-anchor", d => {
      const angle = (x(d.param) + x.bandwidth() / 2);
      return angle < Math.PI ? "start" : "end";
    })
    .attr("transform", d => {
      const angle = (x(d.param) + x.bandwidth() / 2) * 180 / Math.PI - 90;
      const radius = y(d3.max([d.best, d.worst, d.ukraine])) + 20;
      return `rotate(${angle}) translate(${radius},0)`;
    })
    .append("text")
    .text(d => d.param)
    .attr("transform", d => {
      const angle = (x(d.param) + x.bandwidth() / 2);
      return angle < Math.PI ? "rotate(0)" : "rotate(180)";
    })
    .style("font-size", "12px")
    .style("fill", "#555")
    .attr("alignment-baseline", "middle");

  // Add grid circles
  const ticks = y.ticks(5);
  svgCirc.selectAll(".grid-circle")
    .data(ticks)
    .join("circle")
    .attr("class", "grid-circle")
    .attr("r", d => y(d))
    .attr("fill", "none")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 0.5);

  // Add center circle
  svgCirc.append("circle")
    .attr("r", 80)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2);

  // Add value labels outside bars - show real values
  ["best", "worst", "ukraine"].forEach((category, idx) => {
    const angleOffset = (idx - 1) * 0.05;
    const colorForLabel = colors[category];
    const normKey = category + 'Norm';

    svgCirc.selectAll(`.label-${category}`)
      .data(data)
      .join("text")
      .attr("class", `label-${category}`)
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("transform", d => {
        const angle = (x(d.param) + x.bandwidth() / 2 + angleOffset) * 180 / Math.PI - 90;
        const maxNorm = Math.max(d.bestNorm, d.worstNorm, d.ukraineNorm);
        const radius = y(maxNorm) + 25 + (idx * 15); // Stack labels outside
        return `rotate(${angle}) translate(${radius},0) rotate(${angle < 0 || angle > 180 ? 180 : 0})`;
      })
      .style("font-size", "9px")
      .style("font-weight", "bold")
      .style("fill", colorForLabel)
      .style("pointer-events", "none")
      .text(d => d[category].toFixed(2)); // Show real value
  });
});