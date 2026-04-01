function getCustomerSessionId() {
  const session = Auth.getSession();
  return session && session.role === "customer" ? session.id : null;
}
function getCart() {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  /* ── Personalize hero ── */
  const heroName = document.querySelector(".hero-name");
  if (heroName) heroName.textContent = session.name + "!";

  const allBookings = AppStore.getTable("bookings") || [];
  const myBookings = allBookings
    .filter((b) => b.customer_id === session.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const badgeMap = {
    PENDING: "badge-pending",
    CANCELLED: "badge-cancelled",
    SCHEDULED: "badge-assigned",
    COMPLETED: "badge-completed",
  };

  function renderBookings() {
    const grid = document.getElementById("bookings-grid");
    if (myBookings.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; border: 1px dashed var(--border); border-radius: var(--radius-lg);">
          <svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--border);fill:none;stroke-width:1;margin:0 auto 1rem;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <h3 style="margin-bottom:0.5rem;font-size:1.1rem;color:var(--text-1)">No recent bookings</h3>
          <p style="color:var(--text-2);margin-bottom:1.5rem">Book your first service or add an item to your cart!</p>
          <button class="btn-action btn-primary-action" onclick="window.location='../service_pages/service_discovery.html'" style="padding:0.75rem 1.5rem;cursor:pointer">Browse Services</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = myBookings
      .map((b, i) => {
        const dateObj = new Date(b.scheduled_at);
        const rawStatus = (b.status || "PENDING").toUpperCase();
        const statusMap = {
          PENDING: { label: "Pending", badge: "badge-pending" },
          ASSIGNED: { label: "Assigned", badge: "badge-assigned" },
          IN_PROGRESS: { label: "In Progress", badge: "badge-inprogress" },
          COMPLETED: { label: "Completed", badge: "badge-completed" },
          CANCELLED: { label: "Cancelled", badge: "badge-cancelled" },
        };
        const sObj = statusMap[rawStatus] || statusMap["PENDING"];

        const allProviders = AppStore.getTable("service_providers") || [];

        let providerName = "Awaiting Assignment";
        if (b.provider_id) {
          const found = allProviders.find(
            (p) => p.service_provider_id === b.provider_id,
          );
          providerName = found ? found.name : "Tatku Provider";
        } else if (
          ["COMPLETED", "IN_PROGRESS", "ASSIGNED"].includes(rawStatus)
        ) {
          providerName = "Tatku Professional";
        }

        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const serviceName = b.service_name || "Home Service";

        return `
      <div class="booking-card" style="animation-delay:${i * 0.07}s" onclick="window.location='bookings.html'">
        <div class="booking-card-top">
          <span class="booking-badge ${sObj.badge}">${sObj.label}</span>
          <span class="booking-id">ID: #${b.booking_id}</span>
        </div>
        <div class="booking-name">${serviceName}</div>
        <div class="booking-meta">
          <div class="booking-meta-row">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${dateStr} • ${timeStr}
          </div>
          <div class="booking-meta-row">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Provider: ${providerName}
          </div>
        </div>
      </div>
      `;
      })
      .join("");
  }

  renderBookings();
  updateCartBadge();
});
