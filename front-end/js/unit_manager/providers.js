/**
 * providers.js — Unit Manager: Manage Providers
 *
 * Fixes applied:
 *  1. Summary badges ("Active Now" / "On-Job") now reflect real counts from data.
 *  2. Pagination is fully dynamic — no hardcoded page buttons in HTML.
 *  3. Added providers are saved to localStorage and restored on every page load,
 *     so they survive a browser refresh.
 */

/* ─────────────────────────────────────────────
   1. MOCK DATA  (mirrors mockData.json schema)
   ───────────────────────────────────────────── */

const mockSkills = [
  { skill_id: 'SKL001', skill_name: 'Plumbing' },
  { skill_id: 'SKL002', skill_name: 'Electrical Wiring' },
  { skill_id: 'SKL003', skill_name: 'Deep Cleaning' },
  { skill_id: 'SKL004', skill_name: 'Carpentry' },
  { skill_id: 'SKL005', skill_name: 'AC Servicing' },
  { skill_id: 'SKL006', skill_name: 'Pest Control' },
];

const mockProviderSkills = [
  { service_provider_id: 'SP001', skill_id: 'SKL002' },
  { service_provider_id: 'SP001', skill_id: 'SKL005' },
  { service_provider_id: 'SP002', skill_id: 'SKL001' },
  { service_provider_id: 'SP002', skill_id: 'SKL003' },
  { service_provider_id: 'SP003', skill_id: 'SKL003' },
  { service_provider_id: 'SP004', skill_id: 'SKL004' },
  { service_provider_id: 'SP004', skill_id: 'SKL001' },
  { service_provider_id: 'SP005', skill_id: 'SKL005' },
  { service_provider_id: 'SP005', skill_id: 'SKL002' },
  { service_provider_id: 'SP006', skill_id: 'SKL002' },
  { service_provider_id: 'SP007', skill_id: 'SKL003' },
  { service_provider_id: 'SP008', skill_id: 'SKL003' },
  { service_provider_id: 'SP008', skill_id: 'SKL006' },
];

const mockUnits = [
  { unit_id: 'UNT001', unit_name: 'Electronics Repair'        },
  { unit_id: 'UNT002', unit_name: 'Plumbing Services'         },
  { unit_id: 'UNT004', unit_name: 'Carpentry & Furniture'     },
  { unit_id: 'UNT007', unit_name: 'AC & Appliance Repair'     },
  { unit_id: 'UNT008', unit_name: 'Electrical Services'       },
  { unit_id: 'UNT009', unit_name: 'Deep Cleaning Specialists' },
];

/** Raw service provider records (from mockData.json → service_providers) */
const mockServiceProviders = [
  { id: 'SP001', name: 'Ravi Kumar',      unit_id: 'UNT001', is_active: true,  rating: 4.5, perf: 92 },
  { id: 'SP002', name: 'Priya Sharma',    unit_id: 'UNT002', is_active: true,  rating: 4.2, perf: 85 },
  { id: 'SP003', name: 'Arjun Das',       unit_id: 'UNT001', is_active: false, rating: 3.5, perf: 64 },
  { id: 'SP004', name: 'Meera Krishnan',  unit_id: 'UNT004', is_active: true,  rating: 4.1, perf: 80 },
  { id: 'SP005', name: 'Sunil Babu',      unit_id: 'UNT007', is_active: true,  rating: 4.8, perf: 96 },
  { id: 'SP006', name: 'Divya Rao',       unit_id: 'UNT008', is_active: true,  rating: 4.4, perf: 88 },
  { id: 'SP007', name: 'Tamil Selvan',    unit_id: 'UNT009', is_active: true,  rating: 4.7, perf: 94 },
  { id: 'SP008', name: 'Nithya Lakshmi', unit_id: 'UNT009', is_active: true,  rating: 4.9, perf: 98 },
];

/* ─────────────────────────────────────────────
   2. LOOKUP MAPS
   ───────────────────────────────────────────── */

const skillMap = Object.fromEntries(mockSkills.map(s => [s.skill_id, s.skill_name]));
const unitMap  = Object.fromEntries(mockUnits.map(u  => [u.unit_id,  u.unit_name ]));

/* ─────────────────────────────────────────────
   3. PURE HELPERS
   ───────────────────────────────────────────── */

/** Derive perf label + CSS class from a numeric score (0–100) */
function perfMeta(score) {
  if (score >= 95) return { label: 'EXCELLENT', cls: 'excellent' };
  if (score >= 85) return { label: 'OPTIMAL',   cls: 'optimal'   };
  if (score >= 75) return { label: 'SOLID',      cls: 'solid'     };
  if (score >= 60) return { label: 'WARNING',    cls: 'warning'   };
  return                  { label: 'CRITICAL',   cls: 'critical'  };
}

/** Resolve the first skill name for a provider by their ID */
function resolveSkill(spId) {
  const rel = mockProviderSkills.find(ps => ps.service_provider_id === spId);
  return rel ? (skillMap[rel.skill_id] || 'General') : 'General';
}

/**
 * Assigns a display status. Inactive → Unavailable.
 * Active providers cycle: Active → On-Job → Idle.
 */
const STATUS_CYCLE = ['Active', 'On-Job', 'Idle'];
function deriveStatus(sp, index) {
  if (!sp.is_active) return 'Unavailable';
  return STATUS_CYCLE[index % STATUS_CYCLE.length];
}

/** Map status → pill CSS class */
function statusClass(s) {
  return ({ 'Active': 'active', 'On-Job': 'on-job', 'Idle': 'idle', 'Unavailable': 'unavailable' })[s] || 'idle';
}

/** Build filled/empty star string for a 0–5 rating */
function buildStars(rating) {
  let out = '';
  for (let i = 1; i <= 5; i++) out += i <= Math.floor(rating) ? '★' : (rating - i > -1 ? '★' : '☆');
  return out;
}

/** Up to 2 uppercase initials from a full name */
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Deterministic avatar background colour from name */
function avatarColor(name) {
  const palette = ['#3b82f6', '#0d9488', '#7c3aed', '#d97706', '#dc2626', '#16a34a'];
  return palette[name.charCodeAt(0) % palette.length];
}

/* ─────────────────────────────────────────────
   4. DATA LAYER — build base provider list
   ───────────────────────────────────────────── */

/** Build the canonical provider array from mock raw data */
function buildBaseProviders() {
  return mockServiceProviders.map((sp, idx) => {
    const { label, cls } = perfMeta(sp.perf);
    return {
      id:        sp.id,
      name:      sp.name,
      specialty: resolveSkill(sp.id),
      unit:      unitMap[sp.unit_id] || sp.unit_id,
      status:    deriveStatus(sp, idx),
      rating:    sp.rating,
      perf:      sp.perf,
      perfLabel: label,
      perfClass: cls,
      isNew:     false,   // flag: came from mock data, not user-added
    };
  });
}

/* ─────────────────────────────────────────────
   5. LOCALSTORAGE PERSISTENCE
   Only user-added providers are persisted.
   On load, base data is rebuilt fresh and user
   additions are merged on top.
   ───────────────────────────────────────────── */

const LS_KEY    = 'um_providers_added';
const LS_DEL    = 'um_providers_deleted'; // tracks IDs removed by the user

function loadAddedFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadDeletedFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  } catch {
    return [];
  }
}

function saveAddedToStorage(addedList) {
  localStorage.setItem(LS_KEY, JSON.stringify(addedList));
}

function saveDeletedToStorage(deletedIds) {
  localStorage.setItem(LS_DEL, JSON.stringify(deletedIds));
}

/**
 * Merge base providers with any user-added ones,
 * and apply deletions the user made.
 */
function loadProviders() {
  const base    = buildBaseProviders();
  const added   = loadAddedFromStorage();
  const deleted = new Set(loadDeletedFromStorage());

  // Filter out anything the user deleted from BOTH base and added
  const merged = [...added, ...base].filter(p => !deleted.has(p.id));
  return merged;
}

/* ─────────────────────────────────────────────
   6. APPLICATION STATE
   ───────────────────────────────────────────── */

let providers     = loadProviders();
let currentFilter = 'all';
const ROWS_PER_PAGE = 5;         // how many rows to show per page
let currentPage   = 1;

// Track user-added and user-deleted separately so we can persist them
let addedProviders  = loadAddedFromStorage();
let deletedIds      = new Set(loadDeletedFromStorage());

/** Auto-increment suffix for new provider IDs */
let nextIdSuffix = 900 + loadAddedFromStorage().length;

/* ─────────────────────────────────────────────
   7. SUMMARY BADGES — live counts
   ───────────────────────────────────────────── */

/** Update the "Active Now" and "On-Job" badge numbers from current data */
function updateBadges() {
  const activeCount = providers.filter(p => p.status === 'Active').length;
  const onJobCount  = providers.filter(p => p.status === 'On-Job').length;
  document.getElementById('countActive').textContent = activeCount;
  document.getElementById('countOnJob').textContent  = onJobCount;
}

/* ─────────────────────────────────────────────
   8. PAGINATION
   ───────────────────────────────────────────── */

/**
 * Rebuild the pagination controls for a given total row count.
 * Highlights the current page and wires click handlers.
 *
 * @param {number} totalRows  Total rows matching current filter+search
 */
function renderPagination(totalRows) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  // Clamp currentPage to valid range
  if (currentPage > totalPages) currentPage = totalPages;

  function makeBtn(label, page, disabled, active) {
    const btn = document.createElement('button');
    btn.className = 'pg-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = disabled;
    if (!disabled) {
      btn.addEventListener('click', () => {
        currentPage = page;
        renderTable();
      });
    }
    return btn;
  }

  // ‹ prev
  container.appendChild(makeBtn('‹', currentPage - 1, currentPage === 1, false));

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    container.appendChild(makeBtn(String(i), i, false, i === currentPage));
  }

  // › next
  container.appendChild(makeBtn('›', currentPage + 1, currentPage === totalPages, false));
}

/* ─────────────────────────────────────────────
   9. ROW BUILDER
   ───────────────────────────────────────────── */

function createRow(p) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div class="provider-cell">
        <div class="provider-avatar" style="background:${avatarColor(p.name)}">${getInitials(p.name)}</div>
        <div>
          <div class="provider-name">${p.name}</div>
          <div class="provider-meta">ID: ${p.id} &bull; ${p.specialty}</div>
        </div>
      </div>
    </td>
    <td><span class="status-pill ${statusClass(p.status)}">${p.status}</span></td>
    <td>
      <span class="stars">${buildStars(p.rating)}</span>
      <span class="rating-val">${p.rating.toFixed(1)}</span>
    </td>
    <td>
      <button class="action-link" onclick="viewProfile('${p.id}')">View Profile</button>
      <button class="action-link delete-link" onclick="deleteProvider('${p.id}')">Remove</button>
    </td>
  `;
  return tr;
}

/* ─────────────────────────────────────────────
   10. MAIN RENDER
   ───────────────────────────────────────────── */

function renderTable() {
  const query = document.getElementById('tableSearch').value.toLowerCase().trim();
  const tbody = document.getElementById('providerBody');
  tbody.innerHTML = '';

  // 1. Filter by tab + search
  const filtered = providers.filter(p => {
    const matchFilter = currentFilter === 'all' || p.status === currentFilter;
    const matchSearch =
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)   ||
      p.specialty.toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });

  // 2. Update badges (always from full providers list, not filtered)
  updateBadges();

  // 3. Pagination — slice the filtered list to the current page
  const totalRows  = filtered.length;
  const start      = (currentPage - 1) * ROWS_PER_PAGE;
  const pageSlice  = filtered.slice(start, start + ROWS_PER_PAGE);

  // 4. Footer text
  const from = totalRows === 0 ? 0 : start + 1;
  const to   = Math.min(start + ROWS_PER_PAGE, totalRows);
  document.getElementById('showingText').textContent =
    `Showing ${from} – ${to} of ${totalRows} providers`;

  // 5. Empty state
  if (pageSlice.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:30px;color:var(--text-secondary)">
          No providers match your search or filter.
        </td>
      </tr>`;
    renderPagination(totalRows);
    return;
  }

  // 6. Render rows
  const fragment = document.createDocumentFragment();
  pageSlice.forEach(p => fragment.appendChild(createRow(p)));
  tbody.appendChild(fragment);

  // 7. Render pagination controls
  renderPagination(totalRows);
}

/* ─────────────────────────────────────────────
   11. FILTER & SEARCH HANDLERS
   ───────────────────────────────────────────── */

function filterProviders() {
  currentPage = 1;  // reset to first page on new search
  renderTable();
}

function setFilter(btn, filter) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  currentPage   = 1;  // reset to first page on filter change
  renderTable();
}

/* ─────────────────────────────────────────────
   12. MODAL HANDLERS
   ───────────────────────────────────────────── */

function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('newName').value = '';
  document.getElementById('newSpecialty').selectedIndex = 0;
  document.getElementById('newStatus').selectedIndex = 0;
  document.getElementById('newName').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

/* ─────────────────────────────────────────────
   13. ADD PROVIDER — persists to localStorage
   ───────────────────────────────────────────── */

function generateId() {
  nextIdSuffix++;
  return `SP-NEW-${nextIdSuffix}`;
}

function addProvider() {
  const nameInput = document.getElementById('newName');
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = '#dc2626';
    setTimeout(() => (nameInput.style.borderColor = ''), 1500);
    return;
  }

  const specialty = document.getElementById('newSpecialty').value;
  const status    = document.getElementById('newStatus').value;
  const { label, cls } = perfMeta(75);

  const newProvider = {
    id:        generateId(),
    name,
    specialty,
    unit:      'UNT001',
    status,
    rating:    4.0,
    perf:      75,
    perfLabel: label,
    perfClass: cls,
    isNew:     true,
  };

  // Add to in-memory list (top of list)
  providers.unshift(newProvider);

  // Persist to localStorage so it survives refresh
  addedProviders.unshift(newProvider);
  saveAddedToStorage(addedProviders);

  closeModal();
  currentPage = 1;   // jump to first page so the new entry is visible
  renderTable();
}

/* ─────────────────────────────────────────────
   14. DELETE PROVIDER — persists deletion to localStorage
   ───────────────────────────────────────────── */

function deleteProvider(id) {
  const idx = providers.findIndex(p => p.id === id);
  if (idx === -1) return;

  const name = providers[idx].name;
  if (!confirm(`Remove "${name}" from this unit?`)) return;

  // Remove from in-memory list
  providers.splice(idx, 1);

  // If it was a user-added provider, remove it from addedProviders too
  const addedIdx = addedProviders.findIndex(p => p.id === id);
  if (addedIdx !== -1) {
    addedProviders.splice(addedIdx, 1);
    saveAddedToStorage(addedProviders);
  } else {
    // It was a base provider — track its deletion so it stays gone on reload
    deletedIds.add(id);
    saveDeletedToStorage([...deletedIds]);
  }

  // Adjust page if we deleted the last row on the current page
  const totalAfter = providers.filter(p => {
    const matchFilter = currentFilter === 'all' || p.status === currentFilter;
    return matchFilter;
  }).length;
  const maxPage = Math.max(1, Math.ceil(totalAfter / ROWS_PER_PAGE));
  if (currentPage > maxPage) currentPage = maxPage;

  renderTable();
}

/* ─────────────────────────────────────────────
   15. VIEW PROFILE (stub)
   ───────────────────────────────────────────── */

function viewProfile(id) {
  const p = providers.find(pr => pr.id === id);
  if (!p) return;
  alert(
    `Provider Profile\n\n` +
    `Name:        ${p.name}\n` +
    `ID:          ${p.id}\n` +
    `Skill:       ${p.specialty}\n` +
    `Unit:        ${p.unit}\n` +
    `Status:      ${p.status}\n` +
    `Rating:      ${p.rating.toFixed(1)}\n` +
    `Performance: ${p.perf}% ${p.perfLabel}`
  );
}

/* ─────────────────────────────────────────────
   16. INITIALISE
   ───────────────────────────────────────────── */

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initial render
renderTable();
