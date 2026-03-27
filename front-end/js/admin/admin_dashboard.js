/* dashboard.js */
const EVENTS = [
  { time: '10:45:22 AM', type: 'system',   typeLabel: 'SYSTEM',   desc: 'Service assignment failure: Database timeout during routing calculation.', status: 'unresolved',    statusLabel: 'Unresolved' },
  { time: '10:32:05 AM', type: 'security', typeLabel: 'SECURITY', desc: 'Flagged Account: Multiple login failures from IP 192.168.1.45.',            status: 'investigating', statusLabel: 'Investigating' },
  { time: '10:15:40 AM', type: 'user',     typeLabel: 'USER',     desc: "Provider verification pending: New submission from 'Unit 24 Logistics'.",    status: 'pending',       statusLabel: 'Pending' },
  { time: '09:58:12 AM', type: 'action',   typeLabel: 'ACTION',   desc: 'Account suspended: User ID #9822 for policy violations.',                   status: 'completed',     statusLabel: 'Completed' },
];

const ADMIN_ACTIONS = [
  { dot: 'blue',   title: 'Account suspended',  desc: 'Admin_Mark suspended User #892',        time: '2 mins ago' },
  { dot: 'green',  title: 'Provider verified',  desc: "Admin_Sarah approved 'QuickTransport'", time: '15 mins ago' },
  { dot: 'yellow', title: 'Settings updated',   desc: 'System threshold modified (Queue: 45s)', time: '1 hour ago' },
  { dot: 'gray',   title: 'Login attempt',      desc: 'Super Admin login from 192.168.0.1',    time: '2 hours ago' },
];

function renderEvents() {
  const tbody = document.getElementById('events-tbody');
  if (!tbody) return;
  tbody.innerHTML = EVENTS.map(e => `
    <tr>
      <td class="ev-time">${e.time}</td>
      <td><span class="ev-type-badge ev-type-badge--${e.type}">${e.typeLabel}</span></td>
      <td>${e.desc}</td>
      <td><span class="ev-status ev-status--${e.status}">${e.statusLabel}</span></td>
    </tr>
  `).join('');
}

function renderAdminActions() {
  const el = document.getElementById('admin-action-list');
  if (!el) return;
  el.innerHTML = ADMIN_ACTIONS.map(a => `
    <div class="aa-item">
      <div class="aa-dot aa-dot--${a.dot}"></div>
      <div>
        <div class="aa-title">${a.title}</div>
        <div class="aa-desc">${a.desc}</div>
        <div class="aa-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderEvents();
  renderAdminActions();
});
