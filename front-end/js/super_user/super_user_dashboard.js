/* dashboard.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allEvents = AppStore.getTable("super_user_platform_events") || [];
  const allActions = AppStore.getTable("super_user_actions") || [];
  const allBookings = AppStore.getTable("bookings") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allUsers = AppStore.getTable("customers") || [];
  const allUnits = AppStore.getTable("units") || [];
  const allServices = AppStore.getTable("services") || [];
  const allCategories = AppStore.getTable("categories") || [];

  /* ── 3. Transform platform events ── */
  function transformEvents(events) {
    return events.slice(0, 4).map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type:
        e.event_type === "security"
          ? "security"
          : e.event_type === "system"
            ? "system"
            : e.event_type === "user"
              ? "user"
              : "action",
      typeLabel: e.event_type.toUpperCase(),
      desc: e.title,
      status: e.status,
      statusLabel:
        e.status === "unresolved"
          ? "Unresolved"
          : e.status === "investigating"
            ? "Investigating"
            : e.status === "pending"
              ? "Pending"
              : "Completed",
    }));
  }

  /* ── 4. Transform super user actions ── */
  function transformActions(actions) {
    return actions.slice(0, 4).map((a) => {
      const typeToColor = {
        account_suspension: "blue",
        provider_verification: "green",
        settings_update: "yellow",
        login: "gray",
      };
      return {
        dot: typeToColor[a.action_type] || "blue",
        title: a.title,
        desc: a.description,
        time: a.time_display,
      };
    });
  }

  /* ── 5. Transform services and categories to get top-rated ── */
  function getTopRatedServices(limit = 5) {
    return allServices
      .filter((s) => s.is_available)
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, limit);
  }

  function getTopRatedCategories(limit = 5) {
    return allCategories
      .filter((c) => c.is_available)
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, limit);
  }

  const EVENTS = transformEvents(allEvents);
  const SUPER_USER_ACTIONS = transformActions(allActions);
  const TOP_SERVICES = getTopRatedServices();
  const TOP_CATEGORIES = getTopRatedCategories();

  /* ── 6. Render ── */
  function renderEvents() {
    const tbody = document.getElementById("events-tbody");
    if (!tbody) return;
    tbody.innerHTML = EVENTS.map(
      (e) => `
      <tr>
        <td class="ev-time">${e.time}</td>
        <td><span class="ev-type-badge ev-type-badge--${e.type}">${e.typeLabel}</span></td>
        <td>${e.desc}</td>
        <td><span class="ev-status ev-status--${e.status}">${e.statusLabel}</span></td>
      </tr>
    `,
    ).join("");
  }

  function renderSuperUserActions() {
    const el = document.getElementById("super_user-action-list");
    if (!el) return;
    el.innerHTML = SUPER_USER_ACTIONS.map(
      (a) => `
      <div class="aa-item">
        <div class="aa-dot aa-dot--${a.dot}"></div>
        <div>
          <div class="aa-title">${a.title}</div>
          <div class="aa-desc">${a.desc}</div>
          <div class="aa-time">${a.time}</div>
        </div>
      </div>
    `,
    ).join("");
  }

  function renderTopServices() {
    const el = document.getElementById("top-services-list");
    if (!el) return;

    if (TOP_SERVICES.length === 0) {
      el.innerHTML = `<div class="empty-state">No services yet</div>`;
    } else {
      el.innerHTML = TOP_SERVICES.map((svc) => {
        const rating =
          typeof svc.average_rating === "number" && (svc.rating_count || 0) > 0
            ? svc.average_rating
            : null;
        const ratingText =
          typeof rating === "number" ? rating.toFixed(1) : "N/A";
        return `
          <div class="top-item">
            <div class="top-item-info">
              <div class="top-item-name">${svc.service_name}</div>
              <div class="top-item-meta">${svc.base_price ? "₹" + svc.base_price : "Price TBA"}</div>
            </div>
            <div class="top-item-rating">
              <div class="rating-value">${ratingText}${typeof rating === "number" ? " ⭐" : ""}</div>
              <div class="rating-count">${svc.rating_count || 0} ratings</div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  function renderTopCategories() {
    const el = document.getElementById("top-categories-list");
    if (!el) return;

    if (TOP_CATEGORIES.length === 0) {
      el.innerHTML = `<div class="empty-state">No categories yet</div>`;
    } else {
      el.innerHTML = TOP_CATEGORIES.map((cat) => {
        const rating =
          typeof cat.average_rating === "number" && (cat.rating_count || 0) > 0
            ? cat.average_rating
            : null;
        const ratingText =
          typeof rating === "number" ? rating.toFixed(1) : "N/A";
        return `
          <div class="top-item">
            <div class="top-item-info">
              <div class="top-item-name">${cat.category_name}</div>
              <div class="top-item-meta">${cat.icon} ${cat.description}</div>
            </div>
            <div class="top-item-rating">
              <div class="rating-value">${ratingText}${typeof rating === "number" ? " ⭐" : ""}</div>
              <div class="rating-count">${cat.rating_count || 0} ratings</div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  /* ── 6. Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderEvents();
      renderSuperUserActions();
      renderTopServices();
      renderTopCategories();
    });
  } else {
    renderEvents();
    renderSuperUserActions();
    renderTopServices();
    renderTopCategories();
  }
});
