let providers = [
  { id: 'PRV-89021', name: 'Warshith',      specialty: 'Specialist',  status: 'Active',      rating: 4.2, perf: 92, perfLabel: 'OPTIMAL',   perfClass: 'optimal' },
  { id: 'PRV-89044', name: 'Prajwal',       specialty: 'Technician',  status: 'On-Job',      rating: 5.0, perf: 98, perfLabel: 'EXCELLENT',  perfClass: 'excellent' },
  { id: 'PRV-89052', name: 'Marcus Wright', specialty: 'Logistics',   status: 'Idle',        rating: 3.5, perf: 65, perfLabel: 'WARNING',    perfClass: 'warning' },
  { id: 'PRV-89078', name: 'Elena Rodriguez',specialty:'Specialist',  status: 'Unavailable', rating: 4.5, perf: 88, perfLabel: 'SOLID',      perfClass: 'solid' },
  { id: 'PRV-89031', name: 'David Kim',     specialty: 'Analyst',     status: 'Active',      rating: 4.8, perf: 95, perfLabel: 'EXCELLENT',  perfClass: 'excellent' },
  { id: 'PRV-89063', name: 'Aisha Patel',   specialty: 'Technician',  status: 'On-Job',      rating: 4.1, perf: 80, perfLabel: 'SOLID',      perfClass: 'solid' },
];

let currentFilter = 'all';

function statusClass(s) {
  return { 'Active':'active','On-Job':'on-job','Idle':'idle','Unavailable':'unavailable' }[s] || 'idle';
}

function stars(r) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (r - i > -1 ? '★' : '☆');
  return s;
}

function initials(name) {
  return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}

function avatarColors(name) {
  const colors = ['#3b82f6','#0d9488','#7c3aed','#d97706','#dc2626','#16a34a'];
  return colors[name.charCodeAt(0) % colors.length];
}

function renderTable() {
  const query = document.getElementById('tableSearch').value.toLowerCase();
  const tbody = document.getElementById('providerBody');
  tbody.innerHTML = '';

  const filtered = providers.filter(p => {
    const matchFilter = currentFilter === 'all' || p.status === currentFilter;
    const matchSearch = p.name.toLowerCase().includes(query) ||
                        p.id.toLowerCase().includes(query) ||
                        p.specialty.toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });

  document.getElementById('showingText').textContent =
    `Showing 1 – ${filtered.length} of ${providers.length} providers`;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-secondary)">No providers match your search.</td></tr>';
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="provider-cell">
          <div class="provider-avatar" style="background:${avatarColors(p.name)}">${initials(p.name)}</div>
          <div>
            <div class="provider-name">${p.name}</div>
            <div class="provider-meta">ID: ${p.id} &bull; ${p.specialty}</div>
          </div>
        </div>
      </td>
      <td><span class="status-pill ${statusClass(p.status)}">${p.status}</span></td>
      <td>
        <span class="stars">${stars(p.rating)}</span>
        <span class="rating-val">${p.rating.toFixed(1)}</span>
      </td>
      <td>
        <div class="perf-wrap">
          <div class="perf-bar-bg"><div class="perf-bar ${p.perfClass}" style="width:${p.perf}%"></div></div>
          <div class="perf-label">${p.perf}% ${p.perfLabel}</div>
        </div>
      </td>
      <td><button class="action-link">View Profile</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function filterProviders() { renderTable(); }

function setFilter(btn, filter) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  renderTable();
}

function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function addProvider() {
  const name = document.getElementById('newName').value.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const specialty = document.getElementById('newSpecialty').value;
  const status = document.getElementById('newStatus').value;
  const id = 'PRV-' + (89000 + providers.length + 10);
  providers.unshift({ id, name, specialty, status, rating: 4.0, perf: 70, perfLabel: 'SOLID', perfClass: 'solid' });
  closeModal();
  document.getElementById('newName').value = '';
  renderTable();
}

renderTable();
