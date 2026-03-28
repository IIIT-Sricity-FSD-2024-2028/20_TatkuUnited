/* ═══════════════════════════════════════
   checkout.js — Tatku United Checkout
═══════════════════════════════════════ */

/* ── Toast ── */
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* ── Address Edit ── */
const changeAddrBtn = document.getElementById('changeAddrBtn');
const addressForm   = document.getElementById('addressForm');
const addressCard   = document.getElementById('addressCard');
const saveAddrBtn   = document.getElementById('saveAddrBtn');
const cancelAddrBtn = document.getElementById('cancelAddrBtn');

changeAddrBtn.addEventListener('click', () => {
  addressForm.classList.add('visible');
  addressCard.style.opacity = '.5';
  changeAddrBtn.style.display = 'none';
});

cancelAddrBtn.addEventListener('click', () => {
  addressForm.classList.remove('visible');
  addressCard.style.opacity = '1';
  changeAddrBtn.style.display = 'flex';
});

saveAddrBtn.addEventListener('click', () => {
  const name  = document.getElementById('inputName').value.trim();
  const phone = document.getElementById('inputPhone').value.trim();
  const line1 = document.getElementById('inputLine1').value.trim();
  const line2 = document.getElementById('inputLine2').value.trim();

  if (!name || !phone || !line1) {
    showToast('⚠️ Please fill in required fields.');
    return;
  }

  document.getElementById('addrName').textContent  = name;
  document.getElementById('addrPhone').innerHTML   = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;stroke:#94a3b8;flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17v-.08z"/></svg>
    ${phone}
  `;
  document.getElementById('addrLine1').textContent = line1;
  document.getElementById('addrLine2').textContent = line2;

  addressForm.classList.remove('visible');
  addressCard.style.opacity = '1';
  changeAddrBtn.style.display = 'flex';
  showToast('✅ Address updated successfully!');
});

/* ── Payment Selection ── */
const paymentOptions = document.querySelectorAll('.payment-option');
const confirmBtn     = document.getElementById('confirmBtn');
const confirmHint    = document.getElementById('confirmHint');
let   selectedPayment = null;

paymentOptions.forEach(option => {
  option.addEventListener('click', () => {
    /* Deselect all */
    paymentOptions.forEach(o => o.classList.remove('selected'));
    /* Select clicked */
    option.classList.add('selected');
    option.querySelector('input[type="radio"]').checked = true;
    selectedPayment = option.dataset.value;

    /* Enable confirm */
    confirmBtn.disabled = false;
    confirmHint.style.opacity = '0';
  });
});

/* ── Confirm Booking ── */
confirmBtn.addEventListener('click', () => {
  if (!selectedPayment) return;

  confirmBtn.textContent = 'Processing…';
  confirmBtn.disabled    = true;

  setTimeout(() => {
    /* Generate booking ID */
    const id = 'TU-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9000 + 1000);
    document.getElementById('bookingId').textContent = id;
    document.getElementById('successModal').classList.add('open');
    showToast('🎉 Booking confirmed!');
  }, 1400);
});

/* ── Close modal on overlay click ── */
document.getElementById('successModal').addEventListener('click', e => {
  if (e.target === document.getElementById('successModal')) {
    document.getElementById('successModal').classList.remove('open');
  }
});
