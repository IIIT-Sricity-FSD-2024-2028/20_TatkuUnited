/* user_management.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allCustomers = AppStore.getTable("customers") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allManagers = AppStore.getTable("collective_managers") || [];

  /* ── 3. Transform users (combine customers and providers) ── */
  function transformUsers() {
    const users = [];

    // Add customers
    allCustomers.slice(0, 3).forEach((c, i) => {
      const initials = getInitials(c.full_name);
      const colors = ["#2563eb", "#d97706", "#7c3aed"];
      const bgs = ["#eff6ff", "#fef9c3", "#f5f3ff"];
      users.push({
        id: `#TK-${9000 + i}`,
        name: c.full_name,
        initials: initials,
        color: colors[i % colors.length],
        bg: bgs[i % bgs.length],
        email: c.email,
        phone: c.phone,
        role: "Customer",
        status: c.is_active ? "active" : "suspended",
        statusLabel: c.is_active ? "Active" : "Suspended",
        joined: new Date(c.created_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        action: c.is_active ? "Suspend" : "Reactivate",
        actionClass: c.is_active ? "red" : "green",
      });
    });

    // Add providers
    allProviders.slice(0, 2).forEach((p, i) => {
      const initials = getInitials(p.name);
      const colors = ["#0891b2", "#16a34a"];
      const bgs = ["#e0f7fa", "#f0fdf4"];
      users.push({
        id: `#TK-${8800 + i}`,
        name: p.name,
        initials: initials,
        color: colors[i % colors.length],
        bg: bgs[i % bgs.length],
        email: p.email,
        phone: p.phone,
        role: "Provider",
        status: p.is_active ? "active" : i === 1 ? "pending" : "suspended",
        statusLabel: p.is_active
          ? "Active"
          : i === 1
            ? "Pending Verification"
            : "Suspended",
        joined: new Date(p.created_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        action: i === 1 ? "Verify" : p.is_active ? "Suspend" : "Reactivate",
        actionClass: i === 1 ? "blue" : p.is_active ? "red" : "green",
      });
    });

    return users;
  }

  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  let USERS = transformUsers();
  const PAGE_SIZE = 5;
  let currentPage = 1;
  let roleFilter = "All Roles";
  let statusFilter = "All Statuses";

  function mapStatus(s) {
    if (s === "active") return "status-badge--active";
    if (s === "suspended") return "status-badge--suspended";
    return "status-badge--pending";
  }

  function getFiltered() {
    return USERS.filter((u) => {
      const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "All Statuses" ||
        u.statusLabel === statusFilter ||
        (statusFilter === "Active" && u.status === "active") ||
        (statusFilter === "Suspended" && u.status === "suspended") ||
        (statusFilter === "Pending Verification" && u.status === "pending");
      return matchRole && matchStatus;
    });
  }

  function renderTable() {
    const filtered = getFiltered();
    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    tbody.innerHTML = rows
      .map(
        (u) => `
      <tr>
        <td class="user-id">${u.id}</td>
        <td>
          <div class="user-cell">
            <div class="user-initials" style="background:${u.bg};color:${u.color}">${u.initials}</div>
            <span class="user-fullname">${u.name}</span>
          </div>
        </td>
        <td>
          <div class="user-contact">
            <span class="user-email">${u.email}</span>
            <span class="user-phone">${u.phone}</span>
          </div>
        </td>
        <td>${u.role}</td>
        <td><span class="status-badge ${mapStatus(u.status)}">${u.statusLabel}</span></td>
        <td>${u.joined}</td>
        <td><button class="action-link action-link--${u.actionClass}">${u.action}</button></td>
      </tr>
    `,
      )
      .join("");

    const info = document.getElementById("table-info");
    if (info) {
      const end = Math.min(start + PAGE_SIZE, filtered.length);
      info.innerHTML = `Showing <strong>${start + 1}-${end}</strong> of <strong>${filtered.length.toLocaleString()}</strong>`;
    }

    document
      .querySelectorAll("[data-page]")
      .forEach((btn) =>
        btn.classList.toggle(
          "active",
          Number(btn.dataset.page) === currentPage,
        ),
      );
  }

  function setupEventListeners() {
    const roleFilter_el = document.getElementById("role-filter");
    const statusFilter_el = document.getElementById("status-filter");
    const resetBtn = document.getElementById("reset-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (roleFilter_el) {
      roleFilter_el.addEventListener("change", (e) => {
        roleFilter = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    if (statusFilter_el) {
      statusFilter_el.addEventListener("change", (e) => {
        statusFilter = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (roleFilter_el) roleFilter_el.value = "All Roles";
        if (statusFilter_el) statusFilter_el.value = "All Statuses";
        const dateFilter = document.getElementById("date-filter");
        if (dateFilter) dateFilter.value = "";
        roleFilter = "All Roles";
        statusFilter = "All Statuses";
        currentPage = 1;
        renderTable();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const max = Math.ceil(getFiltered().length / PAGE_SIZE);
        if (currentPage < max) {
          currentPage++;
          renderTable();
        }
      });
    }

    document.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        renderTable();
      });
    });
  }

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderTable();
      setupEventListeners();
    });
  } else {
    renderTable();
    setupEventListeners();
  }
});
