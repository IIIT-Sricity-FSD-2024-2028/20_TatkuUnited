function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'grid' : 'none';
  });
}

AppStore.ready.then(() => {
  const session = Auth.requireSession(['customer']);
  if (!session) return;

  /* ── Personalize hero ── */
  const heroName = document.querySelector('.hero-name');
  if (heroName) heroName.textContent = session.name + '!';

  const categories = [
    { name: 'Kitchen Cleaning', service: 'SVC002', bg: '#fef3c7', stroke: '#d97706', path: `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>` },
    { name: 'Electrical',       service: 'SVC005', bg: '#eff6ff', stroke: '#3b82f6', path: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>` },
    { name: 'Plumbing',         service: 'SVC003', bg: '#f0fdfa', stroke: '#0d9488', path: `<path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z"/><rect x="7" y="10" width="10" height="12" rx="2"/>` },
    { name: 'AC Repair',        service: 'SVC009', bg: '#fef3c7', stroke: '#f59e0b', path: `<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7V5M12 7V3M18 7V5M6 17v2M12 17v4M18 17v2"/>` },
    { name: 'Carpentry',        service: 'SVC007', bg: '#eff6ff', stroke: '#2563eb', path: `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>` },
    { name: 'Painting',         service: 'SVC001', bg: '#f0fdfa', stroke: '#0d9488', path: `<path d="M2 13.5V20h6.5L20 8.5 15.5 4 2 13.5z"/><path d="M21.5 5.5a2.12 2.12 0 00-3-3L15.5 4l3.5 3.5 2.5-2z"/>` },
  ];

  const allBookings = AppStore.getTable("bookings") || [];
  const myBookings = allBookings
    .filter(b => b.customer_id === session.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  
  const badgeMap = { PENDING: 'badge-pending', CANCELLED: 'badge-cancelled', SCHEDULED: 'badge-assigned', COMPLETED: 'badge-completed' };

  function renderCategories() {
    document.getElementById('categories-grid').innerHTML = categories.map((c, i) => `
      <div class="cat-card" style="animation-delay:${i * 0.05}s" onclick="window.location='../service_pages/service_page.html?serviceId=${c.service}'">
        <div class="cat-icon" style="background:${c.bg}">
          <svg viewBox="0 0 24 24" style="stroke:${c.stroke}">${c.path}</svg>
        </div>
        <span class="cat-name">${c.name}</span>
      </div>
    `).join('');
  }

  function renderBookings() {
    const grid = document.getElementById('bookings-grid');
    if (myBookings.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; border: 1px dashed var(--border); border-radius: var(--radius-lg);">
          <svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--border);fill:none;stroke-width:1;margin:0 auto 1rem;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <h3 style="margin-bottom:0.5rem;font-size:1.1rem;color:var(--text-1)">No recent bookings</h3>
          <p style="color:var(--text-2);margin-bottom:1.5rem">Book your first service or add an item to your cart!</p>
          <button class="btn-action btn-primary-action" onclick="window.location='../service_pages/service_discovery.html'" style="padding:0.75rem 1.5rem;cursor:pointer">Browse Services</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = myBookings.map((b, i) => {
      const dateObj = new Date(b.scheduled_at);
      const rawStatus = (b.status || 'PENDING').toUpperCase();
      const statusMap = {
        'PENDING': { label: 'Pending', badge: 'badge-pending' },
        'ASSIGNED': { label: 'Assigned', badge: 'badge-assigned' },
        'IN_PROGRESS': { label: 'In Progress', badge: 'badge-inprogress' },
        'COMPLETED': { label: 'Completed', badge: 'badge-completed' },
        'CANCELLED': { label: 'Cancelled', badge: 'badge-cancelled' },
      };
      const sObj = statusMap[rawStatus] || statusMap['PENDING'];
      
      const allProviders = AppStore.getTable('service_providers') || [];

      let providerName = 'Awaiting Assignment';
      if (b.provider_id) {
        const found = allProviders.find(p => p.service_provider_id === b.provider_id);
        providerName = found ? found.name : 'Tatku Provider';
      } else if (['COMPLETED', 'IN_PROGRESS', 'ASSIGNED'].includes(rawStatus)) {
        providerName = 'Tatku Professional';
      }

      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const serviceName = b.service_name || 'Home Service';
      
      return `
      <div class="booking-card" style="animation-delay:${i * 0.07}s" onclick="window.location='bookings.html'">
        <div class="booking-card-top">
          <span class="booking-badge ${sObj.badge}">${sObj.label}</span>
          <span class="booking-id">ID: #${b.booking_id}</span>
        </div>
        <div class="booking-name">${serviceName}</div>
        <div class="booking-meta">
          <div class="booking-meta-row">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${dateStr} • ${timeStr}
          </div>
          <div class="booking-meta-row">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Provider: ${providerName}
          </div>
        </div>
      </div>
      `;
    }).join('');
  }

  renderCategories();
  renderBookings();
  updateCartBadge();
});
