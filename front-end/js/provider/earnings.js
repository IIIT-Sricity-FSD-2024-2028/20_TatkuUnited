// Load Chart.js
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
script.onload = init;
document.head.appendChild(script);

const stats = [
  { label: 'Total Revenue', value: '₹1,42,800', sub: '+14.2% from last month', subClass: 'stat-change positive' },
  { label: 'Pending Payout', value: '₹12,450', sub: 'Next cycle: Apr 15, 2026', subClass: 'stat-sub' },
  { label: 'Next Payout Date', value: 'Apr 20, 2026', sub: 'Automatic Transfer Enabled', subClass: 'stat-blue' },
  { label: 'Average Job Value', value: '₹1,367', sub: 'Based on last 100 jobs', subClass: 'stat-sub' },
];

const payouts = [
  { date: 'Apr 08, 2026', ref: 'TXN-98421033', amount: '₹18,200', status: 'paid' },
  { date: 'Apr 01, 2026', ref: 'TXN-98320981', amount: '₹21,500', status: 'paid' },
  { date: 'Mar 25, 2026', ref: 'TXN-97889002', amount: '₹16,800', status: 'paid' },
  { date: 'Apr 15, 2026', ref: 'TXN-98512100', amount: '₹12,450', status: 'pending' },
];

// Chart data
const generate30Days = () => {
  const data = []; const labels = [];
  const baseDate = new Date('2026-03-12');
  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate); d.setDate(d.getDate() + i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    data.push(Math.floor(2500 + Math.random() * 6000));
  }
  return { labels, data };
};
const generate7Days = () => {
  const data = []; const labels = [];
  const baseDate = new Date('2026-04-04');
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate); d.setDate(d.getDate() + i);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    data.push(Math.floor(2000 + Math.random() * 8000));
  }
  return { labels, data };
};

let chartInstance = null;
let activeRange = 30;

function renderStats() {
  document.getElementById('stats-row').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="${s.subClass}">${s.sub}</div>
    </div>
  `).join('');
}

function renderPayouts() {
  document.getElementById('payout-tbody').innerHTML = payouts.map(p => `
    <tr>
      <td>${p.date}</td>
      <td class="ref-id">${p.ref}</td>
      <td class="amount-val">${p.amount}</td>
      <td><span class="${p.status === 'paid' ? 'badge-paid' : 'badge-pending-pay'}">${p.status === 'paid' ? 'PAID' : 'PENDING'}</span></td>
      <td>${p.status === 'paid' ? '<span class="receipt-link">Receipt</span>' : '—'}</td>
    </tr>
  `).join('');
}

function buildChart(range) {
  const { labels, data } = range === 7 ? generate7Days() : generate30Days();
  const ctx = document.getElementById('earn-chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(37,99,235,0.85)');
  gradient.addColorStop(1, 'rgba(37,99,235,0.35)');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: gradient,
        borderRadius: 5,
        borderSkipped: false,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' },
          callbacks: { label: ctx => ` ₹${ctx.raw.toLocaleString('en-IN')}` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { family: 'Sora', size: 10 },
            color: '#94a3b8',
            maxTicksLimit: range === 30 ? 6 : 7,
          }
        },
        y: {
          grid: { color: '#f1f5f9' },
          border: { display: false, dash: [4, 4] },
          ticks: {
            font: { family: 'JetBrains Mono', size: 10 },
            color: '#94a3b8',
            callback: v => `₹${(v/1000).toFixed(0)}k`
          }
        }
      }
    }
  });
}

function setRange(r) {
  activeRange = r;
  document.getElementById('btn-7').classList.toggle('active', r === 7);
  document.getElementById('btn-30').classList.toggle('active', r === 30);
  buildChart(r);
}

function init() {
  renderStats();
  renderPayouts();
  buildChart(30);
}
