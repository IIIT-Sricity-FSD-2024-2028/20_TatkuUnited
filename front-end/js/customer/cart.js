/* =============================================================================
   CUSTOMER CART PAGE — cart.js (API-backed)
   ============================================================================= */

let cartData = null; // { cart_id, customer_id, booking_type, scheduled_at, items: [] }
let customerAddress = null;

async function loadCart() {
  try {
    cartData = await Api.get("/cart");
  } catch (_) {
    cartData = { items: [] };
  }
  return cartData;
}

function getCartItems() {
  return (cartData && cartData.items) || [];
}

async function updateCartBadge() {
  const items = getCartItems();
  const count = items.length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

function parsePrice(p) {
  if (typeof p === "number") return p;
  return parseInt((p || "0").replace(/[^\d]/g, "")) || 0;
}

function formatPrice(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

const svcIcon = `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`;

let editingItemId = null;

// ===== EDIT MODAL =====
function openEditModal(itemId) {
  editingItemId = itemId;
  const items = getCartItems();
  const item = items.find((i) => i.cart_item_id === itemId);
  if (!item) return;
  document.getElementById("modal-service-name").textContent =
    item.service_name || item.service || "Service";
  const dateInput = document.getElementById("modal-date");
  const timeSelect = document.getElementById("modal-time");
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);
  const fmt = (d) => d.toISOString().split("T")[0];
  dateInput.min = fmt(today);
  dateInput.max = fmt(maxDate);
  dateInput.value = "";
  timeSelect.value = "";
  document.getElementById("edit-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeEditModalBtn() {
  document.getElementById("edit-modal").classList.remove("open");
  document.body.style.overflow = "";
  editingItemId = null;
}
function closeEditModal(e) {
  if (e.target === document.getElementById("edit-modal")) closeEditModalBtn();
}

async function saveScheduleEdit() {
  if (!editingItemId) return;
  const newDate = document.getElementById("modal-date").value;
  const newTime = document.getElementById("modal-time").value;

  if (!newDate || !newTime) {
    showToast("Please select both date and time.", "error");
    return;
  }

  const scheduledAt = new Date(newDate + "T" + newTime + ":00").toISOString();

  try {
    await Api.patch("/cart", { scheduled_at: scheduledAt });
    await loadCart();
    closeEditModalBtn();
    render();
    showToast("Schedule updated successfully!", "success");
  } catch (err) {
    console.error("[cart] Schedule update failed:", err);
  }
}

async function removeItem(itemId) {
  try {
    await Api.del("/cart/items/" + itemId);
    await loadCart();
    updateCartBadge();
    render();
    showToast("Item removed from cart.", "info");
  } catch (err) {
    console.error("[cart] Remove failed:", err);
  }
}

function render() {
  const items = getCartItems();
  const isEmpty = items.length === 0;
  document.getElementById("cart-items").style.display = isEmpty
    ? "none"
    : "flex";
  document.getElementById("cart-summary").style.display = isEmpty
    ? "none"
    : "block";
  document.getElementById("empty-state").style.display = isEmpty
    ? "flex"
    : "none";
  document.getElementById("cart-sub").textContent = isEmpty
    ? ""
    : `${items.length} service${items.length > 1 ? "s" : ""} in your cart`;
  if (isEmpty) return;

  const subtotal = items.reduce(
    (s, i) => s + parsePrice(i.price_snapshot || i.price),
    0,
  );
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  document.getElementById("cart-items").innerHTML = items
    .map((item, idx) => {
      const displayLocation = customerAddress || item.location || "Location unavailable";
      const priceDisplay = formatPrice(item.price_snapshot || item.price);
      const serviceName = item.service_name || item.service || "Service";
      const itemId = item.cart_item_id || item.id;
      
      let scheduleDisplay = "Instant Booking";
      if (item.booking_type === "SCHEDULED" && item.scheduled_at) {
        const d = new Date(item.scheduled_at);
        scheduleDisplay = `Scheduled for ${d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }

      return `
      <div class="cart-item" style="animation-delay:${idx * 0.07}s">
        <div class="cart-item-icon">${svcIcon}</div>
        <div class="cart-item-body">
          <div class="cart-item-name">${serviceName}</div>
          <div class="cart-item-meta">
            <div class="cart-item-meta-row">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${displayLocation}
            </div>
            <div class="cart-item-meta-row">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${scheduleDisplay}
            </div>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${priceDisplay}</div>
          <button class="btn-remove" onclick="removeItem('${itemId}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            Remove
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  document.getElementById("cart-summary").innerHTML = `
    <div class="summary-title">Order Summary</div>
    <div class="summary-rows">
      ${items.map((i) => `<div class="summary-row"><span class="summary-row-label">${i.service_name || i.service || "Service"}</span><span class="summary-row-value">${formatPrice(i.price_snapshot || i.price)}</span></div>`).join("")}
    </div>
    <div class="summary-divider"></div>
    <div class="summary-rows">
      <div class="summary-row"><span class="summary-row-label">Subtotal</span><span class="summary-row-value">₹${subtotal.toLocaleString("en-IN")}</span></div>
      <div class="summary-row"><span class="summary-row-label">GST (18%)</span><span class="summary-row-value">₹${tax.toLocaleString("en-IN")}</span></div>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-total">
      <span class="summary-total-label">Total</span>
      <span class="summary-total-value">₹${total.toLocaleString("en-IN")}</span>
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
  const code = document.getElementById("promo-input")?.value?.trim();
  if (code) showToast(`Promo "${code}" applied! (Demo)`, "success");
}

function confirmBooking() {
  window.location.href = "payment_pages/checkout.html";
}

(async () => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  try {
    const me = await Api.get("/customers/" + session.id, { silent: true });
    if (me && me.address) {
      customerAddress = me.address;
    }
  } catch (_) {}

  await loadCart();
  render();
  updateCartBadge();
})();
