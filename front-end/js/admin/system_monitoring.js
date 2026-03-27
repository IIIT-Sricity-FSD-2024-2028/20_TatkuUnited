/* system_monitoring.js */
const EVENTS = [
  { time: '10:34 AM', type: 'Provider Registration', typeClass: 'green', desc: 'New provider submitted documents',  module: 'User System' },
  { time: '10:21 AM', type: 'Assignment Failure',    typeClass: 'red',   desc: 'No provider available',             module: 'Scheduling Engine' },
  { time: '09:55 AM', type: 'Account Suspension',    typeClass: 'gray',  desc: 'Policy violation detected',         module: 'Admin Action' },
];

const LOGS = [
  { timestamp: '2023-10-27 10:45:01', service: 'Auth-Service',  event: 'JWT Validation Successful',           status: '200 OK',    statusClass: 'ok' },
  { timestamp: '2023-10-27 10:44:58', service: 'Payment-GW',    event: 'Webhook Received: event_id_442',      status: '200 OK',    statusClass: 'ok' },
  { timestamp: '2023-10-27 10:44:52', service: 'Notify-Core',   event: 'Push Notification Sent: user_99',     status: 'DELIVERED', statusClass: 'delivered' },
];

const API_BAR_HEIGHTS = [30, 40, 28, 45, 38, 52, 35, 42, 55, 60, 70, 100];

function renderApiBars() {
  const container = document.getElementById('api-bars');
  if (!container) return;
  container.innerHTML = API_BAR_HEIGHTS.map((h, i) => {
    const isLast = i === API_BAR_HEIGHTS.length - 1;
    return `<div class="api-bar ${isLast ? 'api-bar--active' : ''}" style="height:${h}%"></div>`;
  }).join('');
}

function renderEvents() {
  const tbody = document.getElementById('events-tbody');
  if (!tbody) return;
  tbody.innerHTML = EVENTS.map(e => `
    <tr>
      <td>${e.time}</td>
      <td><span class="ev-type-badge ev-type-badge--${e.typeClass}">${e.type}</span></td>
      <td>${e.desc}</td>
      <td>${e.module}</td>
    </tr>
  `).join('');
}

function renderLogs() {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;
  tbody.innerHTML = LOGS.map(l => `
    <tr>
      <td>${l.timestamp}</td>
      <td>${l.service}</td>
      <td>${l.event}</td>
      <td class="log-status--${l.statusClass}">${l.status}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderApiBars();
  renderEvents();
  renderLogs();
});
