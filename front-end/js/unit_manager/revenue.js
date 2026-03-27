// Line chart (pure canvas)
const months = ['Jan','Feb','Mar','Apr','May','Jun'];
const actual   = [3200, 4800, 4500, 6200, 6800, 7400];
const projected = [3000, 4600, 5000, 5800, 6500, 7200];

const canvas = document.getElementById('lineCanvas');
const dpr = window.devicePixelRatio || 1;
const W = canvas.offsetWidth, H = 220;
canvas.width = W * dpr; canvas.height = H * dpr;
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

const PAD = { top: 20, right: 20, bottom: 10, left: 40 };
const gW = W - PAD.left - PAD.right;
const gH = H - PAD.top - PAD.bottom;
const allVals = [...actual, ...projected];
const min = 0, max = Math.max(...allVals) * 1.1;

function xPos(i) { return PAD.left + (i / (months.length - 1)) * gW; }
function yPos(v) { return PAD.top + gH - ((v - min) / (max - min)) * gH; }

// Grid lines
ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
for (let i = 0; i <= 4; i++) {
  const y = PAD.top + (gH / 4) * i;
  ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
}

// Projected (dashed, grey)
ctx.setLineDash([6, 4]);
ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
ctx.beginPath();
projected.forEach((v, i) => { i === 0 ? ctx.moveTo(xPos(i), yPos(v)) : ctx.lineTo(xPos(i), yPos(v)); });
ctx.stroke();
ctx.setLineDash([]);

// Actual area fill
const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + gH);
grad.addColorStop(0, 'rgba(37,99,235,.18)');
grad.addColorStop(1, 'rgba(37,99,235,0)');
ctx.fillStyle = grad;
ctx.beginPath();
ctx.moveTo(xPos(0), yPos(actual[0]));
actual.forEach((v, i) => { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
ctx.lineTo(xPos(actual.length - 1), PAD.top + gH);
ctx.lineTo(xPos(0), PAD.top + gH);
ctx.closePath(); ctx.fill();

// Actual line
ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
ctx.beginPath();
actual.forEach((v, i) => { i === 0 ? ctx.moveTo(xPos(i), yPos(v)) : ctx.lineTo(xPos(i), yPos(v)); });
ctx.stroke();

// Dots
actual.forEach((v, i) => {
  ctx.beginPath();
  ctx.arc(xPos(i), yPos(v), 4.5, 0, Math.PI * 2);
  ctx.fillStyle = i === actual.length - 1 ? '#2563eb' : '#fff';
  ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
  ctx.fill(); ctx.stroke();
});

// X Labels
const xLabelsDiv = document.getElementById('xLabels');
months.forEach(m => { const s = document.createElement('span'); s.textContent = m; xLabelsDiv.appendChild(s); });

// Transactions
const txns = [
  { id: 'TXN-9024-XP', date: 'Oct 24, 2023', amount: '₹1,200.00', fee: '-₹84.00',    status: 'Completed' },
  { id: 'TXN-8812-LQ', date: 'Oct 22, 2023', amount: '₹850.00',   fee: '-₹59.50',    status: 'Pending' },
  { id: 'TXN-7741-ZZ', date: 'Oct 20, 2023', amount: '₹2,450.00', fee: '-₹171.50',   status: 'Completed' },
  { id: 'TXN-6632-KA', date: 'Oct 19, 2023', amount: '₹1,050.00', fee: '-₹73.50',    status: 'Failed' },
];

const statClass = { 'Completed':'completed', 'Pending':'pending', 'Failed':'failed' };
const tbody = document.getElementById('txnBody');
txns.forEach(t => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="txn-id">${t.id}</span></td>
    <td>${t.date}</td>
    <td><strong>${t.amount}</strong></td>
    <td><span class="fee-neg">${t.fee}</span></td>
    <td><span class="status-pill ${statClass[t.status]}">${t.status.toUpperCase()}</span></td>
    <td><button class="more-btn">⋮</button></td>
  `;
  tbody.appendChild(tr);
});
