// ── Collective Manager Notifications JS ──

AppStore.ready.then(() => {
  const session = Auth.requireSession(["collective_manager"]);
  if (!session) return;

  const collectiveId = session.collectiveId;

  // Retrieve CM's notification state from local storage or initialize
  const NOTIF_STATE_KEY = "cm_notifications_state_" + session.id;
  let notifState = JSON.parse(localStorage.getItem(NOTIF_STATE_KEY)) || {
    dismissed: [],
    read: [],
  };

  function saveNotifState() {
    localStorage.setItem(NOTIF_STATE_KEY, JSON.stringify(notifState));
  }

  // Generate dynamic notifications
  let allNotifications = [];
  let notifCounter = 1;

  function genId() {
    return notifCounter++;
  }

  function getTimeAgo(dateString) {
    if (!dateString) return "recently";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffMin > 0) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    return "Just now";
  }

  // 1. Unassigned Providers (Needing Admission)
  const allProviders = AppStore.getTable("service_providers") || [];
  const allBookings = AppStore.getTable("bookings") || [];
  const allTransactions = AppStore.getTable("transactions") || [];

  // Mapping collective -> sector_ids
  const myCollective = (AppStore.getTable("collectives") || []).find(
    (c) => c.collective_id === collectiveId,
  );
  const mySectors = myCollective ? myCollective.sector_ids : [];

  // Find providers in CM's sectors that don't belong to a unit yet
  const myUnassignedProviders = allProviders.filter(
    (p) => !p.unit_id && mySectors.includes(p.home_sector_id),
  );

  if (myUnassignedProviders.length > 0) {
    allNotifications.push({
      id: genId(),
      category: "provider",
      read: false,
      color: "amber",
      title: "Provider Admission Request",
      desc: `${myUnassignedProviders.length} new provider application(s) found in your sectors requiring unit assignment.`,
      time: "Recently",
      icon: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
      actions: [
        { label: "Assign Now", cls: "primary", href: "admit_providers.html" },
      ],
    });
  }

  // 2. High rated providers under this CM
  const allUnits = AppStore.getTable("units") || [];
  const myUnits = allUnits.filter((u) => u.collective_id === collectiveId);
  const myUnitIds = new Set(myUnits.map((u) => u.unit_id));
  const myProviders = allProviders.filter((p) => myUnitIds.has(p.unit_id));
  const myProviderIds = new Set(myProviders.map((p) => p.service_provider_id));
  const myBookings = allBookings.filter((b) => {
    const bookingAssignments = (
      AppStore.getTable("job_assignments") || []
    ).filter((a) => a.booking_id === b.booking_id);
    return bookingAssignments.some((a) =>
      myProviderIds.has(a.service_provider_id),
    );
  });
  const myBookingIds = new Set(myBookings.map((b) => b.booking_id));
  const totalRevenue = allTransactions
    .filter(
      (t) => myBookingIds.has(t.booking_id) && t.payment_status === "SUCCESS",
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const topProviders = myProviders.filter((p) => p.rating && p.rating >= 4.7);
  topProviders.forEach((p) => {
    allNotifications.push({
      id: genId(),
      category: "provider",
      read: false,
      color: "green",
      title: "Top Provider Recognition",
      desc: `${p.name} achieved an outstanding rating of ${p.rating} ★. Consider reviewing their recent work.`,
      time: getTimeAgo(p.updated_at || p.created_at),
      icon: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      actions: [],
    });
  });

  // 3. Deactivation Requests
  const deactivatingProviders = myProviders.filter(
    (p) => p.deactivation_requested,
  );
  deactivatingProviders.forEach((p) => {
    allNotifications.push({
      id: genId(),
      category: "provider",
      read: false,
      color: "red",
      title: "Deactivation Request",
      desc: `Service Provider ${p.name} (${p.service_provider_id}) has requested account deactivation. Current status: ${p.account_status.replace("_", " ")}.`,
      time: getTimeAgo(p.updated_at),
      icon: `<svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`,
      actions: [
        {
          label: "View Profile",
          cls: "primary",
          href: `provider_profile.html?id=${p.service_provider_id}`,
        },
      ],
    });
  });

  const inactiveUnits = myUnits.filter((u) => !u.is_active);
  inactiveUnits.forEach((u) => {
    allNotifications.push({
      id: genId(),
      category: "unit",
      read: false,
      color: "amber",
      title: "Inactive Unit Detected",
      desc: `${u.unit_name} is currently inactive and may need review.`,
      time: getTimeAgo(u.created_at),
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      actions: [
        { label: "Open Unit", cls: "primary", href: "manage_units.html" },
      ],
    });
  });

  if (totalRevenue > 0) {
    const successfulTxns = allTransactions.filter(
      (t) => myBookingIds.has(t.booking_id) && t.payment_status === "SUCCESS",
    );
    const latestTxn = successfulTxns.sort(
      (a, b) =>
        new Date(b.verified_at || b.transaction_at) -
        new Date(a.verified_at || a.transaction_at),
    )[0];
    allNotifications.push({
      id: genId(),
      category: "revenue",
      read: false,
      color: "teal",
      title: "Revenue Update",
      desc: `Your collective has generated ₹${totalRevenue.toLocaleString("en-IN")} in successful bookings.`,
      time: getTimeAgo(
        latestTxn && (latestTxn.verified_at || latestTxn.transaction_at),
      ),
      icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      actions: [
        { label: "View Report", cls: "primary", href: "revenue_reports.html" },
      ],
    });
  }

  // Apply state (dismissed/read) to dynamically generated notifications
  // (We identify them by title/desc to persist their states uniquely, as IDs are randomly generated sequentially on reload)
  let notifications = allNotifications.filter(
    (n) => !notifState.dismissed.includes(n.title + n.desc),
  );
  notifications.forEach((n) => {
    if (notifState.read.includes(n.title + n.desc)) n.read = true;
  });

  const PAGE_SIZE = 5;
  const TOAST_DURATION_MS = 2200;
  let visibleCount = PAGE_SIZE;

  // --- TABS & RENDERING LOGIC ---
  const tabs = [
    { key: "all", label: "All" },
    { key: "alert", label: "Alerts" },
    { key: "unit", label: "Unit Updates" },
    { key: "provider", label: "Providers" },
    { key: "revenue", label: "Revenue" },
    { key: "system", label: "System" },
  ];

  let activeTab = "all";

  function resetPagination() {
    visibleCount = PAGE_SIZE;
  }

  function getFiltered() {
    const q = (
      document.getElementById("search-input")?.value || ""
    ).toLowerCase();
    return notifications.filter((n) => {
      const matchTab = activeTab === "all" || n.category === activeTab;
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.desc.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }

  function renderTabs() {
    const el = document.getElementById("notif-tabs");
    el.innerHTML = tabs
      .map((t) => {
        const count = notifications.filter(
          (n) => (t.key === "all" || n.category === t.key) && !n.read,
        ).length;
        return `<button class="tab ${activeTab === t.key ? "active" : ""}" data-key="${t.key}">
        ${t.label}
        ${count > 0 ? `<span class="tab-count">${count}</span>` : ""}
      </button>`;
      })
      .join("");

    el.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        activeTab = e.currentTarget.getAttribute("data-key");
        resetPagination();
        renderTabs();
        renderNotifications();
      });
    });
  }

  function updateBadge() {
    const badge = document.getElementById("notif-badge");
    const count = notifications.filter((n) => !n.read).length;
    if (badge) badge.textContent = count > 0 ? count : "";
    if (badge) badge.style.display = count > 0 ? "flex" : "none";
  }

  function renderNotifications() {
    const list = document.getElementById("notif-list");
    const filtered = getFiltered();
    const visible = filtered.slice(0, visibleCount);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p>No notifications</p><span>You're all caught up!</span>
      </div>`;
      updateLoadMoreButton(0, 0);
      updateBadge();
      return;
    }

    list.innerHTML = visible
      .map(
        (n, i) => `
      <div class="notif-item ${n.read ? "" : "unread"}" id="notif-${n.id}" style="animation-delay:${i * 0.05}s">
        <div class="notif-icon ${n.color}">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-top">
            <span class="notif-title">${n.title}</span>
            ${!n.read ? '<span class="unread-dot"></span>' : ""}
          </div>
          <div class="notif-desc">${n.desc}</div>
          <div class="notif-meta">${n.time} &bull; ${n.category.toUpperCase()}</div>
          ${n.actions && n.actions.length ? `<div class="notif-actions">${n.actions.map((a) => `<button class="nbtn ${a.cls}" data-action-id="${n.id}" data-action-label="${a.label}" data-action-href="${a.href || ""}">${a.label}</button>`).join("")}</div>` : ""}
        </div>
        <button class="notif-dismiss" data-dismiss-id="${n.id}" title="Dismiss">×</button>
      </div>
    `,
      )
      .join("");

    // Attach Action interactions
    list.querySelectorAll(".nbtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.getAttribute("data-action-id"));
        const label = e.currentTarget.getAttribute("data-action-label") || "";
        const href = e.currentTarget.getAttribute("data-action-href");
        handleAction(id, label, href);
        if (href) window.location.href = href;
      });
    });

    list.querySelectorAll(".notif-dismiss").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.getAttribute("data-dismiss-id"));
        dismiss(id);
      });
    });

    updateLoadMoreButton(visible.length, filtered.length);
    updateBadge();
  }

  function updateLoadMoreButton(visible, total) {
    const btn = document.querySelector(".load-more-btn");
    if (!btn) return;
    const remaining = Math.max(0, total - visible);
    if (remaining <= 0) {
      btn.textContent = "No more notifications";
      btn.disabled = true;
      return;
    }
    btn.textContent = `Load previous notifications (${remaining})`;
    btn.disabled = false;
  }

  function showToast(message, type = "info") {
    const existing = document.getElementById("cm-notif-toast");
    if (existing) existing.remove();

    const colors = {
      success: "#16a34a",
      info: "#2563eb",
      warning: "#d97706",
      error: "#dc2626",
    };

    const toast = document.createElement("div");
    toast.id = "cm-notif-toast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;right:20px;bottom:20px;z-index:1300;padding:10px 14px;border-radius:10px;" +
      "color:#fff;font-size:.85rem;font-weight:600;box-shadow:0 12px 28px rgba(0,0,0,.35);" +
      "font-family:Inter,sans-serif;opacity:0;transform:translateY(8px);transition:all .2s ease;";
    toast.style.background = colors[type] || colors.info;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 220);
    }, TOAST_DURATION_MS);
  }

  function handleAction(id, label, href) {
    const n = notifications.find((x) => x.id === id);
    if (n) {
      n.read = true;
      const key = n.title + n.desc;
      if (!notifState.read.includes(key)) {
        notifState.read.push(key);
        saveNotifState();
      }
    }
    if (!href) {
      showToast(`${label || "Notification"} marked as read`, "info");
    }
    renderTabs();
    renderNotifications();
  }

  function dismiss(id) {
    const n = notifications.find((x) => x.id === id);
    if (n) {
      const key = n.title + n.desc;
      if (!notifState.dismissed.includes(key)) {
        notifState.dismissed.push(key);
        saveNotifState();
      }
    }
    notifications = notifications.filter((x) => x.id !== id);
    showToast("Notification dismissed", "success");
    renderTabs();
    renderNotifications();
  }

  // Bind to window for HTML inline onclick attributes in the static parts of HTML
  window.markAllRead = function () {
    notifications.forEach((n) => {
      n.read = true;
      const key = n.title + n.desc;
      if (!notifState.read.includes(key)) {
        notifState.read.push(key);
      }
    });
    saveNotifState();
    showToast("All notifications marked as read", "success");
    renderTabs();
    renderNotifications();
  };

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      resetPagination();
      renderNotifications();
    });
  }

  window.filterNotifications = function () {
    resetPagination();
    renderNotifications();
  };

  window.loadMore = function () {
    const total = getFiltered().length;
    visibleCount = Math.min(total, visibleCount + PAGE_SIZE);
    renderNotifications();
  };

  // Initial renders
  renderTabs();
  renderNotifications();
});
