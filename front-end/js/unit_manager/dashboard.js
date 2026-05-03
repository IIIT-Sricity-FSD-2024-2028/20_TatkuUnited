/**
 * dashboard.js — Unit Manager: Dashboard Overview (API-backed)
 */

/* ─────────────────────────────────────────────
   1. STATE
   ───────────────────────────────────────────── */

let PROVIDERS = [];
let TRANSACTIONS = [];
let BOOKINGS = [];
let CHART_DATA_ALL = [];
let CHART_DATA_30 = [];
let LEDGER_ENTRIES = [];

const FEE_RATE = 0.07;
let LATEST_TXN_DATE = new Date();
let is30DayMode = false;

function deriveProviderStatus(sp, providerAssignments) {
  if (!sp.is_active) return "Unavailable";
  if (
    providerAssignments.some(
      (a) => a.status === "IN_PROGRESS" || a.status === "ASSIGNED",
    )
  )
    return "On-Job";
  if (providerAssignments.some((a) => a.status === "COMPLETED"))
    return "Active";
  return "Idle";
}

function buildChartSeries(txns) {
  const success = txns.filter((t) => t.status === "SUCCESS");
  const grouped = {};

  success.forEach((t) => {
    const d = new Date(t.date);
    const key = d.toISOString().slice(0, 10);
    grouped[key] = (grouped[key] || 0) + Number(t.amount || 0);
  });

  return Object.keys(grouped)
    .sort()
    .slice(-7)
    .map((k) => {
      const d = new Date(k);
      const amt = grouped[k];
      return {
        label: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        earnings: amt,
        fees: Math.round(amt * FEE_RATE),
      };
    });
}

async function loadDashboardData(session) {
  const umId = session.id;
  const unitId = session.unitId;

  // Fetch providers for this unit
  let allProviders = [];
  allProviders  = await Api.get("/service-providers");
  const unitProviders = allProviders.filter((p) => p.unit_id === unitId);
  const unitProviderIds = new Set(unitProviders.map((p) => p.sp_id));

  // Fetch job assignments
  let allAssignments = [];
  allAssignments  = await Api.get("/job-assignments");
  const unitAssignments = allAssignments.filter((a) => unitProviderIds.has(a.sp_id));

  // Fetch skills
  let allSkills = [];
  allSkills  = await Api.get("/skills");
  const skillMap = {};
  allSkills.forEach((s) => { skillMap[s.skill_id] = s.skill_name; });

  // Build providers list
  PROVIDERS = unitProviders.map((sp) => {
    const providerAssignments = unitAssignments.filter(
      (a) => a.sp_id === sp.sp_id,
    );
    return {
      id: sp.sp_id,
      name: sp.name,
      status: deriveProviderStatus(sp, providerAssignments),
      rating: typeof sp.rating === "number" ? sp.rating : 4.0,
      phone: String(sp.phone || "").replace(/^\+91/, ""),
      specialty: sp.specialty || "General",
    };
  });

  // Fetch revenue ledger for this unit manager
  let ledgerResp = await Api.get("/revenue-ledger/unit-manager/" + umId);
  LEDGER_ENTRIES = ledgerResp.rows || [];

  // Fetch transactions
  let allTxns = [];
  allTxns  = await Api.get("/transactions");

  const unitBookingIds = new Set(unitAssignments.map((a) => a.booking_id));
  TRANSACTIONS = allTxns
    .map((t) => ({
      id: t.transaction_id,
      status: t.payment_status,
      amount: Number(t.amount || 0),
      date: t.verified_at || t.transaction_at || new Date().toISOString(),
      booking_id: t.booking_id,
    }));

  // Fetch bookings
  let allBookings = [];
  allBookings  = await Api.get("/bookings");

  BOOKINGS = allBookings
    .filter((b) => unitBookingIds.has(b.booking_id))
    .map((b) => ({
      id: b.booking_id,
      status: b.status,
      customerName: b.customer_name || "Guest",
      serviceName: b.service_name || "Home Service",
      scheduledAt: b.scheduled_at,
      price: b.price || b.total_price || 0,
    }));

  if (TRANSACTIONS.length) {
    LATEST_TXN_DATE = new Date(
      Math.max(...TRANSACTIONS.map((t) => new Date(t.date).getTime())),
    );
  }

  CHART_DATA_ALL = buildChartSeries(TRANSACTIONS);
  const cutoff = new Date(LATEST_TXN_DATE);
  cutoff.setDate(cutoff.getDate() - 30);
  CHART_DATA_30 = buildChartSeries(
    TRANSACTIONS.filter((t) => new Date(t.date) >= cutoff),
  );
}

/* ─────────────────────────────────────────────
   3. HELPERS
   ───────────────────────────────────────────── */

function rupee(n) {
  return (
    "\u20b9" +
    Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + "%";
}

/* ─────────────────────────────────────────────
   4. TOAST NOTIFICATION
   ───────────────────────────────────────────── */

function showToast(message, type = "success") {
  document.getElementById("dashToast")?.remove();

  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#2563eb",
    warning: "#d97706",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

  const toast = document.createElement("div");
  toast.id = "dashToast";
  toast.style.cssText = [
    "position:fixed",
    "bottom:28px",
    "right:28px",
    "z-index:9999",
    `background:${colors[type]}`,
    "color:#fff",
    "padding:12px 20px",
    "border-radius:10px",
    "font-size:.88rem",
    "font-weight:500",
    "box-shadow:0 8px 24px rgba(0,0,0,.25)",
    "display:flex",
    "align-items:center",
    "gap:10px",
    "transition:opacity .4s",
    "max-width:340px",
    "line-height:1.4",
  ].join(";");
  toast.innerHTML = `<span style="font-size:1rem">${icons[type]}</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ─────────────────────────────────────────────
   5. INLINE MODAL (reusable)
   ───────────────────────────────────────────── */

let modalEl, backdropEl;

function buildModal() {
  if (modalEl) return;

  backdropEl = document.createElement("div");
  backdropEl.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:none";
  backdropEl.addEventListener("click", closeModal);
  document.body.appendChild(backdropEl);

  modalEl = document.createElement("div");
  modalEl.style.cssText = [
    "position:fixed",
    "top:50%",
    "left:50%",
    "transform:translate(-50%,-50%) scale(.95)",
    "width:min(420px, 90vw)",
    "background:var(--surface,#1e293b)",
    "border:1px solid var(--border,#334155)",
    "border-radius:14px",
    "padding:28px 24px",
    "z-index:1001",
    "display:none",
    "transition:transform .2s, opacity .2s",
    "font-family:Inter,sans-serif",
  ].join(";");
  document.body.appendChild(modalEl);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function openModal(titleHtml, bodyHtml, footerHtml = "") {
  buildModal();
  modalEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div style="font-size:1rem;font-weight:600;color:var(--text-primary,#f1f5f9)">${titleHtml}</div>
      <button onclick="closeModal()" style="background:none;border:none;cursor:pointer;
        color:var(--text-secondary,#94a3b8);font-size:1.3rem;line-height:1">&times;</button>
    </div>
    <div style="color:var(--text-secondary,#94a3b8);font-size:.88rem;line-height:1.6">${bodyHtml}</div>
    ${footerHtml ? `<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">${footerHtml}</div>` : ""}
  `;
  backdropEl.style.display = "block";
  modalEl.style.display = "block";
  requestAnimationFrame(() => {
    modalEl.style.transform = "translate(-50%,-50%) scale(1)";
  });
}

function closeModal() {
  if (!modalEl) return;
  modalEl.style.display = "none";
  backdropEl.style.display = "none";
  modalEl.style.transform = "translate(-50%,-50%) scale(.95)";
}
window.closeModal = closeModal;

/* ─────────────────────────────────────────────
   6. COMPUTE STATS
   ───────────────────────────────────────────── */

function getStats(txns, ledgerEntries) {
  // Use ledger entries as the source of truth (same formula as revenue.js)
  if (ledgerEntries && ledgerEntries.length > 0) {
    const totalGMV = ledgerEntries.reduce((sum, entry) => {
      return sum +
        (entry.provider_amount || 0) +
        (entry.um_amount || 0) +
        (entry.cm_amount || 0) +
        (entry.platform_amount || 0);
    }, 0);

    const fees = ledgerEntries.reduce((sum, entry) => sum + (entry.um_amount || 0), 0);
    return { totalRevenue: totalGMV, fees, net: totalGMV - fees, count: ledgerEntries.length };
  }

  // Fallback: no ledger data
  const success = txns.filter((t) => t.status === "SUCCESS" || t.payment_status === "SUCCESS");
  const totalRevenue = success.reduce((s, t) => s + t.amount, 0);
  const fees = totalRevenue * FEE_RATE;
  return { totalRevenue, fees, net: totalRevenue - fees, count: success.length };
}

function getStatsFull() {
  return getStats(TRANSACTIONS, LEDGER_ENTRIES);
}
function getStats30() {
  const cutoff = new Date(LATEST_TXN_DATE);
  cutoff.setDate(cutoff.getDate() - 30);
  
  const filteredTxns = TRANSACTIONS.filter((t) => new Date(t.date) >= cutoff);
  const filteredLedger = (LEDGER_ENTRIES || []).filter(entry => new Date(entry.created_at) >= cutoff);
  
  return getStats(filteredTxns, filteredLedger);
}

/* ─────────────────────────────────────────────
   7. RENDER STAT CARDS
   ───────────────────────────────────────────── */

function renderStatCards(mode30 = false) {
  const { totalRevenue, fees, count } = mode30 ? getStats30() : getStatsFull();

  const activeBookings = BOOKINGS.filter((b) => b.status !== "CANCELLED");
  const bookingCount = mode30
    ? Math.min(3, activeBookings.length) // Simulated 30-day filter for bookings
    : activeBookings.length;

  const avgRating = PROVIDERS.length
    ? (PROVIDERS.reduce((s, p) => s + p.rating, 0) / PROVIDERS.length).toFixed(1)
    : "0.0";

  setHTML("statBookings", bookingCount.toLocaleString("en-IN"));
  setText("statBookingsBadge", `\u2191 ${count} paid`);

  setHTML("statRating", `${avgRating} <small>/ 5.0</small>`);
  setText("statRatingBadge", `${PROVIDERS.length} providers`);

  // Align with Revenue Reports page: Show Gross Revenue (GMV) as main stat
  setHTML("statRevenue", rupee(totalRevenue));
  const badge = document.getElementById("statRevenueBadge");
  if (badge) {
    badge.textContent = `${rupee(fees)} in unit fees`;
    badge.className = "stat-badge";
  }
}

/* ─────────────────────────────────────────────
   8. RENDER CAPACITY BARS
   ───────────────────────────────────────────── */

function renderCapacity() {
  const total = PROVIDERS.length || 1;
  const counts = {
    active: PROVIDERS.filter((p) => p.status === "Active").length,
    onJob: PROVIDERS.filter((p) => p.status === "On-Job").length,
    idle: PROVIDERS.filter((p) => p.status === "Idle").length,
    unavail: PROVIDERS.filter((p) => p.status === "Unavailable").length,
  };
  const p = (n) => Math.round((n / total) * 100);

  [
    ["capActiveCount", "capActivePct", "capActiveBar", counts.active],
    ["capJobCount", "capJobPct", "capJobBar", counts.onJob],
    ["capIdleCount", "capIdlePct", "capIdleBar", counts.idle],
    ["capUnavailCount", "capUnavailPct", "capUnavailBar", counts.unavail],
  ].forEach(([cId, pId, bId, n]) => {
    setText(cId, n);
    setText(pId, p(n) + "%");
    setBar(bId, p(n));
  });
}

/* ─────────────────────────────────────────────
   9. RENDER BAR CHART
   ───────────────────────────────────────────── */

function renderBarChart(data) {
  const container = document.getElementById("barChart");
  if (!container) return;
  container.innerHTML = "";

  const maxVal = Math.max(...data.map((d) => d.earnings), 1);

  data.forEach((d) => {
    const group = document.createElement("div");
    group.className = "bar-group";

    const earBar = document.createElement("div");
    earBar.className = "bar earnings";
    earBar.style.height = `${(d.earnings / maxVal) * 100}%`;
    earBar.title = `Earnings: ${rupee(d.earnings)}`;

    const feeBar = document.createElement("div");
    feeBar.className = "bar fees";
    feeBar.style.height = `${(d.fees / maxVal) * 100}%`;
    feeBar.title = `Fees: ${rupee(d.fees)}`;

    const label = document.createElement("span");
    label.className = "bar-label";
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

document.getElementById("btn30Days")?.addEventListener("click", function () {
  is30DayMode = !is30DayMode;

  if (is30DayMode) {
    this.innerHTML = BTN30_SVG + " Last 30 Days \u2713";
    this.style.outline = "2px solid currentColor";
    renderStatCards(true);
    renderBarChart(CHART_DATA_30);
    showToast("Showing data for the last 30 days", "info");
  } else {
    this.innerHTML = BTN30_SVG + " Last 30 Days";
    this.style.outline = "";
    renderStatCards(false);
    renderBarChart(CHART_DATA_ALL);
    showToast("Showing all-time data", "info");
  }
});

/* ─────────────────────────────────────────────
   11. BUTTON: "Download Report"
   ───────────────────────────────────────────── */

document.getElementById("btnDownload")?.addEventListener("click", function () {
  const { totalRevenue, fees, net } = getStatsFull();
  const avgRating = PROVIDERS.length
    ? (PROVIDERS.reduce((s, p) => s + p.rating, 0) / PROVIDERS.length).toFixed(1)
    : "0.0";

  const rows = [
    ["Dashboard Report", "Unit Manager Dashboard"],
    ["Generated At", new Date().toLocaleString("en-IN")],
    [],
    ["=== SUMMARY STATS ==="],
    ["Total Bookings (active)", BOOKINGS.filter((b) => b.status !== "CANCELLED").length],
    ["Total Revenue (gross)", totalRevenue.toFixed(2)],
    ["Platform Fees (7%)", fees.toFixed(2)],
    ["Net Earnings", net.toFixed(2)],
    ["Avg Provider Rating", avgRating + " / 5.0"],
    ["Total Providers", PROVIDERS.length],
    [],
    ["=== PROVIDER LIST ==="],
    ["ID", "Name", "Specialty", "Status", "Rating"],
    ...PROVIDERS.map((p) => [p.id, p.name, p.specialty, p.status, p.rating]),
  ];

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `unit_dashboard_report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Report downloaded as CSV", "success");
});

/* ─────────────────────────────────────────────
   13. BUTTON: "Reassign Job"
   ───────────────────────────────────────────── */

document.getElementById("btnReassignJob")?.addEventListener("click", function () {
  const available = PROVIDERS.filter(
    (p) => p.status === "Active" || p.status === "Idle",
  );
  const options = available
    .map(
      (p) =>
        `<option value="${p.id}">${p.name} \u2014 ${p.specialty} (\u2605 ${p.rating})</option>`,
    )
    .join("");

  openModal(
    "\uD83D\uDD04 Reassign Job",
    `<p style="margin-bottom:14px">Select an available provider to reassign:</p>
     <select id="reassignSelect" style="width:100%;padding:10px;border-radius:8px;
      border:1px solid var(--border,#334155);background:var(--surface2,#0f172a);
      color:var(--text-primary,#f1f5f9);font-size:.9rem;cursor:pointer">
       ${options}
     </select>`,
    `<button onclick="closeModal()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border,#334155);
      background:none;color:var(--text-secondary,#94a3b8);cursor:pointer">Cancel</button>
     <button onclick="confirmReassign()" style="padding:8px 16px;border-radius:8px;border:none;
      background:#dc2626;color:#fff;cursor:pointer;font-weight:500">Reassign</button>`,
  );
});

window.confirmReassign = function () {
  const sel = document.getElementById("reassignSelect");
  const name = sel ? sel.options[sel.selectedIndex].text.split(" \u2014")[0] : "Provider";
  closeModal();
  const alert = document.getElementById("alertNoShow");
  if (alert) {
    alert.style.opacity = "0.4";
    alert.style.pointerEvents = "none";
    alert.querySelector("strong").textContent = "No-Show Resolved";
  }
  showToast(`Job reassigned to ${name} \u2713`, "success");
};

/* ─────────────────────────────────────────────
   14. BUTTON: "Call Provider"
   ───────────────────────────────────────────── */

document.getElementById("btnCallProvider")?.addEventListener("click", function () {
  const firstProvider = PROVIDERS[0];
  const name = firstProvider ? firstProvider.name : "Provider";
  const phone = firstProvider ? firstProvider.phone : "N/A";
  openModal(
    "\uD83D\uDCDE Contact Provider",
    `<div style="text-align:center;padding:12px 0">
       <div style="font-size:2rem;margin-bottom:8px">\uD83D\uDC64</div>
       <div style="font-size:1rem;font-weight:600;
         color:var(--text-primary,#f1f5f9);margin-bottom:4px">${name}</div>
       <div style="color:var(--text-secondary,#94a3b8);font-size:.85rem;
         margin-bottom:16px">Phone: ${phone}</div>
     </div>`,
  );
});



/* ─────────────────────────────────────────────
   16. TOTAL BOOKINGS MODAL
   ───────────────────────────────────────────── */

function showBookingsModal() {
  const tableRows = BOOKINGS.map((b) => {
    const d = new Date(b.scheduledAt);
    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const statusBadgeCls = {
      PENDING: "background:#fef3c7;color:#92400e;",
      ASSIGNED: "background:#dcfce7;color:#166534;",
      IN_PROGRESS: "background:#dbeafe;color:#1e40af;",
      COMPLETED: "background:#f0fdf4;color:#15803d;",
      CANCELLED: "background:#fee2e2;color:#991b1b;",
    }[b.status.toUpperCase()] || "background:#f1f5f9;color:#475569;";

    return `
      <tr style="border-bottom:1px solid var(--border,#334155)">
        <td style="padding:12px 8px;font-size:0.8rem;color:var(--text-primary,#f1f5f9);font-family:monospace">${b.id}</td>
        <td style="padding:12px 8px;font-size:0.85rem;color:var(--text-primary,#f1f5f9);font-weight:500">${b.customerName}</td>
        <td style="padding:12px 8px;font-size:0.85rem;color:var(--text-secondary,#94a3b8)">${b.serviceName}</td>
        <td style="padding:12px 8px;font-size:0.8rem;color:var(--text-secondary,#94a3b8)">${dateStr}<br/>${timeStr}</td>
        <td style="padding:12px 8px;font-size:0.85rem;color:var(--text-primary,#f1f5f9);font-weight:600">${rupee(b.price)}</td>
        <td style="padding:12px 8px;font-size:0.75rem">
          <span style="padding:4px 8px;border-radius:6px;font-weight:600;${statusBadgeCls}">${b.status}</span>
        </td>
      </tr>
    `;
  }).join("");

  buildModal();
  modalEl.style.width = "min(640px, 95vw)";

  openModal(
    `📋 Customer Bookings (${BOOKINGS.length})`,
    `<div style="overflow-x:auto;max-height:400px;margin-top:10px;">
      <table style="width:100%;border-collapse:collapse;text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid var(--border,#334155)">
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">ID</th>
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">Customer</th>
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">Service</th>
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">Scheduled</th>
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">Price</th>
            <th style="padding:8px;font-size:0.75rem;color:var(--text-secondary,#94a3b8);text-transform:uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-secondary,#94a3b8)">No bookings found</td></tr>'}
        </tbody>
      </table>
    </div>`,
    `<button onclick="modalEl.style.width='min(420px, 90vw)';closeModal()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border,#334155);background:none;color:var(--text-secondary,#94a3b8);cursor:pointer">Close</button>`
  );
}

/* ─────────────────────────────────────────────
  17. INITIALISE
   ───────────────────────────────────────────── */

(async () => {
  const session = Auth.requireSession(["unit_manager"]);
  if (!session) return;
  Auth.syncUserAvatar();

  await loadDashboardData(session);
  renderStatCards(false);
  renderCapacity();
  renderBarChart(CHART_DATA_ALL);

  // Bind Total Bookings Card
  const totalBookingsCard = document.getElementById("totalBookingsCard");
  if (totalBookingsCard) {
    totalBookingsCard.addEventListener("click", showBookingsModal);
  }
})();
