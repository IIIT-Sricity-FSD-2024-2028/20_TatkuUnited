// ===== DATA =====
const timelineJobs = [
  { time: '08:00 AM', service: 'Plumbing Repair', customer: 'Aarav Sharma', address: '22 MG Road, Indiranagar', status: 'completed' },
  { time: '11:30 AM', service: 'AC Installation', customer: 'Neha Kapoor', address: '17 Palm Residency, Koramangala', status: 'next' },
  { time: '02:15 PM', service: 'Deep Cleaning', customer: 'Rahul Mehta', address: 'B-12 Orchid Enclave, HSR', status: 'upcoming' },
  { time: '05:00 PM', service: 'Electrical Inspection', customer: 'Priya Iyer', address: '49 Skyline Apartments, Whitefield', status: 'upcoming' },
];

const assignedJobs = [
  { service: 'AC Installation', customer: 'Neha Kapoor', address: '17 Palm Residency, Koramangala', date: 'Apr 10, 2026', time: '11:30 AM', status: 'inprogress', statusLabel: 'In Progress' },
  { service: 'Deep Cleaning', customer: 'Rahul Mehta', address: 'B-12 Orchid Enclave, HSR', date: 'Apr 10, 2026', time: '02:15 PM', status: 'assigned', statusLabel: 'Assigned' },
  { service: 'Electrical Inspection', customer: 'Priya Iyer', address: '49 Skyline Apartments, Whitefield', date: 'Apr 10, 2026', time: '05:00 PM', status: 'assigned', statusLabel: 'Assigned' },
  { service: 'Water Heater Service', customer: 'Siddharth Rao', address: '8 Lotus Court, JP Nagar', date: 'Apr 11, 2026', time: '09:00 AM', status: 'pending', statusLabel: 'Pending Confirmation' },
];

const earnStats = [
  { label: 'Completed Jobs', value: '18' },
  { label: 'Avg. Ticket', value: '₹1,367' },
  { label: 'Pending Payout', value: '₹4,300' },
  { label: 'Cancelled', value: '2' },
];

const notifications = [
  'Customer Neha Kapoor confirmed arrival instructions.',
  'Weekly payout processed successfully.',
  'New service rating received: 4.9/5.',
  "Tomorrow's first job starts at 9:00 AM.",
];

// ===== BADGE MAP =====
const badgeMap = {
  completed: 'badge-completed',
  next: 'badge-next',
  upcoming: 'badge-upcoming',
  inprogress: 'badge-inprogress',
  assigned: 'badge-assigned',
  pending: 'badge-pending',
};
const labelMap = {
  completed: 'Completed',
  next: 'Next Job',
  upcoming: 'Upcoming',
  inprogress: 'In Progress',
  assigned: 'Assigned',
  pending: 'Pending Confirmation',
};

// ===== RENDER TIMELINE =====
function renderTimeline() {
  const grid = document.getElementById('timeline-grid');
  grid.innerHTML = timelineJobs.map((j, i) => `
    <div class="tl-card ${j.status === 'next' ? 'next-job' : ''}" style="animation-delay:${i * 0.07}s">
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
      <span class="tl-badge ${badgeMap[j.status]}">${labelMap[j.status]}</span>
    </div>
  `).join('');
}

// ===== RENDER JOBS TABLE =====
function renderJobsTable() {
  const tbody = document.getElementById('jobs-tbody');
  tbody.innerHTML = assignedJobs.map(j => `
    <tr onclick="window.location='assigned-jobs.html'">
      <td>${j.service}</td>
      <td>${j.customer}</td>
      <td style="color:var(--text-2)">${j.address}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${j.date}</td>
      <td style="font-family:var(--font-mono);font-size:12.5px">${j.time}</td>
      <td><span class="tl-badge ${badgeMap[j.status]}">${j.statusLabel}</span></td>
    </tr>
  `).join('');
}

// ===== RENDER EARN STATS =====
function renderEarnStats() {
  const el = document.getElementById('earn-stats');
  el.innerHTML = earnStats.map(s => `
    <div class="earn-stat">
      <div class="es-label">${s.label}</div>
      <div class="es-value">${s.value}</div>
    </div>
  `).join('');
}

// ===== RENDER NOTIFICATIONS =====
function renderNotifs() {
  const el = document.getElementById('notif-list');
  el.innerHTML = notifications.map(n => `
    <li><span class="notif-dot-green"></span>${n}</li>
  `).join('');
}

// ===== INIT =====
renderTimeline();
renderJobsTable();
renderEarnStats();
renderNotifs();
