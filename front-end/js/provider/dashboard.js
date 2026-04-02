// ===== DATA =====
let jobs = [];
let earnStats = [];
let notifications = [];
let currentProviderId = null;

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

function updateProviderDashboard() {
  if (!currentProviderId) return;

  const allAssignments = AppStore.getTable('job_assignments') || [];
  const allBookings = AppStore.getTable('bookings') || [];
  const allCustomers = AppStore.getTable('customers') || [];

  const providerAssignments = allAssignments.filter(a => a.service_provider_id === currentProviderId);
  const providerBookingIds = new Set(providerAssignments.map((a) => a.booking_id));

  jobs = providerAssignments.map((ja) => {
    const booking = allBookings.find((b) => b.booking_id === ja.booking_id) || {};
    const customer = allCustomers.find((c) => c.customer_id === booking.customer_id) || {};

    const statusMap = {
      ASSIGNED: 'assigned',
      IN_PROGRESS: 'inprogress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      PENDING: 'pending'
    };
    const uiStatus = statusMap[ja.status] || 'assigned';
    const labelMap = {
      assigned: 'Assigned',
      inprogress: 'In Progress',
      completed: 'Completed',
      pending: 'Pending',
      cancelled: 'Cancelled'
    };

    const serviceName = booking.service_name || 'Home Service';
    const totalPrice = Number(booking.price || 0);

    return {
      id: ja.assignment_id,
      service: serviceName,
      customer: customer.full_name || customer.name || 'Unknown User',
      address: booking.service_address || 'Unknown Address',
      date: ja.scheduled_date || booking.scheduled_at || new Date().toISOString(),
      time: ja.hour_start ? `${ja.hour_start} - ${ja.hour_end}` : '',
      status: uiStatus,
      statusLabel: labelMap[uiStatus],
      price: totalPrice,
    };
  });

  const derived = AppStore.getDerivedMetrics({ providerId: currentProviderId });
  earnStats = [
    { label: 'Total Revenue', value: `₹${derived.revenue.toLocaleString('en-IN')}` },
    { label: 'Completed Jobs', value: `${derived.completedBookings}` },
    { label: 'Pending Jobs', value: `${derived.pendingJobs}` },
    { label: 'Failed Assignments', value: `${derived.failedAssignments}` },
  ];

  notifications = [
    { id: 201, title: 'Real time sync active', text: 'Dashboard reflects updates immediately.' },
    { id: 202, title: 'Job status tracking', text: 'All job status updates are centralized.' },
  ];

  const session = Auth.getSession();
  if (session && session.name) {
    document.querySelectorAll('.user-chip span').forEach((el) => (el.textContent = session.name));
    const titleObj = document.querySelector('.page-title');
    if (titleObj) {
      titleObj.textContent = `Welcome back, ${session.name.split(' ')[0]}!`;
    }
  }

  const totalEarnings = derived.revenue;
  const earnAmtEl = document.querySelector('.earn-amount');
  if (earnAmtEl) {
    earnAmtEl.textContent = '₹' + totalEarnings.toLocaleString('en-IN');
  }

  renderTimeline();
  renderJobsTable();
  renderEarnStats();
  renderNotifs();
}

function renderTimeline() {
  const grid = document.getElementById("timeline-grid");
  const upcoming = jobs.slice(0, 4);
  if (!grid) return;
  grid.innerHTML = upcoming
    .map((j, i) => `
      <div class="tl-card ${i === 0 && j.status !== 'completed' ? 'next-job' : ''}" style="animation-delay:${i * 0.07}s">
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
        <span class="tl-badge ${badgeMap[j.status] || 'badge-pending'}">${j.statusLabel}</span>
      </div>
    `)
    .join('');
}

function renderJobsTable() {
  const tbody = document.getElementById('jobs-tbody');
  if (!tbody) return;
  const recent = jobs.slice(0, 5);
  tbody.innerHTML = recent
    .map((j) => `
      <tr onclick="window.location='assigned-jobs.html'">
        <td>${j.service}</td>
        <td>${j.customer}</td>
        <td style="color:var(--text-2)">${j.address}</td>
        <td style="font-family:var(--font-mono);font-size:12.5px">${formatDateDisplay(j.date)}</td>
        <td style="font-family:var(--font-mono);font-size:12.5px">${j.time}</td>
        <td><span class="tl-badge ${badgeMap[j.status] || 'badge-pending'}">${j.statusLabel}</span></td>
      </tr>
    `)
    .join('');
}

function renderEarnStats() {
  const el = document.getElementById('earn-stats');
  if (!el) return;
  el.innerHTML = earnStats
    .map(
      (s) => `
      <div class="earn-stat">
        <div class="es-label">${s.label}</div>
        <div class="es-value">${s.value}</div>
      </div>
    `,
    )
    .join('');
}

function renderNotifs() {
  const el = document.getElementById('notif-list');
  if (!el) return;
  el.innerHTML = notifications
    .slice(0, 3)
    .map((n) => `
      <li><span class="notif-dot-green"></span>${n.title}</li>
    `)
    .join('');
}

AppStore.ready.then(() => {
  const session = Auth.requireSession(['provider']);
  if (!session) return;

  currentProviderId = session.id;

  updateProviderDashboard();
  AppStore.subscribe(updateProviderDashboard);
});
