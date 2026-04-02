// ---- GLOBAL DATA ----
let allUnits,
  allProviders,
  allAssignments,
  allBookings,
  allBookingServices,
  allServices,
  allCategories,
  allTransactions,
  allLedger;
let myUnits, myProviders, myBookingIds;
let session, collectiveId;
let unitRevenueMap = {}; // Map of unit_id -> { gmv, cmCut, transactionCount }

// ---- DATA INITIALIZATION ----
// Wait for AppStore to be ready so we can fetch real data
AppStore.ready.then(() => {
  session = Auth.requireSession(["collective_manager"]);
  if (!session) return;
  collectiveId = session.collectiveId;

  // 1. Pull required tables
  allUnits = AppStore.getTable("units") || [];
  allProviders = AppStore.getTable("service_providers") || [];
  allAssignments = AppStore.getTable("job_assignments") || [];
  allBookings = AppStore.getTable("bookings") || [];
  allBookingServices = AppStore.getTable("booking_services") || [];
  allServices = AppStore.getTable("services") || [];
  allCategories = AppStore.getTable("categories") || [];
  allTransactions = AppStore.getTable("transactions") || [];
  allLedger = AppStore.getTable("revenue_ledger") || [];

  // 2. Scope to this collective
  myUnits = allUnits.filter((u) => u.collective_id === collectiveId);
  const myUnitIds = new Set(myUnits.map((u) => u.unit_id));
  myProviders = allProviders.filter((p) => myUnitIds.has(p.unit_id));
  const myProviderIds = new Set(myProviders.map((p) => p.service_provider_id));

  // Find assignments for providers in this collective
  const myAssignments = allAssignments.filter((a) =>
    myProviderIds.has(a.service_provider_id),
  );
  myBookingIds = new Set(myAssignments.map((a) => a.booking_id));

  // Setup event listener for period dropdown
  const periodSelect = document.getElementById("periodSelect");
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      updateReportsForPeriod(e.target.value);
    });
  }

  // Initialize with "This Week"
  updateReportsForPeriod("This Week");
});

// ---- UPDATE REPORTS BASED ON PERIOD ----
function updateReportsForPeriod(period) {
  // Calculate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate = new Date(today);
  let days = 7;

  if (period === "This Week") {
    days = 7;
    startDate.setDate(today.getDate() - 6);
  } else if (period === "This Month") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    days = 30;
  } else if (period === "This Quarter") {
    const quarter = Math.floor(today.getMonth() / 3);
    startDate = new Date(today.getFullYear(), quarter * 3, 1);
    days = 91;
  } else if (period === "This Year") {
    startDate = new Date(today.getFullYear(), 0, 1);
    days = 365;
  }

  // Get ledger entries for this collective
  const collectiveLedger = allLedger.filter(
    (entry) =>
      entry.role === "collective_manager" &&
      entry.collective_id === collectiveId,
  );

  // Build transaction map
  const txnById = new Map(allTransactions.map((t) => [t.transaction_id, t]));

  // Filter ledger entries by date range
  const periodLedgerEntries = collectiveLedger.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate >= startDate && entryDate <= today;
  });

  // Calculate unit-level aggregates
  unitRevenueMap = {};
  const myUnitIds = new Set(myUnits.map((u) => u.unit_id));

  myUnitIds.forEach((unitId) => {
    unitRevenueMap[unitId] = {
      gmv: 0,
      cmCut: 0,
      transactionCount: 0,
      unitName: "",
    };
  });

  periodLedgerEntries.forEach((entry) => {
    const txn = txnById.get(entry.transaction_id);
    if (txn) {
      // Find which unit this transaction belongs to by checking the provider
      const providers = allProviders.filter((p) => {
        const assignments = allAssignments.filter(
          (a) =>
            a.service_provider_id === p.service_provider_id &&
            a.booking_id === txn.booking_id,
        );
        return assignments.length > 0;
      });

      providers.forEach((provider) => {
        if (myUnitIds.has(provider.unit_id)) {
          if (!unitRevenueMap[provider.unit_id]) {
            unitRevenueMap[provider.unit_id] = {
              gmv: 0,
              cmCut: 0,
              transactionCount: 0,
              unitName: "",
            };
          }
          const unit = myUnits.find((u) => u.unit_id === provider.unit_id);
          unitRevenueMap[provider.unit_id].unitName = unit
            ? unit.unit_name
            : "";
          unitRevenueMap[provider.unit_id].gmv += Number(txn.amount || 0);
          unitRevenueMap[provider.unit_id].cmCut += Number(entry.amount || 0);
          unitRevenueMap[provider.unit_id].transactionCount += 1;
        }
      });
    }
  });

  // 4. Update Summary Stat Cards
  const activeProviders = myProviders.filter((p) => p.is_active).length;
  const totalGMV = periodLedgerEntries.reduce((sum, entry) => {
    const txn = txnById.get(entry.transaction_id);
    return sum + (txn ? Number(txn.amount || 0) : 0);
  }, 0);
  const totalCMCut = periodLedgerEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const totalBookings = periodLedgerEntries.length;

  updateTextAmount("stat-providers", activeProviders.toLocaleString());
  updateTextAmount("stat-bookings", totalBookings.toLocaleString());

  const fmtRev =
    "₹" + totalGMV.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  updateTextAmount("stat-revenue", fmtRev);

  const statCut =
    "₹" + totalCMCut.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  updateTextAmount("stat-cm-cut", statCut);

  const avgValue = totalBookings > 0 ? totalGMV / totalBookings : 0;
  const fmtAvg =
    "₹" +
    avgValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  updateTextAmount("stat-aov", fmtAvg);

  // 5. Generate Daily Chart Data
  window.lineData = Array(days).fill(0);
  window.barData = Array(days).fill(0);
  window.days = [];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = days - 1; i >= 0; i--) {
    let d = new Date(today);
    d.setDate(d.getDate() - i);
    if (period === "This Week") {
      window.days.push(dayNames[d.getDay()]);
    } else if (period === "This Month") {
      window.days.push(d.getDate().toString());
    } else {
      window.days.push(d.getMonth() + 1 + "/" + d.getDate());
    }
  }

  // Fill in revenue trends from ledger
  periodLedgerEntries.forEach((entry) => {
    const entryDate = new Date(entry.created_at);
    entryDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - entryDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < days) {
      const txn = txnById.get(entry.transaction_id);
      if (txn) {
        window.lineData[days - 1 - diffDays] += Number(txn.amount || 0);
        window.barData[days - 1 - diffDays] += 1;
      }
    }
  });

  // 6. Category-based revenue (for donut chart - using CMCut not GMV)
  window.categories = myUnits
    .map((unit) => ({
      name: unit.unit_name,
      color: [
        "#3b82f6",
        "#22c55e",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#ec4899",
      ][myUnits.indexOf(unit) % 7],
      gmv: unitRevenueMap[unit.unit_id]?.gmv || 0,
      cmCut: unitRevenueMap[unit.unit_id]?.cmCut || 0,
      bookings: unitRevenueMap[unit.unit_id]?.transactionCount || 0,
    }))
    .filter((u) => u.gmv > 0 || u.bookings > 0);

  // Fallback for empty state
  if (window.categories.length === 0) {
    window.categories = [
      { name: "No Data", color: "#9ca3af", gmv: 0, cmCut: 0, bookings: 0 },
    ];
  }

  // 6. Draw Charts & Tables
  drawLine();
  drawBar();
  drawDonut();
  buildTable();
}

function updateTextAmount(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---- LINE CHART ----
function drawLine() {
  const canvas = document.getElementById("lineChart");
  if (!canvas || !window.lineData) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 420;
  const H = 180;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 20, right: 20, bottom: 30, left: 55 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = Math.max(...window.lineData, 10000);

  ctx.clearRect(0, 0, W, H);

  // grid lines
  const steps = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV];
  steps.forEach((v) => {
    const y = pad.top + chartH - (v / maxV) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(
      "₹" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)),
      pad.left - 6,
      y + 4,
    );
  });

  // line
  const points = window.lineData.map((v, i) => ({
    x: pad.left + (i / (window.lineData.length - 1)) * chartW,
    y: pad.top + chartH - (v / maxV) * chartH,
  }));

  ctx.beginPath();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  points.forEach((p, i) =>
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
  );
  ctx.stroke();

  // dots + x labels
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(window.days[i], p.x, H - 6);
  });
}

// ---- BAR CHART ----
function drawBar() {
  const canvas = document.getElementById("barChart");
  if (!canvas || !window.barData) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 360;
  const H = 180;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 20, right: 10, bottom: 30, left: 35 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = Math.max(...window.barData, 10);

  ctx.clearRect(0, 0, W, H);

  // grid lines
  const steps = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV];
  steps.forEach((v) => {
    const y = pad.top + chartH - (v / maxV) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(v), pad.left - 4, y + 4);
  });

  const n = window.barData.length;
  const groupW = chartW / n;
  const barW = groupW * 0.55;

  window.barData.forEach((v, i) => {
    const x = pad.left + i * groupW + (groupW - barW) / 2;
    const bh = (v / maxV) * chartH;
    const y = pad.top + chartH - bh;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0])
      : ctx.rect(x, y, barW, bh);
    ctx.fill();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(window.days[i], x + barW / 2, H - 6);
  });
}

// ---- DONUT CHART ----
function drawDonut() {
  const canvas = document.getElementById("donutChart");
  if (!canvas || !window.categories) return;
  const ctx = canvas.getContext("2d");
  const S = 200;
  canvas.width = S * devicePixelRatio;
  canvas.height = S * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const total = window.categories.reduce((s, c) => s + c.gmv, 0) || 1;
  const cx = S / 2,
    cy = S / 2,
    r = 80,
    inner = 52;
  let start = -Math.PI / 2;

  window.categories.forEach((cat) => {
    const sweep = (cat.gmv / total) * Math.PI * 2;
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
  ctx.fillStyle = "#fff";
  ctx.fill();

  // legend
  const legend = document.getElementById("donutLegend");
  legend.innerHTML = "";
  window.categories.forEach((cat) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<div class="legend-dot" style="background:${cat.color}"></div>${cat.name}`;
    legend.appendChild(item);
  });
}

// ---- TABLE ----
function buildTable() {
  const tbody = document.getElementById("revTableBody");
  if (!tbody || !window.categories) return;
  tbody.innerHTML = ""; // clear old rows
  window.categories.forEach((unit) => {
    const avg =
      unit.bookings > 0 ? (unit.gmv / unit.bookings).toFixed(2) : "0.00";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${unit.name}</td>
      <td class="booking-link">${unit.bookings.toLocaleString()}</td>
      <td>₹${unit.gmv.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
      <td>₹${unit.cmCut.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
      <td>₹${parseFloat(avg).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- RESIZE LISTENER ----
window.addEventListener("resize", () => {
  drawLine();
  drawBar();
});
