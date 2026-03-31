/* ═══════════════════════════════════════════
   payment-success.js — Tatku United
═══════════════════════════════════════════ */

/* ── Toast ── */
const toastEl = document.getElementById("toast");
let toastTimer;

function showSuccessToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

/* ═══════════════════════════════════════════
   VERIFICATION PROGRESS BAR
═══════════════════════════════════════════ */
const verifyBarWrap = document.getElementById("verifyBarWrap");
const verifyBar = document.getElementById("verifyBar");
const bookingDetails = document.getElementById("bookingDetails");
const receiptBtn = document.getElementById("receiptBtn");
const modalSub = document.getElementById("modalSub");

let progress = 0;
let verifyInterval = null;

function getCheckoutMeta() {
  const session = Auth.getSession();
  const customerId = session && session.role === "customer" ? session.id : null;
  if (!customerId || !window.CustomerState) return null;
  return CustomerState.getCheckoutMeta(customerId);
}

function startVerification() {
  receiptBtn.disabled = true;
  receiptBtn.style.opacity = "0.55";
  receiptBtn.style.cursor = "not-allowed";

  verifyInterval = setInterval(() => {
    const step = progress < 60 ? 1.2 : progress < 90 ? 0.7 : 0.3;
    progress = Math.min(100, progress + step);
    verifyBar.style.width = progress + "%";

    if (progress >= 100) {
      clearInterval(verifyInterval);
      onVerified();
    }
  }, 30);
}

function onVerified() {
  verifyBarWrap.style.transition = "opacity .3s ease";
  verifyBarWrap.style.opacity = "0";
  setTimeout(() => {
    verifyBarWrap.style.display = "none";
  }, 320);

  modalSub.style.transition = "opacity .3s ease";
  modalSub.style.opacity = "0";
  setTimeout(() => {
    modalSub.textContent = "Your booking is confirmed and secured.";
    modalSub.style.opacity = "1";
  }, 320);

  setTimeout(() => {
    bookingDetails.classList.add("visible");
  }, 400);

  setTimeout(() => {
    receiptBtn.disabled = false;
    receiptBtn.style.opacity = "1";
    receiptBtn.style.cursor = "pointer";
    showSuccessToast(
      '🎉 Booking confirmed! Tap "View Receipt" to see details.',
    );
  }, 600);
}

window.addEventListener("load", () => {
  setTimeout(startVerification, 800);
});

/* ═══════════════════════════════════════════
   RECEIPT PANEL
═══════════════════════════════════════════ */
const receiptOverlay = document.getElementById("receiptOverlay");
const receiptPanel = document.getElementById("receiptPanel");
const receiptClose = document.getElementById("receiptClose");

receiptBtn.addEventListener("click", () => {
  if (receiptBtn.disabled) return;
  receiptOverlay.classList.add("open");
});

receiptClose.addEventListener("click", () => {
  receiptOverlay.classList.remove("open");
});

receiptOverlay.addEventListener("click", (e) => {
  if (e.target === receiptOverlay) {
    receiptOverlay.classList.remove("open");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    receiptOverlay.classList.remove("open");
  }
});

/* ═══════════════════════════════════════════
   DOWNLOAD RECEIPT (simulated)
═══════════════════════════════════════════ */
document.getElementById("downloadBtn").addEventListener("click", () => {
  const btn = document.getElementById("downloadBtn");
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
    const meta = getCheckoutMeta() || {};
    const bId = meta.last_booking_id || "TU-88291";
    const total = meta.last_total || "₹1,240.00";
    const payMethod =
      meta.last_payment_method === "upi"
        ? "UPI"
        : meta.last_payment_method === "cash"
          ? "Cash on Service"
          : "Credit / Debit Card";
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    document.getElementById("bookingId").textContent = bId;

    const content = [
      "===================================",
      "      TATKU UNITED — RECEIPT",
      "===================================",
      "",
      `Booking ID     : #${bId}`,
      "Service        : Home Services Package",
      `Amount Paid    : ${total}`,
      `Payment Method : ${payMethod}`,
      `Transaction Date: ${today}`,
      "Status         : PAID ✓",
      "",
      "===================================",
      "  Tatku United Inc. © 2026",
      "  support@tatkuunited.com",
      "===================================",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bId}-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);

    btn.innerHTML = original;
    btn.disabled = false;
    showSuccessToast("✅ Receipt downloaded!");
  }, 1000);
});

/* ── Auth guard ── */
AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;
});
