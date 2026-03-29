// ---- DATA ----
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const lineData = [4800, 5400, 4200, 5600, 6200, 8800, 7200];
const barData = [42, 55, 48, 62, 70, 85, 68];

const categories = [
  { name: 'Cleaning', color: '#3b82f6', bookings: 448, revenue: 16887 },
  { name: 'Plumbing', color: '#22c55e', bookings: 321, revenue: 12062 },
  { name: 'Electrical', color: '#f59e0b', bookings: 257, revenue: 9650 },
  { name: 'Painting', color: '#ef4444', bookings: 154, revenue: 5790 },
  { name: 'Landscaping', color: '#8b5cf6', bookings: 104, revenue: 3861 },
];

// ---- LINE CHART ----
function drawLine() {
  const canvas = document.getElementById('lineChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 420;
  const H = 180;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 20, right: 20, bottom: 30, left: 55 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = 10000;

  ctx.clearRect(0, 0, W, H);

  // grid lines
  [0, 2500, 5000, 7500, 10000].forEach(v => {
    const y = pad.top + chartH - (v / maxV) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + (v / 1000).toFixed(1) + 'k', pad.left - 6, y + 4);
  });

  // line
  const points = lineData.map((v, i) => ({
    x: pad.left + (i / (lineData.length - 1)) * chartW,
    y: pad.top + chartH - (v / maxV) * chartH,
  }));

  ctx.beginPath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // dots + x labels
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], p.x, H - 6);
  });
}

// ---- BAR CHART ----
function drawBar() {
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 360;
  const H = 180;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 20, right: 10, bottom: 30, left: 35 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = 100;

  ctx.clearRect(0, 0, W, H);

  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.top + chartH - (v / maxV) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v, pad.left - 4, y + 4);
  });

  const n = barData.length;
  const groupW = chartW / n;
  const barW = groupW * 0.55;

  barData.forEach((v, i) => {
    const x = pad.left + i * groupW + (groupW - barW) / 2;
    const bh = (v / maxV) * chartH;
    const y = pad.top + chartH - bh;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0]) : ctx.rect(x, y, barW, bh);
    ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], x + barW / 2, H - 6);
  });
}

// ---- DONUT CHART ----
function drawDonut() {
  const canvas = document.getElementById('donutChart');
  const ctx = canvas.getContext('2d');
  const S = 200;
  canvas.width = S * devicePixelRatio;
  canvas.height = S * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const total = categories.reduce((s, c) => s + c.revenue, 0);
  const cx = S / 2, cy = S / 2, r = 80, inner = 52;
  let start = -Math.PI / 2;

  categories.forEach(cat => {
    const sweep = (cat.revenue / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + sweep);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    start += sweep;
  });

  // inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // legend
  const legend = document.getElementById('donutLegend');
  legend.innerHTML = '';
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" style="background:${cat.color}"></div>${cat.name}`;
    legend.appendChild(item);
  });
}

// ---- TABLE ----
function buildTable() {
  const tbody = document.getElementById('revTableBody');
  categories.forEach(cat => {
    const avg = (cat.revenue / cat.bookings).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat.name}</td>
      <td class="booking-link">${cat.bookings.toLocaleString()}</td>
      <td>₦${cat.revenue.toLocaleString()}</td>
      <td>₦${avg}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- INIT ----
window.addEventListener('load', () => {
  drawLine();
  drawBar();
  drawDonut();
  buildTable();
});

window.addEventListener('resize', () => {
  drawLine();
  drawBar();
});
