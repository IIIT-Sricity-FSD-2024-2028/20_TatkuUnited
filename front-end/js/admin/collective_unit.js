/* collective_unit.js */
const BANGALORE_UNITS = [
  { name: 'Bangalore North Unit', providers: 38, mgr: 'Priya S.' },
  { name: 'Bangalore East Unit',  providers: 38, mgr: 'Priya S.' },
];

const CHENNAI_UNITS = [
  { name: 'OMR Tech Corridor', providers: 54, mgr: 'Rajesh V.' },
  { name: 'Adyar Central',     providers: 38, mgr: 'Meera R.' },
];

const PROVIDERS = [
  { initials: 'RJ', bg: '#eff6ff', color: '#2563eb', name: 'Rahul Jayaram', id: 'ID: P-90822', skill: 'Plumbing',       rating: 4.8, status: 'available', statusLabel: 'AVAILABLE', actionType: 'reassign' },
  { initials: 'SK', bg: '#fef9c3', color: '#854d0e', name: 'Sumanth Kumar', id: 'ID: P-90112', skill: 'Electrical',     rating: 4.5, status: 'onjob',     statusLabel: 'ON JOB',    actionType: 'reassign' },
  { initials: 'AS', bg: '#f0fdf4', color: '#15803d', name: 'Anjali Sharma', id: 'ID: P-88211', skill: 'HVAC Specialist', rating: 4.9, status: 'offline',   statusLabel: 'OFFLINE',   actionType: 'assign' },
];

function renderUnits(units, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = units.map(u => `
    <div class="unit-row">
      <span class="unit-arrow">›</span>
      <span class="unit-name">${u.name}</span>
      <span class="unit-providers">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
        ${u.providers} Providers
      </span>
      <span class="unit-mgr">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/></svg>
        Mgr: ${u.mgr}
      </span>
      <a href="#" class="view-providers-link">View<br/>Providers</a>
      <button class="edit-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>
  `).join('');
}

function starHTML(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star" style="color:${i < full ? '#f59e0b' : '#d1d5db'}">★</span>`
  ).join('');
}

function renderProviders() {
  const tbody = document.getElementById('providers-tbody');
  if (!tbody) return;
  tbody.innerHTML = PROVIDERS.map(p => `
    <tr>
      <td>
        <div class="prov-cell">
          <div class="prov-avatar" style="background:${p.bg};color:${p.color}">${p.initials}</div>
          <div>
            <div class="prov-name">${p.name}</div>
            <div class="prov-id">${p.id}</div>
          </div>
        </div>
      </td>
      <td>${p.skill}</td>
      <td>
        <div class="rating-cell">
          ${starHTML(p.rating)}
          <span class="rating-num">${p.rating.toFixed(1)}</span>
        </div>
      </td>
      <td><span class="prov-status prov-status--${p.status}">${p.statusLabel}</span></td>
      <td>
        <div class="action-row">
          <button class="remove-link">Remove Provider</button>
          ${p.actionType === 'reassign'
            ? `<button class="reassign-btn">Reassign</button>`
            : `<button class="assign-btn">Assign Provider</button>`}
        </div>
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderUnits(BANGALORE_UNITS, 'bangalore-units');
  renderUnits(CHENNAI_UNITS, 'chennai-units');
  renderProviders();
});
