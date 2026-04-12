// ===== DATA =====
let jobs = [];
let earnStats = [];
let notifications = [];
let providerRatings = { average: null, count: 0, items: [] };

// ===== BADGE MAP =====
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

// ===== RENDER TIMELINE =====
function renderTimeline() {
  const grid = document.getElementById("timeline-grid");
  const upcoming = jobs.slice(0, 4);
  grid.innerHTML = upcoming
    .map(
      (j, i) => `
    <div class="tl-card ${i === 0 && j.status !== "completed" ? "next-job" : ""}" style="animation-delay:${i * 0.07}s">
      <div class="tl-time">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${j.time}
      </div>
      <div class="tl-service">${j.service}</div>
      <div class="tl-customer">${j.customer}</div>
      <div class="tl-address">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${j.address}
      </div>
      <span class="tl-badge ${badgeMap[j.status] || "badge-pending"}">${j.statusLabel}</span>
    </div>
  `,
    )
    .join("");
}

// ===== RENDER JOBS TABLE =====
function renderJobsTable() {
  const tbody = document.getElementById("jobs-tbody");
  const recent = jobs.slice(0, 5);
  tbody.innerHTML = recent
    .map(
      (j) => `
    <tr onclick="window.location='assigned-jobs.html'">
      <td>${j.service}</td>
      <td>${j.customer}</td>
      <td style="color:var(--text-2)">${j.address}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${formatDateDisplay(j.date)}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${j.time}</td>
      <td><span class="tl-badge ${badgeMap[j.status] || "badge-pending"}">${j.statusLabel}</span></td>
    </tr>
  `,
    )
    .join("");
}

// ===== RENDER EARN STATS =====
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

// ===== RENDER NOTIFICATIONS =====
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

function buildProviderRatings(providerId) {
  if (!window.AppStore || !providerId) {
    return { average: null, count: 0, items: [] };
  }

  const reviews = AppStore.getTable("reviews") || [];
  const assignments = AppStore.getTable("job_assignments") || [];

  const latestAssignmentByBooking = new Map();
  assignments.forEach((assignment) => {
    const existing = latestAssignmentByBooking.get(assignment.booking_id);
    if (!existing) {
      latestAssignmentByBooking.set(assignment.booking_id, assignment);
      return;
    }

    const existingTs = new Date(
      existing.updated_at || existing.assigned_at || existing.created_at || 0,
    ).getTime();
    const currentTs = new Date(
      assignment.updated_at ||
        assignment.assigned_at ||
        assignment.created_at ||
        0,
    ).getTime();
    if (currentTs >= existingTs) {
      latestAssignmentByBooking.set(assignment.booking_id, assignment);
    }
  });

  const providerReviews = reviews
    .filter((review) => {
      if (review.provider_id === providerId) return true;
      if (!review.booking_id) return false;
      const latestAssignment = latestAssignmentByBooking.get(review.booking_id);
      return (
        latestAssignment && latestAssignment.service_provider_id === providerId
      );
    })
    .filter((review) => Number.isFinite(Number(review.rating)))
    .map((review) => ({
      score: Math.max(1, Math.min(5, Number(review.rating))),
      text: (review.review_text || "").trim(),
      date: review.updated_at || review.created_at || null,
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!providerReviews.length) {
    return { average: null, count: 0, items: [] };
  }

  const average =
    providerReviews.reduce((sum, review) => sum + review.score, 0) /
    providerReviews.length;

  return {
    average,
    count: providerReviews.length,
    items: providerReviews.slice(0, 3),
  };
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
window.initData().then(() => {
  const data = window.getData();
  jobs = data.jobs || [];
  earnStats = data.stats || [];
  notifications = data.notifications || [];

  if (data.provider) {
    document
      .querySelectorAll(".user-chip span")
      .forEach((el) => (el.textContent = data.provider.name || "Provider"));
    if (data.provider.pfp_url) {
      document.querySelectorAll(".user-avatar").forEach((el) => {
        el.innerHTML = `<img src="${data.provider.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      });
    }
    const titleObj = document.querySelector(".page-title");
    if (titleObj && data.provider.name) {
      titleObj.textContent = `Welcome back, ${data.provider.name.split(" ")[0]}!`;
    }

    providerRatings = buildProviderRatings(data.provider.service_provider_id);
  }

  // Calculate top weekly earnings dynamically
  let totalEarnings = 0;
  jobs.forEach((job) => {
    if (job.status === "completed") {
      totalEarnings += job.price || 0;
    }
  });

  const earnAmtEl = document.querySelector(".earn-amount");
  if (earnAmtEl) {
    earnAmtEl.textContent = "₹" + totalEarnings.toLocaleString("en-IN");
  }

  renderTimeline();
  renderJobsTable();
  renderEarnStats();
  renderNotifs();
  renderProviderRatings();
});
