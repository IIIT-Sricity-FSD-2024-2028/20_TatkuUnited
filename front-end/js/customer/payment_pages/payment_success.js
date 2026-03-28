/* ═══════════════════════════════════════════
   payment-success.js — Tatku United
═══════════════════════════════════════════ */

/* ── Toast ── */
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════════════
   VERIFICATION PROGRESS BAR
   Fills 0 → 100% over ~2 seconds, then
   reveals booking details & enables button
═══════════════════════════════════════════ */
const verifyBarWrap = document.getElementById('verifyBarWrap');
const verifyBar     = document.getElementById('verifyBar');
const bookingDetails = document.getElementById('bookingDetails');
const receiptBtn    = document.getElementById('receiptBtn');
const modalSub      = document.getElementById('modalSub');

let progress = 0;
let verifyInterval = null;

function startVerification() {
  receiptBtn.disabled = true;
  receiptBtn.style.opacity = '0.55';
  receiptBtn.style.cursor  = 'not-allowed';

  verifyInterval = setInterval(() => {
    /* Speed varies to feel natural */
    const step = progress < 60 ? 1.2 : progress < 90 ? 0.7 : 0.3;
    progress = Math.min(100, progress + step);
    verifyBar.style.width = progress + '%';

    if (progress >= 100) {
      clearInterval(verifyInterval);
      onVerified();
    }
  }, 30);
}

function onVerified() {
  /* Hide progress bar */
  verifyBarWrap.style.transition = 'opacity .3s ease';
  verifyBarWrap.style.opacity    = '0';
  setTimeout(() => { verifyBarWrap.style.display = 'none'; }, 320);

  /* Update subtitle */
  modalSub.style.transition = 'opacity .3s ease';
  modalSub.style.opacity    = '0';
  setTimeout(() => {
    modalSub.textContent  = 'Your booking is confirmed and secured.';
    modalSub.style.opacity = '1';
  }, 320);

  /* Show booking details */
  setTimeout(() => {
    bookingDetails.classList.add('visible');
  }, 400);

  /* Enable button */
  setTimeout(() => {
    receiptBtn.disabled      = false;
    receiptBtn.style.opacity = '1';
    receiptBtn.style.cursor  = 'pointer';
    showToast('🎉 Booking confirmed! Tap "View Receipt" to see details.');
  }, 600);
}

/* ── Start verification on load ── */
window.addEventListener('load', () => {
  /* Small delay so page animations settle first */
  setTimeout(startVerification, 800);
});

/* ═══════════════════════════════════════════
   RECEIPT PANEL
═══════════════════════════════════════════ */
const receiptOverlay = document.getElementById('receiptOverlay');
const receiptPanel   = document.getElementById('receiptPanel');
const receiptClose   = document.getElementById('receiptClose');

receiptBtn.addEventListener('click', () => {
  if (receiptBtn.disabled) return;
  receiptOverlay.classList.add('open');
});

receiptClose.addEventListener('click', () => {
  receiptOverlay.classList.remove('open');
});

/* Close on overlay background click */
receiptOverlay.addEventListener('click', e => {
  if (e.target === receiptOverlay) {
    receiptOverlay.classList.remove('open');
  }
});

/* Close on Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    receiptOverlay.classList.remove('open');
  }
});

/* ═══════════════════════════════════════════
   DOWNLOAD RECEIPT (simulated)
═══════════════════════════════════════════ */
document.getElementById('downloadBtn').addEventListener('click', () => {
  const btn = document.getElementById('downloadBtn');
  const original = btn.innerHTML;

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
      <line x1="12" y1="2" x2="12" y2="12"/>
      <polyline points="5 9 12 16 19 9"/>
    </svg>
    Preparing…
  `;
  btn.disabled = true;

  setTimeout(() => {
    /* Build a simple text receipt and trigger download */
    const content = [
      '===================================',
      '      TATKU UNITED — RECEIPT',
      '===================================',
      '',
      'Booking ID     : #TKU-88291',
      'Service        : Home Services Package',
      'Amount Paid    : ₹1,240.00',
      'Payment Method : Visa ending in 4242',
      'Transaction Date: May 24, 2024',
      'Status         : PAID ✓',
      '',
      '===================================',
      '  Tatku United Inc. © 2026',
      '  support@tatkuunited.com',
      '===================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'TKU-88291-receipt.txt';
    a.click();
    URL.revokeObjectURL(url);

    btn.innerHTML = original;
    btn.disabled  = false;
    showToast('✅ Receipt downloaded!');
  }, 1000);
});

/* ═══════════════════════════════════════════
   NAV LINKS — prevent default
═══════════════════════════════════════════ */
document.querySelectorAll('.nav-links a, .mlink, .footer-links a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const label = link.textContent.trim();
    showToast(`Navigating to ${label}…`);
  });
});
