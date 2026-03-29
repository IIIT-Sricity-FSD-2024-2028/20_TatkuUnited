// ── Super User Profile JS ──

const sysStats = [
  { label: 'System Status', sub: 'All services operational', value: 'Online', valueColor: 'green', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, iconColor: 'green' },
  { label: 'Active Sessions', sub: 'Platform-wide right now', value: '184', valueColor: 'blue', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>`, iconColor: 'blue' },
  { label: 'Open Complaints', sub: 'Awaiting resolution', value: '4', valueColor: 'orange', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, iconColor: 'orange' },
  { label: 'Platform Uptime', sub: 'Last 30 days', value: '99.8%', valueColor: 'green', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, iconColor: 'teal' },
];

const permissions = [
  { name: 'Full User Management', desc: 'Create, suspend, delete any account', cls: '' },
  { name: 'Platform Configuration', desc: 'Modify all system settings', cls: '' },
  { name: 'Financial Controls', desc: 'Access revenue, payout & billing data', cls: '' },
  { name: 'Security Administration', desc: 'Manage roles, sessions & 2FA enforcement', cls: '' },
  { name: 'Audit Log Access', desc: 'View complete system event history', cls: '' },
  { name: 'Emergency Overrides', desc: 'Force-terminate jobs and escalate issues', cls: 'yellow' },
];

const activities = [
  { title: 'User suspended', desc: 'Account ID #4192 suspended for policy violation', time: '10 minutes ago', color: 'red' },
  { title: 'Platform settings updated', desc: 'Service fee adjusted from 12% to 14%', time: '1 hour ago', color: 'yellow' },
  { title: 'Provider verification approved', desc: '6 new providers verified and activated', time: '3 hours ago', color: 'green' },
  { title: 'System alert dismissed', desc: 'Service assignment failure for #A-421 resolved', time: '5 hours ago', color: 'blue' },
  { title: 'New collective created', desc: 'East Zone Collective added to the platform', time: '1 day ago', color: 'blue' },
];

function renderSysStats() {
  const el = document.getElementById('sys-stats');
  if (!el) return;
  el.innerHTML = sysStats.map(s => `
    <div class="sys-stat">
      <div class="sys-stat-left">
        <div class="sys-stat-icon ${s.iconColor}">${s.icon}</div>
        <div>
          <div class="sys-stat-label">${s.label}</div>
          <div class="sys-stat-sub">${s.sub}</div>
        </div>
      </div>
      <div class="sys-stat-value ${s.valueColor}">${s.value}</div>
    </div>
  `).join('');
}

function renderPermissions() {
  const el = document.getElementById('perm-list');
  if (!el) return;
  el.innerHTML = permissions.map(p => `
    <div class="perm-item ${p.cls}">
      <div class="perm-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div class="perm-name">${p.name}</div>
        <div class="perm-desc">${p.desc}</div>
      </div>
    </div>
  `).join('');
}

function renderActivities() {
  const el = document.getElementById('activity-list');
  if (!el) return;
  el.innerHTML = activities.map(a => `
    <div class="act-item">
      <div class="act-dot ${a.color}"></div>
      <div class="act-body">
        <div class="act-title">${a.title}</div>
        <div class="act-desc">${a.desc}</div>
        <div class="act-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

function syncName() {
  const v = document.getElementById('full-name').value.trim();
  document.getElementById('hero-name').textContent = v || 'Super User';
  document.getElementById('topbar-name').textContent = v || 'Super User';
}

function syncEmail() {
  const v = document.getElementById('email').value.trim();
  document.getElementById('hero-email').textContent = v || 'super_user@tatku.com';
}

function saveSection(section) {
  showToast('Super User profile saved successfully!');
}

function openPwdModal() { document.getElementById('pwd-modal').classList.add('open'); }
function closePwdModal(e) { if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn(); }
function closePwdModalBtn() { document.getElementById('pwd-modal').classList.remove('open'); }

function updateAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const av = document.getElementById('profile-avatar');
    av.innerHTML = `<img src="${e.target.result}" alt="Super User" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}



document.addEventListener('DOMContentLoaded', () => {
  renderSysStats();
  renderPermissions();
  renderActivities();
});

