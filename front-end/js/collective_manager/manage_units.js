// ── Collective Manager – Manage Units JS — API-backed ──

let units = [];
let currentSession = null;

/* ── Render table from data ── */
function renderTable(data) {
  const tbody = document.getElementById('unitsTableBody');
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#9ca3af;">No units found.</td></tr>';
    return;
  }

  data.forEach(u => {
    const tr = document.createElement('tr');
    tr.dataset.id = u.id;
    const ratingDisplay = u.rating ? u.rating.toFixed(1) : 'N/A';
    
    tr.innerHTML = `
      <td>
        <div class="unit-name">${u.name}</div>
        <div class="unit-manager">${u.manager}</div>
      </td>
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

    tr.addEventListener('click', (e) => {
      if (e.target.closest('.tbl-actions')) return;
      openUnitDetails(u.id);
    });

    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-view-det').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openUnitDetails(btn.dataset.id); });
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

/* ── Cached API data for detail views ── */
let _allProviders = [], _allManagers = [], _allAssignments = [];

/* ── Unit Detailed Dashboard ── */
async function openUnitDetails(unitId) {
  const unit = units.find(u => u.id === unitId);
  if (!unit) return;

  const manager = _allManagers.find(m => m.unit_id === unitId);
  const unitProviders = _allProviders.filter(p => p.unit_id === unitId);

  document.getElementById('det-unit-name').textContent = unit.name;
  document.getElementById('det-unit-cat').textContent = unit.category || 'Service Unit';
  document.getElementById('det-unit-rating').textContent = (unit.rating ? unit.rating.toFixed(1) : 'N/A') + ' ★';
  
  const completedJobs = _allAssignments.filter(ja => {
    const p = _allProviders.find(prov => prov.sp_id === ja.sp_id);
    return p && p.unit_id === unitId && ja.status === 'COMPLETED';
  }).length;
  document.getElementById('det-unit-done').textContent = completedJobs;

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
    document.getElementById('det-manager-card').onclick = () => showToast(`Viewing details for Manager: ${manager.name}`);
  } else {
    mgrName.textContent = 'Unassigned';
    mgrIcon.textContent = '?';
    mgrStatus.textContent = 'N/A';
    mgrContact.textContent = '—';
  }

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
      tr.onclick = () => window.location.href = `provider_profile.html#id=${p.sp_id}`;
      rosterBody.appendChild(tr);
    });
  }

  document.getElementById('unitDetailOverlay').classList.add('open');
}

function closeUnitDetails() { document.getElementById('unitDetailOverlay').classList.remove('open'); }
document.getElementById('det-modal-close').onclick = closeUnitDetails;
document.getElementById('unitDetailOverlay').onclick = (e) => { if (e.target === e.currentTarget) closeUnitDetails(); };

/* ── Searchable Manager Dropdown Logic ── */
function getUnassignedManagers(excludeUnitId) {
  // An "unassigned" manager is one whose unit_id is empty/falsy
  // OR whose unit_id matches the unit being edited (so you can re-select them)
  const assignedUnitIds = new Set(
    _allManagers
      .filter(m => m.unit_id && m.unit_id !== excludeUnitId)
      .map(m => m.unit_id)
  );
  return _allManagers.filter(m => {
    if (!m.unit_id || m.unit_id === '') return true;  // truly unassigned
    if (m.unit_id === excludeUnitId) return true;     // currently assigned to this unit
    return false;
  });
}

function renderDropdownOptions(managers, dropdown) {
  dropdown.innerHTML = '';
  if (managers.length === 0) {
    const noRes = document.createElement('div');
    noRes.className = 'searchable-select-option no-results';
    noRes.textContent = 'No available managers found';
    dropdown.appendChild(noRes);
    return;
  }
  managers.forEach(m => {
    const opt = document.createElement('div');
    opt.className = 'searchable-select-option';
    opt.dataset.id = m.um_id;
    const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase();
    opt.innerHTML = `
      <div class="opt-avatar">${initials}</div>
      <div class="opt-details">
        <span class="opt-name">${m.name}</span>
        <span class="opt-email">${m.email}</span>
      </div>
    `;
    opt.addEventListener('click', () => selectManager(m));
    dropdown.appendChild(opt);
  });
}

function selectManager(manager) {
  document.getElementById('selectedManagerId').value = manager.um_id;
  document.getElementById('selectedManagerName').textContent = manager.name;
  document.getElementById('selectedManagerTag').style.display = 'flex';
  document.getElementById('managerSearchInput').classList.add('has-selection');
  document.getElementById('managerSearchInput').value = '';
  document.getElementById('managerDropdown').classList.remove('open');
  document.getElementById('managerError').style.display = 'none';
}

function clearManagerSelection() {
  document.getElementById('selectedManagerId').value = '';
  document.getElementById('selectedManagerName').textContent = '';
  document.getElementById('selectedManagerTag').style.display = 'none';
  document.getElementById('managerSearchInput').classList.remove('has-selection');
  document.getElementById('managerSearchInput').value = '';
  document.getElementById('managerError').style.display = 'none';
}

function initManagerDropdown(excludeUnitId) {
  const searchInput = document.getElementById('managerSearchInput');
  const dropdown = document.getElementById('managerDropdown');
  
  const available = getUnassignedManagers(excludeUnitId);
  renderDropdownOptions(available, dropdown);

  // Remove old listeners by cloning
  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newInput, searchInput);

  newInput.addEventListener('focus', () => {
    const q = newInput.value.toLowerCase();
    const filtered = available.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
    renderDropdownOptions(filtered, dropdown);
    dropdown.classList.add('open');
  });

  newInput.addEventListener('input', () => {
    const q = newInput.value.toLowerCase();
    const filtered = available.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
    renderDropdownOptions(filtered, dropdown);
    dropdown.classList.add('open');
    // Hide error while typing
    document.getElementById('managerError').style.display = 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!e.target.closest('#managerSelectWrap')) {
      dropdown.classList.remove('open');
    }
  });

  // Wire up clear button
  const clearBtn = document.getElementById('clearManagerBtn');
  const newClearBtn = clearBtn.cloneNode(true);
  clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
  newClearBtn.addEventListener('click', clearManagerSelection);
}

/* ── Edit/Create Modal ── */
let editingId = null;
let _editingUnit = null;

function openEditModal(unit) {
  editingId = unit ? unit.id : null;
  _editingUnit = unit || null;
  
  document.getElementById('modalTitle').textContent = unit ? 'Edit Unit' : 'Create New Unit';
  document.getElementById('unitName').value = unit ? unit.name : '';
  document.getElementById('btnSave').textContent = unit ? 'Save Changes' : 'Create Unit';
  document.getElementById('managerError').style.display = 'none';

  // Clear manager selection
  clearManagerSelection();

  // Initialize the dropdown with unassigned managers
  initManagerDropdown(editingId);

  // If editing, pre-select the current manager if one exists
  if (unit && editingId) {
    const currentManager = _allManagers.find(m => m.unit_id === editingId);
    if (currentManager) {
      selectManager(currentManager);
    }
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { 
  document.getElementById('modalOverlay').classList.remove('open'); 
  document.getElementById('managerDropdown').classList.remove('open');
}

document.getElementById('btnCreateUnit').onclick = () => openEditModal(null);
document.getElementById('modalClose').onclick = closeModal;
document.getElementById('btnCancel').onclick = closeModal;

/* ── Save Handler ── */
document.getElementById('btnSave').addEventListener('click', async () => {
  const unitName = document.getElementById('unitName').value.trim();
  const selectedManagerId = document.getElementById('selectedManagerId').value;
  const searchInputVal = document.getElementById('managerSearchInput').value.trim();

  // Validate unit name
  if (!unitName) {
    showToast('Please enter a unit name.', 'error');
    return;
  }

  // Validate manager: if user typed something but didn't select from dropdown → invalid
  if (searchInputVal && !selectedManagerId) {
    document.getElementById('managerError').style.display = 'flex';
    return;
  }

  const btnSave = document.getElementById('btnSave');
  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  try {
    if (editingId) {
      // ── EDIT MODE ──
      // 1. Update unit name
      await Api.patch(`/units/${editingId}`, { unit_name: unitName });

      // 2. Handle manager assignment changes
      const previousManager = _allManagers.find(m => m.unit_id === editingId);
      
      if (previousManager && previousManager.um_id !== selectedManagerId) {
        // Unassign previous manager
        await Api.patch(`/unit-managers/${previousManager.um_id}`, { unit_id: '' });
      }
      
      if (selectedManagerId && (!previousManager || previousManager.um_id !== selectedManagerId)) {
        // Assign new manager to this unit
        await Api.patch(`/unit-managers/${selectedManagerId}`, { unit_id: editingId });
      }

      showToast('Unit updated successfully!');
    } else {
      // ── CREATE MODE ──
      const newUnit = await Api.post('/units', {
        unit_name: unitName,
        is_active: true,
        collective_id: currentSession.collectiveId
      });

      // If a manager was selected, assign them to the new unit
      if (selectedManagerId && newUnit && newUnit.unit_id) {
        await Api.patch(`/unit-managers/${selectedManagerId}`, { unit_id: newUnit.unit_id });
      }

      showToast('Unit created successfully!');
    }

    closeModal();
    // Refresh data
    await refreshData();
  } catch (err) {
    console.error('Save error:', err);
    showToast(err.message || 'Failed to save unit.', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = editingId ? 'Save Changes' : 'Create Unit';
  }
});

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

/* ── Data Refresh ── */
async function refreshData() {
  let allUnits = await Api.get("/units");
  allUnits = allUnits.filter(u => u.collective_id === currentSession.collectiveId);

  _allProviders = await Api.get("/service-providers");
  _allManagers = await Api.get("/unit-managers");
  _allAssignments = await Api.get("/job-assignments");

  const managerMap = Object.fromEntries(_allManagers.map(m => [m.unit_id, m.name]));
  const providersByUnit = {};
  _allProviders.forEach(p => { providersByUnit[p.unit_id] = (providersByUnit[p.unit_id] || 0) + 1; });

  const completedMap = {};
  const activeMap = {};
  _allAssignments.forEach(ja => {
    const p = _allProviders.find(prov => prov.sp_id === ja.sp_id);
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

  updateSummaryCards();
  applyFilters();
}

/* ── Initialization ── */
(async () => {
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;
  currentSession = session;

  const avatarEl = document.getElementById('topbar-avatar');
  if (avatarEl) avatarEl.textContent = session.name.split(' ').map(n => n[0]).join('').toUpperCase();

  await refreshData();
})();
