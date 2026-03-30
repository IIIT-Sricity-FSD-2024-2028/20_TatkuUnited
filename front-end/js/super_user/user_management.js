/* user_management.js */
const USERS = [
  { id: '#TK-9021', name: 'Jordan Smith',  initials: 'JS', color: '#2563eb', bg: '#eff6ff', email: 'jordan@example.com', phone: '+1 234 567 890', role: 'Customer', status: 'active',    statusLabel: 'Active',    joined: 'Mar 2, 2026', action: 'Suspend',    actionClass: 'red' },
  { id: '#TK-8842', name: 'Marcus Reed',   initials: 'MR', color: '#d97706', bg: '#fef9c3', email: 'mreed@provider.co', phone: '+1 987 654 321', role: 'Provider', status: 'suspended', statusLabel: 'Suspended', joined: 'Mar 1, 2026', action: 'Reactivate', actionClass: 'green' },
  { id: '#TK-9055', name: 'David Park',    initials: 'DP', color: '#7c3aed', bg: '#f5f3ff', email: 'dpark@services.io', phone: '+1 333 444 555', role: 'Provider', status: 'pending',   statusLabel: 'Pending Verification', joined: 'Mar 1, 2026', action: 'Verify', actionClass: 'blue' },
  { id: '#TK-8801', name: 'Anika Patel',   initials: 'AP', color: '#0891b2', bg: '#e0f7fa', email: 'anika@mail.com',   phone: '+1 555 678 901', role: 'Customer', status: 'active',    statusLabel: 'Active',    joined: 'Feb 28, 2026', action: 'Suspend',   actionClass: 'red' },
  { id: '#TK-8765', name: 'Leo Fernandez', initials: 'LF', color: '#16a34a', bg: '#f0fdf4', email: 'leo@biznet.io',   phone: '+1 444 321 876', role: 'Provider', status: 'active',    statusLabel: 'Active',    joined: 'Feb 27, 2026', action: 'Suspend',   actionClass: 'red' },
];

const PAGE_SIZE = 5;
let currentPage = 1;
let roleFilter = 'All Roles';
let statusFilter = 'All Statuses';

function mapStatus(s) {
  if (s === 'active') return 'status-badge--active';
  if (s === 'suspended') return 'status-badge--suspended';
  return 'status-badge--pending';
}

function getFiltered() {
  return USERS.filter(u => {
    const matchRole   = roleFilter   === 'All Roles'     || u.role === roleFilter;
    const matchStatus = statusFilter === 'All Statuses'  || u.statusLabel === statusFilter || (statusFilter === 'Active' && u.status === 'active') || (statusFilter === 'Suspended' && u.status === 'suspended') || (statusFilter === 'Pending Verification' && u.status === 'pending');
    return matchRole && matchStatus;
  });
}

function renderTable() {
  const filtered = getFiltered();
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = rows.map(u => `
    <tr>
      <td class="user-id">${u.id}</td>
      <td>
        <div class="user-cell">
          <div class="user-initials" style="background:${u.bg};color:${u.color}">${u.initials}</div>
          <span class="user-fullname">${u.name}</span>
        </div>
      </td>
      <td>
        <div class="user-contact">
          <span class="user-email">${u.email}</span>
          <span class="user-phone">${u.phone}</span>
        </div>
      </td>
      <td>${u.role}</td>
      <td><span class="status-badge ${mapStatus(u.status)}">${u.statusLabel}</span></td>
      <td>${u.joined}</td>
      <td><button class="action-link action-link--${u.actionClass}">${u.action}</button></td>
    </tr>
  `).join('');

  const info = document.getElementById('table-info');
  if (info) {
    const end = Math.min(start + PAGE_SIZE, filtered.length);
    info.innerHTML = `Showing <strong>${start+1}-${end}</strong> of <strong>${filtered.length.toLocaleString()}</strong>`;
  }

  document.querySelectorAll('[data-page]').forEach(btn =>
    btn.classList.toggle('active', Number(btn.dataset.page) === currentPage)
  );
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable();

  document.getElementById('role-filter').addEventListener('change', e => {
    roleFilter = e.target.value; currentPage = 1; renderTable();
  });
  document.getElementById('status-filter').addEventListener('change', e => {
    statusFilter = e.target.value; currentPage = 1; renderTable();
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('role-filter').value = 'All Roles';
    document.getElementById('status-filter').value = 'All Statuses';
    document.getElementById('date-filter').value = '';
    roleFilter = 'All Roles'; statusFilter = 'All Statuses';
    currentPage = 1; renderTable();
  });
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    const max = Math.ceil(getFiltered().length / PAGE_SIZE);
    if (currentPage < max) { currentPage++; renderTable(); }
  });
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); renderTable(); });
  });
});
