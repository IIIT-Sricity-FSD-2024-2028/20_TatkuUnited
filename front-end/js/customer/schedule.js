function getCustomerSessionId() {
  const session = Auth.getSession();
  return session && session.role === "customer" ? session.id : null;
}
function getCart() {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}
function saveCart(c) {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return;
  CustomerState.setCart(customerId, c);
}
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCurrentCustomerAddress(customerId) {
  if (!window.AppStore || typeof AppStore.getTable !== "function") return "";
  if (!customerId) return "";

  const customers = AppStore.getTable("customers") || [];
  const me = customers.find((c) => c.customer_id === customerId);
  if (!me) return "";

  if (Array.isArray(me.saved_addresses) && me.saved_addresses.length > 0) {
    const primary = me.saved_addresses[0];
    if (primary && primary.text) return primary.text;
  }

  return me.address || "";
}

function getServiceLocationFromMockData(serviceName) {
  if (!window.AppStore || typeof AppStore.getTable !== "function") return "";

  const services = AppStore.getTable("services") || [];
  const bookingServices = AppStore.getTable("booking_services") || [];
  const bookings = AppStore.getTable("bookings") || [];
  const queryName = normalizeText(serviceName);
  const queryWords = queryName ? queryName.split(/\s+/).filter(Boolean) : [];

  const service =
    services.find((item) => normalizeText(item.service_name) === queryName) ||
    services
      .map((item) => {
        const serviceWords = normalizeText(item.service_name)
          .split(/\s+/)
          .filter(Boolean);
        const score = queryWords.reduce(
          (total, word) => total + (serviceWords.includes(word) ? 1 : 0),
          0,
        );
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.item ||
    null;

  if (!service) return "";

  const serviceBookingIds = new Set(
    bookingServices
      .filter((entry) => entry.service_id === service.service_id)
      .map((entry) => entry.booking_id),
  );

  const booking = bookings.find((entry) =>
    serviceBookingIds.has(entry.booking_id),
  );
  return booking && booking.service_address ? booking.service_address : "";
}

let currentMode = "instant";

function getBookingRules() {
  if (!window.AppStore || typeof AppStore.getBookingRules !== "function") {
    return {
      instantBooking: true,
      maxAdvanceDays: 7,
      minNoticeLabel: "1 hour",
      maxAdvanceLabel: "7 days",
    };
  }
  return AppStore.getBookingRules();
}

function getDateConstraints() {
  const rules = getBookingRules();
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + rules.maxAdvanceDays);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { min: fmt(today), max: fmt(maxDate) };
}

function setMode(mode) {
  const rules = getBookingRules();
  if (mode === "instant" && !rules.instantBooking) {
    showToast("Instant booking is currently disabled.", "error");
    mode = "scheduled";
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
    : `Choose your preferred date and time (within ${rules.maxAdvanceLabel} from now).`;
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
    const { min, max } = getDateConstraints();
    const dateInput = document.getElementById("sched-date");
    dateInput.min = min;
    dateInput.max = max;
    if (dateInput.value && (dateInput.value < min || dateInput.value > max))
      dateInput.value = "";
  }
}

function addToCart() {
  const session = Auth.getSession();
  if (!session || session.role !== "customer") {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search + window.location.hash,
    );
    window.location.href = "/front-end/html/auth_pages/login.html?next=" + next;
    return;
  }

  const rules = getBookingRules();

  if (currentMode === "instant" && !rules.instantBooking) {
    showToast("Instant booking is currently disabled.", "error");
    return;
  }

  if (currentMode === "scheduled") {
    const dateVal = document.getElementById("sched-date").value;
    const timeVal = document.getElementById("sched-time").value;
    const validation =
      window.AppStore && typeof AppStore.validateScheduledSlot === "function"
        ? AppStore.validateScheduledSlot(dateVal, timeVal)
        : { valid: !!dateVal && !!timeVal, error: "Please select date/time." };

    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }
  }
  const cart = getCart();
  const liveCustomerAddress = getCurrentCustomerAddress(session.id);
  const item = {
    id: Date.now(),
    service: serviceName,
    price: servicePrice,
    location: liveCustomerAddress || serviceLocation,
    mode: currentMode,
    date:
      currentMode === "scheduled"
        ? document.getElementById("sched-date").value || ""
        : "ASAP",
    time:
      currentMode === "scheduled"
        ? document.getElementById("sched-time").value
        : "Immediate",
  };
  cart.push(item);
  saveCart(cart);
  updateCartBadge();

  // Redirect directly to cart
  window.location.href = "cart.html";
}

/* ── Variables populated after auth ── */
let serviceName, servicePrice, serviceLocation;

AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  const rules = getBookingRules();
  if (!rules.instantBooking) {
    const instantBtn = document.getElementById("btn-instant");
    if (instantBtn) {
      instantBtn.classList.add("disabled");
      instantBtn.title = "Instant booking is disabled in platform settings";
    }
    setMode("scheduled");
  }

  const params = new URLSearchParams(window.location.search);
  serviceName = params.get("service") || "Home Deep Cleaning";
  servicePrice = params.get("price") || "₹ 1200";
  serviceLocation =
    getCurrentCustomerAddress(session.id) ||
    params.get("location") ||
    "Location unavailable";

  document.getElementById("svc-name").textContent = serviceName;
  document.getElementById("svc-price").textContent = servicePrice;
  document.getElementById("svc-location").textContent = serviceLocation;

  updateCartBadge();
});
