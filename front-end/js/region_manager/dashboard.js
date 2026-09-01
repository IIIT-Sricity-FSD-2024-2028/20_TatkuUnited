// ── Region Manager Dashboard JS — API & Mock-backed ──

(async () => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  let regionId = session.region_id;

  /* ── 2. Pull from API ── */
  let allProviders = [], allAssignments = [], allTransactions = [], allBookings = [];
  let regions = [], region = null;

  try {
    regions = await Api.get("/regions", { silent: true }) || [];
  } catch (_) {}

  try {
    allProviders = await Api.get("/service-providers", { silent: true }) || [];
  } catch (_) {}

  try {
    allAssignments = await Api.get("/job-assignments", { silent: true }) || [];
  } catch (_) {}

  try {
    allTransactions = await Api.get("/transactions", { silent: true }) || [];
  } catch (_) {}

  try {
    allBookings = await Api.get("/bookings", { silent: true }) || [];
  } catch (_) {}

  // If no regionId in session, resolve from manager's record or first region
  if (!regionId && Array.isArray(regions) && regions.length > 0) {
    regionId = regions[0].region_id;
  }

  region = (regions || []).find(r => r.region_id === regionId) || regions[0] || { region_name: 'Chennai North', is_active: true };

  /* ── 3. Scope data to this region consistently across all widgets ── */
  const myProviders = (allProviders || []).filter(p => p.region_id === region.region_id);
  const pendingProviders = myProviders.filter(
    p => p.account_status === 'pending' || !p.region_id
  );
  const myProviderIds = new Set(myProviders.map(p => p.sp_id || p.service_provider_id));

  const myAssignments = (allAssignments || []).filter(a => myProviderIds.has(a.sp_id || a.service_provider_id));
  const myBookingIds = new Set(myAssignments.map(a => a.booking_id));

  const completedAssignments = myAssignments.filter(a => a.status === 'COMPLETED');

  const totalRevenue = (allTransactions || [])
    .filter(t => myBookingIds.has(t.booking_id) && t.payment_status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  /* ── 4. Stat counters ── */
  setStatCard('stat-providers', myProviders.length);
  setStatCard('stat-pending', pendingProviders.length);
  setStatCard('stat-completed', completedAssignments.length);
  setText('stat-revenue', formatCurrency(totalRevenue));

  /* ── 5. Topbar ── */
  const initials = getInitials(session.name || 'Region Manager');
  setText('topbar-avatar', initials);
  setText('page-greeting', `Welcome back, ${(session.name || 'Manager').split(' ')[0]}!`);

  /* ── 6. Region Banner ── */
  const banner = document.getElementById('collective-banner');
  if (banner) banner.style.display = '';

  setText('collective-name', region.region_name || 'Chennai North');
  setText('collective-providers', myProviders.length.toString());
  setText('collective-pending', pendingProviders.length.toString());
  setText('collective-manager-name', session.name || 'Region Manager');

  const statusBadge = document.getElementById('collective-status-badge');
  if (statusBadge) {
    const isActive = region.is_active ?? true;
    statusBadge.textContent = isActive ? 'Active' : 'Inactive';
    statusBadge.style.background = isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    statusBadge.style.color = isActive ? '#22c55e' : '#ef4444';
  }

  /* ── 7. Render Activity ── */
  renderActivity(myAssignments, allBookings, allProviders);
})();

function setStatCard(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = Number(value).toLocaleString('en-IN');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatCurrency(amt) {
  return '₹' + Number(amt || 0).toLocaleString('en-IN');
}

function getInitials(name) {
  if (!name) return 'RM';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function renderActivity(assignments, bookings, providers) {
  const container = document.getElementById('recent-activity-list');
  if (!container) return;
  if (!assignments || assignments.length === 0) {
    container.innerHTML = '<div style="padding:16px;color:#64748b;">No recent activity.</div>';
    return;
  }
  container.innerHTML = assignments.slice(0, 5).map(a => {
    const p = providers.find(sp => (sp.sp_id || sp.service_provider_id) === (a.sp_id || a.service_provider_id));
    return `
      <div style="padding:12px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="color:#0f172a;">${p ? p.name : 'Provider'}</strong>
          <div style="font-size:0.85rem;color:#64748b;">Status: ${a.status}</div>
        </div>
        <span style="font-size:0.85rem;color:#475569;">${a.scheduled_date || ''} ${a.hour_start || ''}</span>
      </div>
    `;
  }).join('');
}
