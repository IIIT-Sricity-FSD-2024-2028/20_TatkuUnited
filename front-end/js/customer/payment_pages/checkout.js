/* ═══════════════════════════════════════
   checkout.js — Tatku United Checkout
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

function getCheckoutCart(customerId) {
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}

function getBookingRules() {
  if (!window.AppStore || typeof AppStore.getBookingRules !== "function") {
    return { instantBooking: true };
  }
  return AppStore.getBookingRules();
}

function parseAmount(value) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapPaymentMethod(value) {
  if (value === "upi") return "UPI";
  if (value === "card") return "CARD";
  if (value === "netbank") return "NETBANK";
  if (value === "wallet") return "WALLET";
  return "CARD";
}

function resolveServiceIdByName(serviceName) {
  if (!window.AppStore) return null;
  const services = AppStore.getTable("services") || [];
  const exactMatch = services.find(
    (service) => service.service_name === serviceName,
  );
  if (exactMatch) return exactMatch.service_id;

  const normalized = String(serviceName || "")
    .trim()
    .toLowerCase();
  const softMatch = services.find(
    (service) =>
      String(service.service_name || "")
        .trim()
        .toLowerCase() === normalized,
  );
  return softMatch ? softMatch.service_id : null;
}

function getCurrentCustomerRecord(customerId) {
  if (
    !customerId ||
    !window.AppStore ||
    typeof AppStore.getTable !== "function"
  ) {
    return null;
  }

  const customers = AppStore.getTable("customers") || [];
  return customers.find((c) => c.customer_id === customerId) || null;
}

function resolveCustomerAddress(customer) {
  if (!customer) return "";
  if (
    Array.isArray(customer.saved_addresses) &&
    customer.saved_addresses.length > 0
  ) {
    const primary = customer.saved_addresses[0];
    if (primary && primary.text) return primary.text;
  }
  return customer.address || "";
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

function persistCustomerAddress(session, name, phone, line1, line2) {
  const customer = getCurrentCustomerRecord(session.id);
  if (!customer) return;

  const fullAddress = buildAddressText(line1, line2);
  customer.full_name = name || customer.full_name;
  customer.phone = phone || customer.phone;
  customer.address = fullAddress;

  if (
    Array.isArray(customer.saved_addresses) &&
    customer.saved_addresses.length > 0
  ) {
    customer.saved_addresses[0].text = fullAddress;
  } else {
    customer.saved_addresses = [{ id: 1, tag: "Home", text: fullAddress }];
  }

  if (window.AppStore && typeof AppStore.save === "function") {
    AppStore.save();
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

saveAddrBtn.addEventListener("click", () => {
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
  persistCustomerAddress(session, name, phone, line1, line2);

  const cart = getCheckoutCart(session.id).map((item) => ({
    ...item,
    location: buildAddressText(line1, line2),
  }));
  CustomerState.setCart(session.id, cart);

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
confirmBtn.addEventListener("click", () => {
  if (!selectedPayment) return;

  if (selectedPayment === "cash") {
    showCheckoutToast(
      "Cash payment is no longer supported. Choose a digital payment method.",
    );
    return;
  }

  confirmBtn.textContent = "Processing…";
  confirmBtn.disabled = true;

  setTimeout(() => {
    const session = Auth.requireSession(["customer"]);
    if (!session) return;

    const cart = getCheckoutCart(session.id);
    const rules = getBookingRules();

    if (!rules.instantBooking && cart.some((item) => item.mode === "instant")) {
      confirmBtn.textContent = "Confirm Booking";
      confirmBtn.disabled = false;
      showCheckoutToast(
        "Instant booking is disabled. Please reschedule cart items before checkout.",
      );
      return;
    }

    for (let i = 0; i < cart.length; i += 1) {
      const item = cart[i];
      if (item.mode !== "scheduled") continue;

      const validation =
        window.AppStore && typeof AppStore.validateScheduledSlot === "function"
          ? AppStore.validateScheduledSlot(item.date, item.time)
          : { valid: true };

      if (!validation.valid) {
        confirmBtn.textContent = "Confirm Booking";
        confirmBtn.disabled = false;
        showCheckoutToast(validation.error);
        return;
      }
    }

    let firstId = null;
    cart.forEach((item) => {
      const bId = AppStore.nextId("BKG");
      if (!firstId) firstId = bId;
      const nowIso = new Date().toISOString();
      const bookingAmount = parseAmount(item.price);
      const checkoutAddress = buildAddressText(
        document.getElementById("addrLine1").textContent,
        document.getElementById("addrLine2").textContent,
      );

      const newBooking = {
        booking_id: bId,
        customer_id: session.id,
        booking_type: item.mode === "instant" ? "INSTANT" : "SCHEDULED",
        status: "PENDING",
        service_address: checkoutAddress || item.location,
        service_name: item.service,
        price: item.price,
        provider_id: null,
        scheduled_at:
          item.mode === "scheduled"
            ? new Date(
                item.date +
                  "T" +
                  (item.time ? item.time.split(" ")[0] + ":00" : "10:00:00"),
              ).toISOString()
            : new Date().toISOString(),
        created_at: nowIso,
      };
      CRUD.createRecord("bookings", newBooking);

      const serviceId = resolveServiceIdByName(item.service);
      if (serviceId) {
        CRUD.createRecord("booking_services", {
          booking_id: bId,
          service_id: serviceId,
          quantity: 1,
          price_at_booking: bookingAmount,
        });
      }

      CRUD.createRecord("transactions", {
        transaction_id: AppStore.nextId("TXN"),
        payment_gateway_ref: `PGR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        payment_method: mapPaymentMethod(selectedPayment),
        idempotency_key: `idem-${String(bId).toLowerCase()}-001`,
        payment_status: "SUCCESS",
        amount: bookingAmount,
        currency: "INR",
        refund_amount: 0,
        refund_reason: null,
        transaction_at: nowIso,
        verified_at: nowIso,
        booking_id: bId,
      });

      // Auto-assign a provider via skill matching
      if (window.AssignmentEngine) {
        const result = AssignmentEngine.assignProviderForBooking(bId);
        if (result.success) {
          console.log(
            "[Checkout] Provider " +
              result.providerId +
              " assigned to booking " +
              bId,
          );

          // Create pending revenue split at booking time.
          if (window.RevenueManager) {
            window.RevenueManager.ensureLedgerEntriesForBooking(bId, {
              payoutStatus: "PENDING",
              providerId: result.providerId,
            });
          }
        } else {
          console.log(
            "[Checkout] No provider assigned for " + bId + ": " + result.reason,
          );
        }
      }
    });

    CustomerState.clearCart(session.id);

    CustomerState.setCheckoutMeta(session.id, {
      last_booking_id:
        firstId ||
        "TU-" +
          new Date().getFullYear() +
          "-" +
          Math.floor(Math.random() * 9000 + 1000),
      last_payment_method: selectedPayment,
      last_total: document.querySelector(".total-amount").textContent,
    });

    window.location.href = "payment_success.html";
  }, 1400);
});

/* ── Close modal on overlay click ── */
document.getElementById("successModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("successModal")) {
    document.getElementById("successModal").classList.remove("open");
  }
});

/* ── Auth guard & Init ── */
AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  // Calculate cart totals
  const cart = getCheckoutCart(session.id);

  if (cart.length === 0) {
    showCheckoutToast("Your cart is empty. Redirecting...");
    setTimeout(() => {
      window.location.href = "../home.html";
    }, 1500);
    return;
  }

  function parsePrice(p) {
    return parseInt((p || "0").replace(/[^\d]/g, "")) || 0;
  }
  const subtotal = cart.reduce((s, i) => s + parsePrice(i.price), 0);
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

  // Populate address and form from AppStore customer record
  const me = getCurrentCustomerRecord(session.id);
  if (me) {
    const name = me.full_name || session.name || "Customer";
    const phone = me.phone || "";
    const resolvedAddress = resolveCustomerAddress(me);
    const addressParts = parseAddressParts(resolvedAddress);

    setAddressCardUI(name, phone, addressParts.line1, addressParts.line2);
    setAddressFormUI(name, phone, addressParts.line1, addressParts.line2);

    const cartWithCurrentAddress = cart.map((item) => ({
      ...item,
      location: resolvedAddress || item.location,
    }));
    CustomerState.setCart(session.id, cartWithCurrentAddress);
  }
});
