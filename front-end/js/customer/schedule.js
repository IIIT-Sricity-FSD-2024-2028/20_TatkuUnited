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

let currentMode = "instant";

function getDateConstraints() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { min: fmt(today), max: fmt(maxDate) };
}

function setMode(mode) {
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
    : "Choose your preferred date and time slot (within 1 week from today).";
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
  if (currentMode === "scheduled") {
    const dateVal = document.getElementById("sched-date").value;
    const { min, max } = getDateConstraints();
    if (!dateVal) {
      showToast("Please select a date.", "error");
      return;
    }
    if (dateVal < min || dateVal > max) {
      showToast("Please select a date within 1 week from today.", "error");
      return;
    }
  }
  const cart = getCart();
  const item = {
    id: Date.now(),
    service: serviceName,
    price: servicePrice,
    location: serviceLocation,
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

  const params = new URLSearchParams(window.location.search);
  serviceName = params.get("service") || "Home Deep Cleaning";
  servicePrice = params.get("price") || "₹ 1200";
  serviceLocation = params.get("location") || "21/229, Indira Nagar, Lucknow";

  document.getElementById("svc-name").textContent = serviceName;
  document.getElementById("svc-price").textContent = servicePrice;
  document.getElementById("svc-location").textContent = serviceLocation;

  updateCartBadge();
});
