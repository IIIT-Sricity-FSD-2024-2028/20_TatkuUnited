// ── Collective Manager Profile JS ──

const units = [
  { name: 'Plumbing Unit Alpha', count: 40, status: 'Active', color: 'green' },
  { name: 'Electrical Unit Beta', count: 38, status: 'Active', color: 'green' },
  { name: 'Home Cleaning Gamma', count: 52, status: 'Active', color: 'green' },
  { name: 'HVAC Unit Delta', count: 28, status: 'Low Capacity', color: 'amber' },
  { name: 'Pest Control Epsilon', count: 35, status: 'Active', color: 'green' },
  { name: 'Carpentry Zeta', count: 55, status: 'Active', color: 'green' },
];

const activities = [
  { title: 'New unit created', desc: 'Carpentry Zeta unit added to your collective', time: '1 hour ago', color: 'green' },
  { title: 'Provider admitted', desc: '3 new providers approved to Plumbing Unit Alpha', time: '4 hours ago', color: '' },
  { title: 'Revenue milestone', desc: 'Collective hit ₹4.5L for March 2026', time: '1 day ago', color: 'teal' },
  { title: 'Alert resolved', desc: 'HVAC Unit Delta capacity issue addressed', time: '2 days ago', color: 'amber' },
  { title: 'Skill updated', desc: '"Tile Grouting" added to Carpentry Zeta', time: '3 days ago', color: '' },
];

function renderUnits() {
  const el = document.getElementById('unit-list');
  if (!el) return;
  el.innerHTML = units.map(u => `
    <div class="unit-item">
      <div class="unit-item-left">
        <div class="unit-dot ${u.color}"></div>
        <div>
          <div class="unit-name">${u.name}</div>
          <div class="unit-sub">${u.count} providers</div>
        </div>
      </div>
      <span class="unit-badge ${u.color === 'amber' ? 'amber' : ''}">${u.status}</span>
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
  document.getElementById('hero-name').textContent = v || 'Priya Nair';
  const av = document.getElementById('profile-avatar');
  const parts = v.split(' ').filter(Boolean);
  if (parts.length >= 2) av.textContent = parts[0][0] + parts[1][0];
  else if (parts.length === 1) av.textContent = parts[0].slice(0, 2).toUpperCase();
}

function syncEmail() {
  const v = document.getElementById('email').value.trim();
  document.getElementById('hero-email').textContent = v || 'priya.nair@tatku.com';
}

function saveSection(section) {
  const msgs = { personal: 'Personal information saved!', collective: 'Collective details saved!' };
  showToast(msgs[section] || 'Changes saved!');
}

function openPwdModal() { document.getElementById('pwd-modal').classList.add('open'); }
function closePwdModal(e) { if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn(); }
function closePwdModalBtn() { document.getElementById('pwd-modal').classList.remove('open'); }

function updateAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('profile-avatar').innerHTML = `<img src="${e.target.result}" alt="avatar" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

function confirmDelete() {
  if (confirm('Are you sure you want to deactivate your account? This cannot be undone.')) {
    showToast('Account deactivation requested. You will be contacted shortly.');
  }
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
  renderUnits();
  renderActivities();
});


