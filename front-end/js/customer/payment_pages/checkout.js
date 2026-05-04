/* ═══════════════════════════════════════
   checkout.js — Tatku United Checkout (API-backed)
═══════════════════════════════════════ */

/* ── Toast ── */
const toastEl = document.getElementById("toast");
let toastTimer;

function showCheckoutToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

function parseAmount(value) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAddressParts(addressText) {
  const raw = String(addressText || "").trim();
  if (!raw) return { line1: "", line2: "" };

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return { line1: raw, line2: "" };
  }

  return {
    line1: parts.slice(0, -1).join(", "),
    line2: parts[parts.length - 1],
  };
}

function buildAddressText(line1, line2) {
  const a = String(line1 || "").trim();
  const b = String(line2 || "").trim();
  return b ? `${a}, ${b}` : a;
}

function setAddressCardUI(name, phone, line1, line2) {
  document.getElementById("addrName").textContent = name || "Customer";
  document.getElementById("addrPhone").innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;stroke:#94a3b8;flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17v-.08z"/></svg>
    ${phone || "N/A"}
  `;
  document.getElementById("addrLine1").textContent =
    line1 || "Address not available";
  document.getElementById("addrLine2").textContent = line2 || "";
}

function setAddressFormUI(name, phone, line1, line2) {
  document.getElementById("inputName").value = name || "";
  document.getElementById("inputPhone").value = phone || "";
  document.getElementById("inputLine1").value = line1 || "";
  document.getElementById("inputLine2").value = line2 || "";
}

async function persistCustomerAddress(session, name, phone, line1, line2) {
  const fullAddress = buildAddressText(line1, line2);
  try {
    await Api.patch("/customers/" + session.id, {
      full_name: name,
      phone: phone,
      address: fullAddress,
    }, { silent: true });
  } catch (_) {
    // Address save failed silently — not critical
  }
}

/* ── Address Edit ── */
const changeAddrBtn = document.getElementById("changeAddrBtn");
const addressForm = document.getElementById("addressForm");
const addressCard = document.getElementById("addressCard");
const saveAddrBtn = document.getElementById("saveAddrBtn");
const cancelAddrBtn = document.getElementById("cancelAddrBtn");

changeAddrBtn.addEventListener("click", () => {
  addressForm.classList.add("visible");
  addressCard.style.opacity = ".5";
  changeAddrBtn.style.display = "none";
});

cancelAddrBtn.addEventListener("click", () => {
  addressForm.classList.remove("visible");
  addressCard.style.opacity = "1";
  changeAddrBtn.style.display = "flex";
});

saveAddrBtn.addEventListener("click", async () => {
  const session = Auth.getSession();
  if (!session || session.role !== "customer") return;

  const name = document.getElementById("inputName").value.trim();
  const phone = document.getElementById("inputPhone").value.trim();
  const line1 = document.getElementById("inputLine1").value.trim();
  const line2 = document.getElementById("inputLine2").value.trim();

  if (!name || !phone || !line1) {
    showCheckoutToast("⚠️ Please fill in required fields.");
    return;
  }

  setAddressCardUI(name, phone, line1, line2);
  await persistCustomerAddress(session, name, phone, line1, line2);

  // Update cart service_address
  const fullAddress = buildAddressText(line1, line2);
  try {
    await Api.patch("/cart", { service_address: fullAddress }, { silent: true });
  } catch (_) {}

  addressForm.classList.remove("visible");
  addressCard.style.opacity = "1";
  changeAddrBtn.style.display = "flex";
  showCheckoutToast("✅ Address updated successfully!");
});

/* ── Payment Selection ── */
const paymentOptions = document.querySelectorAll(".payment-option");
const confirmBtn = document.getElementById("confirmBtn");
const confirmHint = document.getElementById("confirmHint");
let selectedPayment = null;

paymentOptions.forEach((option) => {
  option.addEventListener("click", () => {
    paymentOptions.forEach((o) => o.classList.remove("selected"));
    option.classList.add("selected");
    option.querySelector('input[type="radio"]').checked = true;
    selectedPayment = option.dataset.value;
    confirmBtn.disabled = false;
    confirmHint.style.opacity = "0";
  });
});

/* ── Confirm Booking ── */
confirmBtn.addEventListener("click", async () => {
  if (!selectedPayment) return;

  const addrLine1 = document.getElementById("addrLine1").textContent;
  if (!addrLine1 || addrLine1.includes("not available") || addrLine1.trim() === "") {
    showCheckoutToast("⚠️ Please add a delivery address first.");
    document.getElementById("addressSection").scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (selectedPayment === "cash") {
    showCheckoutToast(
      "Cash payment is no longer supported. Choose a digital payment method.",
    );
    return;
  }

  confirmBtn.textContent = "Processing…";
  confirmBtn.disabled = true;

  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  try {
    // Single API call to checkout — backend handles everything:
    // 1. Creates Booking + BookingServices from cart items
    // 2. Creates Transaction record
    // 3. Triggers auto-assignment
    // 4. Creates revenue ledger entries
    // 5. Clears the cart
    const result = await Api.post("/bookings/checkout", {
      payment_method: selectedPayment,
    });

    // Store checkout meta for payment success page
    try {
      sessionStorage.setItem(
        "tu_checkout_result",
        JSON.stringify({
          booking_id: result.booking_id || result.id,
          payment_method: selectedPayment,
          total: document.querySelector(".total-amount")?.textContent || "₹0",
        }),
      );
    } catch (_) {}

    window.location.href = "payment_success.html";
  } catch (err) {
    confirmBtn.textContent = "Confirm Booking";
    confirmBtn.disabled = false;
    // Error toast already shown by Api interceptor
    console.error("[checkout] Checkout failed:", err);
  }
});

/* ── Close modal on overlay click ── */
document.getElementById("successModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("successModal")) {
    document.getElementById("successModal").classList.remove("open");
  }
});

/* ── Auth guard & Init ── */
(async () => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  // Load cart from API
  let cartData;
  try {
    cartData = await Api.get("/cart");
  } catch (_) {
    cartData = { items: [] };
  }

  const items = (cartData && cartData.items) || [];

  if (items.length === 0) {
    showCheckoutToast("Your cart is empty. Redirecting...");
    setTimeout(() => {
      window.location.href = "../home.html";
    }, 1500);
    return;
  }

  // Calculate totals from API cart data
  function parsePrice(p) {
    if (typeof p === "number") return p;
    return parseInt((p || "0").replace(/[^\d]/g, "")) || 0;
  }
  const subtotal = items.reduce(
    (s, i) => s + parsePrice(i.price_snapshot || i.price),
    0,
  );
  const tax = Math.round(subtotal * 0.18);
  const delivery = 49;
  const total = subtotal + tax + delivery;

  const summaryVals = document.querySelectorAll(".summary-val");
  if (summaryVals.length >= 3) {
    summaryVals[0].textContent = "₹" + subtotal.toLocaleString("en-IN");
    summaryVals[1].textContent = "₹" + delivery;
    summaryVals[2].textContent = "₹" + tax.toLocaleString("en-IN");
  }
  const totalAmountEl = document.querySelector(".total-amount");
  if (totalAmountEl) {
    totalAmountEl.textContent = "₹" + total.toLocaleString("en-IN");
  }

  // Load customer profile for address
  try {
    const me = await Api.get("/customers/" + session.id, { silent: true });
    if (me) {
      const name = me.full_name || session.name || "Customer";
      const phone = me.phone || "";
      const resolvedAddress = me.address || "";
      const addressParts = parseAddressParts(resolvedAddress);

      setAddressCardUI(name, phone, addressParts.line1, addressParts.line2);
      setAddressFormUI(name, phone, addressParts.line1, addressParts.line2);

      if (!resolvedAddress) {
        showCheckoutToast("📍 Please add a delivery address to continue.");
        addressForm.classList.add("visible");
        addressCard.style.opacity = ".5";
        changeAddrBtn.style.display = "none";
      } else {
        // Automatically ensure cart has the latest profile address before checkout
        try {
          Api.patch("/cart", { service_address: resolvedAddress }, { silent: true });
        } catch (_) {}
      }
    }
  } catch (_) {
    // Address load failed — not critical
  }
})();
