function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

const bookings = [
  { id: 'TU-92834', status: 'pending', statusLabel: 'Pending', name: 'Microwave Deep Cleaning', category: 'Cleaning', provider: 'Sambhav', date: 'Dec 28, 2026', time: '10:00 AM', address: '21/229, Indira Nagar, Lucknow', price: '₹1,200', duration: '2 hours', description: 'Complete deep cleaning of microwave including interior, exterior, and turntable.', iconBg: '#fef3c7', icon: `<svg viewBox="0 0 24 24" style="stroke:#d97706"><rect x="2" y="7" width="20" height="12" rx="2"/><path d="M17 11h1M6 11h6"/></svg>`, timeline: [{ label: 'Booking Placed', sub: 'Dec 20, 2026', done: true }, { label: 'Provider Assigned', sub: 'Awaiting assignment', done: false }, { label: 'Service Completed', sub: '—', done: false }], actions: ['reschedule', 'cancel'] },
  { id: 'TU-92833', status: 'assigned', statusLabel: 'Assigned', name: 'Full Pipe Inspection', category: 'Plumbing', provider: 'elHuman', date: 'Mar 25, 2026', time: '02:30 PM', address: '21/229, Indira Nagar, Lucknow', price: '₹2,500', duration: '3 hours', description: 'Full inspection of all pipes, checking for leaks, blockages, and pressure issues.', iconBg: '#f0fdfa', icon: `<svg viewBox="0 0 24 24" style="stroke:#0d9488"><path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z"/><rect x="7" y="10" width="10" height="10" rx="2"/></svg>`, timeline: [{ label: 'Booking Placed', sub: 'Mar 10, 2026', done: true }, { label: 'Provider Assigned', sub: 'elHuman confirmed', done: true }, { label: 'Service Completed', sub: '—', done: false }], actions: ['track'] },
  { id: 'TU-92832', status: 'inprogress', statusLabel: 'In Progress', name: 'Smart Home Setup', category: 'Electrical', provider: "elHumann't", date: 'Mar 27, 2026', time: '11:00 AM', address: '21/229, Indira Nagar, Lucknow', price: '₹4,800', duration: '4 hours', description: 'Installation and configuration of smart home devices including lights, locks, and thermostat.', iconBg: '#eff6ff', icon: `<svg viewBox="0 0 24 24" style="stroke:#2563eb"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, liveStatus: 'Technician is on-site', timeline: [{ label: 'Booking Placed', sub: 'Mar 20, 2026', done: true }, { label: 'Provider Assigned', sub: "elHumann't confirmed", done: true }, { label: 'In Progress', sub: 'Technician on-site now', done: true }, { label: 'Service Completed', sub: '—', done: false }], actions: ['track'] },
  { id: 'TU-92831', status: 'completed', statusLabel: 'Completed', name: 'Kitchen Counter Resurfacing', category: 'Carpentry', provider: 'TheResurface', date: 'Dec 20, 2025', time: '09:00 AM', address: '21/229, Indira Nagar, Lucknow', price: '₹6,500', duration: '5 hours', description: 'Full resurfacing of kitchen countertop with premium laminate finish.', iconBg: '#f0fdf4', icon: `<svg viewBox="0 0 24 24" style="stroke:#16a34a"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`, timeline: [{ label: 'Booking Placed', sub: 'Dec 10, 2025', done: true }, { label: 'Provider Assigned', sub: 'TheResurface confirmed', done: true }, { label: 'Service Completed', sub: 'Dec 20, 2025', done: true }], actions: ['invoice', 'review', 'rebook'] },
  { id: 'TU-92830', status: 'cancelled', statusLabel: 'Cancelled', name: 'Garden Lawn Mowing', category: 'Gardening', provider: 'John Lemon', date: 'Dec 15, 2025', time: '11:30 AM', address: '21/229, Indira Nagar, Lucknow', price: '₹800', duration: '1.5 hours', description: 'Standard lawn mowing and trimming service.', iconBg: '#fee2e2', icon: `<svg viewBox="0 0 24 24" style="stroke:#ef4444"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`, timeline: [{ label: 'Booking Placed', sub: 'Dec 5, 2025', done: true }, { label: 'Cancelled', sub: 'Dec 8, 2025 — by customer', done: true }], actions: ['rebook'] },
  { id: 'TU-92829', status: 'pending', statusLabel: 'Pending', name: 'Exterior Window Wash', category: 'Cleaning', provider: 'Paul McWashney', date: 'Nov 02, 2025', time: '08:00 AM', address: '21/229, Indira Nagar, Lucknow', price: '₹1,500', duration: '2.5 hours', description: 'Complete exterior window washing for a 2-floor building.', iconBg: '#eff6ff', icon: `<svg viewBox="0 0 24 24" style="stroke:#3b82f6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`, timeline: [{ label: 'Booking Placed', sub: 'Oct 25, 2025', done: true }, { label: 'Provider Assigned', sub: 'Awaiting assignment', done: false }, { label: 'Service Completed', sub: '—', done: false }], actions: ['reschedule', 'cancel'] },
];

const badgeMap = { upcoming: 'badge-upcoming', inprogress: 'badge-inprogress', completed: 'badge-completed', pending: 'badge-pending', cancelled: 'badge-cancelled', assigned: 'badge-assigned' };
const filters = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];
let activeFilter = 'All';

function renderFilters() {
  document.getElementById('filter-tabs').innerHTML = filters.map(f => `<button class="filter-tab ${f === activeFilter ? 'active' : ''}" onclick="setFilter('${f}')">${f}</button>`).join('');
}
function setFilter(f) { activeFilter = f; renderFilters(); renderBookings(); }

function renderBookings() {
  const filtered = activeFilter === 'All' ? bookings : bookings.filter(b => b.statusLabel === activeFilter || b.status === activeFilter.toLowerCase().replace(' ', ''));
  document.getElementById('bookings-list').innerHTML = filtered.map((b, i) => `
    <div class="booking-row ${b.status === 'cancelled' ? 'cancelled' : ''}" style="animation-delay:${i * 0.06}s" onclick="openDrawer('${b.id}')">
      <div class="booking-row-icon" style="background:${b.iconBg}">${b.icon}</div>
      <div class="booking-row-body">
        <div class="booking-row-top">
          <span class="booking-row-name">${b.name}</span>
          <span class="booking-badge ${badgeMap[b.status]}">${b.statusLabel}</span>
        </div>
        <div class="booking-row-meta">
          <div class="booking-meta-item">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${b.provider}
          </div>
          ${b.liveStatus
            ? `<div class="booking-meta-item live"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${b.liveStatus}</div>`
            : `<div class="booking-meta-item"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${b.date} • ${b.time}</div>`
          }
        </div>
      </div>
      <div class="booking-row-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
    </div>
  `).join('');

  document.getElementById('pagination').innerHTML = `
    <button class="page-btn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
    <button class="page-btn active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <button class="page-btn">…</button>
    <button class="page-btn">6</button>
    <button class="page-btn"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
  `;
}

function openDrawer(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  const actionBtns = {
    track:      `<button class="drawer-btn drawer-btn-teal">Track Technician</button>`,
    review:     `<button class="drawer-btn drawer-btn-review" onclick="window.location='review.html'">⭐ Leave a Review</button>`,
    invoice:    `<button class="drawer-btn drawer-btn-outline">View Invoice</button>`,
    rebook:     `<button class="drawer-btn drawer-btn-orange" onclick="window.location='schedule.html?service=${encodeURIComponent(b.name)}&price=${encodeURIComponent(b.price)}'">Rebook This Service</button>`,
    reschedule: `<button class="drawer-btn drawer-btn-outline">Reschedule</button>`,
    cancel:     `<button class="drawer-btn drawer-btn-danger">Cancel Booking</button>`,
  };

  document.getElementById('drawer-content').innerHTML = `
    <div class="drawer-badge-row"><span class="booking-badge ${badgeMap[b.status]}">${b.statusLabel}</span></div>
    <div class="drawer-title">${b.name}</div>
    <div class="drawer-id">Booking #${b.id}</div>
    <div class="drawer-service-card">
      <div class="drawer-service-icon" style="background:${b.iconBg}">${b.icon}</div>
      <div>
        <div class="drawer-service-name">${b.name}</div>
        <div class="drawer-service-provider">Provider: <strong>${b.provider}</strong></div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">Service Details</div>
      <div class="drawer-grid">
        <div class="drawer-field"><label>Category</label><p>${b.category}</p></div>
        <div class="drawer-field"><label>Duration</label><p>${b.duration}</p></div>
        <div class="drawer-field"><label>Scheduled Date</label><p>${b.date}</p></div>
        <div class="drawer-field"><label>Time Slot</label><p>${b.time}</p></div>
        <div class="drawer-field"><label>Amount</label><p>${b.price}</p></div>
        <div class="drawer-field"><label>Location</label><p style="font-size:13px">${b.address}</p></div>
      </div>
    </div>
    <div class="drawer-divider"></div>
    <div class="drawer-section">
      <div class="drawer-section-title">Description</div>
      <p style="font-size:13.5px;color:var(--text-2);line-height:1.6">${b.description}</p>
    </div>
    <div class="drawer-divider"></div>
    <div class="drawer-section">
      <div class="drawer-section-title">Booking Timeline</div>
      <div class="status-timeline">
        ${b.timeline.map((step, i) => `
          <div class="status-step">
            <div class="status-step-left">
              <div class="status-dot ${step.done ? 'done' : ''}">${step.done ? `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>` : ''}</div>
              ${i < b.timeline.length - 1 ? `<div class="status-line ${step.done ? 'done' : ''}"></div>` : ''}
            </div>
            <div class="status-step-body"><div class="status-step-label">${step.label}</div><div class="status-step-sub">${step.sub}</div></div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="drawer-divider"></div>
    <div class="drawer-section">${b.actions.map(a => actionBtns[a] || '').join('')}</div>
  `;
  document.getElementById('drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawerBtn() { document.getElementById('drawer-overlay').classList.remove('open'); document.body.style.overflow = ''; }
function closeDrawer(e) { if (e.target === document.getElementById('drawer-overlay')) closeDrawerBtn(); }

renderFilters();
renderBookings();
updateCartBadge();
