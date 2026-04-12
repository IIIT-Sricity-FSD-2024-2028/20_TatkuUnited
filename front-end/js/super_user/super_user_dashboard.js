/* dashboard.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull base tables ── */
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
  const allLedger = AppStore.getTable("revenue_ledger") || [];

  function updateNotificationBadges() {
    const unread = (AppStore.getTable("super_user_notifications") || []).filter(
      (n) => !n.is_read,
    ).length;
    document.querySelectorAll(".notif-badge").forEach((badge) => {
      if (unread > 0) {
        badge.textContent = String(unread);
        badge.style.display = "flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    });
  }

  /* ── 3. Transform platform events ── */
  function transformEvents(events) {
    return events
      .filter(
        (e) =>
          e.title !== "Provider verification pending from Unit 24 Logistics",
      )
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
    const { allServices } = getRefData();
    return allServices
      .filter((s) => s.is_available)
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, limit);
  }

  function getTopRatedCategories(limit = 5) {
    const { allCategories } = getRefData();
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
    const derived = AppStore.getDerivedMetrics();
    const activeUsers = derived.userCount;
    const failedAssignments = derived.failedAssignments;

    const activeEl = document.getElementById("activeUsersValue");
    const failedEl = document.getElementById("failedAssignmentsValue");

    if (activeEl) activeEl.textContent = activeUsers;
    if (failedEl) failedEl.textContent = failedAssignments;
  }

  function renderRevenue() {
    const roleOrder = [
      { role: "provider", label: "Providers (78%)" },
      { role: "unit_manager", label: "Unit Managers (7%)" },
      { role: "collective_manager", label: "Collective Managers (4%)" },
      { role: "super_user", label: "Platform / Super User (11%)" },
    ];

    const revenueByRole = {
      provider: { amount: 0 },
      unit_manager: { amount: 0 },
      collective_manager: { amount: 0 },
      super_user: { amount: 0 },
    };

    allLedger.forEach((entry) => {
      if (revenueByRole[entry.role]) {
        revenueByRole[entry.role].amount += Number(entry.amount || 0);
      }
    });

    let totalGMV = 0;
    allTransactions.forEach((tx) => {
      if (
        tx.payment_status === "SUCCESS" ||
        tx.payment_status === "COMPLETED"
      ) {
        totalGMV += Number(tx.amount || 0) - Number(tx.refund_amount || 0);
      }
    });

    const totalDistributed = roleOrder.reduce(
      (sum, roleMeta) => sum + revenueByRole[roleMeta.role].amount,
      0,
    );

    const distributionRate =
      totalGMV > 0 ? Math.min((totalDistributed / totalGMV) * 100, 100) : 0;

    const formatInr = (value) =>
      `₹${Math.round(value).toLocaleString("en-IN")}`;

    const revEl = document.getElementById("totalRevenueValue");
    if (revEl) revEl.textContent = formatInr(totalGMV);

    const gmvEl = document.getElementById("revenueGmvValue");
    if (gmvEl) gmvEl.textContent = formatInr(totalGMV);

    const distEl = document.getElementById("revenueDistributedValue");
    if (distEl) distEl.textContent = formatInr(totalDistributed);

    const rateEl = document.getElementById("revenueDistributionRate");
    if (rateEl) rateEl.textContent = `${distributionRate.toFixed(1)}%`;

    const barsEl = document.getElementById("revenue-breakdown-bars");
    if (barsEl) {
      const peakAmount = Math.max(
        ...roleOrder.map((roleMeta) => revenueByRole[roleMeta.role].amount),
        0,
      );

      barsEl.innerHTML = roleOrder
        .map((roleMeta) => {
          const amount = revenueByRole[roleMeta.role].amount;
          const widthPct = peakAmount > 0 ? (amount / peakAmount) * 100 : 0;
          return `
            <div class="revenue-role-item">
              <div class="revenue-role-head">
                <span class="revenue-role-name">${roleMeta.label}</span>
                <span class="revenue-role-value">${formatInr(amount)}</span>
              </div>
              <div class="revenue-role-track">
                <div class="revenue-role-fill revenue-role-fill--${roleMeta.role}" style="width: ${widthPct.toFixed(1)}%;"></div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const tbody = document.getElementById("revenue-tbody");
    if (tbody) {
      const rows = roleOrder
        .map((roleMeta) => {
          const amount = revenueByRole[roleMeta.role].amount;
          return `
            <tr>
              <td><strong>${roleMeta.label}</strong></td>
              <td class="revenue-table-amount revenue-amount">${formatInr(amount)}</td>
            </tr>
          `;
        })
        .join("");

      tbody.innerHTML =
        rows +
        `
          <tr class="revenue-total-row">
            <td><strong>Total GMV</strong></td>
            <td class="revenue-table-amount revenue-amount">${formatInr(totalGMV)}</td>
          </tr>
        `;
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
    updateNotificationBadges();
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

  function start() {
    initDashboard();
    AppStore.subscribe(initDashboard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});
