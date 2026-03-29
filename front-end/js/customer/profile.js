// ===== CART BADGE =====
function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== AVATAR =====
function updateAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('profile-avatar');
    el.innerHTML = `<img src="${e.target.result}" alt="avatar"/>`;
  };
  reader.readAsDataURL(file);
  showToast('Profile photo updated!');
}

// ===== NAME / EMAIL SYNC =====
function syncName() {
  const val = document.getElementById('full-name').value;
  document.getElementById('hero-name').textContent = val || 'Your Name';
  // Update initials
  const initials = val.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = document.getElementById('profile-avatar');
  if (!avatar.querySelector('img')) avatar.textContent = initials || 'SC';
}
function syncEmail() {
  const val = document.getElementById('email').value;
  document.getElementById('hero-email').textContent = val || '';
}

// ===== SAVE SECTION =====
function saveSection(section) {
  showToast(section === 'personal' ? 'Personal info saved!' : 'Changes saved!');
}

// ===== ADDRESSES =====
const addresses = [
  { id: 1, tag: 'Home', text: '21/229, Indira Nagar, Lucknow, UP – 226016' },
  { id: 2, tag: 'Office', text: '14, Sector 18, Noida, UP – 201301' },
];

function renderAddresses() {
  document.getElementById('addresses-list').innerHTML = addresses.map(a => `
    <div class="address-item">
      <div class="address-icon">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="address-body">
        <div class="address-tag">${a.tag}</div>
        <div class="address-text">${a.text}</div>
      </div>
      <div class="address-actions">
        <button class="addr-btn" onclick="showToast('Edit address — coming soon!')">Edit</button>
        <button class="addr-btn del" onclick="deleteAddress(${a.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function deleteAddress(id) {
  const idx = addresses.findIndex(a => a.id === id);
  if (idx > -1) { addresses.splice(idx, 1); renderAddresses(); showToast('Address removed.'); }
}

function addAddress() {
  const text = prompt('Enter new address:');
  if (text && text.trim()) {
    addresses.push({ id: Date.now(), tag: 'Other', text: text.trim() });
    renderAddresses();
    showToast('Address added!');
  }
}

// ===== PAYMENT METHODS =====
const payments = [
  { type: 'upi', label: 'shricharan@okaxis', sub: 'UPI', isDefault: true,  bg: '#f0fdfa', stroke: '#0d9488' },
  { type: 'card', label: 'HDFC Bank ••••  4821', sub: 'Visa Credit Card', isDefault: false, bg: '#eff6ff', stroke: '#2563eb' },
];

function renderPayments() {
  document.getElementById('payment-list').innerHTML = payments.map(p => `
    <div class="payment-item">
      <div class="payment-icon" style="background:${p.bg}">
        <svg viewBox="0 0 24 24" style="stroke:${p.stroke}">
          ${p.type === 'upi'
            ? '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'
            : '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="9" y2="15"/>'}
        </svg>
      </div>
      <div class="payment-body">
        <div class="payment-label">${p.label}</div>
        <div class="payment-sub">${p.sub}</div>
      </div>
      ${p.isDefault ? `<span class="payment-default">Default</span>` : `<button class="addr-btn" onclick="showToast('Set as default — coming soon!')">Set Default</button>`}
    </div>
  `).join('');
}

// ===== RECENT ACTIVITY =====
const activities = [
  { name: 'Microwave Deep Cleaning', date: 'Mar 4, 2026', status: 'completed', bg: '#fef3c7', stroke: '#d97706', icon: `<rect x="2" y="7" width="20" height="12" rx="2"/><path d="M17 11h1M6 11h6"/>` },
  { name: 'Smart Home Setup', date: 'Mar 27, 2026', status: 'upcoming', bg: '#eff6ff', stroke: '#2563eb', icon: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>` },
  { name: 'Full Pipe Inspection', date: 'Mar 25, 2026', status: 'upcoming', bg: '#f0fdfa', stroke: '#0d9488', icon: `<path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z"/><rect x="7" y="10" width="10" height="10" rx="2"/>` },
  { name: 'Garden Lawn Mowing', date: 'Dec 15, 2025', status: 'cancelled', bg: '#fee2e2', stroke: '#ef4444', icon: `<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>` },
];

const badgeCls = { completed: 'badge-completed', upcoming: 'badge-upcoming', cancelled: 'badge-cancelled' };
const badgeLbl = { completed: 'Completed', upcoming: 'Upcoming', cancelled: 'Cancelled' };

function renderActivity() {
  document.getElementById('activity-list').innerHTML = activities.map(a => `
    <div class="activity-item" onclick="window.location='bookings.html'">
      <div class="activity-dot" style="background:${a.bg}">
        <svg viewBox="0 0 24 24" style="stroke:${a.stroke}">${a.icon}</svg>
      </div>
      <div class="activity-body">
        <div class="activity-name">${a.name}</div>
        <div class="activity-date">${a.date}</div>
      </div>
      <span class="activity-badge ${badgeCls[a.status]}">${badgeLbl[a.status]}</span>
    </div>
  `).join('');
}

// ===== PASSWORD MODAL =====
function openPwdModal() { document.getElementById('pwd-modal').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closePwdModalBtn() { document.getElementById('pwd-modal').classList.remove('open'); document.body.style.overflow = ''; }
function closePwdModal(e) { if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn(); }

// ===== DANGER & LOGOUT =====
function confirmDelete() {
  if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
    showToast('Account deletion request submitted.');
  }
}

function confirmLogout() {
  if (confirm('Are you sure you want to log out?')) {
    window.location.href = '../auth_pages/logout.html';
  }
}

// ===== INIT =====
renderAddresses();
renderPayments();
renderActivity();
updateCartBadge();
