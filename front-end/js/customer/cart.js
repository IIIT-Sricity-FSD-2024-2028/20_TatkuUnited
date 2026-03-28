function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('tu_cart', JSON.stringify(c)); }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}
function parsePrice(p) { return parseInt((p || '0').replace(/[^\d]/g, '')) || 0; }

const svcIcon = `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`;

let editingItemId = null;

// ===== EDIT MODAL =====
function openEditModal(itemId) {
  editingItemId = itemId;
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (!item) return;
  document.getElementById('modal-service-name').textContent = item.service;
  // Pre-fill current values
  const dateInput = document.getElementById('modal-date');
  const timeSelect = document.getElementById('modal-time');
  if (item.date && item.date !== 'ASAP') dateInput.value = item.date;
  // Match time option
  const opts = Array.from(timeSelect.options);
  const match = opts.findIndex(o => o.value === item.time);
  if (match >= 0) timeSelect.selectedIndex = match;
  document.getElementById('edit-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeEditModalBtn() {
  document.getElementById('edit-modal').classList.remove('open');
  document.body.style.overflow = '';
  editingItemId = null;
}
function closeEditModal(e) { if (e.target === document.getElementById('edit-modal')) closeEditModalBtn(); }

function saveScheduleEdit() {
  if (!editingItemId) return;
  const cart = getCart();
  const item = cart.find(i => i.id === editingItemId);
  if (item) {
    const newDate = document.getElementById('modal-date').value;
    const newTime = document.getElementById('modal-time').value;
    item.date = newDate || item.date;
    item.time = newTime;
    saveCart(cart);
  }
  closeEditModalBtn();
  render();
}

function removeItem(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartBadge();
  render();
}

function render() {
  const cart = getCart();
  const isEmpty = cart.length === 0;
  document.getElementById('cart-items').style.display = isEmpty ? 'none' : 'flex';
  document.getElementById('cart-summary').style.display = isEmpty ? 'none' : 'block';
  document.getElementById('empty-state').style.display = isEmpty ? 'flex' : 'none';
  document.getElementById('cart-sub').textContent = isEmpty ? '' : `${cart.length} service${cart.length > 1 ? 's' : ''} in your cart`;
  if (isEmpty) return;

  const subtotal = cart.reduce((s, i) => s + parsePrice(i.price), 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  document.getElementById('cart-items').innerHTML = cart.map((item, idx) => {
    const isScheduled = item.mode === 'scheduled';
    const displayDate = item.date && item.date !== 'ASAP' ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : item.date;
    return `
      <div class="cart-item" style="animation-delay:${idx * 0.07}s">
        <div class="cart-item-icon">${svcIcon}</div>
        <div class="cart-item-body">
          <div class="cart-item-name">${item.service}</div>
          <div class="cart-item-meta">
            <div class="cart-item-meta-row">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${item.location}
            </div>
            <div class="cart-item-meta-row">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${displayDate} · ${item.time}
            </div>
            <div class="cart-item-meta-row">
              <span class="mode-tag ${isScheduled ? 'mode-scheduled' : 'mode-instant'}">${item.mode}</span>
            </div>
          </div>
          ${isScheduled ? `
            <div class="edit-schedule-row">
              <button class="edit-schedule-btn" onclick="openEditModal(${item.id})">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Schedule
              </button>
              <span class="edit-schedule-hint">Change date or time slot</span>
            </div>
          ` : ''}
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${item.price}</div>
          <button class="btn-remove" onclick="removeItem(${item.id})">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            Remove
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-summary').innerHTML = `
    <div class="summary-title">Order Summary</div>
    <div class="summary-rows">
      ${cart.map(i => `<div class="summary-row"><span class="summary-row-label">${i.service}</span><span class="summary-row-value">${i.price}</span></div>`).join('')}
    </div>
    <div class="summary-divider"></div>
    <div class="summary-rows">
      <div class="summary-row"><span class="summary-row-label">Subtotal</span><span class="summary-row-value">₹${subtotal.toLocaleString('en-IN')}</span></div>
      <div class="summary-row"><span class="summary-row-label">GST (18%)</span><span class="summary-row-value">₹${tax.toLocaleString('en-IN')}</span></div>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-total">
      <span class="summary-total-label">Total</span>
      <span class="summary-total-value">₹${total.toLocaleString('en-IN')}</span>
    </div>
    <div class="promo-field">
      <input type="text" class="promo-input" placeholder="Promo code" id="promo-input"/>
      <button class="promo-apply" onclick="applyPromo()">Apply</button>
    </div>
    <button class="btn-confirm" onclick="confirmBooking()">
      <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Confirm & Pay
    </button>
    <div class="safety-note">
      <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Secured by Tatku United Payments
    </div>
  `;
}

function applyPromo() {
  const code = document.getElementById('promo-input')?.value?.trim();
  if (code) alert(`Promo "${code}" applied! (Demo)`);
}
function confirmBooking() {
  alert('Redirecting to payment gateway… (Payment page not yet implemented)');
}

// Seed demo data on first open
if (getCart().length === 0) {
  saveCart([
    { id: 1001, service: 'Home Deep Cleaning', price: '₹ 1200', location: '21/229, Indira Nagar, Lucknow', mode: 'instant', date: 'ASAP', time: 'Immediate' },
    { id: 1002, service: 'AC Servicing', price: '₹ 800', location: '21/229, Indira Nagar, Lucknow', mode: 'scheduled', date: '2026-04-10', time: '10:00 AM – 12:00 PM' },
  ]);
}

render();
updateCartBadge();
