/* =============================================================================
   PROVIDER EARNINGS — earnings.js (API-backed)
   ============================================================================= */

// Load Chart.js
const script = document.createElement("script");
script.src =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
script.onload = init;
document.head.appendChild(script);

let chartInstance = null;
let activeRange = 30;
let payoutRows = [];
let payoutByRef = new Map();
let activeReceiptRef = null;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getTimestamp(value) {
  const d = parseDate(value);
  return d ? d.getTime() : 0;
}

function formatCurrency(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function formatDisplayDate(value) {
  const d = parseDate(value);
  if (!d) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

async function buildPayoutRows() {
  const session = Auth.getSession();
  if (!session) return;

  const spId = session.id;

  try {
    const ledgerEntries = await Api.get("/revenue-ledger/provider/" + spId);

    payoutRows = (ledgerEntries.rows || []).map((entry) => {
      const status =
        ["DISBURSED", "PAID"].includes((entry.payout_status || "").toUpperCase())
          ? "paid"
          : "pending";
      const effectiveDate =
        status === "paid"
          ? entry.paid_at || entry.created_at
          : entry.created_at;

      const providerAmt = Number(entry.provider_amount || entry.sp_amount || entry.amount || 0);

      return {
        ref: entry.ledger_id || entry.id,
        date: effectiveDate,
        displayDate: formatDisplayDate(effectiveDate),
        amount: providerAmt,
        amountLabel: formatCurrency(providerAmt),
        status,
        customer: entry.booking_id || "-",
        service: entry.booking_id || "-",
        bookingId: entry.booking_id || null,
        paymentMethod: entry.payment_method || "-",
        transactionId: entry.transaction_id || "-",
        paymentStatusRaw: status === "paid" ? "SUCCESS" : "PENDING",
        originalAmount: providerAmt > 0 ? Math.round((providerAmt / 0.78) * 100) / 100 : 0,
      };
    });

    payoutRows.sort((a, b) => getTimestamp(b.date) - getTimestamp(a.date));
    payoutByRef = new Map(payoutRows.map((row) => [row.ref, row]));
  } catch (err) {
    console.error("[earnings] Failed to load revenue ledger:", err);
    payoutRows = [];
    payoutByRef = new Map();
  }
}

function renderStats() {
  const totalRevenue = payoutRows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amount, 0);

  const pendingPayout = payoutRows
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + row.amount, 0);

  const grossEarnings = payoutRows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.originalAmount, 0);

  const paidCount = payoutRows.filter((row) => row.status === "paid").length;
  const totalJobs = payoutRows.length;
  const avgValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  const dynamicStats = [
    {
      label: "Total Earnings",
      value: formatCurrency(totalRevenue),
      sub: `${paidCount} booking${paidCount !== 1 ? "s" : ""} completed`,
      subClass: "stat-change positive",
    },
    {
      label: "Pending Payout",
      value: formatCurrency(pendingPayout),
      sub: `${totalJobs - paidCount} awaiting settlement`,
      subClass: "stat-sub",
    },
    {
      label: "Gross Service Value",
      value: formatCurrency(grossEarnings),
      sub: "You earned 78% of this",
      subClass: "stat-blue",
    },
    {
      label: "Average Booking Value",
      value: formatCurrency(avgValue),
      sub: "Per completed booking",
      subClass: "stat-sub",
    },
  ];

  document.getElementById("stats-row").innerHTML = dynamicStats
    .map(
      (s) => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="${s.subClass}">${s.sub}</div>
    </div>
  `,
    )
    .join("");
}

function renderPayouts() {
  const payoutBody = document.getElementById("payout-tbody");
  if (!payoutRows.length) {
    payoutBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:#64748b;">No payout records available</td>
      </tr>
    `;
    return;
  }

  payoutBody.innerHTML = payoutRows
    .map((p) => {
      const badgeClass =
        p.status === "paid"
          ? "badge-paid"
          : p.status === "refunded"
            ? "badge-pending-pay"
            : "badge-pending-pay";
      const badgeLabel =
        p.status === "paid"
          ? "PAID"
          : p.status === "refunded"
            ? "REFUNDED"
            : "PENDING";
      const action =
        p.status === "paid"
          ? `<span class="receipt-link" onclick="showReceipt('${p.ref}')" style="cursor: pointer; color: #2563eb; text-decoration: underline; font-weight: 500;">Receipt</span>`
          : "—";

      return `
    <tr>
      <td>${p.displayDate}</td>
      <td class="ref-id">${p.ref}</td>
      <td class="amount-val">${p.amountLabel}</td>
      <td><span class="${badgeClass}">${badgeLabel}</span></td>
      <td>${action}</td>
    </tr>
  `;
    })
    .join("");
}

function showReceipt(refId) {
  const row = payoutByRef.get(refId);
  if (!row || row.status !== "paid") return;

  activeReceiptRef = row.ref;

  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Ref #</span>
      <span style="font-weight: 600; color: #0f172a;">${row.ref}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Date</span>
      <span style="color: #0f172a;">${row.displayDate}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #64748b;">Booking</span>
      <span style="color: #0f172a;">${row.customer}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
      <span style="color: #64748b;">Transaction ID</span>
      <span style="color: #0f172a;">${row.transactionId}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
      <span style="color: #0f172a;">Total Payout</span>
      <span style="color: #10b981;">${row.amountLabel}</span>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; font-family: 'Sora', sans-serif;">
      Payout deposited to registered bank account.<br>Status: ${row.paymentStatusRaw}
    </div>
  `;
  document.getElementById("receipt-details").innerHTML = content;
  const modal = document.getElementById("receipt-modal");
  modal.style.display = "flex";
  modal.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 200,
    fill: "forwards",
  });
}

function closeReceipt() {
  const modal = document.getElementById("receipt-modal");
  const anim = modal.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 150,
    fill: "forwards",
  });
  anim.onfinish = () => {
    modal.style.display = "none";
    activeReceiptRef = null;
  };
}

function downloadReceipt() {
  if (!activeReceiptRef) return;

  const row = payoutByRef.get(activeReceiptRef);
  if (!row) return;

  const entries = [
    ["Ref #", row.ref],
    ["Date", row.displayDate],
    ["Booking", row.customer],
    ["Transaction ID", row.transactionId],
    ["Total Payout", row.amountLabel],
    ["Status", row.paymentStatusRaw],
  ];

  const labelWidth = Math.max(...entries.map(([label]) => label.length));
  const formatLine = (label, value) =>
    `${label.padEnd(labelWidth, " ")} : ${String(value || "-")}`;

  let formattedText = "==============================================\n";
  formattedText += "                TATKU UNITED                  \n";
  formattedText += "           PROVIDER PAYOUT RECEIPT            \n";
  formattedText += "==============================================\n\n";

  entries.forEach(([label, value]) => {
    formattedText += formatLine(label, value) + "\n";
  });

  formattedText += "\n==============================================\n";
  formattedText += "       Payout deposited to registered account.\n";
  formattedText += "            Powered by Tatku United Inc.      \n";

  const blob = new Blob([formattedText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Tatku_Payout_Receipt_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildDailyRevenueSeries(range) {
  const labels = [];
  const data = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const paidByDate = new Map();
  payoutRows
    .filter((row) => row.status === "paid")
    .forEach((row) => {
      const d = parseDate(row.date);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      paidByDate.set(key, (paidByDate.get(key) || 0) + row.amount);
    });

  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(
      range === 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
    data.push(paidByDate.get(key) || 0);
  }

  return { labels, data };
}

function buildChart(range) {
  const { labels, data } = buildDailyRevenueSeries(range);
  const ctx = document.getElementById("earn-chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, "rgba(37,99,235,0.85)");
  gradient.addColorStop(1, "rgba(37,99,235,0.35)");

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: gradient,
          borderRadius: 5,
          borderSkipped: false,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#94a3b8",
          bodyColor: "#fff",
          bodyFont: { family: "JetBrains Mono", size: 13, weight: "600" },
          callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString("en-IN")}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { family: "Sora", size: 10 },
            color: "#94a3b8",
            maxTicksLimit: range === 30 ? 6 : 7,
          },
        },
        y: {
          grid: { color: "#f1f5f9" },
          border: { display: false, dash: [4, 4] },
          ticks: {
            font: { family: "JetBrains Mono", size: 10 },
            color: "#94a3b8",
            callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
          },
        },
      },
    },
  });
}

function setRange(r) {
  activeRange = r;
  document.getElementById("btn-7").classList.toggle("active", r === 7);
  document.getElementById("btn-30").classList.toggle("active", r === 30);
  buildChart(r);
}

async function init() {
  const session = Auth.requireSession(["provider", "service_provider"]);
  if (!session) return;

  // Update provider name in UI
  document
    .querySelectorAll(".user-chip span")
    .forEach((el) => (el.textContent = session.name || "Provider"));

  await buildPayoutRows();
  renderStats();
  renderPayouts();
  buildChart(30);
}
