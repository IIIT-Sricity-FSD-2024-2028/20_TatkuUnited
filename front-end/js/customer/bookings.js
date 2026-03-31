function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

/* ── These must be in global scope for onclick handlers in HTML ── */
let bookings = [];
let activeFilter = 'All';
let sortDesc = true;
let reschedulingBookingId = null;

function toggleSort() {
  sortDesc = !sortDesc;
  document.getElementById('sort-label').textContent = sortDesc ? 'Sort: Newest' : 'Sort: Oldest';
  renderBookings();
}

const badgeMap = { upcoming: 'badge-upcoming', inprogress: 'badge-inprogress', completed: 'badge-completed', pending: 'badge-pending', cancelled: 'badge-cancelled', assigned: 'badge-assigned' };
const filters = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

function renderFilters() {
  document.getElementById('filter-tabs').innerHTML = filters.map(f => `<button class="filter-tab ${f === activeFilter ? 'active' : ''}" onclick="setFilter('${f}')">${f}</button>`).join('');
}
function setFilter(f) { activeFilter = f; renderFilters(); renderBookings(); }

function renderBookings() {
  let filtered = activeFilter === 'All' ? bookings : bookings.filter(b => b.statusLabel === activeFilter || b.status === activeFilter.toLowerCase().replace(' ', ''));
  
  const startVal = document.getElementById('filter-start')?.value;
  const endVal = document.getElementById('filter-end')?.value;
  
  if (startVal) {
    const sDate = new Date(startVal);
    sDate.setHours(0,0,0,0);
    filtered = filtered.filter(b => new Date(b.rawDateISO) >= sDate);
  }
  
  if (endVal) {
    const eDate = new Date(endVal);
    eDate.setHours(23,59,59,999);
    filtered = filtered.filter(b => new Date(b.rawDateISO) <= eDate);
  }
  
  filtered.sort((a, b) => {
    const d1 = new Date(a.rawDateISO).getTime();
    const d2 = new Date(b.rawDateISO).getTime();
    return sortDesc ? d2 - d1 : d1 - d2;
  });
  if (filtered.length === 0) {
    document.getElementById('bookings-list').innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 4rem 1rem; color: var(--text-2);">
        <svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:currentColor;fill:none;stroke-width:1;margin:0 auto 1rem;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <h3 style="margin-bottom:0.5rem;color:var(--text-1)">No bookings found</h3>
        <p>You don't have any bookings matching this filter.</p>
      </div>
    `;
    document.getElementById('pagination').innerHTML = '';
    return;
  }
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
    reschedule: `<button class="drawer-btn drawer-btn-outline" onclick="openRescheduleModal('${b.id}')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Reschedule</button>`,
    cancel:     `<button class="drawer-btn drawer-btn-danger" onclick="cancelBooking('${b.id}')">Cancel Booking</button>`,
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
        <div class="drawer-field"><label>Scheduled Time</label><p>${b.time}</p></div>
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

function cancelBooking(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  CRUD.updateRecord('bookings', 'booking_id', id, { status: 'CANCELLED' });
  closeDrawerBtn();
  loadBookings();
  showToast('Booking cancelled successfully.', 'success');
}

// ===== RESCHEDULE MODAL =====
function getDateConstraints() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const fmt = d => d.toISOString().split('T')[0];
  return { min: fmt(today), max: fmt(maxDate) };
}

function openRescheduleModal(bookingId) {
  reschedulingBookingId = bookingId;
  const b = bookings.find(x => x.id === bookingId);
  if (!b) return;
  document.getElementById('reschedule-service-name').textContent = b.name + ' (#' + b.id + ')';
  const dateInput = document.getElementById('reschedule-date');
  const { min, max } = getDateConstraints();
  dateInput.min = min;
  dateInput.max = max;
  dateInput.value = '';
  document.getElementById('reschedule-time').value = '';
  document.getElementById('reschedule-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRescheduleModalBtn() {
  document.getElementById('reschedule-modal').classList.remove('open');
  document.body.style.overflow = '';
  reschedulingBookingId = null;
}
function closeRescheduleModal(e) { if (e.target === document.getElementById('reschedule-modal')) closeRescheduleModalBtn(); }

function saveReschedule() {
  if (!reschedulingBookingId) return;
  const newDate = document.getElementById('reschedule-date').value;
  const newTime = document.getElementById('reschedule-time').value;
  const { min, max } = getDateConstraints();
  if (!newDate) { showToast('Please select a date.', 'error'); return; }
  if (newDate < min || newDate > max) { showToast('Please select a date within 1 week from today.', 'error'); return; }
  if (!newTime) { showToast('Please select a time.', 'error'); return; }
  
  const dateTimeISO = new Date(newDate + 'T' + newTime + ':00').toISOString();
  CRUD.updateRecord('bookings', 'booking_id', reschedulingBookingId, { scheduled_at: dateTimeISO });
  
  closeRescheduleModalBtn();
  closeDrawerBtn();
  loadBookings();
  showToast('Booking rescheduled successfully', 'success');
}

let currentSession = null;

function seedMockBookingsIfNeeded(session) {
  if (localStorage.getItem('tu_demo_seeded')) return;
  
  const mockBookings = [
    {
      booking_id: AppStore.nextId('BKG'),
      customer_id: session.id,
      booking_type: 'SCHEDULED',
      status: 'PENDING',
      service_address: '21/229, Indira Nagar, Lucknow',
      service_name: 'Deep Home Cleaning',
      price: '2500',
      provider_id: null,
      scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      booking_id: AppStore.nextId('BKG'),
      customer_id: session.id,
      booking_type: 'SCHEDULED',
      status: 'ASSIGNED',
      service_address: '21/229, Indira Nagar, Lucknow',
      service_name: 'AC Precision Repair',
      price: '850',
      provider_id: 'SP001',
      scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 day from now
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      booking_id: AppStore.nextId('BKG'),
      customer_id: session.id,
      booking_type: 'INSTANT',
      status: 'IN_PROGRESS',
      service_address: '21/229, Indira Nagar, Lucknow',
      service_name: 'Emergency Plumbing Fix',
      price: '450',
      provider_id: 'SP002',
      scheduled_at: new Date().toISOString(), // Today
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    },
    {
      booking_id: AppStore.nextId('BKG'),
      customer_id: session.id,
      booking_type: 'SCHEDULED',
      status: 'COMPLETED',
      service_address: '21/229, Indira Nagar, Lucknow',
      service_name: 'Smart Lock Installation',
      price: '1100',
      provider_id: 'SP003',
      scheduled_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      booking_id: AppStore.nextId('BKG'),
      customer_id: session.id,
      booking_type: 'SCHEDULED',
      status: 'CANCELLED',
      service_address: '21/229, Indira Nagar, Lucknow',
      service_name: 'Garden Trimming',
      price: '600',
      provider_id: null,
      scheduled_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    }
  ];
  
  mockBookings.forEach(b => CRUD.createRecord('bookings', b));
  localStorage.setItem('tu_demo_seeded', 'true');
  
  // Reload page to reflect newly created AppStore rows correctly in rendering
  window.location.reload();
}

function loadBookings() {
  if (!currentSession) return;
  const allBookings = AppStore.getTable('bookings') || [];
  bookings = allBookings
    .filter(b => b.customer_id === currentSession.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(b => {
      const dateObj = new Date(b.scheduled_at);
      const rawStatus = (b.status || 'PENDING').toUpperCase();
      
      const statusMap = {
        'PENDING': { label: 'Pending', css: 'pending', badge: 'badge-pending' },
        'ASSIGNED': { label: 'Assigned', css: 'assigned', badge: 'badge-assigned' },
        'IN_PROGRESS': { label: 'In Progress', css: 'inprogress', badge: 'badge-inprogress' },
        'COMPLETED': { label: 'Completed', css: 'completed', badge: 'badge-completed' },
        'CANCELLED': { label: 'Cancelled', css: 'cancelled', badge: 'badge-cancelled' },
      };
      const sObj = statusMap[rawStatus] || statusMap['PENDING'];
      
      let actions = [];
      if (rawStatus === 'PENDING') actions = ['reschedule', 'cancel'];
      else if (rawStatus === 'ASSIGNED') actions = ['reschedule', 'track'];
      else if (rawStatus === 'IN_PROGRESS') actions = ['track'];
      else if (rawStatus === 'COMPLETED') actions = ['invoice', 'review', 'rebook'];
      else if (rawStatus === 'CANCELLED') actions = ['rebook'];

      const allProviders = AppStore.getTable('service_providers') || [];
      
      let providerName = 'Awaiting assignment';
      if (b.provider_id) {
        const found = allProviders.find(p => p.service_provider_id === b.provider_id);
        providerName = found ? found.name : 'Tatku Provider';
      } else if (['COMPLETED', 'IN_PROGRESS', 'ASSIGNED'].includes(rawStatus)) {
        providerName = 'Tatku Professional';
      }

      const providerTimelineSub = rawStatus === 'CANCELLED' ? 'by customer' : (providerName !== 'Awaiting assignment' ? 'Provider Assigned' : 'Awaiting assignment');
      const providerTimelineDone = rawStatus !== 'PENDING';
      const isEnded = ['COMPLETED', 'CANCELLED'].includes(rawStatus);
      
      return {
        id: b.booking_id,
        status: sObj.css,
        statusLabel: sObj.label,
        name: b.service_name || 'Home Service',
        category: 'Service',
        provider: providerName,
        liveStatus: rawStatus === 'IN_PROGRESS' ? 'Job in progress/tracked' : null,
        rawDateISO: b.scheduled_at,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        address: b.service_address || 'Address not provided',
        price: '₹' + (b.price || '0').toLocaleString('en-IN'),
        duration: '2 hours',
        description: 'Service booked on ' + new Date(b.created_at).toLocaleDateString(),
        iconBg: '#eff6ff', 
        icon: `<svg viewBox="0 0 24 24" style="stroke:#3b82f6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
        timeline: [
          { label: 'Booking Placed', sub: new Date(b.created_at).toLocaleDateString(), done: true },
          { label: rawStatus === 'CANCELLED' ? 'Cancelled' : 'Provider Assigned', sub: providerTimelineSub, done: providerTimelineDone },
          { label: 'Service Completed', sub: rawStatus === 'COMPLETED' ? 'Delivered' : '—', done: rawStatus === 'COMPLETED' }
        ],
        actions: actions
      };
    });
  renderFilters();
  renderBookings();
  updateCartBadge();
}

AppStore.ready.then(() => {
  currentSession = Auth.requireSession(['customer']);
  if (!currentSession) return;
  seedMockBookingsIfNeeded(currentSession);
  loadBookings();
});
