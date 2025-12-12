import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export let fullRadarData = [];
export const radarColumns = [
    { norm:"HAPPINESS SCORE MIN-MAX NORMALIZATION", raw:"HAPPINESS SCORE", label:"Happiness" },
    { norm:"GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION", raw:"GDP PER CAPITA (Billions)", label:"GDP" },
    { norm:"SOCIAL SUPPORT MIN-MAX NORMALIZATION", raw:"SOCIAL SUPPORT", label:"Social Support" },
    { norm:"HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION", raw:"HEALTHY LIFE EXPECTANCY", label:"Healthy Life" },
    { norm:"FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION", raw:"FREEDOM TO MAKE LIFE CHOICES", label:"Freedom" },
    { norm:"GENEROSITY MIN-MAX NORMALIZATION", raw:"GENEROSITY", label:"Generosity" },
    { norm:"PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION", raw:"PERCEPTION OF CORRUPTION", label:"Corruption" }
];

// Year color scale with labels
export const yearColors = {
    2015: { color: "#1f77b4", label: "2015" },
    2016: { color: "#ff7f0e", label: "2016" },
    2017: { color: "#2ca02c", label: "2017" },
    2018: { color: "#d62728", label: "2018" },
    2019: { color: "#9467bd", label: "2019" },
    2020: { color: "#8c564b", label: "2020" },
    2021: { color: "#e377c2", label: "2021" },
    2022: { color: "#7f7f7f", label: "2022" },
    2023: { color: "#bcbd22", label: "2023" },
    2024: { color: "#17becf", label: "2024" }
};

export function getYearColor2(year) {
    return yearColors[year]?.color || "#999";
}

/* ========== FUNÇÃO RADAR ORIGINAL ========== */
export function RadarChart2({ data, container, columns, animate=false }) {
    const width = window.innerWidth/3;
    const height = width;
    const radius = width/3;
    const angleSlice = 2*Math.PI/columns.length;
    const rScale = d3.scaleLinear().domain([0,1]).range([0,radius]);

    // Tooltip
    let tooltip = d3.select(container+"Tooltip");
    if (tooltip.empty()) tooltip = d3.select("body")
        .append("div")
        .attr("id", container.replace("#","")+"Tooltip")
        .style("position","absolute")
        .style("background","white")
        .style("padding","6px 12px")
        .style("border","1px solid #aaa")
        .style("border-radius","6px")
        .style("pointer-events","none")
        .style("opacity",0)
        .style("max-width","260px");

    // SVG
    const svgC = d3.select(container);
    if (!animate) svgC.selectAll("*").remove();
    let svgEl = svgC.select("svg");
    if (svgEl.empty()) svgEl = svgC.append("svg").attr("width",width).attr("height",height);
    let svg = svgEl.select("g");
    if (svg.empty()) svg = svgEl.append("g").attr("transform",`translate(${width/2},${height/2})`);
    
    // Remove old paths and points when animating
    if (animate) {
        svg.selectAll(".radarPath").remove();
        svg.selectAll(".radarPointGroup").remove();
    }

    // GRID
    if (!animate) {
        for(let level=1;level<=5;level++)
            svg.append("circle").attr("r",(radius*level)/5)
                .attr("fill","#CDCDCD").attr("fill-opacity",0.1).attr("stroke","#CDCDCD");

        columns.forEach((c,i)=>{
            svg.append("line")
                .attr("x1",0).attr("y1",0)
                .attr("x2", rScale(1)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("y2", rScale(1)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("stroke","#777");

            svg.append("text")
                .attr("x", rScale(1.2)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("y", rScale(1.2)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("text-anchor","middle")
                .style("font-size","12px").style("fill","#444")
                .text(c.label);
        });
    }

    const radarLine = d3.lineRadial()
        .radius(d=>rScale(d.value))
        .angle((d,i)=>i*angleSlice)
        .curve(d3.curveCardinalClosed);

    // Use keyed data joins para permitir que séries sejam removidas
    const series = data.map((row,idx)=>({
        year: row.YEAR,
        values: columns.map(c=>({value:+row[c.norm], raw:+row[c.raw], label:c.label, year:row.YEAR})),
        gray: 0.4 + idx*0.4/data.length
    }));

    // Paths com keyed join
    const paths = svg.selectAll(".radarPath").data(series, d=>d.year);
    paths.exit().remove();
    paths.join(
        enter=>enter.append("path")
            .attr("class","radarPath")
            .attr("data-year",d=>d.year)
            .attr("stroke",d=>getYearColor2(d.year))
            .attr("fill",d=>{
                const color = d3.color(getYearColor2(d.year));
                color.opacity = 0.2;
                return color;
            })
            .attr("stroke-width",2)
            .attr("d",d=>radarLine(d.values)),
        update=>update
            .attr("stroke",d=>getYearColor(d.year))
            .attr("fill",d=>{
                const color = d3.color(getYearColor(d.year));
                color.opacity = 0.2;
                return color;
            })
            .attr("d",d=>radarLine(d.values))
    );

    // Points com keyed join
    const pointGroups = svg.selectAll(".radarPointGroup").data(series, d=>d.year);
    pointGroups.exit().remove();
    const mergedPoints = pointGroups.join(
        enter=>enter.append("g").attr("class","radarPointGroup").attr("data-year",d=>d.year),
        update=>update.attr("data-year",d=>d.year)
    );

    mergedPoints.each(function(seriesData){
        const pts = d3.select(this)
            .selectAll("circle")
            .data(seriesData.values.map(v=>({...v, year: seriesData.year})), d=>d.label);

        pts.exit().remove();
        pts.join(
            enter=>enter.append("circle")
                .attr("r",5)
                .attr("cx",(d,i)=>rScale(d.value)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("cy",(d,i)=>rScale(d.value)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("fill",d=>getYearColor2(d.year))
                .on("mouseover",(event,d)=>{
                    tooltip.style("opacity",1)
                        .html(`<strong>${d.label}</strong><br>Year: ${d.year}<br>Value: ${d.raw}`);
                })
                .on("mousemove",e=>tooltip.style("left",e.pageX+15+"px").style("top",e.pageY+15+"px"))
                .on("mouseout",()=>tooltip.style("opacity",0)),
            update=>update
                .attr("cx",(d,i)=>rScale(d.value)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("cy",(d,i)=>rScale(d.value)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("fill",d=>getYearColor(d.year))
        );
    });
}

/* ========== CARREGAR CSV ========== */
d3.csv("dataset-ukrain.csv").then(data=>{
    fullRadarData = data.map(d=>{
        radarColumns.forEach(c=>d[c.norm]=+d[c.norm]);
        radarColumns.forEach(c=>d[c.raw]=+d[c.raw]);
        d.YEAR=+d.YEAR;
        return d;
    });

    // Inicializar radar original (todos os parâmetros)
    RadarChart2({ data:fullRadarData, container:"#radarcolors", columns:radarColumns, animate:false });

});

// Atualiza todos os radares conforme o filtro de ano
function updateRadarsByYear2(yearValue) {
    if (!fullRadarData.length) return;
    let filtered = fullRadarData;
    
    if (yearValue && yearValue !== "2015-2024") {
        // Check if it's a range (e.g., "2016-2020")
        if (yearValue.includes("-")) {
            const [start, end] = yearValue.split("-").map(Number);
            filtered = fullRadarData.filter(d => d.YEAR >= start && d.YEAR <= end);
        } else {
            // Single year
            const yr = +yearValue;
            filtered = fullRadarData.filter(d => d.YEAR === yr);
        }
    }

    const animate = true;
    // Update radar with colors
    RadarChart2({ data: filtered, container: "#radarcolors", columns: radarColumns, animate });
}

// Listener para select de anos no index.html
const yearSelectEl = document.getElementById("yearSelect");
if (yearSelectEl) {
    yearSelectEl.addEventListener("change", (e) => {
        updateRadarsByYear2(e.target.value);
    });
}
