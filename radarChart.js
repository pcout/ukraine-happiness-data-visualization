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

/* ========== FUNÇÃO RADAR ORIGINAL ========== */
export function RadarChart({ data, container, columns, animate=false }) {
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

    data.forEach((row,idx)=>{
        const radarData = columns.map(c=>({value:+row[c.norm], raw:+row[c.raw], label:c.label, year:row.YEAR}));
        const gray = 0.4 + idx*0.4/data.length;
        const path = svg.selectAll(`.radar_${row.YEAR}`).data([radarData])
            .join("path")
            .attr("class",`radar_${row.YEAR}`)
            .attr("stroke",`rgba(50,50,50,${gray})`)
            .attr("fill",`rgba(100,100,100,${gray*0.4})`)
            .attr("stroke-width",2)
            .attr("d",radarLine);

        // Points
        svg.selectAll(`.pt_${row.YEAR}`).data(radarData)
            .join("circle")
            .attr("class",`pt_${row.YEAR}`)
            .attr("r",5)
            .attr("cx",(d,i)=>rScale(d.value)*Math.cos(i*angleSlice-Math.PI/2))
            .attr("cy",(d,i)=>rScale(d.value)*Math.sin(i*angleSlice-Math.PI/2))
            .attr("fill",`rgba(50,50,50,${gray})`)
            .on("mouseover",(event,d)=>{
                tooltip.style("opacity",1)
                    .html(`<strong>${d.label}</strong><br>Year: ${d.year}<br>Value: ${d.raw}`);
            })
            .on("mousemove",e=>tooltip.style("left",e.pageX+15+"px").style("top",e.pageY+15+"px"))
            .on("mouseout",()=>tooltip.style("opacity",0));
    });
}

/* ========== RADAR2 POR VARIÁVEL ========= */
function RadarVariable({ data, container, variableRaw, animate=false }) {
    const width = window.innerWidth/3;
    const height = width;
    const radius = width/3;
    const angleSlice = 2*Math.PI/data.length;
    const rScale = d3.scaleLinear().domain([0,1]).range([0,radius]);

    // Tooltip
    let tooltip = d3.select(container+"Tooltip");
    if (tooltip.empty()) tooltip = d3.select("body")
        .append("div")
        .attr("id",container.replace("#","")+"Tooltip")
        .style("position","absolute")
        .style("background","white")
        .style("padding","6px 12px")
        .style("border","1px solid #aaa")
        .style("border-radius","6px")
        .style("pointer-events","none")
        .style("opacity",0)
        .style("max-width","260px")
        .style("font-size","12px");

    const svgC = d3.select(container);
    if (!animate) svgC.selectAll("*").remove();
    let svgEl = svgC.select("svg");
    if (svgEl.empty()) svgEl = svgC.append("svg").attr("width",width).attr("height",height);
    let svg = svgEl.select("g");
    if (svg.empty()) svg = svgEl.append("g").attr("transform",`translate(${width/2},${height/2})`);

    // GRID
    if (!animate) {
        for(let level=1;level<=5;level++)
            svg.append("circle")
                .attr("r",(radius*level)/5)
                .attr("fill","#CDCDCD")
                .attr("fill-opacity",0.1)
                .attr("stroke","#CDCDCD");

        data.forEach((d,i)=>{
            svg.append("line")
                .attr("x1",0).attr("y1",0)
                .attr("x2",rScale(1)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("y2",rScale(1)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("stroke","#777");

            svg.append("text")
                .attr("x", rScale(1.2)*Math.cos(i*angleSlice-Math.PI/2))
                .attr("y", rScale(1.2)*Math.sin(i*angleSlice-Math.PI/2))
                .attr("text-anchor","middle")
                .style("font-size","12px")
                .style("fill","#444")
                .text(d.YEAR);
        });
    }

    const col = radarColumns.find(c=>c.raw===variableRaw);
    const radarData = data.map(d=>({
        value: +d[col.norm],
        raw: +d[col.raw],
        year: d.YEAR,
        label: col.label,
        desc: col.desc
    }));

    const radarLine = d3.lineRadial()
        .radius(d=>rScale(d.value))
        .angle((d,i)=>i*angleSlice)
        .curve(d3.curveCardinalClosed);

    // Linha
    svg.selectAll(".radarVarPath").data([radarData])
        .join("path")
        .transition().duration(animate?800:0)
        .attr("class","radarVarPath")
        .attr("d",radarLine)
        .attr("stroke","steelblue")
        .attr("stroke-width",2)
        .attr("fill","rgba(70,130,180,0.2)");

    // Pontos
    svg.selectAll(".radarVarPoint").data(radarData,d=>d.year)
        .join("circle")
        .transition().duration(animate?800:0)
        .attr("class","radarVarPoint")
        .attr("r",5)
        .attr("cx",(d,i)=>rScale(d.value)*Math.cos(i*angleSlice-Math.PI/2))
        .attr("cy",(d,i)=>rScale(d.value)*Math.sin(i*angleSlice-Math.PI/2))
        .attr("fill","steelblue")
        .on("mouseover",(event,d)=>{
            tooltip.style("opacity",1)
                .html(`
                    <strong>${d.label}</strong><br>
                    <strong>Year:</strong> ${d.year}<br>
                    <strong>Original:</strong> ${d.raw}<br>
                    <strong>Normalized:</strong> ${d.value.toFixed(3)}<br>
                    <em>${d.desc}</em>
                `);
        })
        .on("mousemove",e=>{
            tooltip.style("left",e.pageX+15+"px")
                   .style("top",e.pageY+15+"px");
        })
        .on("mouseout",()=>tooltip.style("opacity",0));
}


/* ========== CARREGAR CSV ========== */
d3.csv("dataset-ukrain.csv").then(data=>{
    fullRadarData = data.map(d=>{
        radarColumns.forEach(c=>d[c.norm]=+d[c.norm]);
        radarColumns.forEach(c=>d[c.raw]=+d[c.raw]);
        d.YEAR=+d.YEAR;
        return d;
    });

    // Inicializar radar1 (todos os parâmetros)
    RadarChart({ data:fullRadarData, container:"#radar", columns:radarColumns, animate:false });

    // Inicializar radar2 (Happiness score)
    RadarVariable({ data:fullRadarData, container:"#radar2", variableRaw:"HAPPINESS SCORE", animate:false });
});

/* ========== SELECT VARIÁVEL PARA RADAR2 ========= */
d3.select("#varSelect").on("change",function(){
    RadarVariable({ data:fullRadarData, container:"#radar2", variableRaw:this.value, animate:true });
});
