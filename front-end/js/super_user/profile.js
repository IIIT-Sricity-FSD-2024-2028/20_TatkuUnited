/* profile.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allAuditLogs = AppStore.getTable("admin_audit_logs") || [];
  const allBookings = AppStore.getTable("bookings") || [];
  const allTransactions = AppStore.getTable("transactions") || [];
  const allSuperUsers = AppStore.getTable("super_users") || [];

  /* ── 3. Compute system stats ── */
  function computeSysStats() {
    const successfulTransactions = allTransactions.filter(
      (t) => t.payment_status === "SUCCESS",
    ).length;
    const totalRevenue = allTransactions
      .filter((t) => t.payment_status === "SUCCESS")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const uptime = 99.8;

    return [
      {
        label: "System Status",
        sub: "All services operational",
        value: "Online",
        valueColor: "green",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        iconColor: "green",
      },
      {
        label: "Active Sessions",
        sub: "Platform-wide right now",
        value: `${allSuperUsers.length + 5}`,
        valueColor: "blue",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>`,
        iconColor: "blue",
      },
      {
        label: "Open Complaints",
        sub: "Awaiting resolution",
        value: "4",
        valueColor: "orange",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        iconColor: "orange",
      },
      {
        label: "Platform Uptime",
        sub: "Last 30 days",
        value: `${uptime}%`,
        valueColor: "green",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        iconColor: "teal",
      },
    ];
  }

  const sysStats = computeSysStats();

  const permissions = [
    {
      name: "Full User Management",
      desc: "Create, suspend, delete any account",
      cls: "",
    },
    {
      name: "Platform Configuration",
      desc: "Modify all system settings",
      cls: "",
    },
    {
      name: "Financial Controls",
      desc: "Access revenue, payout & billing data",
      cls: "",
    },
    {
      name: "Security Administration",
      desc: "Manage roles, sessions & 2FA enforcement",
      cls: "",
    },
    {
      name: "Audit Log Access",
      desc: "View complete system event history",
      cls: "",
    },
    {
      name: "Emergency Overrides",
      desc: "Force-terminate jobs and escalate issues",
      cls: "yellow",
    },
  ];

  /* ── 4. Transform activities from audit logs ── */
  function transformActivities() {
    const actionTypeToColorAndTitle = {
      system: { color: "blue", title: "System action performed" },
      account_action: { color: "red", title: "User account modified" },
      settings_update: { color: "yellow", title: "Settings updated" },
      payment: { color: "green", title: "Payment processed" },
      notification: { color: "blue", title: "Notification sent" },
      default: { color: "gray", title: "Action completed" },
    };

    const timeAgo = (timestamp) => {
      const now = new Date();
      const then = new Date(timestamp);
      const diff = Math.floor((now - then) / 1000);

      if (diff < 60) return `${diff} seconds ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    };

    return allAuditLogs.slice(0, 5).map((log) => {
      const mapping =
        actionTypeToColorAndTitle[log.action_type] ||
        actionTypeToColorAndTitle["default"];
      return {
        title: mapping.title,
        desc: log.action_description,
        time: timeAgo(log.timestamp),
        color: mapping.color,
      };
    });
  }

  const activities = transformActivities();

  /* ── 5. Render functions ── */
  function renderSysStats() {
    const el = document.getElementById("sys-stats");
    if (!el) return;
    el.innerHTML = sysStats
      .map(
        (s) => `
      <div class="sys-stat">
        <div class="sys-stat-left">
          <div class="sys-stat-icon ${s.iconColor}">${s.icon}</div>
          <div>
            <div class="sys-stat-label">${s.label}</div>
            <div class="sys-stat-sub">${s.sub}</div>
          </div>
        </div>
        <div class="sys-stat-value ${s.valueColor}">${s.value}</div>
      </div>
    `,
      )
      .join("");
  }

  function renderPermissions() {
    const el = document.getElementById("perm-list");
    if (!el) return;
    el.innerHTML = permissions
      .map(
        (p) => `
      <div class="perm-item ${p.cls}">
        <div class="perm-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div class="perm-name">${p.name}</div>
          <div class="perm-desc">${p.desc}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  function renderActivities() {
    const el = document.getElementById("activity-list");
    if (!el) return;
    el.innerHTML = activities
      .map(
        (a) => `
      <div class="act-item">
        <div class="act-dot ${a.color}"></div>
        <div class="act-body">
          <div class="act-title">${a.title}</div>
          <div class="act-desc">${a.desc}</div>
          <div class="act-time">${a.time}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  function syncName() {
    const v = document.getElementById("full-name")?.value.trim();
    const heroName = document.getElementById("hero-name");
    const topbarName = document.getElementById("topbar-name");
    if (heroName) heroName.textContent = v || "Super User";
    if (topbarName) topbarName.textContent = v || "Super User";
  }

  function syncEmail() {
    const v = document.getElementById("email")?.value.trim();
    const heroEmail = document.getElementById("hero-email");
    if (heroEmail) heroEmail.textContent = v || "super_user@tatku.com";
  }

  function saveSection(section) {
    showToast("Super User profile saved successfully!");
  }

  function openPwdModal() {
    const pwdModal = document.getElementById("pwd-modal");
    if (pwdModal) pwdModal.classList.add("open");
  }

  function closePwdModal(e) {
    if (e.target === document.getElementById("pwd-modal")) closePwdModalBtn();
  }

  function closePwdModalBtn() {
    const pwdModal = document.getElementById("pwd-modal");
    if (pwdModal) pwdModal.classList.remove("open");
  }

  function updateAvatar(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const av = document.getElementById("profile-avatar");
      if (av)
        av.innerHTML = `<img src="${e.target.result}" alt="Super User" />`;
    };
    reader.readAsDataURL(input.files[0]);
  }

  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
    }
  }

  /* ── Event Listeners ── */
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");

  if (fullNameInput) fullNameInput.addEventListener("input", syncName);
  if (emailInput) emailInput.addEventListener("input", syncEmail);

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderSysStats();
      renderPermissions();
      renderActivities();
    });
  } else {
    renderSysStats();
    renderPermissions();
    renderActivities();
  }
});
