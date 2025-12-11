import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = {top: 80, right: 30, bottom: 50, left:110},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#ridgeline_plot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left}, ${margin.top})`);

//read data
d3.csv("dataset-ukrain.csv").then(function(data) {

  // Parse data
  data.forEach(d => {
    d["HAPPINESS SCORE MIN-MAX NORMALIZATION"] = +d["HAPPINESS SCORE MIN-MAX NORMALIZATION"];
    d["GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION"] = +d["GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION"];
    d["SOCIAL SUPPORT MIN-MAX NORMALIZATION"] = +d["SOCIAL SUPPORT MIN-MAX NORMALIZATION"];
    d["HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION"] = +d["HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION"];
    d["FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION"] = +d["FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION"];
    d["GENEROSITY MIN-MAX NORMALIZATION"] = +d["GENEROSITY MIN-MAX NORMALIZATION"];
    d["PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION"] = +d["PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION"];
  });

  // Get the different categories and count them
  const categories = [
    "HAPPINESS SCORE MIN-MAX NORMALIZATION",
    "GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION",
    "SOCIAL SUPPORT MIN-MAX NORMALIZATION",
    "HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION",
    "FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION",
    "GENEROSITY MIN-MAX NORMALIZATION",
    "PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION"
  ]

  const categoryLabels = {
    "HAPPINESS SCORE MIN-MAX NORMALIZATION": "Happiness Score",
    "GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION": "GDP per Capita",
    "SOCIAL SUPPORT MIN-MAX NORMALIZATION": "Social Support",
    "HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION": "Healthy Life Expectancy",
    "FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION": "Freedom",
    "GENEROSITY MIN-MAX NORMALIZATION": "Generosity",
    "PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION": "Corruption"
  }

  const n = categories.length

  // Compute the mean of each group
  const allMeans = []
  for (let i in categories){
    const currentGroup = categories[i]
    const mean = d3.mean(data, function(d) { return +d[currentGroup] })
    allMeans.push(mean)
  }

  // Create a color scale using these means.
  const myColor = d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateViridis);

  // Add X axis
  const x = d3.scaleLinear()
    .domain([0, 1])
    .range([ 0, width ]);
  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickValues([0, 0.25, 0.5, 0.75, 1]).tickSize(-height) )
    .select(".domain").remove()

  // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + 40)
      .text("Normalized Value (0-1)");

  // Create a Y scale for densities
  const y = d3.scaleLinear()
    .domain([0, 1.4])
    .range([ height, 0]);

  // Create the Y axis for names
  const yName = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .paddingInner(0.4)
  svg.append("g")
    .call(d3.axisLeft(yName).tickSize(0).tickFormat(d => categoryLabels[d] || d))
    .select(".domain").remove()

  // Compute kernel density estimation for each column:
  const kde = kernelDensityEstimator(kernelEpanechnikov(0.12), x.ticks(80)) // adjust bandwidth for smoother, centered ridgelines.
  const allDensity = []
  for (let i = 0; i < n; i++) {
      const key = categories[i]
      const values = data.map(function(d){ return d[key]; }).filter(v => !isNaN(v));
      const density = kde(values);
      allDensity.push({key: key, density: density})
  }

  // Add areas
  svg.selectAll("areas")
    .data(allDensity)
    .join("path")
      .attr("transform", function(d){return(`translate(0, ${(yName(d.key)-height)})` )})
      .attr("fill", function(d){
        const grp = d.key ;
        const index = categories.indexOf(grp)
        const value = allMeans[index]
        return myColor( value  )
      })
      .datum(function(d){return(d.density)})
      .attr("opacity", 0.7)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.1)
      .attr("d",  d3.line()
          .curve(d3.curveBasis)
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y(d[1]); })
      )

})

// This is what I need to compute kernel density estimation
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}