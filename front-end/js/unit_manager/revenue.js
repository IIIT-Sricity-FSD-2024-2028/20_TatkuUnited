/**
 * revenue.js — Unit Manager: Revenue Reports
 *
 * Script is placed at bottom of <body>, DOM is ready at execution time.
 * No DOMContentLoaded wrapper needed.
 *
 * Features:
 *  - Stat cards driven from live transaction data
 *  - Revenue Trend chart (pure canvas, deferred one tick for layout)
 *  - Transaction table with pagination
 *  - ⋮ (details) button shows a slide-in detail panel per transaction
 *  - "Last 30 Days" button filters everything; click again = All Time
 *  - "Export PDF" opens a clean print view via window.print()
 */

/* ─────────────────────────────────────────────
  1. LIVE DATA (from shared AppStore)
  ───────────────────────────────────────────── */

let ALL_TRANSACTIONS = [];

/**
 * Use the LATEST transaction date as the "current date" reference.
 * This ensures "Last 30 Days" always produces meaningful results
 * regardless of when the app is opened relative to stored history.
 * (The seeded history spans 2024–2026; using real `new Date()` would
 *  return 0 results since most entries are far in the past or future.)
 */
let LATEST_TXN_DATE = new Date();

/** SVG for the filter button — stored so we can rebuild innerHTML safely */
const BTN30_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="4" width="18" height="18" rx="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8" y1="2" x2="8" y2="6"/>
  <line x1="3" y1="10" x2="21" y2="10"/>
</svg>`;

/* ─────────────────────────────────────────────
   2. STATE
   ───────────────────────────────────────────── */

const PER_PAGE = 5;

let activeTxns = [];
let txnPage = 1;
let is30DayMode = false;
let unitGMVData = {}; // Track GMV and unit manager earnings

function mapMethod(m) {
  return (
    { UPI: "UPI", CARD: "CARD", NETBANK: "Net Banking", WALLET: "Wallet" }[m] ||
    m ||
    "Unknown"
  );
}

function loadRevenueDataFromStore(session) {
  const allLedger = AppStore.getTable("revenue_ledger") || [];
  const allTxns = AppStore.getTable("transactions") || [];

  const unitId = session.unitId;

  // Filter ledger entries for this unit manager
  const unitLedgerEntries = allLedger.filter(
    (entry) => entry.role === "unit_manager" && entry.unit_id === unitId,
  );

  // Build transaction map
  const txnById = new Map(allTxns.map((t) => [t.transaction_id, t]));

  // Convert ledger entries to transaction view
  ALL_TRANSACTIONS = unitLedgerEntries.map((ledger_entry) => {
    const txn = txnById.get(ledger_entry.transaction_id);
    const status = "SUCCESS"; // Ledger entries are only for successful transactions

    return {
      id: ledger_entry.transaction_id,
      method: txn ? mapMethod(txn.payment_method) : "Unknown",
      status,
      amount: Number(txn ? txn.amount || 0 : 0), // Gross amount
      unitManagerCut: Number(ledger_entry.amount || 0), // 7% cut for unit manager
      refund: 0,
      date: ledger_entry.created_at,
      booking_id: txn ? txn.booking_id : "-",
      ledgerId: ledger_entry.ledger_id,
    };
  });

  if (ALL_TRANSACTIONS.length) {
    LATEST_TXN_DATE = new Date(
      Math.max(...ALL_TRANSACTIONS.map((t) => new Date(t.date).getTime())),
    );
  }

  activeTxns = [...ALL_TRANSACTIONS];

  // Calculate unit-level GMV
  unitGMVData = {
    totalGMV: ALL_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0),
    unitManagerCut: ALL_TRANSACTIONS.reduce(
      (sum, t) => sum + t.unitManagerCut,
      0,
    ),
    transactionCount: ALL_TRANSACTIONS.length,
  };
}

/* ─────────────────────────────────────────────
   3. HELPERS
   ───────────────────────────────────────────── */

/** Format number as ₹ Indian currency */
function rupee(n) {
  return (
    "\u20b9" +
    Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Format ISO date string to "01 Jul 2024" */
function niceDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format ISO date string to "01 Jul 2024, 09:32 AM" */
function niceDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSuccessTxns(txns) {
  return txns.filter((t) => t.status === "SUCCESS");
}

/* ─────────────────────────────────────────────
   4. STAT CARDS
   ───────────────────────────────────────────── */

function renderStatCards() {
  const success = activeTxns.filter((t) => t.status === "SUCCESS");
  const totalGMV = unitGMVData.totalGMV || 0;
  const unitManagerCut = unitGMVData.unitManagerCut || 0;
  const count = success.length;

  document.getElementById("statTotalRevenue").textContent = rupee(totalGMV);
  document.getElementById("statTotalFees").textContent = rupee(unitManagerCut);
  document.getElementById("statNetEarnings").textContent = rupee(
    totalGMV - unitManagerCut,
  );

  document.getElementById("statRevenueBadge").textContent =
    count > 0 ? `\u2191 ${count} booking${count !== 1 ? "s" : ""}` : "No data";

  document.getElementById("statFeesBadge").textContent = `7% unit manager cut`;
  document.getElementById("statEarningsBadge").textContent =
    totalGMV > 0
      ? `\u2191 ${((unitManagerCut / totalGMV) * 100).toFixed(1)}% to unit`
      : "\u2014";
}

/* ─────────────────────────────────────────────
   5. REVENUE TREND CHART  (pure canvas)
      Deferred one tick with setTimeout so layout
      has applied and offsetWidth > 0
   ───────────────────────────────────────────── */

function buildMonthlyData(txns) {
  const map = {};
  txns.forEach((t) => {
    if (t.status === "SUCCESS") {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + t.amount; // GMV amount
    }
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
}

function drawChart() {
  const canvas = document.getElementById("lineCanvas");
  if (!canvas) return;

  // Fallback chain for width — handles pre-layout timing
  const W = canvas.offsetWidth || canvas.parentElement.offsetWidth || 600;
  const H = 220;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const monthly = buildMonthlyData(activeTxns);
  const labels = monthly.map(([k]) => {
    const [yr, mo] = k.split("-");
    return (
      new Date(Number(yr), Number(mo) - 1).toLocaleString("en-IN", {
        month: "short",
      }) +
      " '" +
      String(yr).slice(2)
    );
  });
  const actual = monthly.map(([, v]) => v);
  const projected = actual.map((v) => Math.round(v * 1.08));

  // Empty state
  if (actual.length === 0) {
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.font = "14px Inter,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No revenue data for this period", W / 2, H / 2);
    document.getElementById("xLabels").innerHTML = "";
    return;
  }

  const PAD = { top: 28, right: 24, bottom: 10, left: 64 };
  const gW = Math.max(W - PAD.left - PAD.right, 1);
  const gH = Math.max(H - PAD.top - PAD.bottom, 1);
  const n = actual.length;
  const maxV = Math.max(...actual, ...projected) * 1.15 || 1000;

  const xP = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * gW : gW / 2);
  const yP = (v) => PAD.top + gH - (v / maxV) * gH;

  /* Grid + Y labels */
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (gH / 4) * i;
    const v = Math.round(maxV - (maxV / 4) * i);
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "11px Inter,sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(
      v >= 1000 ? "\u20b9" + (v / 1000).toFixed(1) + "k" : "\u20b9" + v,
      PAD.left - 6,
      y + 4,
    );
  }

  /* Projected dashed line */
  if (n > 1) {
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(148,163,184,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    projected.forEach((v, i) =>
      i === 0 ? ctx.moveTo(xP(i), yP(v)) : ctx.lineTo(xP(i), yP(v)),
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* Actual area fill */
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + gH);
  grad.addColorStop(0, "rgba(37,99,235,0.22)");
  grad.addColorStop(1, "rgba(37,99,235,0.01)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(xP(0), yP(actual[0]));
  actual.forEach((v, i) => {
    if (i > 0) ctx.lineTo(xP(i), yP(v));
  });
  ctx.lineTo(xP(n - 1), PAD.top + gH);
  ctx.lineTo(xP(0), PAD.top + gH);
  ctx.closePath();
  ctx.fill();

  /* Actual line */
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  actual.forEach((v, i) =>
    i === 0 ? ctx.moveTo(xP(i), yP(v)) : ctx.lineTo(xP(i), yP(v)),
  );
  ctx.stroke();

  /* Dots */
  actual.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(xP(i), yP(v), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = i === n - 1 ? "#2563eb" : "#fff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    /* Amount label on the last dot */
    if (i === n - 1) {
      ctx.fillStyle = "#2563eb";
      ctx.font = "bold 11px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(rupee(v), xP(i), yP(v) - 10);
    }
  });

  /* X-axis month labels */
  const xDiv = document.getElementById("xLabels");
  xDiv.innerHTML = "";
  labels.forEach((lbl) => {
    const s = document.createElement("span");
    s.textContent = lbl;
    xDiv.appendChild(s);
  });
}

/* ─────────────────────────────────────────────
   6. TRANSACTION TABLE
   ───────────────────────────────────────────── */

const STATUS_CSS = {
  SUCCESS: "completed",
  PENDING: "pending",
  REFUNDED: "refunded",
  FAILED: "failed",
};
const STATUS_LBL = {
  SUCCESS: "COMPLETED",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

function buildRow(t) {
  const tr = document.createElement("tr");

  const grossAmount = `<strong>${rupee(t.amount)}</strong>`;
  const unitCut = `<span class="fee-neg">${rupee(t.unitManagerCut)}</span>`;
  const providerShare = `<span style="color:#3b82f6">${rupee(t.amount - t.unitManagerCut)}</span>`;

  tr.innerHTML = `
    <td><span class="txn-id">${t.id}</span></td>
    <td>${niceDate(t.date)}</td>
    <td>${grossAmount}</td>
    <td>${unitCut}</td>
    <td>${providerShare}</td>
    <td><span class="status-pill ${STATUS_CSS[t.status] || "pending"}">${STATUS_LBL[t.status] || t.status}</span></td>
    <td><button class="more-btn" data-id="${t.id}" title="View details">&#8942;</button></td>
  `;

  /* Wire ⋮ button to detail panel */
  tr.querySelector(".more-btn").addEventListener("click", () => showDetail(t));

  return tr;
}

function renderTransactions() {
  const sorted = [...activeTxns].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const total = sorted.length;
  const start = (txnPage - 1) * PER_PAGE;
  const slice = sorted.slice(start, start + PER_PAGE);

  const tbody = document.getElementById("txnBody");
  tbody.innerHTML = "";

  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;opacity:.5">
      No transactions found for this period.</td></tr>`;
  } else {
    const frag = document.createDocumentFragment();
    slice.forEach((t) => frag.appendChild(buildRow(t)));
    tbody.appendChild(frag);
  }

  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + PER_PAGE, total);
  document.getElementById("txnShowingText").textContent =
    `Showing ${from} \u2013 ${to} of ${total} transaction${total !== 1 ? "s" : ""}`;

  renderPagination(total);
}

function renderPagination(total) {
  const container = document.getElementById("txnPagination");
  container.innerHTML = "";
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (txnPage > pages) txnPage = 1;

  const makeBtn = (label, page, disabled, active) => {
    const b = document.createElement("button");
    b.className = "pg-btn" + (active ? " active" : "");
    b.textContent = label;
    b.disabled = disabled;
    if (!disabled)
      b.addEventListener("click", () => {
        txnPage = page;
        renderTransactions();
      });
    return b;
  };

  container.appendChild(makeBtn("Prev", txnPage - 1, txnPage === 1, false));
  for (let i = 1; i <= pages; i++)
    container.appendChild(makeBtn(String(i), i, false, i === txnPage));
  container.appendChild(makeBtn("Next", txnPage + 1, txnPage === pages, false));
}

/* ─────────────────────────────────────────────
   7. TRANSACTION DETAIL PANEL  (⋮ button)
      A side-sheet injected into the DOM once,
      reused for every transaction.
   ───────────────────────────────────────────── */

/* Inject the detail panel HTML once */
(function injectDetailPanel() {
  const panel = document.createElement("div");
  panel.id = "txnDetailPanel";
  panel.style.cssText = [
    "position:fixed",
    "top:0",
    "right:-380px",
    "width:360px",
    "height:100vh",
    "background:var(--surface,#1e293b)",
    "border-left:1px solid var(--border,#334155)",
    "box-shadow:-8px 0 32px rgba(0,0,0,.35)",
    "padding:28px 24px",
    "transition:right .3s cubic-bezier(.4,0,.2,1)",
    "z-index:1000",
    "overflow-y:auto",
    "font-family:Inter,sans-serif",
  ].join(";");

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h3 style="margin:0;font-size:1rem;color:var(--text-primary,#f1f5f9)">Transaction Details</h3>
      <button id="closeDetail" style="background:none;border:none;cursor:pointer;
        color:var(--text-secondary,#94a3b8);font-size:1.4rem;line-height:1">&times;</button>
    </div>
    <div id="detailContent"></div>
  `;
  document.body.appendChild(panel);

  /* Backdrop */
  const backdrop = document.createElement("div");
  backdrop.id = "detailBackdrop";
  backdrop.style.cssText = [
    "position:fixed",
    "inset:0",
    "background:rgba(0,0,0,.4)",
    "z-index:999",
    "display:none",
  ].join(";");
  document.body.appendChild(backdrop);

  function closeDetail() {
    panel.style.right = "-380px";
    backdrop.style.display = "none";
  }

  panel.querySelector("#closeDetail").addEventListener("click", closeDetail);
  backdrop.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });
})();

function showDetail(t) {
  const panel = document.getElementById("txnDetailPanel");
  const content = document.getElementById("detailContent");
  const statusColor = {
    SUCCESS: "#16a34a",
    PENDING: "#f59e0b",
    REFUNDED: "#3b82f6",
    FAILED: "#dc2626",
  };

  const grossAmount = rupee(t.amount);
  const unitManagerCut = rupee(t.unitManagerCut);
  const providerShare = rupee(t.amount - t.unitManagerCut);
  const collectiveManagerShare = rupee(t.amount * 0.04); // 4%
  const superUserShare = rupee(t.amount * 0.11); // 11%

  function row(label, value, valueStyle = "") {
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
        padding:12px 0;border-bottom:1px solid var(--border,#334155)">
        <span style="font-size:.82rem;color:var(--text-secondary,#94a3b8);min-width:120px">${label}</span>
        <span style="font-size:.88rem;color:var(--text-primary,#f1f5f9);text-align:right;font-weight:500;${valueStyle}">${value}</span>
      </div>`;
  }

  content.innerHTML = `
    <div style="text-align:center;padding:16px 0 24px">
      <div style="font-size:1.6rem;font-weight:700;color:var(--text-primary,#f1f5f9)">${grossAmount}</div>
      <span style="display:inline-block;margin-top:8px;padding:3px 12px;border-radius:999px;
        font-size:.75rem;font-weight:600;background:${statusColor[t.status] || "#94a3b8"}22;
        color:${statusColor[t.status] || "#94a3b8"}">${STATUS_LBL[t.status] || t.status}</span>
    </div>
    ${row("Transaction ID", `<code style="font-size:.8rem">${t.id}</code>`)}
    ${row("Booking Ref", t.booking_id)}
    ${row("Date & Time", niceDateTime(t.date))}
    ${row("Payment Method", t.method)}
    <div style="margin-top:24px;padding:12px;background:rgba(37,99,235,0.1);border-radius:6px">
      <div style="font-size:.75rem;font-weight:600;text-transform:uppercase;color:#64748b;margin-bottom:12px">Revenue Split</div>
      ${row("Provider (78%)", rupee(t.amount * 0.78), "color:#3b82f6")}
      ${row("Unit Manager (7%)", unitManagerCut, "color:#10b981")}
      ${row("Collective Manager (4%)", collectiveManagerShare, "color:#f59e0b")}
      ${row("Super User (11%)", superUserShare, "color:#ec4899")}
    </div>
  `;

  document.getElementById("detailBackdrop").style.display = "block";
  panel.style.right = "0";
}

/* ─────────────────────────────────────────────
   8. LAST 30 DAYS FILTER
   ───────────────────────────────────────────── */

document.getElementById("btn30Days").addEventListener("click", function () {
  is30DayMode = !is30DayMode;

  if (is30DayMode) {
    const cutoff = new Date(LATEST_TXN_DATE);
    cutoff.setDate(cutoff.getDate() - 30);
    activeTxns = ALL_TRANSACTIONS.filter((t) => new Date(t.date) >= cutoff);
    this.innerHTML = BTN30_SVG + " Last 30 Days ✓";
    this.style.outline = "2px solid currentColor";
  } else {
    activeTxns = [...ALL_TRANSACTIONS];
    this.innerHTML = BTN30_SVG + " Last 30 Days";
    this.style.outline = "";
  }

  // Recalculate GMV data for active transactions
  unitGMVData = {
    totalGMV: activeTxns.reduce((sum, t) => sum + t.amount, 0),
    unitManagerCut: activeTxns.reduce((sum, t) => sum + t.unitManagerCut, 0),
    transactionCount: activeTxns.length,
  };

  txnPage = 1;
  renderStatCards();
  setTimeout(drawChart, 0);
  renderTransactions();
});

/* ─────────────────────────────────────────────
   9. EXPORT PDF
      Injects a clean print stylesheet, hides sidebar
      and non-essential chrome, triggers window.print(),
      then removes the stylesheet.
   ───────────────────────────────────────────── */

document.getElementById("btnExportPDF").addEventListener("click", function () {
  /* Inject print-only style */
  const style = document.createElement("style");
  style.id = "printStyle";
  style.textContent = `
    @media print {
      @page { margin: 18mm 14mm; size: A4 portrait; }
      body  { background: #fff !important; color: #111 !important; font-family: Inter, sans-serif; }
      .sidebar, .topbar, .page-actions, .icon-btn,
      #txnPagination, .more-btn, #printStyle { display: none !important; }
      .main  { margin: 0 !important; }
      .card, .stat-card { box-shadow: none !important; border: 1px solid #ddd !important; }
      .stat-value  { color: #111 !important; }
      .status-pill { border: 1px solid #ccc !important; background: transparent !important; color: #111 !important; }
      .fee-neg     { color: #b91c1c !important; }
      h1, h2       { color: #111 !important; }
      canvas       { max-width: 100% !important; }
    }
  `;
  document.head.appendChild(style);

  window.print();

  /* Remove the style tag after print dialog closes
     (either cancelled or sent to printer) */
  setTimeout(() => {
    const el = document.getElementById("printStyle");
    if (el) el.remove();
  }, 1000);
});

/* ─────────────────────────────────────────────
   10. INITIAL RENDER
   ───────────────────────────────────────────── */

AppStore.ready.then(() => {
  const session = Auth.requireSession(["unit_manager"]);
  if (!session) return;

  loadRevenueDataFromStore(session);
  renderStatCards();
  renderTransactions();

  /* Draw chart one tick later so CSS layout has applied
    and canvas.offsetWidth returns the real pixel width */
  setTimeout(drawChart, 0);
});
