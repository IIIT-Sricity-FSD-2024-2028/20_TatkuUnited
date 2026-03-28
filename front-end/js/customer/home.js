function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'grid' : 'none';
  });
}

const categories = [
  { name: 'Kitchen Cleaning', bg: '#fef3c7', stroke: '#d97706', path: `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>` },
  { name: 'Electrical',        bg: '#eff6ff', stroke: '#3b82f6', path: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>` },
  { name: 'Plumbing',          bg: '#f0fdfa', stroke: '#0d9488', path: `<path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z"/><rect x="7" y="10" width="10" height="12" rx="2"/>` },
  { name: 'AC Repair',         bg: '#fef3c7', stroke: '#f59e0b', path: `<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7V5M12 7V3M18 7V5M6 17v2M12 17v4M18 17v2"/>` },
  { name: 'Carpentry',         bg: '#eff6ff', stroke: '#2563eb', path: `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>` },
  { name: 'Painting',          bg: '#f0fdfa', stroke: '#0d9488', path: `<path d="M2 13.5V20h6.5L20 8.5 15.5 4 2 13.5z"/><path d="M21.5 5.5a2.12 2.12 0 00-3-3L15.5 4l3.5 3.5 2.5-2z"/>` },
];

const recentBookings = [
  { id: 'TU-92834', status: 'upcoming', statusLabel: 'Upcoming', name: 'Microwave Deep Clean', date: 'Oct 24, 2023', time: '10:00 AM', provider: 'Sarah Jenkins', actions: [{ label: 'Reschedule', cls: 'btn-secondary-action' }, { label: '···', cls: 'btn-more' }] },
  { id: 'TU-92831', status: 'inprogress', statusLabel: 'In Progress', name: 'Living Room Painting', date: 'Oct 22, 2023', time: '09:30 AM', provider: "Mike 'The Pro'", actions: [{ label: 'Track Technician', cls: 'btn-primary-action' }] },
  { id: 'TU-92810', status: 'completed', statusLabel: 'Completed', name: 'Full Pipe Inspection', date: 'Oct 18, 2023', time: '02:00 PM', provider: 'AquaFlow Ltd', actions: [{ label: 'View Invoice', cls: 'btn-outline-action' }, { label: 'Rebook', cls: 'btn-orange-action' }] },
];

const badgeMap = { upcoming: 'badge-upcoming', inprogress: 'badge-inprogress', completed: 'badge-completed', pending: 'badge-pending', cancelled: 'badge-cancelled', assigned: 'badge-assigned' };

function renderCategories() {
  document.getElementById('categories-grid').innerHTML = categories.map((c, i) => `
    <div class="cat-card" style="animation-delay:${i * 0.05}s" onclick="window.location='services.html'">
      <div class="cat-icon" style="background:${c.bg}">
        <svg viewBox="0 0 24 24" style="stroke:${c.stroke}">${c.path}</svg>
      </div>
      <span class="cat-name">${c.name}</span>
    </div>
  `).join('');
}

function renderBookings() {
  document.getElementById('bookings-grid').innerHTML = recentBookings.map((b, i) => `
    <div class="booking-card" style="animation-delay:${i * 0.07}s" onclick="window.location='bookings.html'">
      <div class="booking-card-top">
        <span class="booking-badge ${badgeMap[b.status]}">${b.statusLabel}</span>
        <span class="booking-id">ID: #${b.id}</span>
      </div>
      <div class="booking-name">${b.name}</div>
      <div class="booking-meta">
        <div class="booking-meta-row">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${b.date} • ${b.time}
        </div>
        <div class="booking-meta-row">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Provider: ${b.provider}
        </div>
      </div>
      <div class="booking-actions" onclick="event.stopPropagation()">
        ${b.actions.map(a => `<button class="btn-action ${a.cls}">${a.label}</button>`).join('')}
      </div>
    </div>
  `).join('');
}

renderCategories();
renderBookings();
updateCartBadge();
