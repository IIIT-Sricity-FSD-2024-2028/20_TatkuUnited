// ── Collective Manager Dashboard JS ──
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;

  const collectiveId = session.collectiveId;

  /* ── 2. Pull tables ── */
  const allUnits       = AppStore.getTable('units')           || [];
  const allProviders   = AppStore.getTable('service_providers') || [];
  const allAssignments = AppStore.getTable('job_assignments')  || [];
  const allTransactions= AppStore.getTable('transactions')     || [];
  const allBookings    = AppStore.getTable('bookings')         || [];
  const collective     = (AppStore.getTable('collectives') || [])
                           .find(c => c.collective_id === collectiveId);

  /* ── 3. Scope data to this collective ── */
  const myUnits       = allUnits.filter(u => u.collective_id === collectiveId);
  const myUnitIds     = new Set(myUnits.map(u => u.unit_id));
  const myProviders   = allProviders.filter(p => myUnitIds.has(p.unit_id));
  const myProviderIds = new Set(myProviders.map(p => p.service_provider_id));

  // Assignments where the provider belongs to this collective
  const myAssignments = allAssignments.filter(a => myProviderIds.has(a.service_provider_id));
  const myBookingIds  = new Set(myAssignments.map(a => a.booking_id));

  // Completed assignments
  const completedAssignments = myAssignments.filter(a => a.status === 'COMPLETED');

  // Revenue: sum of SUCCESS transactions for this collective's bookings
  const totalRevenue = allTransactions
    .filter(t => myBookingIds.has(t.booking_id) && t.payment_status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  /* ── 4. Stat counters ── */
  const totalProviders   = myProviders.length;
  const activeUnits      = myUnits.filter(u => u.is_active).length;
  const completedServices = completedAssignments.length;

  /* ── 5. Render stat cards ── */
  setStatCard('stat-providers',        totalProviders);
  setStatCard('stat-active-units',     activeUnits);
  setStatCard('stat-completed',        completedServices);
  setText('stat-revenue',              formatCurrency(totalRevenue));

  /* ── 6. Topbar: name initial + avatar ── */
  const initials = getInitials(session.name);
  setText('topbar-avatar', initials);
  setText('page-greeting', `Welcome back, ${session.name.split(' ')[0]}!`);

  /* ── 7. Collective Banner ── */
  const allSectors     = AppStore.getTable('sectors') || [];
  const allCMgrs       = AppStore.getTable('collective_managers') || [];

  const banner = document.getElementById('collective-banner');
  if (banner) banner.style.display = '';

  setText('collective-name', collective ? collective.collective_name : '—');
  setText('collective-units', myUnits.length.toString());

  // Sector names
  if (collective && Array.isArray(collective.sector_ids)) {
    const sectorNames = collective.sector_ids
      .map(sid => {
        const sec = allSectors.find(s => s.sector_id === sid);
        return sec ? sec.sector_name : sid;
      })
      .join(', ');
    setText('collective-sectors', sectorNames || '—');
  } else {
    setText('collective-sectors', '—');
  }

  // Manager name (the logged-in CM)
  setText('collective-manager-name', session.name);

  // Status badge
  const statusBadge = document.getElementById('collective-status-badge');
  if (statusBadge) {
    const isActive = collective && collective.is_active;
    statusBadge.textContent = isActive ? 'Active' : 'Inactive';
    statusBadge.style.background  = isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    statusBadge.style.color        = isActive ? '#22c55e' : '#ef4444';
  }

  /* ── 8. Revenue chart (per-month from transactions) ── */
  renderRevenueChart(allTransactions, myBookingIds);

  /* ── 9. Recent Activity ── */
  renderActivity(myAssignments, allBookings, allProviders, myUnits);
});

/* ─── HELPERS ─────────────────────────────────────────── */

function setStatCard(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  // Animated counter
  const target = parseInt(value, 10);
  if (isNaN(target)) { el.textContent = value; return; }
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.round(current).toLocaleString('en-IN');
  }, 16);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getInitials(name) {
  if (!name) return 'CM';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function formatCurrency(amount) {
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
  if (amount >= 1000)   return '₹' + (amount / 1000).toFixed(1)   + 'k';
  return '₹' + amount.toFixed(0);
}

/* ─── REVENUE CHART ────────────────────────────────────── */
function renderRevenueChart(allTransactions, myBookingIds) {
  const barsEl   = document.getElementById('revenueChart');
  const xLabelsEl = document.getElementById('xLabels');
  if (!barsEl || !xLabelsEl) return;

  const months     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyRev = Array(12).fill(0);

  allTransactions.forEach(t => {
    if (!myBookingIds.has(t.booking_id)) return;
    if (t.payment_status !== 'SUCCESS') return;
    const date = new Date(t.transaction_at);
    if (isNaN(date)) return;
    monthlyRev[date.getMonth()] += (t.amount || 0);
  });

  const maxVal = Math.max(...monthlyRev, 1000); // at least ₹1000 scale

  // Update Y-axis labels
  const ySteps = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];
  const yLabels = document.querySelectorAll('.y-labels span');
  yLabels.forEach((el, i) => {
    el.textContent = formatCurrency(ySteps[i]);
  });

  barsEl.innerHTML   = '';
  xLabelsEl.innerHTML = '';

  months.forEach((m, i) => {
    const pct = maxVal > 0 ? (monthlyRev[i] / maxVal) * 100 : 0;

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = pct + '%';
    bar.style.animationDelay = (i * 0.05) + 's';

    const tip = document.createElement('div');
    tip.className   = 'bar-tooltip';
    tip.textContent = formatCurrency(monthlyRev[i]);
    bar.appendChild(tip);
    barsEl.appendChild(bar);

    const lbl = document.createElement('div');
    lbl.className   = 'x-label';
    lbl.textContent = m;
    xLabelsEl.appendChild(lbl);
  });
}

/* ─── RECENT ACTIVITY ──────────────────────────────────── */
function renderActivity(myAssignments, allBookings, allProviders, myUnits) {
  const listEl = document.querySelector('.activity-list');
  if (!listEl) return;

  // Sort assignments by most recently updated
  const sorted = [...myAssignments].sort((a, b) =>
    new Date(b.updated_at) - new Date(a.updated_at)
  ).slice(0, 5);

  if (!sorted.length) {
    listEl.innerHTML = '<li class="activity-item"><div class="activity-content"><span class="activity-title">No recent activity</span></div></li>';
    return;
  }

  const providerMap = Object.fromEntries(
    allProviders.map(p => [p.service_provider_id, p])
  );
  const unitMap = Object.fromEntries(
    myUnits.map(u => [u.unit_id, u])
  );

  listEl.innerHTML = sorted.map(ja => {
    const provider = providerMap[ja.service_provider_id];
    const provName = provider ? provider.name : 'Provider';
    const unit     = provider ? unitMap[provider.unit_id] : null;
    const unitName = unit ? unit.unit_name : 'your collective';

    let title, sub, dotClass;
    switch (ja.status) {
      case 'COMPLETED':
        title    = 'Service completed';
        sub      = `${provName} completed a job in ${unitName}`;
        dotClass = 'activity-dot--green';
        break;
      case 'IN_PROGRESS':
        title    = 'Service in progress';
        sub      = `${provName} is currently on a job`;
        dotClass = 'activity-dot--blue';
        break;
      case 'ASSIGNED':
        title    = 'Job assigned';
        sub      = `${provName} assigned to a booking in ${unitName}`;
        dotClass = '';
        break;
      case 'CANCELLED':
        title    = 'Assignment cancelled';
        sub      = `Booking cancelled — assigned to ${provName}`;
        dotClass = 'activity-dot--red';
        break;
      default:
        title    = 'Activity';
        sub      = `Assignment ${ja.assignment_id} updated`;
        dotClass = '';
    }

    return `
      <li class="activity-item">
        <div class="activity-dot ${dotClass}"></div>
        <div class="activity-content">
          <span class="activity-title">${title}</span>
          <span class="activity-sub">${sub}</span>
          <span class="activity-time">${timeAgo(ja.updated_at)}</span>
        </div>
      </li>
    `;
  }).join('');
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs  / 24);
  if (days  > 0) return days  + ' day'  + (days  > 1 ? 's' : '') + ' ago';
  if (hrs   > 0) return hrs   + ' hour' + (hrs   > 1 ? 's' : '') + ' ago';
  if (mins  > 0) return mins  + ' min'  + (mins  > 1 ? 's' : '') + ' ago';
  return 'just now';
}
