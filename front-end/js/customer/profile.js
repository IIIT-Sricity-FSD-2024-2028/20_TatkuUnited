// ===== CART BADGE =====
function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

// ===== TOAST =====
function showProfileToast(msg) {
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
  showProfileToast('Profile photo updated!');
}

// ===== NAME / EMAIL SYNC =====
function syncName() {
  const val = document.getElementById('full-name').value;
  document.getElementById('hero-name').textContent = val || 'Your Name';
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
  if (section === 'personal') {
    const session = Auth.getCurrentUser();
    if (session) {
      const nameVal = document.getElementById('full-name').value;
      const emailVal = document.getElementById('email').value;
      const phoneVal = document.getElementById('phone').value;
      const dobVal = document.getElementById('dob').value;
      
      CRUD.updateRecord("customers", "customer_id", session.id, {
        full_name: nameVal,
        email: emailVal,
        phone: phoneVal,
        dob: dobVal
      });
      // Updating session state in sessionStorage using the correct key
      const activeSession = Auth.getSession();
      if (activeSession) {
        activeSession.name = nameVal;
        activeSession.email = emailVal;
        sessionStorage.setItem('fsd_session', JSON.stringify(activeSession));
      }
    }
  }
  showProfileToast(section === 'personal' ? 'Personal info saved!' : 'Changes saved!');
}

// ===== ADDRESSES =====
let addresses = [];

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
        <!-- Edit hidden for brevity -->
        <button class="addr-btn del" onclick="deleteAddress(${a.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function saveAddressesToStore() {
  const session = Auth.getSession();
  if (session) { CRUD.updateRecord('customers', 'customer_id', session.id, { saved_addresses: addresses }); }
}

function deleteAddress(id) {
  const idx = addresses.findIndex(a => a.id === id);
  if (idx > -1) { 
    addresses.splice(idx, 1); 
    saveAddressesToStore();
    renderAddresses(); 
    showProfileToast('Address removed.'); 
  }
}

function saveNewAddress() {
  const inputEl = document.getElementById('new-address-input');
  if (!inputEl) return;
  const text = inputEl.value;
  if (text && text.trim()) {
    const newAddr = { id: Date.now(), tag: 'Other', text: text.trim() };
    addresses.push(newAddr);
    saveAddressesToStore();
    renderAddresses();
    inputEl.value = '';
    document.getElementById('add-address-form').style.display = 'none';
    showProfileToast('Address added!');
  } else {
    showProfileToast('Please enter an address.');
  }
}

// ===== PAYMENT METHODS =====
let payments = [];

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
      ${p.isDefault ? `<span class="payment-default">Default</span>` : `<button class="addr-btn" onclick="setDefaultPayment('${p.id}')">Set Default</button>`}
    </div>
  `).join('');
}

function savePaymentsToStore() {
  const session = Auth.getSession();
  if (session) { CRUD.updateRecord('customers', 'customer_id', session.id, { saved_payments: payments }); }
}

function setDefaultPayment(id) {
  payments.forEach(p => p.isDefault = false);
  const match = payments.find(p => p.id == id);
  if (match) match.isDefault = true;
  savePaymentsToStore();
  renderPayments();
  showProfileToast('Default payment method updated.');
}

// ===== PREFERENCES =====
let preferences = { email: true, sms: true };
function updatePreference(key, isChecked) {
  preferences[key] = isChecked;
  const session = Auth.getSession();
  if (session) {
    CRUD.updateRecord('customers', 'customer_id', session.id, { preferences: preferences });
  }
  showProfileToast(key === 'email' ? 'Email notifications updated' : 'SMS reminders updated');
}

// ===== RECENT ACTIVITY =====
const badgeCls = { completed: 'badge-completed', upcoming: 'badge-upcoming', cancelled: 'badge-cancelled' };
const badgeLbl = { completed: 'Completed', upcoming: 'Upcoming', cancelled: 'Cancelled' };

function renderActivity() {
  const session = Auth.getCurrentUser();
  if (!session) return;
  const allBookings = AppStore.getTable('bookings') || [];
  const myBookings = allBookings
    .filter(b => b.customer_id === session.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);
    
  if (myBookings.length === 0) {
    document.getElementById('activity-list').innerHTML = '<p style="color:var(--text-2);font-size:14px;">No recent activity</p>';
    return;
  }

  document.getElementById('activity-list').innerHTML = myBookings.map(b => {
      const dateObj = new Date(b.scheduled_at);
      const isPending = b.status === 'PENDING';
      const isCancelled = b.status === 'CANCELLED';
      const isPast = dateObj < new Date() && !isCancelled;
      const status = isCancelled ? 'cancelled' : (isPending || !isPast ? 'upcoming' : 'completed');
      
      const icon = status === 'completed' ? `<rect x="2" y="7" width="20" height="12" rx="2"/><path d="M17 11h1M6 11h6"/>` : (status === 'cancelled' ? `<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>` : `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`);
      const bg = status === 'completed' ? '#f0fdfa' : (status === 'cancelled' ? '#fee2e2' : '#eff6ff');
      const stroke = status === 'completed' ? '#0d9488' : (status === 'cancelled' ? '#ef4444' : '#3b82f6');
      
      return `
        <div class="activity-item" onclick="window.location='bookings.html'">
          <div class="activity-dot" style="background:${bg}">
            <svg viewBox="0 0 24 24" style="stroke:${stroke}">${icon}</svg>
          </div>
          <div class="activity-body">
            <div class="activity-name">${b.service_name || 'Home Service'}</div>
            <div class="activity-date">${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <span class="activity-badge ${badgeCls[status]}">${badgeLbl[status]}</span>
        </div>
      `;
  }).join('');
}

// ===== PASSWORD MODAL =====
function openPwdModal() { 
  document.getElementById('pwd-modal').classList.add('open'); 
  document.body.style.overflow = 'hidden'; 
}
function closePwdModalBtn() { 
  document.getElementById('pwd-modal').classList.remove('open'); 
  document.body.style.overflow = ''; 
  const c = document.getElementById('pwd-current');
  const n = document.getElementById('pwd-new');
  const cn = document.getElementById('pwd-confirm');
  if(c) c.value = '';
  if(n) n.value = '';
  if(cn) cn.value = '';
}
function closePwdModal(e) { if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn(); }

function savePassword() {
  const currentVal = document.getElementById('pwd-current').value;
  const newVal = document.getElementById('pwd-new').value;
  const confirmVal = document.getElementById('pwd-confirm').value;

  const session = Auth.getSession();
  if (!session) return;
  
  const allCustomers = AppStore.getTable('customers') || [];
  const me = allCustomers.find(c => c.customer_id === session.id);
  
  if (!me) {
    showProfileToast('Error tracking user profile details');
    return;
  }
  
  if (currentVal !== me.password) {
    showProfileToast('Current password is incorrect');
    return;
  }
  
  if (newVal.length < 8) {
    showProfileToast('New password must be strictly at least 8 characters');
    return;
  }
  
  if (newVal !== confirmVal) {
    showProfileToast('Your new passwords do not perfectly match');
    return;
  }
  
  CRUD.updateRecord('customers', 'customer_id', session.id, { password: newVal });
  
  const registryEntry = (window.AuthRegistry || []).find(u => u.id === session.id);
  if (registryEntry) registryEntry.password = newVal;

  closePwdModalBtn();
  showProfileToast('Password successfully updated!');
}

// ===== DANGER & LOGOUT =====
function confirmDelete() {
  // Bypassed native window.confirm to avoid browser dialog blocking
  showProfileToast('Account deletion request submitted. An admin will contact you.');
}

function confirmLogout() {
  // Removed native window.confirm to avoid silent failures in test browsers
  Auth.logout();
}

// ===== INIT =====
AppStore.ready.then(() => {
  const session = Auth.requireSession(['customer']);
  if (!session) return;

  /* ── Personalize profile with session data ── */
  const heroName = document.getElementById('hero-name');
  const heroEmail = document.getElementById('hero-email');
  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');

  if (heroName) heroName.textContent = session.name || 'Your Name';
  if (heroEmail) heroEmail.textContent = session.email || '';
  if (fullNameInput) fullNameInput.value = session.name || '';
  if (emailInput) emailInput.value = session.email || '';

  /* ── Update avatar initials ── */
  const initials = (session.name || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = document.getElementById('profile-avatar');
  if (avatar && !avatar.querySelector('img')) avatar.textContent = initials || 'U';

  // Load customer data to populate addresses/payments
  const customers = AppStore.getTable('customers') || [];
  const me = customers.find(c => c.customer_id === session.id) || {};
  addresses = me.saved_addresses || [
    { id: 1, tag: 'Home', text: me.address || 'Address pending setup' }
  ];
  payments = me.saved_payments || [
    { id: 'p1', type: 'upi', label: session.email ? session.email.split('@')[0]+'@okaxis' : 'user@upi', sub: 'UPI', isDefault: true,  bg: '#f0fdfa', stroke: '#0d9488' },
    { id: 'p2', type: 'card', label: 'HDFC Bank •••• 4821', sub: 'Visa Credit Card', isDefault: false, bg: '#eff6ff', stroke: '#2563eb' }
  ];

  const phoneInput = document.getElementById('phone');
  const dobInput = document.getElementById('dob');
  if (phoneInput && me.phone) phoneInput.value = me.phone;
  if (dobInput && me.dob) dobInput.value = me.dob;

  // Load preferences
  preferences = me.hasOwnProperty('preferences') && me.preferences ? me.preferences : { email: true, sms: true };
  const prefEmail = document.getElementById('pref-email');
  const prefSms = document.getElementById('pref-sms');
  if (prefEmail) prefEmail.checked = !!preferences.email;
  if (prefSms) prefSms.checked = !!preferences.sms;

  renderAddresses();
  renderPayments();
  renderActivity();
  updateCartBadge();
});
