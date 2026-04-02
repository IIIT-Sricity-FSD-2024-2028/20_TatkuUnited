// ── Collective Manager – Manage Units JS ──

'use strict';

var units = [];
var currentSession = null;
var editingId = null;

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

function updateSummaryCards() {
  var totalUnits  = units.length;
  var totalProv   = units.reduce(function (s, u) { return s + (u.providers || 0); }, 0);
  var totalComp   = units.reduce(function (s, u) { return s + (u.completed || 0); }, 0);
  var totalActive = units.reduce(function (s, u) { return s + (u.active || 0); }, 0);
  var el;
  if ((el = document.getElementById('sum-total-units')))     el.textContent = totalUnits;
  if ((el = document.getElementById('sum-total-providers'))) el.textContent = totalProv;
  if ((el = document.getElementById('sum-completed-jobs')))  el.textContent = totalComp.toLocaleString();
  if ((el = document.getElementById('sum-active-jobs')))     el.textContent = totalActive;
}

/* ══════════════════════════════════════════════
   RENDER TABLE
══════════════════════════════════════════════ */

function renderTable(data) {
  var tbody = document.getElementById('unitsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">No units found.</td></tr>';
    return;
  }

  data.forEach(function (u) {
    var tr = document.createElement('tr');
    tr.dataset.id = u.id;
    var ratingDisplay = (u.rating != null) ? Number(u.rating).toFixed(1) : 'N/A';

    tr.innerHTML =
      '<td>' +
        '<div class="unit-name">'    + (u.name    || '—') + '</div>' +
        '<div class="unit-manager">' + (u.manager || '—') + '</div>' +
      '</td>' +
      '<td><span class="cat-badge">' + (u.category || '—') + '</span></td>' +
      '<td><span class="rating"><span class="star">★</span>' + ratingDisplay + '</span></td>' +
      '<td>' + (u.providers || 0) + '</td>' +
      '<td>' + (u.completed || 0).toLocaleString() + '</td>' +
      '<td>' + (u.active    || 0) + '</td>' +
      '<td><span class="' + (u.status === 'Active' ? 'status-active' : 'status-suspended') + '">' + (u.status || '—') + '</span></td>' +
      '<td>' +
        '<div class="tbl-actions">' +
          '<button class="tbl-icon-btn btn-view-det" data-id="' + u.id + '" title="View Details">' +
            '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
          '</button>' +
          '<button class="tbl-icon-btn btn-edit" data-id="' + u.id + '" title="Edit">' +
            '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
          '</button>' +
        '</div>' +
      '</td>';

    /* Row click → details */
    tr.addEventListener('click', (function (uid) {
      return function (e) {
        if (e.target.closest('.tbl-actions')) return;
        openUnitDetails(uid);
      };
    }(u.id)));

    tbody.appendChild(tr);
  });

  /* Action button listeners */
  tbody.querySelectorAll('.btn-view-det').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      openUnitDetails(btn.dataset.id);
    });
  });

  tbody.querySelectorAll('.btn-edit').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var unit = units.find(function (u) { return u.id === btn.dataset.id; });
      if (unit) openEditModal(unit);
    });
  });
}

function applyFilters() {
  var search = (document.getElementById('unitSearch').value || '').toLowerCase();
  var status = document.getElementById('statusFilter').value;
  var filtered = units.filter(function (u) {
    var matchSearch = (u.name    || '').toLowerCase().includes(search) ||
                      (u.manager || '').toLowerCase().includes(search);
    var matchStatus = status === 'All' || u.status === status;
    return matchSearch && matchStatus;
  });
  renderTable(filtered);
}

/* ══════════════════════════════════════════════
   UNIT DETAIL OVERLAY
══════════════════════════════════════════════ */

function openUnitDetails(unitId) {
  var allUnits    = AppStore.getTable('units')            || [];
  var unit        = allUnits.find(function (u) { return u.unit_id === unitId; });
  if (!unit) return;

  var allManagers  = AppStore.getTable('unit_managers')   || [];
  var allProviders = AppStore.getTable('service_providers') || [];
  var manager      = allManagers.find(function (m) { return m.unit_id === unitId; });
  var unitProviders = allProviders.filter(function (p) { return p.unit_id === unitId; });

  document.getElementById('det-unit-name').textContent   = unit.unit_name;
  document.getElementById('det-unit-cat').textContent    = unit.category || 'Service Unit';
  document.getElementById('det-unit-rating').textContent = (unit.rating != null ? Number(unit.rating).toFixed(1) : 'N/A') + ' ★';

  var completedJobs = (AppStore.getTable('job_assignments') || []).filter(function (ja) {
    var p = allProviders.find(function (prov) { return prov.service_provider_id === ja.service_provider_id; });
    return p && p.unit_id === unitId && ja.status === 'COMPLETED';
  }).length;
  document.getElementById('det-unit-done').textContent = completedJobs;

  var mgrName    = document.getElementById('det-mgr-name');
  var mgrIcon    = document.getElementById('det-mgr-icon');
  var mgrStatus  = document.getElementById('det-mgr-status');
  var mgrContact = document.getElementById('det-mgr-contact');

  if (manager) {
    mgrName.textContent    = manager.name;
    mgrIcon.textContent    = manager.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase();
    mgrStatus.textContent  = manager.is_active ? 'Active' : 'Inactive';
    mgrStatus.style.color  = manager.is_active ? '#16a34a' : '#dc2626';
    mgrContact.textContent = manager.email || 'No email';
    document.getElementById('det-manager-card').onclick = function () {
      showToast('Manager: ' + manager.name);
    };
  } else {
    mgrName.textContent    = 'Unassigned';
    mgrIcon.textContent    = '?';
    mgrStatus.textContent  = 'N/A';
    mgrContact.textContent = '—';
  }

  var rosterBody = document.getElementById('det-roster-body');
  rosterBody.innerHTML = '';
  if (!unitProviders.length) {
    rosterBody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:24px;color:#9ca3af;">No providers assigned to this unit.</td></tr>';
  } else {
    unitProviders.forEach(function (p) {
      var tr = document.createElement('tr');
      var r  = p.rating != null ? Number(p.rating).toFixed(1) : 'N/A';
      tr.innerHTML =
        '<td class="p-roster-name">' + p.name + '</td>' +
        '<td><span class="rating"><span class="star">★</span>' + r + '</span></td>' +
        '<td><span class="status-active" style="background:' + (p.is_active ? '#f0fdf4' : '#fef2f2') + ';color:' + (p.is_active ? '#16a34a' : '#dc2626') + ';">' + (p.is_active ? 'Active' : 'Inactive') + '</span></td>';
      tr.style.cursor = 'pointer';
      tr.onclick = function () {
        window.location.href = 'provider_profile.html?id=' + p.service_provider_id;
      };
      rosterBody.appendChild(tr);
    });
  }

  document.getElementById('unitDetailOverlay').classList.add('open');
}

function closeUnitDetails() {
  document.getElementById('unitDetailOverlay').classList.remove('open');
}

/* ══════════════════════════════════════════════
   CREATE / EDIT MODAL
══════════════════════════════════════════════ */

function openEditModal(unit) {
  editingId = unit ? unit.id : null;
  document.getElementById('modalTitle').textContent       = unit ? 'Edit Unit' : 'Create New Unit';
  document.getElementById('unitName').value               = unit ? unit.name     : '';
  document.getElementById('unitManager').value            = unit ? unit.manager  : '';
  document.getElementById('unitCategory').value           = unit ? unit.category : 'Plumbing';
  document.getElementById('btnSave').textContent          = unit ? 'Save Changes' : 'Create Unit';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

/* ══════════════════════════════════════════════
   SAVE HANDLER  (create or edit)
══════════════════════════════════════════════ */

function handleSave() {
  var nameVal     = (document.getElementById('unitName').value     || '').trim();
  var managerVal  = (document.getElementById('unitManager').value  || '').trim();
  var categoryVal = (document.getElementById('unitCategory').value || '').trim();

  if (!nameVal) {
    showToast('⚠ Unit name is required.');
    return;
  }

  /* ── Always grab the live table reference ── */
  var storeUnits = AppStore.getTable('units') || [];

  if (editingId) {
    /* ── EDIT ── */
    var storeRow = storeUnits.find(function (u) { return u.unit_id === editingId; });
    if (storeRow) {
      storeRow.unit_name = nameVal;
      storeRow.category  = categoryVal;
      /* Also try to patch manager name in unit_managers */
      var mgrRow = (AppStore.getTable('unit_managers') || []).find(function (m) { return m.unit_id === editingId; });
      if (mgrRow && managerVal) mgrRow.name = managerVal;
      AppStore.save();
    }
    /* Patch local display row */
    var localIdx = units.findIndex(function (u) { return u.id === editingId; });
    if (localIdx !== -1) {
      units[localIdx].name     = nameVal;
      units[localIdx].manager  = managerVal || 'Unassigned';
      units[localIdx].category = categoryVal;
    }
    showToast('✓ Unit updated successfully.');

  } else {
    /* ── CREATE ── */
    var newId = AppStore.nextId('UNT');
    var collectiveId = (currentSession && currentSession.collectiveId) || null;

    var newStoreRow = {
      unit_id:       newId,
      unit_name:     nameVal,
      category:      categoryVal,
      collective_id: collectiveId,
      is_active:     true,
      rating:        null,
      created_at:    new Date().toISOString()
    };
    storeUnits.push(newStoreRow);
    AppStore.save();

    /* Add a manager row if a name was provided */
    if (managerVal) {
      var allMgrs = AppStore.getTable('unit_managers') || [];
      var newMgrId = AppStore.nextId('UM');
      allMgrs.push({
        um_id:      newMgrId,
        name:       managerVal,
        email:      '',
        password:   '',
        unit_id:    newId,
        collective_id: collectiveId,
        is_active:  true,
        created_at: new Date().toISOString()
      });
      AppStore.save();
    }

    var newDisplayRow = {
      id:        newId,
      name:      nameVal,
      manager:   managerVal || 'Unassigned',
      category:  categoryVal,
      rating:    null,
      providers: 0,
      completed: 0,
      active:    0,
      status:    'Active'
    };
    units.push(newDisplayRow);
    showToast('✓ Unit "' + nameVal + '" created successfully.');
  }

  closeModal();
  updateSummaryCards();
  applyFilters();
}

/* ══════════════════════════════════════════════
   INITIALIZATION  – runs after DOM + AppStore ready
══════════════════════════════════════════════ */

function buildUnitsFromStore(session) {
  var allProviders  = AppStore.getTable('service_providers') || [];
  var allManagers   = AppStore.getTable('unit_managers')     || [];
  var allAssignments = AppStore.getTable('job_assignments')  || [];
  var allStoreUnits = AppStore.getTable('units')             || [];

  /* Filter by collective — if collectiveId is null/undefined, show all (dev/demo fallback) */
  var filtered = session && session.collectiveId
    ? allStoreUnits.filter(function (u) { return u.collective_id === session.collectiveId; })
    : allStoreUnits;

  var managerMap = {};
  allManagers.forEach(function (m) { managerMap[m.unit_id] = m.name; });

  var providersByUnit = {};
  allProviders.forEach(function (p) {
    providersByUnit[p.unit_id] = (providersByUnit[p.unit_id] || 0) + 1;
  });

  var completedMap = {};
  var activeMap    = {};
  allAssignments.forEach(function (ja) {
    var p = allProviders.find(function (prov) { return prov.service_provider_id === ja.service_provider_id; });
    if (!p) return;
    if (ja.status === 'COMPLETED') completedMap[p.unit_id] = (completedMap[p.unit_id] || 0) + 1;
    else                           activeMap[p.unit_id]    = (activeMap[p.unit_id]    || 0) + 1;
  });

  units = filtered.map(function (u) {
    return {
      id:        u.unit_id,
      name:      u.unit_name,
      manager:   managerMap[u.unit_id] || 'Unassigned',
      category:  u.category || 'Service',
      rating:    u.rating || null,
      providers: providersByUnit[u.unit_id] || 0,
      completed: completedMap[u.unit_id]    || 0,
      active:    activeMap[u.unit_id]       || 0,
      status:    u.is_active ? 'Active' : 'Suspended'
    };
  });

  updateSummaryCards();
  renderTable(units);
}

/* ── Wire up all DOM events once the document is ready ── */
document.addEventListener('DOMContentLoaded', function () {

  /* Filters */
  document.getElementById('unitSearch').addEventListener('input',  applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);

  /* Detail overlay close */
  document.getElementById('det-modal-close').onclick = closeUnitDetails;
  document.getElementById('unitDetailOverlay').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeUnitDetails();
  });

  /* Create / Edit modal open */
  document.getElementById('btnCreateUnit').addEventListener('click', function () {
    openEditModal(null);
  });

  /* Modal close buttons */
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click',  closeModal);
  document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });

  /* SAVE button */
  document.getElementById('btnSave').addEventListener('click', handleSave);

  /* Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeUnitDetails(); }
  });

  /* ── Wait for AppStore then initialise ── */
  AppStore.ready.then(function () {
    /* Try to get a session; if none (dev mode / direct file open), still show data */
    var session = null;
    try {
      session = Auth.requireSession(['collective_manager']);
    } catch (err) {
      console.warn('[ManageUnits] Auth.requireSession failed, running in dev mode:', err);
    }

    /* Auth.requireSession redirects and returns null if role mismatch — respect that */
    if (session === null && typeof Auth !== 'undefined') {
      /* Check if we're just unauthenticated (no session at all) — in that case Auth already redirected */
      var raw = sessionStorage.getItem('fsd_session');
      if (!raw) return; /* Already redirecting */
    }

    currentSession = session;

    var avatarEl = document.getElementById('topbar-avatar');
    if (avatarEl && session && session.name) {
      avatarEl.textContent = session.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase();
    }

    buildUnitsFromStore(session);
  });
});
