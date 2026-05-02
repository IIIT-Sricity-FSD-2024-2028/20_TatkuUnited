/* =============================================================================
   PROVIDER DASHBOARD — dashboard.js (API-backed)
   ============================================================================= */

let jobs = [];
let earnStats = [];
let notifications = [];
let providerRatings = { average: null, count: 0, items: [] };

const badgeMap = {
  completed: "badge-completed",
  inprogress: "badge-inprogress",
  assigned: "badge-assigned",
  pending: "badge-pending",
  cancelled: "badge-pending",
};

function formatDateDisplay(dStr) {
  if (!dStr) return "";
  const d = new Date(dStr);
  return isNaN(d)
    ? dStr
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function renderTimeline() {
  const grid = document.getElementById("timeline-grid");
  const upcoming = jobs.slice(0, 4);
  grid.innerHTML = upcoming
    .map(
      (j, i) => `
    <div class="tl-card ${i === 0 && j.status !== "completed" ? "next-job" : ""}" style="animation-delay:${i * 0.07}s">
      <div class="tl-time">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${j.time || "TBD"}
      </div>
      <div class="tl-service">${j.service}</div>
      <div class="tl-customer">${j.customer}</div>
      <div class="tl-address">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${j.address || "Address pending"}
      </div>
      <span class="tl-badge ${badgeMap[j.status] || "badge-pending"}">${j.statusLabel}</span>
    </div>
  `,
    )
    .join("");
}

function renderJobsTable() {
  const tbody = document.getElementById("jobs-tbody");
  const recent = jobs.slice(0, 5);
  tbody.innerHTML = recent
    .map(
      (j) => `
    <tr onclick="window.location='assigned-jobs.html'">
      <td>${j.service}</td>
      <td>${j.customer}</td>
      <td style="color:var(--text-2)">${j.address || ""}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${formatDateDisplay(j.date)}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${j.time || ""}</td>
      <td><span class="tl-badge ${badgeMap[j.status] || "badge-pending"}">${j.statusLabel}</span></td>
    </tr>
  `,
    )
    .join("");
}

function renderEarnStats() {
  const el = document.getElementById("earn-stats");
  el.innerHTML = earnStats
    .map(
      (s) => `
    <div class="earn-stat">
      <div class="es-label">${s.label}</div>
      <div class="es-value">${s.value}</div>
    </div>
  `,
    )
    .join("");
}

function renderNotifs() {
  const el = document.getElementById("notif-list");
  el.innerHTML = notifications
    .slice(0, 3)
    .map(
      (n) => `
    <li><span class="notif-dot-green"></span>${n.title}</li>
  `,
    )
    .join("");
}

async function buildProviderRatings(providerId) {
  if (!providerId) return { average: null, count: 0, items: [] };

  try {
    const reviews = await Api.get("/reviews/provider/" + providerId, { silent: true }) || [];
    if (!reviews.length) return { average: null, count: 0, items: [] };

    const mapped = reviews
      .filter((r) => Number.isFinite(Number(r.rating)))
      .map((r) => ({
        score: Math.max(1, Math.min(5, Number(r.rating))),
        text: (r.comment || r.review_text || "").trim(),
        date: r.updated_at || r.created_at || null,
      }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    if (!mapped.length) return { average: null, count: 0, items: [] };

    const average = mapped.reduce((sum, r) => sum + r.score, 0) / mapped.length;
    return { average, count: mapped.length, items: mapped.slice(0, 3) };
  } catch (_) {
    return { average: null, count: 0, items: [] };
  }
}

function renderProviderRatings() {
  const scoreEl = document.getElementById("provider-rating-score");
  const countEl = document.getElementById("provider-rating-count");
  const listEl = document.getElementById("provider-rating-list");
  if (!scoreEl || !countEl || !listEl) return;

  if (!Number.isFinite(providerRatings.average)) {
    scoreEl.textContent = "N/A";
    countEl.textContent = "0 reviews";
    listEl.innerHTML =
      '<div class="rating-item"><div class="rating-item-text">No customer reviews yet.</div></div>';
    return;
  }

  scoreEl.textContent = `${providerRatings.average.toFixed(2)} / 5`;
  countEl.textContent = `${providerRatings.count} review${providerRatings.count === 1 ? "" : "s"}`;
  listEl.innerHTML = providerRatings.items
    .map((item) => {
      const dateLabel = item.date
        ? new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "N/A";
      const stars = "★".repeat(Math.round(item.score));
      const preview = item.text || "Customer submitted a rating.";

      return `
        <div class="rating-item">
          <div class="rating-item-top">
            <span class="rating-item-stars">${stars}</span>
            <span class="rating-item-date">${dateLabel}</span>
          </div>
          <div class="rating-item-text">${preview}</div>
        </div>
      `;
    })
    .join("");
}

// ===== INIT =====
(async () => {
  const session = Auth.requireSession(["provider"]);
  if (!session) return;

  const spId = session.id;

  // Fetch provider profile
  let provider = null;
  try {
    provider = await Api.get("/service-providers/" + spId, { silent: true });
  } catch (_) {}

  // Fetch job assignments
  let rawJobs = [];
  try {
    rawJobs = await Api.get("/job-assignments/provider/" + spId, { silent: true }) || [];
  } catch (_) {}

  // Map raw assignments to the shape the UI expects
  jobs = rawJobs.map((ja) => {
    const statusMap = {
      ASSIGNED: "assigned",
      IN_PROGRESS: "inprogress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
    };
    const labelMap = {
      ASSIGNED: "Assigned",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    const st = ja.status || "ASSIGNED";
    const scheduledAt = ja.scheduled_at || ja.booking?.scheduled_at;
    const dateObj = scheduledAt ? new Date(scheduledAt) : null;

    return {
      service: ja.service_name || ja.booking?.service_name || "Service",
      customer: ja.customer_name || ja.booking?.customer_name || "Customer",
      address: ja.address || ja.booking?.address || "",
      date: dateObj ? dateObj.toISOString().split("T")[0] : "",
      time: dateObj ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
      status: statusMap[st] || "pending",
      statusLabel: labelMap[st] || st,
      price: ja.price_snapshot || ja.booking?.total_price || 0,
    };
  });

  // Build earn stats from revenue ledger
  let ledger = [];
  try {
    ledger = await Api.get("/revenue-ledger/provider/" + spId, { silent: true }) || [];
  } catch (_) {}

  const totalEarned = ledger.reduce((s, r) => s + (r.provider_amount || 0), 0);
  const pending = ledger.filter((r) => r.payout_status === "PENDING").reduce((s, r) => s + (r.provider_amount || 0), 0);
  const completedJobs = jobs.filter((j) => j.status === "completed").length;

  earnStats = [
    { label: "Total Earned", value: "₹" + totalEarned.toLocaleString("en-IN") },
    { label: "Pending Payout", value: "₹" + pending.toLocaleString("en-IN") },
    { label: "Jobs Done", value: String(completedJobs) },
  ];

  notifications = [
    { title: "You have " + jobs.filter((j) => j.status === "assigned").length + " upcoming assignment(s)" },
  ];

  // Provider info
  if (provider) {
    document.querySelectorAll(".user-chip span").forEach((el) => (el.textContent = provider.name || "Provider"));
    if (provider.pfp_url) {
      document.querySelectorAll(".user-avatar").forEach((el) => {
        el.innerHTML = `<img src="${provider.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      });
    }
    const titleObj = document.querySelector(".page-title");
    if (titleObj && provider.name) {
      titleObj.textContent = `Welcome back, ${provider.name.split(" ")[0]}!`;
    }
  }

  providerRatings = await buildProviderRatings(spId);

  const earnAmtEl = document.querySelector(".earn-amount");
  if (earnAmtEl) {
    earnAmtEl.textContent = "₹" + totalEarned.toLocaleString("en-IN");
  }

  renderTimeline();
  renderJobsTable();
  renderEarnStats();
  renderNotifs();
  renderProviderRatings();
})();
