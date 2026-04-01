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

  /* ── Assignment Notifications ── */
  if (window.AssignmentEngine) {
    const notifs = AssignmentEngine.getCustomerNotifications(session.id);
    if (notifs.length > 0) {
      const container = document.createElement("div");
      container.id = "assign-notif-container";
      const bookingsGrid = document.getElementById("bookings-grid");
      if (bookingsGrid && bookingsGrid.parentNode) {
        bookingsGrid.parentNode.insertBefore(container, bookingsGrid);
      }

      container.innerHTML = notifs
        .map(
          (n) => `
        <div class="assign-notif-banner" data-notif-id="${n.id}">
          <div class="notif-icon-wrap">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-message">${n.message}</div>
            <div class="notif-actions">
              <button class="notif-btn notif-btn-primary" onclick="showProviderProfile('${n.providerId}')">View Provider Profile</button>
              <button class="notif-btn notif-btn-dismiss" onclick="dismissNotif('${session.id}', ${n.id})">Dismiss</button>
            </div>
          </div>
        </div>
      `,
        )
        .join("");
    }
  }
});

/* ── Provider Profile Popup ── */
function showProviderProfile(providerId) {
  if (!window.AssignmentEngine) return;
  const profile = AssignmentEngine.getAssignedProviderProfile(providerId);
  if (!profile) return;

  const stars = [];
  const fullStars = Math.floor(profile.rating);
  const hasHalf = profile.rating - fullStars >= 0.25;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        '<svg viewBox="0 0 20 20" fill="#f5a623"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>',
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        '<svg viewBox="0 0 20 20" fill="#f5a623" opacity="0.5"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>',
      );
    } else {
      stars.push(
        '<svg viewBox="0 0 20 20" fill="#e2e8f0"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>',
      );
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "provider-profile-overlay";
  overlay.onclick = function (e) {
    if (e.target === overlay) overlay.remove();
  };
  overlay.innerHTML = `
    <div class="provider-profile-popup">
      <button class="popup-close" onclick="this.closest('.provider-profile-overlay').remove()">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="popup-avatar">
        <img src="${profile.pfpUrl}" alt="${profile.name}" />
      </div>
      <div class="popup-name">${profile.name}</div>
      <div class="popup-role">Service Provider</div>
      <div class="popup-rating">
        <div class="stars">${stars.join("")}</div>
        <span class="rating-text">${profile.rating.toFixed(1)}</span>
        <span class="rating-count">(${profile.ratingCount} reviews)</span>
      </div>
      <hr class="popup-divider" />
      <div class="popup-info-row">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.1 5.18 2 2 0 015.09 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17v-.08z"/></svg>
        <div>
          <div class="info-label">Phone</div>
          <div class="info-value">${profile.phone}</div>
        </div>
      </div>
      <div class="popup-info-row">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <div>
          <div class="info-label">Provider ID</div>
          <div class="info-value">${providerId}</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function dismissNotif(customerId, notifId) {
  if (window.AssignmentEngine) {
    AssignmentEngine.dismissCustomerNotification(customerId, notifId);
  }
  const banner = document.querySelector(
    `.assign-notif-banner[data-notif-id="${notifId}"]`,
  );
  if (banner) {
    banner.style.transition = "opacity 0.3s, transform 0.3s";
    banner.style.opacity = "0";
    banner.style.transform = "translateY(-10px)";
    setTimeout(() => banner.remove(), 300);
  }
}
