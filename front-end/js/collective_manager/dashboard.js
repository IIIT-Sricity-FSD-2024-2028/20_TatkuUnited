// Animate counters
document.querySelectorAll('.stat-value[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target);
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.round(current).toLocaleString();
  }, 16);
});

// Revenue chart
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const values = [32000, 27000, 35000, 38000, 36000, 40000, 42000, 39000, 44000, 43000, 48000, 46000];
const maxVal = 60000;

const barsEl = document.getElementById('revenueChart');
const xLabelsEl = document.getElementById('xLabels');

months.forEach((m, i) => {
  const pct = (values[i] / maxVal) * 100;
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.height = pct + '%';
  bar.style.animationDelay = (i * 0.05) + 's';
  const tip = document.createElement('div');
  tip.className = 'bar-tooltip';
  tip.textContent = '₦' + (values[i]/1000).toFixed(0) + 'k';
  bar.appendChild(tip);
  barsEl.appendChild(bar);

  const lbl = document.createElement('div');
  lbl.className = 'x-label';
  lbl.textContent = m;
  xLabelsEl.appendChild(lbl);
});
