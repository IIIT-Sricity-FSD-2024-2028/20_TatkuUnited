/* =============================================================================
   PROVIDER ASSIGNED JOBS — assigned-jobs.js (API-backed)
   ============================================================================= */

let jobs = [];

const statusMap = {
  inprogress: "badge-inprogress",
  assigned: "badge-assigned",
  pending: "badge-pending",
  completed: "badge-completed",
  cancelled: "badge-pending",
};
let activeFilter = "all";

// Render filters
function renderFilters() {
  const filters = ["all", "assigned", "inprogress", "completed"];
  const labels = {
    all: "All",
    assigned: "Assigned",
    inprogress: "In Progress",
    pending: "Pending",
    completed: "Completed",
  };
  document.getElementById("filter-row").innerHTML = filters
    .map(
      (f) => `
    <button class="filter-btn ${f === activeFilter ? "active" : ""}" onclick="setFilter('${f}')">${labels[f]}</button>
  `,
    )
    .join("");
}

function setFilter(f) {
  activeFilter = f;
  renderFilters();
  renderJobs();
}

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

function renderJobs() {
  const list = document.getElementById("jobs-list");
  const filtered =
    activeFilter === "all"
      ? jobs
      : jobs.filter((j) => j.status === activeFilter);
  list.innerHTML = filtered
    .map(
      (j, i) => `
    <div class="job-row" style="animation-delay:${i * 0.06}s" onclick="openDetail('${j.id}')">
      <div class="job-meta">
        <div class="job-top">
          <span class="job-service">${j.service}</span>
          <span class="job-cat">${j.category}</span>
          <span class="badge ${statusMap[j.status] || "badge-pending"}">${j.statusLabel}</span>
        </div>
        <div class="job-details">
          <div class="jd-item">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${j.customer}
          </div>
          <div class="jd-item">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${j.address}
          </div>
          <div class="jd-item">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${formatDateDisplay(j.date)}
          </div>
          <div class="jd-item">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${j.time}
          </div>
        </div>
      </div>
      <div class="job-right">
        <div class="job-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>
    </div>
  `,
    )
    .join("");
}

function openDetail(id) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  const steps = ["Assigned", "In Progress", "Completed"];
  const stepStatus = { assigned: 0, inprogress: 1, completed: 2 };
  const current = stepStatus[job.status] ?? (job.status === "pending" ? -1 : 0);
  document.getElementById("modal-content").innerHTML = `
    <div class="modal-job-title">${job.service}</div>
    <div class="modal-job-id">Job #${job.id}</div>

    <div class="modal-section">
      <div class="modal-section-title">Job Status</div>
      <div class="status-stepper">
        ${steps
          .map(
            (s, i) => `
          ${i > 0 ? `<div class="step-line ${i <= current ? "done" : ""}"></div>` : ""}
          <div class="step">
            <div class="step-dot ${i <= current ? "done" : ""}">
              <svg viewBox="0 0 24 24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="step-label ${i === current ? "active" : ""}">${s}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      ${
        job.status !== "completed" && job.status !== "cancelled"
          ? `
        ${job.status === "assigned" ? `<button class="modal-btn modal-btn-primary" onclick="updateStatus('${job.id}', 'inprogress')">Mark In Progress</button>` : ""}
        <button class="modal-btn modal-btn-success" onclick="updateStatus('${job.id}', 'completed')">Mark Completed</button>
      `
          : ""
      }
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Service Information</div>
      <p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:14px">${job.description}</p>
      <div class="modal-section-title" style="margin-bottom:8px">Service Notes</div>
      <textarea class="notes-area" placeholder="Add notes about this job..."></textarea>
      <button class="save-notes-btn">Save Notes</button>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Customer Details</div>
      <div class="modal-grid">
        <div class="modal-field"><label>Customer Name</label><p>${job.customer}</p></div>
        <div class="modal-field"><label>Contact Number</label><p>${job.phone}</p></div>
        <div class="modal-field" style="grid-column:1/-1"><label>Address</label><p>${job.address}</p></div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Schedule Details</div>
      <div class="modal-grid">
        <div class="modal-field"><label>Scheduled Date</label><p>${formatDateDisplay(job.date)}</p></div>
        <div class="modal-field"><label>Scheduled Time</label><p>${job.time}</p></div>
      </div>
    </div>
  `;
  document.getElementById("modal-overlay").classList.add("open");
}

function closeDetailModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}
function closeModal(e) {
  if (e.target === document.getElementById("modal-overlay")) closeDetailModal();
}

async function updateStatus(id, newStatus) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;

  // Validation: Do not allow future jobs to be marked as completed or in progress early
  if (newStatus === "completed" || newStatus === "inprogress") {
    try {
      const jobDateTime = new Date(job.rawDate);
      const currentRealTime = new Date();

      if (!isNaN(jobDateTime.getTime()) && jobDateTime > currentRealTime) {
        alert(
          `Security Check: You cannot change the status to '${newStatus === "completed" ? "Completed" : "In Progress"}' for a job scheduled in the future.\n\nCurrent Real Time: ${currentRealTime.toLocaleString()}\nAssigned Time: ${jobDateTime.toLocaleString()}`,
        );
        return;
      }
    } catch (e) {
      console.warn("Time parsing error, skipping strict block", e);
    }
  }

  if (newStatus === "inprogress") {
    try {
      await Api.patch("/job-assignments/" + id + "/in-progress", {});
      Api.showToast("Job marked as in progress!", "success");
    } catch (err) {
      console.error("[jobs] In-progress failed:", err);
      return;
    }
  }

  if (newStatus === "completed") {
    try {
      await Api.patch("/job-assignments/" + id + "/complete", {
        completion_notes: "Completed by provider",
      });
      Api.showToast("Job marked as completed!", "success");
    } catch (err) {
      console.error("[jobs] Complete failed:", err);
      return;
    }
  }

  // Reload jobs from API
  await loadJobs();
  openDetail(id);
  renderJobs();
}

async function loadJobs() {
  const session = Auth.getSession();
  if (!session) return;

  const spId = session.id;

  try {
    const assignments = await Api.get("/job-assignments/provider/" + spId);

    jobs = (assignments || []).map((ja) => {
      const rawStatus = (ja.status || "ASSIGNED").toUpperCase();
      const statusCssMap = {
        ASSIGNED: "assigned",
        IN_PROGRESS: "inprogress",
        COMPLETED: "completed",
        PENDING: "pending",
        CANCELLED: "cancelled",
      };
      const statusLabelMap = {
        ASSIGNED: "Assigned",
        IN_PROGRESS: "In Progress",
        COMPLETED: "Completed",
        PENDING: "Pending Confirmation",
        CANCELLED: "Cancelled",
      };

      const dateObj = new Date(ja.scheduled_at || ja.assigned_at || ja.created_at);

      return {
        id: ja.assignment_id || ja.id,
        booking_id: ja.booking_id,
        service: ja.service_name || "Home Service",
        category: ja.category_name || "Service",
        customer: ja.customer_name || "Customer",
        phone: ja.customer_phone || "N/A",
        address: ja.service_address || "Address not provided",
        status: statusCssMap[rawStatus] || "assigned",
        statusLabel: statusLabelMap[rawStatus] || "Assigned",
        rawDate: ja.scheduled_at || ja.assigned_at || ja.created_at,
        date: dateObj.toISOString().split("T")[0],
        time: dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        description: ja.notes || "Service assignment for provider",
      };
    });
  } catch (err) {
    console.error("[jobs] Failed to load assignments:", err);
    jobs = [];
  }
}

(async () => {
  const session = Auth.requireSession(["provider", "service_provider"]);
  if (!session) return;

  // Update provider name in UI
  document
    .querySelectorAll(".user-chip span")
    .forEach((el) => (el.textContent = session.name || "Provider"));

  await loadJobs();
  renderFilters();
  renderJobs();
})();
