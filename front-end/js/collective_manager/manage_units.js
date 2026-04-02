// ── Collective Manager – Manage Units JS ──

let units = [];
let currentSession = null;

const catClass = {
  'Plumbing': 'cat-plumbing',
  'Electrical': 'cat-electrical',
  'Cleaning': 'cat-cleaning'
};

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
    tr.dataset.id = u.id; // Store ID for row click
    const ratingDisplay = u.rating ? u.rating.toFixed(1) : 'N/A';
    
    tr.innerHTML = `
      <td>
        <div class="unit-name">${u.name}</div>
        <div class="unit-manager">${u.manager}</div>
      </td>
      <td><span class="cat-badge">${u.category}</span></td>
      <td><span class="rating"><span class="star">★</span>${ratingDisplay}</span></td>
      <td>${u.providers}</td>
      <td>${u.completed.toLocaleString()}</td>
      <td>${u.active}</td>
      <td><span class="${u.status === 'Active' ? 'status-active' : 'status-suspended'}">${u.status}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-icon-btn btn-view-det" data-id="${u.id}" title="View Details">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="tbl-icon-btn btn-edit" data-id="${u.id}" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </td>
    `;

    // Row click for Dashboard
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.tbl-actions')) return; // Ignore if clicking action buttons
      openUnitDetails(u.id);
    });

    tbody.appendChild(tr);
  });

  // Action button listeners
  document.querySelectorAll('.btn-view-det').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openUnitDetails(btn.dataset.id);
    });
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const unit = units.find(u => u.id === btn.dataset.id);
      if (unit) openEditModal(unit);
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

/* ── Unit Detailed Dashboard ── */
function openUnitDetails(unitId) {
  const allUnits = AppStore.getTable('units') || [];
  const unit = allUnits.find(u => u.unit_id === unitId);
  if (!unit) return;

  const allManagers = AppStore.getTable('unit_managers') || [];
  const manager = allManagers.find(m => m.unit_id === unitId);

  const allProviders = AppStore.getTable('service_providers') || [];
  const unitProviders = allProviders.filter(p => p.unit_id === unitId);

  // Populate Dashboard
  document.getElementById('det-unit-name').textContent = unit.unit_name;
  document.getElementById('det-unit-cat').textContent = unit.category || 'Service Unit';
  document.getElementById('det-unit-rating').textContent = (unit.rating ? unit.rating.toFixed(1) : 'N/A') + ' ★';
  
  // Stats
  const completedJobs = AppStore.getTable('job_assignments').filter(ja => {
     const p = allProviders.find(prov => prov.service_provider_id === ja.service_provider_id);
     return p && p.unit_id === unitId && ja.status === 'COMPLETED';
  }).length;
  document.getElementById('det-unit-done').textContent = completedJobs;

  // Manager Card
  const mgrName = document.getElementById('det-mgr-name');
  const mgrIcon = document.getElementById('det-mgr-icon');
  const mgrStatus = document.getElementById('det-mgr-status');
  const mgrContact = document.getElementById('det-mgr-contact');

  if (manager) {
    mgrName.textContent = manager.name;
    mgrIcon.textContent = manager.name.split(' ').map(n => n[0]).join('').toUpperCase();
    mgrStatus.textContent = manager.is_active ? 'Active' : 'Inactive';
    mgrStatus.style.color = manager.is_active ? '#16a34a' : '#dc2626';
    mgrContact.textContent = manager.email || 'No email';
    
    // Click manager to see their details (reusing existing view logic if needed, or just staying here)
    document.getElementById('det-manager-card').onclick = () => {
       // Optionally open a manager-specific modal or just show toast
       showToast(`Viewing details for Manager: ${manager.name}`);
    };
  } else {
    mgrName.textContent = 'Unassigned';
    mgrIcon.textContent = '?';
    mgrStatus.textContent = 'N/A';
    mgrContact.textContent = '—';
  }

  // Roster rendering
  const rosterBody = document.getElementById('det-roster-body');
  rosterBody.innerHTML = '';
  if (unitProviders.length === 0) {
    rosterBody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:24px;color:#9ca3af;">No providers assigned to this unit.</td></tr>';
  } else {
    unitProviders.forEach(p => {
      const tr = document.createElement('tr');
      const r = p.rating ? p.rating.toFixed(1) : 'N/A';
      tr.innerHTML = `
        <td class="p-roster-name">${p.name}</td>
        <td><span class="rating"><span class="star">★</span>${r}</span></td>
        <td><span class="status-active" style="background:${p.is_active ? '#f0fdf4':'#fef2f2'}; color:${p.is_active ? '#16a34a':'#dc2626'};">${p.is_active ? 'Active' : 'Inactive'}</span></td>
      `;
      tr.onclick = () => {
         window.location.href = `provider_profile.html?id=${p.service_provider_id}`;
      };
      rosterBody.appendChild(tr);
    });
  }

  document.getElementById('unitDetailOverlay').classList.add('open');
}

function closeUnitDetails() {
  document.getElementById('unitDetailOverlay').classList.remove('open');
}

document.getElementById('det-modal-close').onclick = closeUnitDetails;
document.getElementById('unitDetailOverlay').onclick = (e) => {
  if (e.target === e.currentTarget) closeUnitDetails();
};

/* ── Edit/Create Modal ── */
let editingId = null;
function openEditModal(unit) {
  editingId = unit ? unit.id : null;
  document.getElementById('modalTitle').textContent = unit ? 'Edit Unit' : 'Create New Unit';
  document.getElementById('unitName').value = unit ? unit.name : '';
  document.getElementById('unitManager').value = unit ? unit.manager : '';
  document.getElementById('unitCategory').value = unit ? unit.category : 'Plumbing';
  document.getElementById('btnSave').textContent = unit ? 'Save Changes' : 'Create Unit';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('btnCreateUnit').onclick = () => openEditModal(null);
document.getElementById('modalClose').onclick = closeModal;
document.getElementById('btnCancel').onclick = closeModal;

/* ── Toast and Summary ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function updateSummaryCards() {
  const totalUnits = units.length;
  const totalProv = units.reduce((s, u) => s + u.providers, 0);
  const totalComp = units.reduce((s, u) => s + u.completed, 0);
  const totalActive = units.reduce((s, u) => s + u.active, 0);
  document.getElementById('sum-total-units').textContent = totalUnits;
  document.getElementById('sum-total-providers').textContent = totalProv;
  document.getElementById('sum-completed-jobs').textContent = totalComp.toLocaleString();
  document.getElementById('sum-active-jobs').textContent = totalActive;
}

/* ── Initialization ── */
AppStore.ready.then(() => {
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;
  currentSession = session;

  const allUnits = AppStore.getTable('units').filter(u => u.collective_id === session.collectiveId);
  const allProviders = AppStore.getTable('service_providers') || [];
  const allManagers = AppStore.getTable('unit_managers') || [];
  const allAssignments = AppStore.getTable('job_assignments') || [];

  const managerMap = Object.fromEntries(allManagers.map(m => [m.unit_id, m.name]));
  const providersByUnit = {};
  allProviders.forEach(p => {
    providersByUnit[p.unit_id] = (providersByUnit[p.unit_id] || 0) + 1;
  });

  const completedMap = {};
  const activeMap = {};
  allAssignments.forEach(ja => {
    const p = allProviders.find(prov => prov.service_provider_id === ja.service_provider_id);
    if (!p) return;
    if (ja.status === 'COMPLETED') completedMap[p.unit_id] = (completedMap[p.unit_id] || 0) + 1;
    else activeMap[p.unit_id] = (activeMap[p.unit_id] || 0) + 1;
  });

  units = allUnits.map(u => ({
    id: u.unit_id,
    name: u.unit_name,
    manager: managerMap[u.unit_id] || 'Unassigned',
    category: u.category || 'Service',
    rating: u.rating || null,
    providers: providersByUnit[u.unit_id] || 0,
    completed: completedMap[u.unit_id] || 0,
    active: activeMap[u.unit_id] || 0,
    status: u.is_active ? 'Active' : 'Suspended'
  }));

  const avatarEl = document.getElementById('topbar-avatar');
  if (avatarEl) avatarEl.textContent = session.name.split(' ').map(n => n[0]).join('').toUpperCase();

  updateSummaryCards();
  renderTable(units);
});
