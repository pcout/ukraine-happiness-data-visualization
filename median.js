(function renderMedianSummary() {
  const target = document.getElementById('median-summary');
  if (!target) return;

  Promise.all([
    d3.csv('average/average-best.csv'),
    d3.csv('average/average-worst.csv'),
    d3.csv('average/ukraine_average.csv')
  ]).then(([bestRows, worstRows, ukraineRows]) => {
    const bestMedian = bestRows.find(r => (r[''] || '').toUpperCase() === 'MEDIAN');
    const worstMedian = worstRows.find(r => (r[''] || '').toUpperCase() === 'MEDIAN');
    const ukraineMedian = ukraineRows.find(r => (r[''] || '').toUpperCase() === 'MEDIAN');

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '20px';

    // Extract happiness score from each CSV
    const bestVal = bestMedian ? Number(bestMedian['HAPPINESS SCORE']) : null;
    const worstVal = worstMedian ? Number(worstMedian['HAPPINESS SCORE']) : null;
    const ukraineVal = ukraineMedian ? Number(ukraineMedian['HAPPINESS SCORE']) : null;

    const items = [
      { title: 'Best Country', val: bestVal },
      { title: 'Worst Country', val: worstVal },
      { title: 'Ukraine', val: ukraineVal }
    ];

    items.forEach(item => {
      const section = document.createElement('div');
      section.style.borderBottom = '1px solid #ccc';
      section.style.paddingBottom = '10px';

      const titleEl = document.createElement('h3');
      titleEl.textContent = item.title;
      titleEl.style.margin = '0 0 5px 0';

      const valueEl = document.createElement('p');
      valueEl.textContent = `Happiness Score: ${Number.isFinite(item.val) ? item.val.toFixed(2) : 'N/A'}`;
      valueEl.style.margin = '0';

      section.appendChild(titleEl);
      section.appendChild(valueEl);
      container.appendChild(section);
    });

    target.innerHTML = '';
    target.appendChild(container);
  }).catch(err => console.warn('Could not load median data', err));
})();
