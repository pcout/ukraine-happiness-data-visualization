import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

var margin = {top: 100, right: 30, bottom: 100, left: 60},
    width = window.innerWidth - margin.left - margin.right - 40,
    height = window.innerHeight - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#area_chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Tooltip for hover
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "rgba(255,255,255,0.95)")
  .style("padding", "8px 12px")
  .style("border", "1px solid #999")
  .style("border-radius", "6px")
  .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("font-size", "12px");

// Long-form descriptions per year
const yearDescriptions = {
  2015: "Conflict escalation in Eastern Ukraine continues; the economy contracts and consumer confidence falls. International aid discussions intensify while households report rising uncertainty over livelihoods; migration pressures increase as safety concerns grow.",
  2016: "Fragile recovery attempts begin with limited reforms; currency stabilizes slightly but real incomes remain low. Communities adapt through local support networks; humanitarian organizations expand presence; trust in institutions remains weak.",
  2017: "Incremental improvements in service delivery occur; modest infrastructure repairs start. Civil society initiatives spread wellbeing programs; some displaced families return cautiously; optimism grows slowly but remains uneven.",
  2018: "Economic indicators show modest gains; social support networks strengthen in urban centers. Mental health initiatives gain traction; civic engagement rises; corruption perceptions persist, tempering overall confidence.",
  2019: "Pre-war baseline year with relatively higher stability and slight optimism. Public discourse focuses on reforms; cross-border tensions remain but daily life normalizes; social cohesion feels stronger in many regions.",
  2020: "Pandemic shocks the economy; mobility restrictions intensify stress. Remote support and digital services expand; healthcare strain rises; communities rely more on mutual aid amid uncertainty.",
  2021: "Partial recovery from pandemic; vaccination campaigns ramp up. Economic activity improves, but inflation pressures households; resilience programs scale; focus on preparedness and social safety nets increases.",
  2022: "Full-scale invasion triggers sharp declines in wellbeing; displacement surges. Emergency relief dominates; global support intensifies; daily routines disrupted; uncertainty and safety dominate perceptions.",
  2023: "Adaptation under conflict conditions; humanitarian corridors and services stabilize somewhat. Reconstruction pilots start; community-led support deepens; people balance vigilance with cautious hope for recovery.",
  2024: "Ongoing conflict backdrop with gradual reconstruction in some areas. International assistance continues; local recovery projects expand; focus on mental health and livelihoods grows amid persistent security concerns."
};

// Read the data (D3 v7 promise API)
d3.csv(
  "dataset-ukrain.csv",
  d => ({ 
    year: +d.YEAR, 
    happiness: +d["HAPPINESS SCORE MIN-MAX NORMALIZATION"]
  })
).then(function(data) {

    // Add X axis --> years
    const xExtent = d3.extent(data, function(d) { return d.year; });
    var x = d3.scaleLinear()
      .domain(xExtent)
      .range([ 0, width ]);
    const xAxis = svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis (0-1, no visible ticks/labels per user request)
    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([ height, 0 ]);
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).tickSize(0).tickFormat(""))
      .select(".domain").remove();

    // Add a clipPath: everything out of this area won't be drawn.
    const defs = svg.append("defs");
    
    defs.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    function computeWidths(scale) {
      return data.map((d, i) => {
        const fallback = i > 0 ? scale(d.year) - scale(data[i - 1].year) : (data.length > 1 ? scale(data[1].year) - scale(d.year) : width);
        const segmentWidth = i < data.length - 1 ? scale(data[i + 1].year) - scale(d.year) : fallback;
        return Math.max(1, segmentWidth);
      });
    }

    const patternWidths = computeWidths(x);

    // Create image patterns for each year
    data.forEach((d, i) => {
      defs.append("pattern")
        .attr("id", `yearPattern${d.year}`)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", patternWidths[i])
        .attr("height", height)
        .attr("x", x(d.year))
        .append("image")
        .attr("xlink:href", `assets/${d.year}.png`)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", patternWidths[i])
        .attr("height", height)
        .attr("preserveAspectRatio", "none");
    });

    // Add brushing
    var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
      .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the area variable: where both the area and the brush take place
    var area = svg.append('g')
      .attr("clip-path", "url(#clip)")

    // Create an area generator
    var areaGenerator = d3.area()
      .x(function(d) { return x(d.year) })
      .y0(y(0))
      .y1(function(d) { return y(d.happiness) })

    // Add background images (low opacity) for each year segment
    for (let i = 0; i < data.length - 1; i++) {
      const segmentData = [data[i], data[i + 1]];
      
      const patternYear = (i === data.length - 2) ? data[i + 1].year : data[i].year;

      // Background rect with low opacity image
      area.append("rect")
        .attr("class", `bgImage year${patternYear}`)
        .attr("x", x(data[i].year))
        .attr("y", 0)
        .attr("width", x(data[i + 1].year) - x(data[i].year))
        .attr("height", height)
        .attr("fill", `url(#yearPattern${patternYear})`)
        .attr("opacity", 0.3);
      
      // Foreground area with full opacity image
      area.append("path")
        .datum(segmentData)
        .attr("class", `myArea year${patternYear}`)
        .attr("fill", `url(#yearPattern${patternYear})`)
        .attr("fill-opacity", 1)
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .attr("d", areaGenerator);
    }

    // Add the brushing
    area
      .append("g")
        .attr("class", "brush")
        .call(brush);

    // Hover handling on the brush overlay (so brushing and hover can coexist)
    const bisect = d3.bisector(d => d.year).left;
    const overlay = area.select(".brush").select(".overlay");

    function highlightYear(idx, duration = 150) {
      const year = data[idx].year;
      const val = data[idx].happiness;

      area.selectAll('.myArea').transition().duration(duration).style("opacity", 0.25);
      area.selectAll('.bgImage').transition().duration(duration).style("opacity", 0.1);

      area.select(`.myArea.year${year}`).transition().duration(duration).style("opacity", 1);
      area.select(`.bgImage.year${year}`).transition().duration(duration).style("opacity", 0.5);

      return { year, val };
    }

    function clearHighlight(duration = 150) {
      area.selectAll('.myArea').transition().duration(duration).style("opacity", 1);
      area.selectAll('.bgImage').transition().duration(duration).style("opacity", 0.3);
      tooltip.style("opacity", 0);
    }

    function handleHover(event) {
      const [mx] = d3.pointer(event, this);
      const xVal = x.invert(mx);
      const idxRaw = bisect(data, xVal) - 1;
      const idx = Math.max(0, Math.min(data.length - 2, idxRaw));
      const { year, val } = highlightYear(idx);

      tooltip.style("opacity", 1)
        .html(tooltipHtml(year, val))
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY + 12) + "px");
    }

    overlay
      .style("cursor", "crosshair")
      .on("mousemove.tooltip", handleHover)
      .on("mouseover.tooltip", handleHover)
      .on("mouseout.tooltip", () => clearHighlight());

    function tooltipHtml(year, val) {
      const desc = yearDescriptions[year] || "";
      return `<strong>${year}</strong><br>Happiness (norm): ${val.toFixed(2)}<br><em>Normalized happiness score (0–1)</em><br><br>${desc}`;
    }

    const dataYears = data.map(d => d.year);

    function visibleYears(domain) {
      const [d0, d1] = domain;
      const within = dataYears.filter(y => y >= d0 && y <= d1);
      if (within.length) return within;
      return [Math.round(d0), Math.round(d1)];
    }

    function redraw(duration = 600) {
      const ticks = visibleYears(x.domain());
      xAxis.transition().duration(duration).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("d")));
      
      // Update background rectangles
      area.selectAll('.bgImage').each(function(d, i) {
        const yearIdx = Math.floor(i);
        if (yearIdx < data.length - 1) {
          d3.select(this)
            .transition()
            .duration(duration)
            .attr("x", x(data[yearIdx].year))
            .attr("width", x(data[yearIdx + 1].year) - x(data[yearIdx].year));
        }
      });
      
      // Update area paths
      area.selectAll('.myArea')
        .transition()
        .duration(duration)
        .attr("d", areaGenerator);
    }

    // A function that updates the chart for given boundaries
    function updateChart(event) {

      // What are the selected boundaries?
      const extent = event.selection;

      // Ignore programmatic clears (sourceEvent null) to keep zoom after brush end
      if (!extent) {
        if (!event.sourceEvent) return;
        x.domain(xExtent);
        redraw();
        return;
      }

      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ]);
      redraw();

      // Remove the grey brush area without firing another reset
      area.select(".brush").call(brush.move, null);
    }

    function resetZoom(duration = 300) {
      x.domain(xExtent);
      redraw(duration);
      area.select(".brush").call(brush.move, null);
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
      resetZoom(300);
    });

    const resetBtn = document.getElementById("resetAreaZoom");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => resetZoom(150));
    }

}).catch(function(error) {
  console.error("Failed to load area chart data", error);
});