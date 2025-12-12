import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const metrics = [
  { label: "Happiness", key: "HAPPINESS SCORE MIN-MAX NORMALIZATION" },
  { label: "GDP per Capita", key: "GDP PER CAPITA (Billions) MIN-MAX NORMALIZATION" },
  { label: "Social Support", key: "SOCIAL SUPPORT MIN-MAX NORMALIZATION" },
  { label: "Healthy Life", key: "HEALTHY LIFE EXPECTANCY MIN-MAX NORMALIZATION" },
  { label: "Freedom", key: "FREEDOM TO MAKE LIFE CHOICES MIN-MAX NORMALIZATION" },
  { label: "Generosity", key: "GENEROSITY MIN-MAX NORMALIZATION" },
  { label: "Corruption", key: "PERCEPTION OF CORRUPTION MIN-MAX NORMALIZATION" }
];

const container = d3.select("#norm-population");
let dataByYear = new Map();
let valueSpans = new Map();

function parsePopulation(value) {
  if (value == null) return NaN;
  return parseInt(String(value).replace(/\./g, ""), 10);
}

function formatNumber(num) {
  const fmt = d3.format(",.0f");
  return fmt(num);
}

function buildLayout() {
  if (container.empty()) return;
  container.selectAll("*").remove();
  const list = container.append("div").attr("class", "norm-pop-list");
  metrics.forEach(m => {
    const row = list.append("div").attr("class", "norm-pop-row").style("margin","6px 0");
    const span = row.append("span").text("Select a year to see values.");
    valueSpans.set(m.key, span);
  });
}

function updateAll(yearValue) {
  if (container.empty()) return;
  if (!dataByYear.size) {
    container.text("Carregando estimativas...");
    return;
  }

    // Determine years to aggregate (single year or range)
    let years = [];
    if (yearValue && yearValue.includes("-")) {
      const [a,b] = yearValue.split("-").map(Number);
      const start = Math.min(a,b);
      const end = Math.max(a,b);
      years = Array.from(dataByYear.keys()).filter(y => y >= start && y <= end);
    } else if (yearValue) {
      years = [+yearValue];
    }

    // If nothing selected or no matching years, show prompt
    if (!years.length) {
      valueSpans.forEach(span => span.text("Selecione um ano."));
      return;
    }

    const records = years
      .map(y => dataByYear.get(y))
      .filter(rec => rec && !isNaN(rec.pop));

    if (!records.length) {
      valueSpans.forEach(span => span.text("Sem dados."));
      return;
    }

    metrics.forEach(m => {
      const span = valueSpans.get(m.key);
      if (!span) return;

      const estimates = records
        .map(rec => {
          const norm = rec[m.key];
          if (isNaN(norm)) return NaN;
          return norm * rec.pop;
        })
        .filter(v => !isNaN(v));

      if (!estimates.length) {
        span.text("Sem dados.");
        return;
      }

      const avg = d3.mean(estimates);
      span.text(`approximately ${formatNumber(avg)} Ukrainian citizens perceived ${m.label}`);
    });
}

if (!container.empty()) {
  buildLayout();
  d3.csv("dataset-ukrain.csv").then(data => {
    dataByYear = new Map(
      data.map(d => {
        const entry = { pop: parsePopulation(d.POPULATION) };
        metrics.forEach(m => entry[m.key] = +d[m.key]);
        return [+d.YEAR, entry];
      })
    );

    const selectEl = document.getElementById("yearSelect");
    const initialYear = selectEl ? selectEl.value : "2015-2024";
    updateAll(initialYear);

    if (selectEl) {
      selectEl.addEventListener("change", e => updateAll(e.target.value));
    }
  }).catch(() => {
    container.text("Não foi possível carregar os dados.");
  });
}
