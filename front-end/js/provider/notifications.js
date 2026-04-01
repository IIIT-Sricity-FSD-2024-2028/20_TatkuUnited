const tabs = ["All", "Jobs", "Payments", "Account"];
let activeTab = "All";
let notifications = [];

const iconMap = {
  job: `<div class="notif-icon job"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>`,
  payment: `<div class="notif-icon payment"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>`,
  account: `<div class="notif-icon account"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>`,
  completed: `<div class="notif-icon completed"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>`,
};

const PAGE_SIZE = 3;
let visibleCount = PAGE_SIZE;

function renderTabs() {
  document.getElementById("notif-tabs").innerHTML = tabs
    .map(
      (t) => `
    <button class="notif-tab ${t === activeTab ? "active" : ""}" onclick="setTab('${t}')">${t}</button>
  `,
    )
    .join("");
}

function setTab(t) {
  activeTab = t;
  visibleCount = PAGE_SIZE;
  renderTabs();
  renderNotifs();
}

function renderNotifs() {
  const filtered =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);
  const visible = filtered.slice(0, visibleCount);

  if (filtered.length === 0) {
    document.getElementById("notif-list").innerHTML = `
      <div style="text-align:center; padding: 40px; color: #94a3b8; font-size: 14px;">
        <p>No notifications found in this category.</p>
      </div>
    `;
    updateLoadMoreButton(0, 0);
    return;
  }

  document.getElementById("notif-list").innerHTML = visible
    .map(
      (n, i) => `
    <div class="notif-item ${n.unread ? "unread" : ""} type-${n.type}" style="animation-delay:${i * 0.07}s" id="notif-${n.id}">
      ${iconMap[n.type]}
      <div class="notif-body">
        <div class="notif-row">
          <span class="notif-title-text">${n.title}</span>
          <span class="notif-time">${n.time} ${n.unread ? '<span class="unread-dot"></span>' : ""}</span>
        </div>
        <p class="notif-desc">${n.desc}</p>
        <div class="notif-actions">
          ${
            n.actions && n.actions.length > 0
              ? n.actions
                  .map(
                    (a) => `
            <button class="notif-action-btn ${a.cls}" onclick="${a.action === "dismiss" ? `dismissNotif(${n.id})` : `window.location='${a.href}'`}">${a.label}</button>
          `,
                  )
                  .join("")
              : ""
          }
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  updateLoadMoreButton(visible.length, filtered.length);
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

function dismissNotif(id) {
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx > -1) {
    notifications.splice(idx, 1);
    saveNotifications();
    renderNotifs();
  }
}

function markAllRead() {
  notifications.forEach((n) => (n.unread = false));
  saveNotifications();
  renderNotifs();
}

function saveNotifications() {
  if (window.getData && window.setData) {
    const data = window.getData();
    if (data) {
      data.notifications = notifications;
      window.setData(data);
    }
  }
}

function loadMore() {
  const filtered =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);
  visibleCount = Math.min(filtered.length, visibleCount + PAGE_SIZE);
  renderNotifs();
}

function init() {
  if (window.initData) {
    window.initData().then(() => {
      const data = window.getData();
      if (!data) return;

      if (data.provider) {
        document
          .querySelectorAll(".user-chip span")
          .forEach((el) => (el.textContent = data.provider.name || "Provider"));
        if (data.provider.pfp_url) {
          document.querySelectorAll(".user-avatar").forEach((el) => {
            el.innerHTML = `<img src="${data.provider.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          });
        }
      }

      notifications = data.notifications || [];
      visibleCount = PAGE_SIZE;
      renderTabs();
      renderNotifs();
    });
  } else {
    renderTabs();
    renderNotifs();
  }
}

init();
