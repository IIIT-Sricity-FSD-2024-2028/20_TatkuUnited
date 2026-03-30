// Load Chart.js
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
script.onload = init;
document.head.appendChild(script);

let chartInstance = null;
let activeRange = 30;
let userJobs = [];

function renderStats() {
  let totalRevenue = 0;
  let pendingPayout = 0;
  let completedCount = 0;

  userJobs.forEach(job => {
    if (job.status === 'completed') {
      totalRevenue += job.price || 0;
      completedCount++;
    } else if (job.status === 'inprogress' || job.status === 'assigned' || job.status === 'pending') {
      pendingPayout += job.price || 0;
    }
  });

  const avgValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  const dynamicStats = [
    { label: 'Total Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN'), sub: 'Lifetime earnings', subClass: 'stat-change positive' },
    { label: 'Pending Payout', value: '₹' + pendingPayout.toLocaleString('en-IN'), sub: 'Jobs in progress', subClass: 'stat-sub' },
    { label: 'Completed Jobs', value: completedCount.toString(), sub: 'Total successful jobs', subClass: 'stat-blue' },
    { label: 'Average Job Value', value: '₹' + avgValue.toLocaleString('en-IN'), sub: 'Based on completed jobs', subClass: 'stat-sub' },
  ];

  document.getElementById('stats-row').innerHTML = dynamicStats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="${s.subClass}">${s.sub}</div>
    </div>
  `).join('');
}

function renderPayouts() {
  const dynamicPayouts = userJobs.map(job => {
    const isPaid = job.status === 'completed';
    // Format date properly
    let fDate = 'TBD';
    if (job.date) {
      const d = new Date(job.date);
      if (!isNaN(d)) fDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    
    return {
      date: fDate,
      ref: job.id,
      amount: '₹' + (job.price || 0).toLocaleString('en-IN'),
      status: isPaid ? 'paid' : 'pending'
    };
  });

  document.getElementById('payout-tbody').innerHTML = dynamicPayouts.map(p => `
    <tr>
      <td>${p.date}</td>
      <td class="ref-id">${p.ref}</td>
      <td class="amount-val">${p.amount}</td>
      <td><span class="${p.status === 'paid' ? 'badge-paid' : 'badge-pending-pay'}">${p.status === 'paid' ? 'PAID' : 'PENDING'}</span></td>
      <td>${p.status === 'paid' ? `<span class="receipt-link" onclick="showReceipt('${p.ref}')" style="cursor: pointer; color: #2563eb; text-decoration: underline; font-weight: 500;">Receipt</span>` : '—'}</td>
    </tr>
  `).join('');
}

function showReceipt(refId) {
  const job = userJobs.find(j => j.id === refId);
  if (!job) return;

  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Ref #</span>
      <span style="font-weight: 600; color: #0f172a;">${job.id}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Date</span>
      <span style="color: #0f172a;">${new Date(job.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Customer</span>
      <span style="color: #0f172a;">${job.customer}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
      <span style="color: #64748b;">Service</span>
      <span style="color: #0f172a;">${job.service.substring(0, 20)}${job.service.length > 20 ? '...' : ''}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
      <span style="color: #0f172a;">Total Payout</span>
      <span style="color: #10b981;">₹${(job.price || 0).toLocaleString('en-IN')}</span>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; font-family: 'Sora', sans-serif;">
      Payout deposited to registered bank account.<br>ID: TXN-${Math.floor(Math.random() * 900000) + 100000}
    </div>
  `;
  document.getElementById('receipt-details').innerHTML = content;
  const modal = document.getElementById('receipt-modal');
  modal.style.display = 'flex';
  // Fade in animation
  modal.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
}

function closeReceipt() {
  const modal = document.getElementById('receipt-modal');
  const anim = modal.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
  anim.onfinish = () => modal.style.display = 'none';
}

function downloadReceipt() {
  const detailsNode = document.getElementById('receipt-details');
  if (!detailsNode) return;
  
  const rawLines = detailsNode.innerText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let formattedText = "===================================\n";
  formattedText += "           TATKU UNITED            \n";
  formattedText += "      PROVIDER PAYOUT RECEIPT      \n";
  formattedText += "===================================\n\n";
  
  // Format the key-value pairs nicely
  rawLines.forEach((line, index) => {
    formattedText += line + "\n";
  });
  
  formattedText += "\n===================================\n";
  formattedText += "   Powered by Tatku United Inc.    \n";

  const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tatku_Payout_Receipt_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Chart data
const generate30Days = () => {
  const data = []; const labels = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);
  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate); d.setDate(d.getDate() + i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    data.push(Math.floor(2500 + Math.random() * 6000));
  }
  return { labels, data };
};

const generate7Days = () => {
  const data = []; const labels = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate); d.setDate(d.getDate() + i);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    data.push(Math.floor(2000 + Math.random() * 8000));
  }
  return { labels, data };
};

function buildChart(range) {
  const { labels, data } = range === 7 ? generate7Days() : generate30Days();
  const ctx = document.getElementById('earn-chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

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
  if (window.initData) {
    window.initData().then(() => {
      const data = window.getData();
      if (!data) return;

      if (data.provider) {
        document.querySelectorAll('.user-chip span').forEach(el => el.textContent = data.provider.name || 'Provider');
        if (data.provider.pfp_url) {
          document.querySelectorAll('.user-avatar').forEach(el => {
            el.innerHTML = `<img src="${data.provider.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          });
        }
      }

      if (data.jobs) {
        userJobs = data.jobs;
      }

      renderStats();
      renderPayouts();
      buildChart(30);
    });
  } else {
    renderStats();
    renderPayouts();
    buildChart(30);
  }
}
