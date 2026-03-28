const jobs = [
  { id: 'JOB-2024-0042', service: 'Deep Home Cleaning', category: 'Cleaning', customer: 'Sambhav', address: '7274, Hausila Nagar, Maholi, Ayodhya', phone: '+91 7054120741', date: 'March 8, 2026', time: '10:00 AM – 1:00 PM', status: 'assigned', statusLabel: 'Assigned', description: 'Complete deep cleaning of a 3-bedroom apartment including kitchen, bathrooms, living room, and all bedrooms. Special attention to grout cleaning and window washing.' },
  { id: 'JOB-2024-0041', service: 'AC Installation', category: 'HVAC', customer: 'Neha Kapoor', address: '17 Palm Residency, Koramangala, Bangalore', phone: '+91 9876543210', date: 'Apr 10, 2026', time: '11:30 AM – 2:00 PM', status: 'inprogress', statusLabel: 'In Progress', description: 'Install 1.5-ton split AC unit in the master bedroom. Customer has provided the unit. Ensure proper insulation and test run.' },
  { id: 'JOB-2024-0040', service: 'Electrical Inspection', category: 'Electrical', customer: 'Priya Iyer', address: '49 Skyline Apartments, Whitefield, Bangalore', phone: '+91 9988776655', date: 'Apr 10, 2026', time: '05:00 PM – 6:30 PM', status: 'assigned', statusLabel: 'Assigned', description: 'Full electrical safety inspection for a 2BHK apartment. Check all wiring, sockets, and MCB panel.' },
  { id: 'JOB-2024-0039', service: 'Water Heater Service', category: 'Plumbing', customer: 'Siddharth Rao', address: '8 Lotus Court, JP Nagar, Bangalore', phone: '+91 9112334455', date: 'Apr 11, 2026', time: '09:00 AM – 10:30 AM', status: 'pending', statusLabel: 'Pending Confirmation', description: 'Annual service for Racold 25L water heater. Check anode rod, heating element and thermostat.' },
  { id: 'JOB-2024-0038', service: 'Plumbing Repair', category: 'Plumbing', customer: 'Aarav Sharma', address: '22 MG Road, Indiranagar, Bangalore', phone: '+91 9700011223', date: 'Apr 10, 2026', time: '08:00 AM – 9:30 AM', status: 'completed', statusLabel: 'Completed', description: 'Fix kitchen sink drainage and replace tap washer in bathroom.' },
];

const statusMap = { inprogress: 'badge-inprogress', assigned: 'badge-assigned', pending: 'badge-pending', completed: 'badge-completed' };
let activeFilter = 'all';

// Render filters
function renderFilters() {
  const filters = ['all', 'assigned', 'inprogress', 'pending', 'completed'];
  const labels = { all: 'All', assigned: 'Assigned', inprogress: 'In Progress', pending: 'Pending', completed: 'Completed' };
  document.getElementById('filter-row').innerHTML = filters.map(f => `
    <button class="filter-btn ${f === activeFilter ? 'active' : ''}" onclick="setFilter('${f}')">${labels[f]}</button>
  `).join('');
}

function setFilter(f) {
  activeFilter = f;
  renderFilters();
  renderJobs();
}

function renderJobs() {
  const list = document.getElementById('jobs-list');
  const filtered = activeFilter === 'all' ? jobs : jobs.filter(j => j.status === activeFilter);
  list.innerHTML = filtered.map((j, i) => `
    <div class="job-row" style="animation-delay:${i*0.06}s" onclick="openDetail('${j.id}')">
      <div class="job-meta">
        <div class="job-top">
          <span class="job-service">${j.service}</span>
          <span class="job-cat">${j.category}</span>
          <span class="badge ${statusMap[j.status]}">${j.statusLabel}</span>
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
            ${j.date}
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
  `).join('');
}

function openDetail(id) {
  const job = jobs.find(j => j.id === id);
  if (!job) return;
  const steps = ['Assigned', 'In Progress', 'Completed'];
  const stepStatus = { assigned: 0, inprogress: 1, completed: 2 };
  const current = stepStatus[job.status] ?? 0;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-job-title">${job.service}</div>
    <div class="modal-job-id">Job #${job.id}</div>

    <div class="modal-section">
      <div class="modal-section-title">Job Status</div>
      <div class="status-stepper">
        ${steps.map((s, i) => `
          ${i > 0 ? `<div class="step-line ${i <= current ? 'done' : ''}"></div>` : ''}
          <div class="step">
            <div class="step-dot ${i <= current ? 'done' : ''}">
              <svg viewBox="0 0 24 24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="step-label ${i === current ? 'active' : ''}">${s}</span>
          </div>
        `).join('')}
      </div>
      ${job.status !== 'completed' ? `
        ${job.status === 'assigned' ? `<button class="modal-btn modal-btn-primary" onclick="updateStatus('${job.id}', 'inprogress')">Mark In Progress</button>` : ''}
        <button class="modal-btn modal-btn-success" onclick="updateStatus('${job.id}', 'completed')">Mark Completed</button>
      ` : ''}
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
        <div class="modal-field"><label>Scheduled Date</label><p>${job.date}</p></div>
        <div class="modal-field"><label>Time Slot</label><p>${job.time}</p></div>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeDetailModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeDetailModal();
}
function updateStatus(id, newStatus) {
  const job = jobs.find(j => j.id === id);
  if (job) { job.status = newStatus; job.statusLabel = { inprogress: 'In Progress', completed: 'Completed' }[newStatus]; }
  openDetail(id);
  renderJobs();
}

renderFilters();
renderJobs();
