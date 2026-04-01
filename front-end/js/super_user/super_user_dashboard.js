/* dashboard.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allEvents = AppStore.getTable("super_user_platform_events") || [];
  const allActions = AppStore.getTable("super_user_actions") || [];
  const allCustomers = AppStore.getTable("customers") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allCMs = AppStore.getTable("collective_managers") || [];
  const allUMs = AppStore.getTable("unit_managers") || [];
  const allSUs = AppStore.getTable("super_users") || [];
  const allAssignments = AppStore.getTable("job_assignments") || [];
  const allTransactions = AppStore.getTable("transactions") || [];
  const allBookings = AppStore.getTable("bookings") || [];
  const allUnits = AppStore.getTable("units") || [];
  const allCollectives = AppStore.getTable("collectives") || [];
  const allServices = AppStore.getTable("services") || [];
  const allCategories = AppStore.getTable("categories") || [];

  /* ── 3. Transform platform events ── */
  function transformEvents(events) {
    return events
      .filter((e) => e.title !== "Provider verification pending from Unit 24 Logistics")
      .slice(0, 4)
      .map((e) => ({
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
      }));
  }

  /* ── 4. Transform super user actions ── */
  function transformActions(actions) {
    return actions.map((a) => {
      const typeToColor = {
        account_suspension: "blue",
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
  function renderKPIs() {
    const activeCustomers = allCustomers.filter((c) => c.is_active !== false).length;
    const activeProviders = allProviders.filter((p) => p.is_active || p.account_status === "active").length;
    const activeCMs = allCMs.filter((m) => m.is_active).length;
    const activeUMs = allUMs.filter((m) => m.is_active).length;
    const activeSUs = allSUs.filter((u) => u.is_active).length;

    const activeUsers = activeCustomers + activeProviders + activeCMs + activeUMs + activeSUs;

    const failedAssignments = allAssignments.filter(
      (a) => a.status === "CANCELLED" || a.status === "FAILED",
    ).length;

    const activeEl = document.getElementById("activeUsersValue");
    const failedEl = document.getElementById("failedAssignmentsValue");

    if (activeEl) activeEl.textContent = activeUsers;
    if (failedEl) failedEl.textContent = failedAssignments;
  }

  function renderRevenue() {
    let totalRevenue = 0;
    const collectiveRevMap = {};

    allCollectives.forEach((c) => {
      collectiveRevMap[c.collective_id] = { name: c.collective_name, amount: 0 };
    });
    collectiveRevMap["unassigned"] = { name: "Other / Direct (Unassigned)", amount: 0 };

    allTransactions.forEach((tx) => {
      if (tx.payment_status === "SUCCESS" || tx.payment_status === "COMPLETED" || tx.payment_status === "completed") {
        const netAmount = (tx.amount || 0) - (tx.refund_amount || 0);
        totalRevenue += netAmount;

        const booking = allBookings.find((b) => b.booking_id === tx.booking_id);
        let assignedColId = "unassigned";

        if (booking) {
          const assignment = allAssignments.find(
            (a) => a.booking_id === booking.booking_id && a.service_provider_id,
          );
          if (assignment) {
            const provider = allProviders.find(
              (p) => p.service_provider_id === assignment.service_provider_id,
            );
            if (provider && provider.unit_id) {
              const unit = allUnits.find((u) => u.unit_id === provider.unit_id);
              if (unit && unit.collective_id) {
                assignedColId = unit.collective_id;
              }
            }
          }
        }
        if (!collectiveRevMap[assignedColId]) {
          collectiveRevMap[assignedColId] = { name: `Unknown (${assignedColId})`, amount: 0 };
        }
        collectiveRevMap[assignedColId].amount += netAmount;
      }
    });

    const revEl = document.getElementById("totalRevenueValue");
    if (revEl) {
      revEl.textContent = `₹${totalRevenue.toLocaleString("en-IN")}`;
    }

    const tbody = document.getElementById("revenue-tbody");
    if (tbody) {
      const sortedCols = Object.values(collectiveRevMap)
        .filter((c) => c.amount > 0 || c.name !== "Other / Direct (Unassigned)")
        .sort((a, b) => b.amount - a.amount);

      if (sortedCols.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--text-faint);">No revenue data available.</td></tr>`;
      } else {
        tbody.innerHTML = sortedCols
          .map(
            (c) => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 500;">₹${c.amount.toLocaleString("en-IN")}</td>
          </tr>
        `,
          )
          .join("");
      }
    }
  }

  function renderEvents() {
    const tbody = document.getElementById("events-tbody");
    if (!tbody) return;

    if (EVENTS.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px; color:var(--text-faint); font-size: 13px;">No recent system events.</td></tr>`;
      return;
    }

    tbody.innerHTML = EVENTS.map(
      (e) => `
      <tr>
        <td class="ev-time">${e.time}</td>
        <td><span class="ev-type-badge ev-type-badge--${e.type}">${e.typeLabel}</span></td>
        <td>${e.desc}</td>
      </tr>
    `,
    ).join("");
  }

  function renderSuperUserActions() {
    const el = document.getElementById("super_user-action-list");
    if (!el) return;

    if (SUPER_USER_ACTIONS.length === 0) {
      el.innerHTML =
        '<div style="padding: 20px; text-align: center; color: var(--text-faint); font-size: 13px;">No recent specialized actions.</div>';
      return;
    }

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

  /* ── 7. Initialize on DOM ready ── */
  function initDashboard() {
    renderKPIs();
    renderRevenue();
    renderEvents();
    renderSuperUserActions();
    renderTopServices();
    renderTopCategories();
    setupDownloadLog();
  }

  function setupDownloadLog() {
    const btn = document.querySelector(".download-log-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (SUPER_USER_ACTIONS.length === 0) {
          alert("No recent actions to download.");
          return;
        }
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(SUPER_USER_ACTIONS, null, 2));
        const anchor = document.createElement("a");
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "action_log.json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
});
