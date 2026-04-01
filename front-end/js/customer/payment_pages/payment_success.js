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

function formatCurrency(value) {
  const rawValue =
    typeof value === "number"
      ? value
      : Number(String(value || "").replace(/[^\d.]/g, ""));
  const amount = Number.isFinite(rawValue) ? rawValue : 0;
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatPaymentMethod(method) {
  if (method === "upi") return "UPI";
  if (method === "cash") return "Cash on Service";
  if (method === "card") return "Credit / Debit Card";
  if (typeof method === "string" && method.trim()) {
    return method
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "Credit / Debit Card";
}

function getReceiptContext() {
  const session = Auth.getSession();
  const customerId = session && session.role === "customer" ? session.id : null;
  if (!customerId || !window.AppStore) return null;

  const meta = getCheckoutMeta() || {};
  const bookings = AppStore.getTable("bookings") || [];
  const sortedBookings = bookings
    .filter((booking) => booking.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let booking = null;
  if (meta.last_booking_id) {
    booking =
      bookings.find((item) => item.booking_id === meta.last_booking_id) || null;
  }
  if (!booking) {
    booking = sortedBookings[0] || null;
  }
  if (!booking) return null;

  const bookedAt = booking.created_at || new Date().toISOString();
  const transactionDate = new Date(bookedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    bookingId: booking.booking_id,
    serviceName: booking.service_name || "Home Services Booking",
    totalAmount: meta.last_total || formatCurrency(booking.price || 0),
    paymentMethod: formatPaymentMethod(meta.last_payment_method),
    transactionDate,
    status: "PAID",
  };
}

function updateReceiptView(context) {
  if (!context) return;

  const mappings = [
    ["successBookingId", context.bookingId],
    ["successAmount", context.totalAmount],
    ["successPaymentMethod", context.paymentMethod],
    ["successDate", context.transactionDate],
    ["receiptBookingId", `#${context.bookingId}`],
    ["receiptServiceName", context.serviceName],
    ["receiptPaymentMethod", context.paymentMethod],
    ["receiptTransactionDate", context.transactionDate],
    ["receiptStatus", "✓ Paid"],
  ];

  mappings.forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  });

  const amountNode = document.querySelector(".rp-big-amount");
  if (amountNode) {
    amountNode.textContent = context.totalAmount;
  }
}

function buildReceiptText(context) {
  return [
    "===================================",
    "      TATKU UNITED — RECEIPT",
    "===================================",
    "",
    `Booking ID      : #${context.bookingId}`,
    `Service         : ${context.serviceName}`,
    `Amount Paid     : ${context.totalAmount}`,
    `Payment Method  : ${context.paymentMethod}`,
    `Transaction Date: ${context.transactionDate}`,
    "Status          : PAID ✓",
    "",
    "===================================",
    "  Tatku United Inc. © 2026",
    "  support@tatkuunited.com",
    "===================================",
  ].join("\n");
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
    const receiptContext = getReceiptContext();
    if (receiptContext) {
      updateReceiptView(receiptContext);
    }

    receiptBtn.disabled = !receiptContext;
    receiptBtn.style.opacity = receiptContext ? "1" : "0.55";
    receiptBtn.style.cursor = receiptContext ? "pointer" : "not-allowed";
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
  const receiptContext = getReceiptContext();

  if (!receiptContext) {
    showSuccessToast("Unable to load receipt details right now.");
    return;
  }

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
      <line x1="12" y1="2" x2="12" y2="12"/>
      <polyline points="5 9 12 16 19 9"/>
    </svg>
    Preparing…
  `;
  btn.disabled = true;

  setTimeout(() => {
    updateReceiptView(receiptContext);
    const content = buildReceiptText(receiptContext);

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receiptContext.bookingId}-receipt.txt`;
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
