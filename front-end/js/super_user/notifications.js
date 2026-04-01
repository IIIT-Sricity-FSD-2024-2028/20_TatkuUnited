/* notifications.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allNotifications = AppStore.getTable("super_user_notifications") || [];

  /* ── 3. Transform notifications ── */
  function transformNotifications(notifList) {
    return notifList.map((n) => ({
      id: parseInt(n.notif_id.replace("NOTIF", "")),
      category: n.category,
      read: n.is_read,
      urgent: n.is_urgent,
      color: getCategoryColor(n.category),
      priority: n.priority,
      title: n.title,
      desc: n.description,
      time: getTimeAgo(n.timestamp),
      icon: getCategoryIcon(n.category),
      actions: getActionsForCategory(n.category),
    }));
  }

  function getCategoryColor(category) {
    const colors = {
      security: "red",
      system: "red",
      user: "yellow",
      revenue: "green",
      default: "blue",
    };
    return colors[category] || colors["default"];
  }

  function getCategoryIcon(category) {
    const icons = {
      security: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      system: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      revenue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
    };
    return icons[category] || icons["default"];
  }

  function getActionsForCategory(category) {
    const actions = {
      security: [
        { label: "Lock Account", cls: "danger" },
        { label: "Investigate", cls: "warning" },
        { label: "Dismiss", cls: "ghost" },
      ],
      system: [
        { label: "Troubleshoot", cls: "danger" },
        { label: "Reassign Manually", cls: "ghost" },
      ],
      user: [
        { label: "Open Queue", cls: "primary" },
        { label: "Delegate", cls: "ghost" },
      ],
      revenue: [{ label: "View Report", cls: "primary" }],
      default: [{ label: "View", cls: "primary" }],
    };
    return actions[category] || actions["default"];
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return `${Math.floor(diff / 604800)} weeks ago`;
  }

  let notifications = transformNotifications(allNotifications);

  const tabs = [
    { key: "all", label: "All" },
    { key: "security", label: "Security" },
    { key: "system", label: "System" },
    { key: "user", label: "Users" },
    { key: "revenue", label: "Revenue" },
  ];

  let activeTab = "all";

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
    if (!el) return;
    el.innerHTML = tabs
      .map((t) => {
        const count = notifications.filter(
          (n) => (t.key === "all" || n.category === t.key) && !n.read,
        ).length;
        const isUrgent =
          notifications.filter(
            (n) =>
              (t.key === "all" || n.category === t.key) && n.urgent && !n.read,
          ).length > 0;
        return `<button class="tab ${activeTab === t.key ? "active" : ""}" onclick="setTab('${t.key}')">
        ${t.label}
        ${count > 0 ? `<span class="tab-count ${isUrgent ? "urgent" : ""}">${count}</span>` : ""}
      </button>`;
      })
      .join("");
  }

  function setTab(key) {
    activeTab = key;
    renderTabs();
    renderNotifications();
  }

  // Make setTab globally accessible
  window.setTab = setTab;

  function renderNotifications() {
    const list = document.getElementById("notif-list");
    if (!list) return;
    const filtered = getFiltered();
    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>No notifications</p><span>You're all caught up!</span>
      </div>`;
      return;
    }
    list.innerHTML = filtered
      .map(
        (n, i) => `
      <div class="notif-item ${n.read ? "" : "unread"} ${n.urgent ? "urgent" : ""}" id="notif-${n.id}" style="animation-delay:${i * 0.04}s">
        <div class="notif-icon ${n.color}">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-top">
            <span class="notif-title">${n.title}</span>
            ${!n.read ? '<span class="unread-dot"></span>' : ""}
            <span class="priority-badge ${n.priority}">${n.priority.toUpperCase()}</span>
          </div>
          <div class="notif-desc">${n.desc}</div>
          <div class="notif-meta">${n.time} &bull; ${n.category}</div>
          ${n.actions.length ? `<div class="notif-actions">${n.actions.map((a) => `<button class="nbtn ${a.cls}" onclick="handleAction(${n.id},'${a.label}')">${a.label}</button>`).join("")}</div>` : ""}
        </div>
        <button class="notif-dismiss" onclick="dismiss(${n.id})" title="Dismiss">×</button>
      </div>
    `,
      )
      .join("");
    updateBadge();
  }

  function handleAction(id, label) {
    const n = notifications.find((x) => x.id === id);
    if (n) n.read = true;
    renderTabs();
    renderNotifications();
  }

  function dismiss(id) {
    notifications = notifications.filter((n) => n.id !== id);
    renderTabs();
    renderNotifications();
  }

  function markAllRead() {
    notifications.forEach((n) => (n.read = true));
    renderTabs();
    renderNotifications();
  }

  function filterNotifications() {
    renderNotifications();
  }

  function updateBadge() {
    const badge = document.getElementById("notif-badge");
    const count = notifications.filter((n) => !n.read).length;
    if (badge) {
      badge.textContent = count > 0 ? count : "";
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }

  function loadMore() {
    const btn = document.querySelector(".load-more-btn");
    if (btn) {
      btn.textContent = "No more notifications";
      btn.disabled = true;
    }
  }

  // Make functions globally accessible
  window.handleAction = handleAction;
  window.dismiss = dismiss;
  window.markAllRead = markAllRead;
  window.filterNotifications = filterNotifications;
  window.loadMore = loadMore;

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderTabs();
      renderNotifications();
    });
  } else {
    renderTabs();
    renderNotifications();
  }
});
