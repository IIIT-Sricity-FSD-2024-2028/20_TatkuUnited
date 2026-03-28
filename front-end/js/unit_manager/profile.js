// ── Unit Manager Profile JS ──

const activities = [
  { title: 'Provider reassigned', desc: 'ID #1042 moved to Emergency Unit for the day', time: '2 hours ago', color: 'amber' },
  { title: 'New provider onboarded', desc: 'Ramesh Kumar joined Plumbing Unit Alpha', time: '1 day ago', color: 'green' },
  { title: 'Rating flagged', desc: 'Provider #2281 received a 1-star review — under review', time: '2 days ago', color: 'amber' },
  { title: 'Revenue milestone', desc: 'Unit exceeded ₹50,000 monthly target', time: '3 days ago', color: 'teal' },
  { title: 'Profile updated', desc: 'Operating zone updated to North Bangalore', time: '5 days ago', color: '' },
];

function renderActivities() {
  const list = document.getElementById('activity-list');
  if (!list) return;
  list.innerHTML = activities.map(a => `
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
  document.getElementById('hero-name').textContent = v || 'Arun Kumar';
  const av = document.getElementById('profile-avatar');
  const parts = v.split(' ').filter(Boolean);
  if (parts.length >= 2) av.textContent = parts[0][0] + parts[1][0];
  else if (parts.length === 1) av.textContent = parts[0].slice(0, 2).toUpperCase();
}

function syncEmail() {
  const v = document.getElementById('email').value.trim();
  document.getElementById('hero-email').textContent = v || 'arun.kumar@tatku.com';
}

function saveSection(section) {
  const msgs = {
    personal: 'Personal information saved!',
    unit: 'Unit details saved!',
  };
  showToast(msgs[section] || 'Changes saved!');
}

function openPwdModal() {
  document.getElementById('pwd-modal').classList.add('open');
}
function closePwdModal(e) {
  if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn();
}
function closePwdModalBtn() {
  document.getElementById('pwd-modal').classList.remove('open');
}

function updateAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const av = document.getElementById('profile-avatar');
    av.innerHTML = `<img src="${e.target.result}" alt="avatar" />`;
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

document.getElementById('logout-btn').addEventListener('click', function (e) {
  e.preventDefault();
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = '../../html/auth_pages/login.html';
  }
});

document.addEventListener('DOMContentLoaded', renderActivities);
