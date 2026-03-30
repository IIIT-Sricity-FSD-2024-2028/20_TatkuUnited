// ── Collective Manager – Manage Units JS ──
// Depends on: store.js → auth.js (loaded before this script)

/* Global unit array used by filters/modal */
let units = [];

/* ── Category CSS class map ── */
const catClass = {};

/* ── Render table from data ── */
function renderTable(data) {
  const tbody = document.getElementById('unitsTableBody');
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">No units found.</td></tr>';
    return;
  }

  data.forEach(u => {
    const tr = document.createElement('tr');
    const ratingDisplay = u.rating ? u.rating.toFixed(1) : 'N/A';
    const catKey = (u.category || '').replace(/\s+/g, '_').toLowerCase();
    tr.innerHTML = `
      <td>
        <div class="unit-name">${u.name}</div>
        <div class="unit-manager">${u.manager}</div>
      </td>
      <td><span class="cat-badge ${catClass[u.category] || ''}">${u.category}</span></td>
      <td><span class="rating"><span class="star">★</span>${ratingDisplay}</span></td>
      <td>${u.providers}</td>
      <td>${u.completed.toLocaleString()}</td>
      <td>${u.active}</td>
      <td><span class="${u.status === 'Active' ? 'status-active' : 'status-suspended'}">${u.status}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-icon-btn" title="View">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="tbl-icon-btn btn-edit" data-id="${u.id}" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="tbl-icon-btn btn-suspend" data-id="${u.id}" title="${u.status === 'Active' ? 'Suspend' : 'Reactivate'}">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const unit = units.find(u => u.id === btn.dataset.id);
      if (unit) openModal(unit);
    });
  });

  document.querySelectorAll('.btn-suspend').forEach(btn => {
    btn.addEventListener('click', () => {
      const unit = units.find(u => u.id === btn.dataset.id);
      if (unit) {
        unit.status = unit.status === 'Active' ? 'Suspended' : 'Active';
        applyFilters();
        showToast(unit.status === 'Active' ? `✓ ${unit.name} reactivated` : `⚠ ${unit.name} suspended`);
      }
    });
  });
}

function applyFilters() {
  const search = (document.getElementById('unitSearch').value || '').toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = units.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search) || u.manager.toLowerCase().includes(search);
    const matchStatus = status === 'All' || u.status === status;
    return matchSearch && matchStatus;
  });
  renderTable(filtered);
}

document.getElementById('unitSearch').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

/* ── Modal ── */
let editingId = null;
function openModal(unit) {
  editingId = unit ? unit.id : null;
  document.getElementById('modalTitle').textContent = unit ? 'Edit Unit' : 'Create New Unit';
  document.getElementById('unitName').value     = unit ? unit.name     : '';
  document.getElementById('unitManager').value  = unit ? unit.manager  : '';
  document.getElementById('unitCategory').value = unit ? unit.category : 'Plumbing';
  document.getElementById('btnSave').textContent = unit ? 'Save Changes' : 'Create Unit';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

document.getElementById('btnCreateUnit').addEventListener('click', () => openModal(null));
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('btnSave').addEventListener('click', () => {
  const name = document.getElementById('unitName').value.trim();
  const mgr  = document.getElementById('unitManager').value.trim();
  const cat  = document.getElementById('unitCategory').value;
  if (!name || !mgr) { showToast('⚠ Please fill in all fields'); return; }
  if (editingId) {
    const unit = units.find(u => u.id === editingId);
    if (unit) { unit.name = name; unit.manager = mgr; unit.category = cat; }
    showToast(`✓ ${name} updated`);
  } else {
    units.push({ id: 'new-' + Date.now(), name, manager: mgr, category: cat, rating: null, providers: 0, completed: 0, active: 0, status: 'Active' });
    showToast(`✓ ${name} created`);
  }
  closeModal();
  applyFilters();
  updateSummaryCards();
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Summary cards ── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateSummaryCards() {
  const totalUnits   = units.length;
  const totalProv    = units.reduce((s, u) => s + u.providers, 0);
  const totalComp    = units.reduce((s, u) => s + u.completed, 0);
  const totalActive  = units.reduce((s, u) => s + u.active, 0);
  setText('sum-total-units',    totalUnits);
  setText('sum-total-providers', totalProv);
  setText('sum-completed-jobs',  totalComp.toLocaleString('en-IN'));
  setText('sum-active-jobs',     totalActive);
}

/* ── Avatar ── */
function getInitials(name) {
  if (!name) return 'CM';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   MAIN – runs after AppStore is ready
   ═══════════════════════════════════════════════════════════ */
AppStore.ready.then(() => {
  /* 1. Auth gate */
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;

  const collectiveId = session.collectiveId;

  /* 2. Pull tables */
  const allUnits       = AppStore.getTable('units')            || [];
  const allProviders   = AppStore.getTable('service_providers') || [];
  const allManagers    = AppStore.getTable('unit_managers')     || [];
  const allAssignments = AppStore.getTable('job_assignments')   || [];

  /* 3. Scope to this collective */
  const myRawUnits = allUnits.filter(u => u.collective_id === collectiveId);

  /* 4. Build category → unit map via providers' skills and unit name */
  // Since units don't have a category field, we derive from unit_name
  function deriveCategoryFromName(unitName) {
    const n = (unitName || '').toLowerCase();
    if (n.includes('electric'))   return 'Electrical';
    if (n.includes('plumb'))      return 'Plumbing';
    if (n.includes('clean'))      return 'Cleaning';
    if (n.includes('landscap') || n.includes('garden')) return 'Landscaping';
    if (n.includes('security'))   return 'Security';
    if (n.includes('paint'))      return 'Painting';
    if (n.includes('carpent') || n.includes('furniture')) return 'Carpentry';
    if (n.includes('ac') || n.includes('appliance'))      return 'AC & Appliances';
    if (n.includes('pest'))       return 'Pest Control';
    return unitName;
  }

  /* 5. Build unit-manager look-up */
  const unitManagerMap = Object.fromEntries(
    allManagers.map(um => [um.unit_id, um.name])
  );

  /* 6. Build provider count per unit */
  const providersByUnit = {};
  allProviders.forEach(p => {
    if (!providersByUnit[p.unit_id]) providersByUnit[p.unit_id] = 0;
    providersByUnit[p.unit_id]++;
  });

  /* 7. Build completed/active assignment counts per unit */
  // Map provider → unit
  const providerUnitMap = Object.fromEntries(allProviders.map(p => [p.service_provider_id, p.unit_id]));
  const completedByUnit = {};
  const activeByUnit    = {};
  allAssignments.forEach(ja => {
    const uid = providerUnitMap[ja.service_provider_id];
    if (!uid) return;
    if (ja.status === 'COMPLETED') completedByUnit[uid] = (completedByUnit[uid] || 0) + 1;
    if (ja.status === 'IN_PROGRESS' || ja.status === 'ASSIGNED') activeByUnit[uid] = (activeByUnit[uid] || 0) + 1;
  });

  /* 8. Compose units array */
  units = myRawUnits.map(u => ({
    id:        u.unit_id,
    name:      u.unit_name,
    manager:   unitManagerMap[u.unit_id] || '—',
    category:  deriveCategoryFromName(u.unit_name),
    rating:    u.rating || null,
    providers: providersByUnit[u.unit_id] || 0,
    completed: completedByUnit[u.unit_id] || 0,
    active:    activeByUnit[u.unit_id]    || 0,
    status:    u.is_active ? 'Active' : 'Suspended',
  }));

  /* 9. Topbar avatar */
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = getInitials(session.name);

  /* 10. Render */
  updateSummaryCards();
  renderTable(units);
});
