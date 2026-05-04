/* =============================================================================
   CUSTOMER SCHEDULE PAGE — schedule.js (API-backed)
   ============================================================================= */

async function updateCartBadge() {
  try {
    const cart = await Api.get("/cart", { silent: true });
    const items = (cart && cart.items) || [];
    const count = items.length;
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "grid" : "none";
    });
  } catch (_) {
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = "0";
      el.style.display = "none";
    });
  }
}

let currentMode = "instant";

function setMode(mode) {
  if (mode === "instant") {
    // Check platform settings for instant booking (fallback to true)
    // For now just allow it
  }

  currentMode = mode;
  const isInstant = mode === "instant";
  document.getElementById("btn-instant").classList.toggle("active", isInstant);
  document
    .getElementById("btn-scheduled")
    .classList.toggle("active", !isInstant);
  document.getElementById("scheduled-fields").style.display = isInstant
    ? "none"
    : "flex";
  document.getElementById("info-text").textContent = isInstant
    ? "Your service will be assigned to an available provider immediately."
    : "Choose your preferred date and time (within 30 days from now).";
  const banner = document.getElementById("info-banner");
  banner.style.background = isInstant
    ? "var(--green-light)"
    : "var(--primary-light)";
  banner.style.borderColor = isInstant ? "#6ee7b7" : "#bfdbfe";
  banner.style.color = isInstant ? "#065f46" : "#1e3a8a";
  banner.querySelector("svg").style.stroke = isInstant
    ? "#059669"
    : "var(--primary)";
  if (!isInstant) {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    const fmt = (d) => d.toISOString().split("T")[0];
    const dateInput = document.getElementById("sched-date");
    dateInput.min = fmt(today);
    dateInput.max = fmt(maxDate);
    if (dateInput.value && (dateInput.value < fmt(today) || dateInput.value > fmt(maxDate)))
      dateInput.value = "";
  }
}

async function addToCart() {
  const session = Auth.getSession();
  if (!session || session.role !== "customer") {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search + window.location.hash,
    );
    window.location.href = "/html/auth_pages/login.html?next=" + next;
    return;
  }

  let bookingType = "INSTANT";
  let scheduledAtStr = null;

  if (currentMode === "scheduled") {
    const dateVal = document.getElementById("sched-date").value;
    const timeVal = document.getElementById("sched-time").value;

    if (!dateVal || !timeVal) {
      showToast("Please select both date and time.", "error");
      return;
    }

    const scheduledAt = new Date(dateVal + "T" + timeVal + ":00");
    if (isNaN(scheduledAt.getTime())) {
      showToast("Invalid scheduled date/time.", "error");
      return;
    }
    
    bookingType = "SCHEDULED";
    scheduledAtStr = scheduledAt.toISOString();
  }

  // Add item to cart via API
  try {
    const services = await Api.get("/services/available", { silent: true });
    const queryName = (serviceName || "").trim().toLowerCase();
    const service = (services || []).find(
      (s) => (s.service_name || "").trim().toLowerCase() === queryName,
    );

    if (service) {
      await Api.post("/cart/items", {
        service_id: service.service_id,
        quantity: 1,
        booking_type: bookingType,
        scheduled_at: scheduledAtStr
      });
    } else {
      showToast("Service not found in catalog. Please try from the services page.", "error");
      return;
    }

    window.location.href = "cart.html";
  } catch (err) {
    console.error("[schedule] Add to cart failed:", err);
  }
}

/* ── Variables populated after auth ── */
let serviceName, servicePrice, serviceLocation;

(async () => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  serviceName = params.get("service") || "Home Deep Cleaning";
  servicePrice = params.get("price") || "₹ 1200";
  serviceLocation = params.get("location") || "Location unavailable";

  // Try to load customer address from API
  try {
    const me = await Api.get("/customers/" + session.id, { silent: true });
    if (me && me.address) {
      serviceLocation = me.address;
    }
  } catch (_) {}

  document.getElementById("svc-name").textContent = serviceName;
  document.getElementById("svc-price").textContent = servicePrice;
  document.getElementById("svc-location").textContent = serviceLocation;

  updateCartBadge();
})();
