/**
 * dashboard.js — Unit Manager: Dashboard Overview
 *
 * Buttons implemented:
 *  - "Last 30 Days"    → filters stat cards & bar chart to the last 30 days
 *                        of data (relative to latest transaction date)
 *  - "Download Report" → generates and downloads a CSV of the dashboard summary
 *  - "Assign Now"      → confirms training assignment to top providers; shows toast
 *  - "Reassign Job"    → prompts for provider selection; shows success toast
 *  - "Call Provider"   → shows a contact info popup for provider #1042
 *  - "Investigate"     → shows a detailed incident report for the rating alert
 *  - "Dismiss"         → slides out the rating alert card
 */

/* ─────────────────────────────────────────────
   1. MOCK DATA
   ───────────────────────────────────────────── */

const PROVIDERS = [
  { id: 'SP001', name: 'Ravi Kumar',           status: 'Active',      rating: 4.8, phone: '98800 11001', specialty: 'Electrical Wiring' },
  { id: 'SP002', name: 'Priya Sharma',         status: 'Active',      rating: 4.5, phone: '98800 11002', specialty: 'Plumbing'          },
  { id: 'SP003', name: 'Arun Selvam',          status: 'On-Job',      rating: 4.2, phone: '98800 11003', specialty: 'Plumbing'          },
  { id: 'SP004', name: 'Meera Krishnan',       status: 'Idle',        rating: 4.7, phone: '98800 11004', specialty: 'Carpentry'         },
  { id: 'SP005', name: 'Sunil Babu',           status: 'On-Job',      rating: 4.6, phone: '98800 11005', specialty: 'AC Servicing'      },
  { id: 'SP006', name: 'Lakshmi Devi',         status: 'Active',      rating: 4.3, phone: '98800 11006', specialty: 'Deep Cleaning'     },
  { id: 'SP007', name: 'Mohan Raj',            status: 'Unavailable', rating: 3.9, phone: '98800 11007', specialty: 'Carpentry'         },
  { id: 'SP008', name: 'Nithya Lakshmi',       status: 'Active',      rating: 4.9, phone: '98800 11008', specialty: 'Deep Cleaning'     },
  { id: 'SP009', name: 'Karthik Subramanian',  status: 'Idle',        rating: 4.1, phone: '98800 11009', specialty: 'Electrical Wiring' },
  { id: 'SP010', name: 'Divya Menon',          status: 'On-Job',      rating: 4.4, phone: '98800 11010', specialty: 'Plumbing'          },
];

const TRANSACTIONS = [
  { id: 'TXN001', status: 'SUCCESS',  amount: 1999.00, date: '2024-07-01' },
  { id: 'TXN002', status: 'SUCCESS',  amount: 2499.00, date: '2024-07-01' },
  { id: 'TXN003', status: 'REFUNDED', amount: 0.00,    date: '2024-07-10' },
  { id: 'TXN004', status: 'PENDING',  amount: 3299.00, date: '2026-04-10' },
  { id: 'TXN005', status: 'SUCCESS',  amount: 1999.00, date: '2026-04-01' },
  { id: 'TXN006', status: 'SUCCESS',  amount: 299.00,  date: '2024-08-12' },
  { id: 'TXN007', status: 'SUCCESS',  amount: 2499.00, date: '2026-04-14' },
  { id: 'TXN008', status: 'REFUNDED', amount: 0.00,    date: '2024-09-28' },
];

const BOOKINGS = [
  { id: 'BKG001', status: 'COMPLETED'   },
  { id: 'BKG002', status: 'CONFIRMED'   },
  { id: 'BKG003', status: 'CANCELLED'   },
  { id: 'BKG004', status: 'PENDING'     },
  { id: 'BKG005', status: 'IN_PROGRESS' },
  { id: 'BKG006', status: 'COMPLETED'   },
  { id: 'BKG007', status: 'CONFIRMED'   },
  { id: 'BKG008', status: 'PENDING'     },
  { id: 'BKG009', status: 'COMPLETED'   },
  { id: 'BKG010', status: 'CANCELLED'   },
];

/** Full week bar chart data — derived from transaction amounts */
const CHART_DATA_ALL = [
  { label: 'Mon', earnings: 1999, fees: Math.round(1999 * 0.07) },
  { label: 'Tue', earnings: 2499, fees: Math.round(2499 * 0.07) },
  { label: 'Wed', earnings: 299,  fees: Math.round(299  * 0.07) },
  { label: 'Thu', earnings: 1999, fees: Math.round(1999 * 0.07) },
  { label: 'Fri', earnings: 2499, fees: Math.round(2499 * 0.07) },
  { label: 'Sat', earnings: 0,    fees: 0                          },
  { label: 'Sun', earnings: 0,    fees: 0                          },
];

/** Last 30-day subset — only the days with recent activity */
const CHART_DATA_30 = [
  { label: 'Apr 1',  earnings: 1999, fees: Math.round(1999 * 0.07) },
  { label: 'Apr 10', earnings: 0,    fees: 0                          },
  { label: 'Apr 14', earnings: 2499, fees: Math.round(2499 * 0.07) },
];

/* ─────────────────────────────────────────────
   2. STATE
   ───────────────────────────────────────────── */

const FEE_RATE        = 0.07;
const LATEST_TXN_DATE = new Date(Math.max(...TRANSACTIONS.map(t => new Date(t.date).getTime())));
let   is30DayMode     = false;

/* ─────────────────────────────────────────────
   3. HELPERS
   ───────────────────────────────────────────── */

function rupee(n) {
  return '\u20b9' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html)  { const el = document.getElementById(id); if (el) el.innerHTML  = html;  }
function setBar(id, pct)    { const el = document.getElementById(id); if (el) el.style.width = pct + '%'; }

/* ─────────────────────────────────────────────
   4. TOAST NOTIFICATION
   ───────────────────────────────────────────── */

function showToast(message, type = 'success') {
  // Remove existing toast if any
  document.getElementById('dashToast')?.remove();

  const colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb', warning: '#d97706' };
  const icons  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  const toast   = document.createElement('div');
  toast.id      = 'dashToast';
  toast.style.cssText = [
    'position:fixed', 'bottom:28px', 'right:28px', 'z-index:9999',
    `background:${colors[type]}`, 'color:#fff',
    'padding:12px 20px', 'border-radius:10px',
    'font-size:.88rem', 'font-weight:500',
    'box-shadow:0 8px 24px rgba(0,0,0,.25)',
    'display:flex', 'align-items:center', 'gap:10px',
    'transition:opacity .4s', 'max-width:340px', 'line-height:1.4',
  ].join(';');
  toast.innerHTML = `<span style="font-size:1rem">${icons[type]}</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
}

/* ─────────────────────────────────────────────
   5. INLINE MODAL (reusable)
   ───────────────────────────────────────────── */

let modalEl, backdropEl;

function buildModal() {
  if (modalEl) return;

  backdropEl = document.createElement('div');
  backdropEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:none';
  backdropEl.addEventListener('click', closeModal);
  document.body.appendChild(backdropEl);

  modalEl = document.createElement('div');
  modalEl.style.cssText = [
    'position:fixed', 'top:50%', 'left:50%',
    'transform:translate(-50%,-50%) scale(.95)',
    'width:min(420px, 90vw)',
    'background:var(--surface,#1e293b)',
    'border:1px solid var(--border,#334155)',
    'border-radius:14px', 'padding:28px 24px',
    'z-index:1001', 'display:none',
    'transition:transform .2s, opacity .2s',
    'font-family:Inter,sans-serif',
  ].join(';');
  document.body.appendChild(modalEl);

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(titleHtml, bodyHtml, footerHtml = '') {
  buildModal();
  modalEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div style="font-size:1rem;font-weight:600;color:var(--text-primary,#f1f5f9)">${titleHtml}</div>
      <button onclick="closeModal()" style="background:none;border:none;cursor:pointer;
        color:var(--text-secondary,#94a3b8);font-size:1.3rem;line-height:1">&times;</button>
    </div>
    <div style="color:var(--text-secondary,#94a3b8);font-size:.88rem;line-height:1.6">${bodyHtml}</div>
    ${footerHtml ? `<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">${footerHtml}</div>` : ''}
  `;
  backdropEl.style.display = 'block';
  modalEl.style.display    = 'block';
  requestAnimationFrame(() => { modalEl.style.transform = 'translate(-50%,-50%) scale(1)'; });
}

function closeModal() {
  if (!modalEl) return;
  modalEl.style.display    = 'none';
  backdropEl.style.display = 'none';
  modalEl.style.transform  = 'translate(-50%,-50%) scale(.95)';
}
window.closeModal = closeModal;  // expose for onclick in innerHTML

/* ─────────────────────────────────────────────
   6. COMPUTE STATS
   ───────────────────────────────────────────── */

function getStats(txns) {
  const success      = txns.filter(t => t.status === 'SUCCESS');
  const totalRevenue = success.reduce((s, t) => s + t.amount, 0);
  const fees         = totalRevenue * FEE_RATE;
  const net          = totalRevenue - fees;
  return { totalRevenue, fees, net, count: success.length };
}

function getStatsFull()  { return getStats(TRANSACTIONS); }
function getStats30()    {
  const cutoff = new Date(LATEST_TXN_DATE);
  cutoff.setDate(cutoff.getDate() - 30);
  return getStats(TRANSACTIONS.filter(t => new Date(t.date) >= cutoff));
}

/* ─────────────────────────────────────────────
   7. RENDER STAT CARDS
   ───────────────────────────────────────────── */

function renderStatCards(mode30 = false) {
  const { net, fees, count } = mode30 ? getStats30() : getStatsFull();

  const activeBookings = BOOKINGS.filter(b => b.status !== 'CANCELLED');
  const bookingCount   = mode30 ? Math.min(3, activeBookings.length) : activeBookings.length;

  const avgRating = (PROVIDERS.reduce((s, p) => s + p.rating, 0) / PROVIDERS.length).toFixed(1);

  setHTML('statBookings', bookingCount.toLocaleString('en-IN'));
  setText('statBookingsBadge', `\u2191 ${count} paid`);

  setHTML('statRating', `${avgRating} <small>/ 5.0</small>`);
  setText('statRatingBadge', `${PROVIDERS.length} providers`);

  setHTML('statRevenue', rupee(net));
  const badge = document.getElementById('statRevenueBadge');
  if (badge) { badge.textContent = `${rupee(fees)} in fees`; badge.className = 'stat-badge'; }
}

/* ─────────────────────────────────────────────
   8. RENDER CAPACITY BARS
   ───────────────────────────────────────────── */

function renderCapacity() {
  const total   = PROVIDERS.length;
  const counts  = {
    active:  PROVIDERS.filter(p => p.status === 'Active').length,
    onJob:   PROVIDERS.filter(p => p.status === 'On-Job').length,
    idle:    PROVIDERS.filter(p => p.status === 'Idle').length,
    unavail: PROVIDERS.filter(p => p.status === 'Unavailable').length,
  };
  const p = n => Math.round((n / total) * 100);

  [
    ['capActiveCount', 'capActivePct', 'capActiveBar',  counts.active],
    ['capJobCount',    'capJobPct',    'capJobBar',     counts.onJob],
    ['capIdleCount',   'capIdlePct',   'capIdleBar',    counts.idle],
    ['capUnavailCount','capUnavailPct','capUnavailBar', counts.unavail],
  ].forEach(([cId, pId, bId, n]) => {
    setText(cId, n);
    setText(pId, p(n) + '%');
    setBar(bId,  p(n));
  });
}

/* ─────────────────────────────────────────────
   9. RENDER BAR CHART
   ───────────────────────────────────────────── */

function renderBarChart(data) {
  const container = document.getElementById('barChart');
  if (!container) return;
  container.innerHTML = '';

  const maxVal = Math.max(...data.map(d => d.earnings), 1);

  data.forEach(d => {
    const group = document.createElement('div');
    group.className = 'bar-group';

    const earBar = document.createElement('div');
    earBar.className   = 'bar earnings';
    earBar.style.height = `${(d.earnings / maxVal) * 100}%`;
    earBar.title        = `Earnings: ${rupee(d.earnings)}`;

    const feeBar = document.createElement('div');
    feeBar.className   = 'bar fees';
    feeBar.style.height = `${(d.fees / maxVal) * 100}%`;
    feeBar.title        = `Fees: ${rupee(d.fees)}`;

    const label = document.createElement('span');
    label.className   = 'bar-label';
    label.textContent = d.label;

    group.append(earBar, feeBar, label);
    container.appendChild(group);
  });
}

/* ─────────────────────────────────────────────
   10. BUTTON: "Last 30 Days"
   ───────────────────────────────────────────── */

const BTN30_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8"  y1="2" x2="8"  y2="6"/>
  <line x1="3"  y1="10" x2="21" y2="10"/>
</svg>`;

document.getElementById('btn30Days').addEventListener('click', function () {
  is30DayMode = !is30DayMode;

  if (is30DayMode) {
    this.innerHTML     = BTN30_SVG + ' Last 30 Days \u2713';
    this.style.outline = '2px solid currentColor';
    renderStatCards(true);
    renderBarChart(CHART_DATA_30);
    showToast('Showing data for the last 30 days (Mar 15 \u2013 Apr 14, 2026)', 'info');
  } else {
    this.innerHTML     = BTN30_SVG + ' Last 30 Days';
    this.style.outline = '';
    renderStatCards(false);
    renderBarChart(CHART_DATA_ALL);
    showToast('Showing all-time data', 'info');
  }
});

/* ─────────────────────────────────────────────
   11. BUTTON: "Download Report"
       Generates and downloads a CSV summary
   ───────────────────────────────────────────── */

document.getElementById('btnDownload').addEventListener('click', function () {
  const { totalRevenue, fees, net } = getStatsFull();
  const avgRating = (PROVIDERS.reduce((s, p) => s + p.rating, 0) / PROVIDERS.length).toFixed(1);

  const rows = [
    ['Dashboard Report', 'Unit Manager \u2013 Unit 402'],
    ['Generated At', new Date().toLocaleString('en-IN')],
    [],
    ['=== SUMMARY STATS ==='],
    ['Total Bookings (active)', BOOKINGS.filter(b => b.status !== 'CANCELLED').length],
    ['Total Revenue (gross)',   totalRevenue.toFixed(2)],
    ['Platform Fees (7%)',      fees.toFixed(2)],
    ['Net Earnings',            net.toFixed(2)],
    ['Avg Provider Rating',     avgRating + ' / 5.0'],
    ['Total Providers',         PROVIDERS.length],
    [],
    ['=== PROVIDER CAPACITY ==='],
    ['Status', 'Count', 'Percentage'],
    ...['Active','On-Job','Idle','Unavailable'].map(s => {
      const c = PROVIDERS.filter(p => p.status === s).length;
      return [s, c, Math.round((c / PROVIDERS.length) * 100) + '%'];
    }),
    [],
    ['=== PROVIDER LIST ==='],
    ['ID', 'Name', 'Specialty', 'Status', 'Rating'],
    ...PROVIDERS.map(p => [p.id, p.name, p.specialty, p.status, p.rating]),
    [],
    ['=== TRANSACTIONS ==='],
    ['ID', 'Date', 'Amount', 'Status'],
    ...TRANSACTIONS.map(t => [t.id, t.date, t.amount.toFixed(2), t.status]),
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `unit_dashboard_report_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Report downloaded as CSV \u2014 open in Excel or Google Sheets', 'success');
});

/* ─────────────────────────────────────────────
   12. BUTTON: "Assign Now" (Training Module)
   ───────────────────────────────────────────── */

document.getElementById('btnAssignNow').addEventListener('click', function () {
  const topProviders = PROVIDERS
    .filter(p => p.status === 'Active' || p.status === 'Idle')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const listHtml = topProviders.map(p =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;
      border-bottom:1px solid var(--border,#334155)">
      <span>${p.name}</span>
      <span style="color:#f59e0b">${'\u2605'.repeat(Math.round(p.rating))} ${p.rating}</span>
    </div>`
  ).join('');

  openModal(
    '\uD83C\uDF93 Assign Training Module',
    `<p style="margin-bottom:14px">The <strong style="color:var(--text-primary,#f1f5f9)">
      Customer Communication</strong> module will be assigned to your top ${topProviders.length} providers:</p>
    ${listHtml}`,
    `<button onclick="closeModal()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border,#334155);
      background:none;color:var(--text-secondary,#94a3b8);cursor:pointer">Cancel</button>
     <button onclick="confirmAssign()" style="padding:8px 16px;border-radius:8px;border:none;
      background:#2563eb;color:#fff;cursor:pointer;font-weight:500">Confirm Assignment</button>`
  );
});

window.confirmAssign = function () {
  closeModal();
  showToast('Training module assigned to 3 top providers \u2713', 'success');
};

/* ─────────────────────────────────────────────
   13. BUTTON: "Reassign Job"
   ───────────────────────────────────────────── */

document.getElementById('btnReassignJob').addEventListener('click', function () {
  const available = PROVIDERS.filter(p => p.status === 'Active' || p.status === 'Idle');
  const options   = available.map(p =>
    `<option value="${p.id}">${p.name} \u2014 ${p.specialty} (\u2605 ${p.rating})</option>`
  ).join('');

  openModal(
    '\uD83D\uDD04 Reassign Job #B-9921',
    `<p style="margin-bottom:14px">Provider #1042 is a no-show. Select an available provider to reassign:</p>
     <select id="reassignSelect" style="width:100%;padding:10px;border-radius:8px;
      border:1px solid var(--border,#334155);background:var(--surface2,#0f172a);
      color:var(--text-primary,#f1f5f9);font-size:.9rem;cursor:pointer">
       ${options}
     </select>`,
    `<button onclick="closeModal()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border,#334155);
      background:none;color:var(--text-secondary,#94a3b8);cursor:pointer">Cancel</button>
     <button onclick="confirmReassign()" style="padding:8px 16px;border-radius:8px;border:none;
      background:#dc2626;color:#fff;cursor:pointer;font-weight:500">Reassign</button>`
  );
});

window.confirmReassign = function () {
  const sel  = document.getElementById('reassignSelect');
  const name = sel ? sel.options[sel.selectedIndex].text.split(' \u2014')[0] : 'Provider';
  closeModal();
  // Mark alert as resolved
  const alert = document.getElementById('alertNoShow');
  if (alert) {
    alert.style.opacity = '0.4';
    alert.style.pointerEvents = 'none';
    alert.querySelector('strong').textContent = 'No-Show Resolved';
  }
  showToast(`Job #B-9921 reassigned to ${name} \u2713`, 'success');
};

/* ─────────────────────────────────────────────
   14. BUTTON: "Call Provider"
   ───────────────────────────────────────────── */

document.getElementById('btnCallProvider').addEventListener('click', function () {
  openModal(
    '\uD83D\uDCDE Call Provider #1042',
    `<div style="text-align:center;padding:12px 0">
       <div style="font-size:2rem;margin-bottom:8px">\uD83D\uDC64</div>
       <div style="font-size:1rem;font-weight:600;
         color:var(--text-primary,#f1f5f9);margin-bottom:4px">Arun Kumar</div>
       <div style="color:var(--text-secondary,#94a3b8);font-size:.85rem;
         margin-bottom:16px">SP-1042 \u00b7 Plumbing Specialist</div>
       <a href="tel:+919880011042" style="display:inline-block;padding:10px 24px;
         border-radius:8px;background:#16a34a;color:#fff;text-decoration:none;
         font-weight:600;font-size:.9rem">\uD83D\uDCDE Call Now: +91 98800 11042</a>
     </div>
     <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border,#334155);
       font-size:.82rem">
       <strong style="color:var(--text-primary,#f1f5f9)">Note:</strong>
       Provider has not responded to 2 prior alerts. If unreachable, use
       <em>Reassign Job</em> to assign a nearby available provider.
     </div>`
  );
});

/* ─────────────────────────────────────────────
   15. BUTTON: "Investigate"
   ───────────────────────────────────────────── */

document.getElementById('btnInvestigate').addEventListener('click', function () {
  openModal(
    '\u26A0\uFE0F Rating Incident — Provider #2281',
    `<table style="width:100%;border-collapse:collapse;font-size:.85rem">
      ${[
        ['Provider',    'Sanjay Menon (SP-2281)'],
        ['Booking',     'BKG-8834 \u2014 Deep Cleaning'],
        ['Customer',    'Kavitha S. (CUS-0044)'],
        ['Rating Given','1.0 \u2605 (1 hour ago)'],
        ['Previous Avg','4.2 \u2605 over 38 jobs'],
        ['Status',      'Under Review'],
      ].map(([k, v]) => `
        <tr style="border-bottom:1px solid var(--border,#334155)">
          <td style="padding:9px 0;color:var(--text-secondary,#94a3b8);width:45%">${k}</td>
          <td style="padding:9px 0;color:var(--text-primary,#f1f5f9);font-weight:500">${v}</td>
        </tr>`).join('')}
    </table>
    <div style="margin-top:16px;padding:12px;border-radius:8px;background:rgba(220,38,38,.1);
      border:1px solid rgba(220,38,38,.3);font-size:.82rem;color:#fca5a5">
      <strong>Recommended Action:</strong> Contact the customer directly, review job photos,
      and suspend provider pending outcome if pattern repeats.
    </div>`,
    `<button onclick="closeModal()" style="padding:8px 16px;border-radius:8px;
      border:1px solid var(--border,#334155);background:none;
      color:var(--text-secondary,#94a3b8);cursor:pointer">Close</button>
     <button onclick="escalate()" style="padding:8px 16px;border-radius:8px;border:none;
      background:#d97706;color:#fff;cursor:pointer;font-weight:500">Escalate to Manager</button>`
  );
});

window.escalate = function () {
  closeModal();
  showToast('Incident escalated to unit manager \u2713', 'warning');
};

/* ─────────────────────────────────────────────
   16. BUTTON: "Dismiss"
   ───────────────────────────────────────────── */

document.getElementById('btnDismiss').addEventListener('click', function () {
  const alertCard = document.getElementById('alertRating');
  if (!alertCard) return;
  alertCard.style.transition  = 'opacity .4s, max-height .4s, margin .4s, padding .4s';
  alertCard.style.overflow    = 'hidden';
  alertCard.style.opacity     = '0';
  alertCard.style.maxHeight   = '0';
  alertCard.style.marginTop   = '0';
  alertCard.style.paddingTop  = '0';
  alertCard.style.paddingBottom = '0';
  setTimeout(() => alertCard.remove(), 450);
  showToast('Rating alert dismissed', 'info');
});

/* ─────────────────────────────────────────────
   17. LOGOUT
   ───────────────────────────────────────────── */

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    if (!confirm('Are you sure you want to logout?')) e.preventDefault();
  });
}

/* ─────────────────────────────────────────────
   18. INITIALISE
   ───────────────────────────────────────────── */

renderStatCards(false);
renderCapacity();
renderBarChart(CHART_DATA_ALL);
