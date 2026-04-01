/* user_management.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allCustomers = AppStore.getTable("customers") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allCollectiveManagers = AppStore.getTable("collective_managers") || [];
  const allUnitManagers = AppStore.getTable("unit_managers") || [];
  const allSuperUsers = AppStore.getTable("super_users") || [];

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function isoDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function mapUser(raw, role, idKey, nameKey) {
    const joinedRaw = raw.created_at || "";
    const isActive = Boolean(raw.is_active);
    return {
      id: raw[idKey] || "-",
      name: raw[nameKey] || "-",
      initials: getInitials(raw[nameKey] || "User"),
      email: raw.email || "-",
      phone: raw.phone || "-",
      role,
      status: isActive ? "active" : "suspended",
      statusLabel: isActive ? "Active" : "Suspended",
      joinedRaw,
      joinedDate: isoDate(joinedRaw),
      joined: formatDate(joinedRaw),
      action: isActive ? "Suspend" : "Reactivate",
      actionClass: isActive ? "red" : "green",
      flagHint: String(raw.notes || ""),
    };
  }

  /* ── 3. Transform users from all user tables ── */
  function transformUsers() {
    const users = [
      ...allCustomers.map((c) => mapUser(c, "Customer", "customer_id", "full_name")),
      ...allProviders.map((p) => mapUser(p, "Provider", "service_provider_id", "name")),
      ...allCollectiveManagers.map((m) =>
        mapUser(m, "Collective Manager", "cm_id", "name"),
      ),
      ...allUnitManagers.map((m) => mapUser(m, "Unit Manager", "um_id", "name")),
      ...allSuperUsers.map((u) => mapUser(u, "Super User", "super_user_id", "name")),
    ];

    return users.sort((a, b) => {
      if (!a.joinedRaw && !b.joinedRaw) return 0;
      if (!a.joinedRaw) return 1;
      if (!b.joinedRaw) return -1;
      return new Date(b.joinedRaw) - new Date(a.joinedRaw);
    });
  }

  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  let USERS = transformUsers();
  const PAGE_SIZE = 10;
  let currentPage = 1;
  let roleFilter = "All Roles";
  let statusFilter = "All Statuses";
  let dateFilter = "";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function colorByRole(role) {
    const map = {
      Customer: { bg: "#eff6ff", color: "#2563eb" },
      Provider: { bg: "#ecfeff", color: "#0e7490" },
      "Collective Manager": { bg: "#fef3c7", color: "#92400e" },
      "Unit Manager": { bg: "#f5f3ff", color: "#6d28d9" },
      "Super User": { bg: "#f0fdf4", color: "#15803d" },
    };
    return map[role] || { bg: "#f3f4f6", color: "#374151" };
  }

  function mapStatus(s) {
    if (s === "active") return "status-badge--active";
    if (s === "suspended") return "status-badge--suspended";
    return "status-badge--pending";
  }

  /* ── 4. Initialize Topbar ── */
  function initTopbar() {
    const sessionUser = Auth.getCurrentUser();
    if (sessionUser) {
      const nameEl = document.querySelector(".topbar-user .user-name");
      if (nameEl) nameEl.textContent = sessionUser.name;
    }

    const notifBadge = document.querySelector(".notif-badge");
    if (notifBadge) {
      const allNotifs = AppStore.getTable("super_user_notifications") || [];
      const unread = allNotifs.filter(n => !n.is_read).length;
      if (unread > 0) {
        notifBadge.textContent = unread;
        notifBadge.style.display = "flex";
      } else {
        notifBadge.style.display = "none";
      }
    }
  }

  function getFiltered() {
    return USERS.filter((u) => {
      const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" && u.status === "active") ||
        (statusFilter === "Suspended" && u.status === "suspended");
      const matchDate = !dateFilter || u.joinedDate === dateFilter;
      return matchRole && matchStatus && matchDate;
    });
  }

  function renderPagination(totalRows) {
    const pageHolder = document.getElementById("page-numbers");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    if (!pageHolder) return;

    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    pageHolder.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map(
        (pageNum) =>
          `<button class="page-btn ${pageNum === currentPage ? "active" : ""}" data-page="${pageNum}">${pageNum}</button>`,
      )
      .join("");

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    pageHolder.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        renderTable();
      });
    });
  }

  function renderKpis() {
    const total = USERS.length;
    const active = USERS.filter((u) => u.status === "active").length;
    const suspended = USERS.filter((u) => u.status === "suspended").length;

    const ratio = (count) => (total ? `${((count / total) * 100).toFixed(1)}%` : "0.0%");

    const totalEl = document.getElementById("kpi-total");
    const totalBadge = document.getElementById("kpi-total-badge");
    const activeEl = document.getElementById("kpi-active");
    const activeBadge = document.getElementById("kpi-active-badge");
    const suspendedEl = document.getElementById("kpi-suspended");
    const suspendedBadge = document.getElementById("kpi-suspended-badge");

    if (totalEl) totalEl.textContent = total.toLocaleString("en-IN");
    if (totalBadge) totalBadge.textContent = `${total.toLocaleString("en-IN")} users`;
    if (activeEl) activeEl.textContent = active.toLocaleString("en-IN");
    if (activeBadge) activeBadge.textContent = ratio(active);
    if (suspendedEl) suspendedEl.textContent = suspended.toLocaleString("en-IN");
    if (suspendedBadge) suspendedBadge.textContent = ratio(suspended);
  }

  function populateRoleFilter() {
    const roleFilterEl = document.getElementById("role-filter");
    if (!roleFilterEl) return;

    const roles = Array.from(new Set(USERS.map((u) => u.role))).sort();
    roleFilterEl.innerHTML = ["All Roles", ...roles]
      .map((role) => `<option>${escapeHtml(role)}</option>`)
      .join("");
  }

  function renderTable() {
    const filtered = getFiltered();
    renderPagination(filtered.length);

    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    tbody.innerHTML = rows
      .map((u) => {
        const color = colorByRole(u.role);
        return `
      <tr>
        <td class="user-id">${escapeHtml(u.id)}</td>
        <td>
          <div class="user-cell">
            <div class="user-initials" style="background:${color.bg};color:${color.color}">${escapeHtml(u.initials)}</div>
            <span class="user-fullname">${escapeHtml(u.name)}</span>
          </div>
        </td>
        <td>
          <div class="user-contact">
            <span class="user-email">${escapeHtml(u.email)}</span>
            <span class="user-phone">${escapeHtml(u.phone)}</span>
          </div>
        </td>
        <td>${escapeHtml(u.role)}</td>
        <td><span class="status-badge ${mapStatus(u.status)}">${escapeHtml(u.statusLabel)}</span></td>
        <td>${escapeHtml(u.joined)}</td>
        <td><button class="action-link action-link--${u.actionClass}" data-id="${escapeHtml(u.id)}" data-role="${escapeHtml(u.role)}">${escapeHtml(u.action)}</button></td>
      </tr>
    `;
      })
      .join("");

    const info = document.getElementById("table-info");
    if (info) {
      if (!filtered.length) {
        info.innerHTML = "Showing <strong>0-0</strong> of <strong>0</strong>";
      } else {
        const end = Math.min(start + PAGE_SIZE, filtered.length);
        info.innerHTML = `Showing <strong>${start + 1}-${end}</strong> of <strong>${filtered.length.toLocaleString("en-IN")}</strong>`;
      }
    }
  }

  function setupEventListeners() {
    const roleFilterEl = document.getElementById("role-filter");
    const statusFilterEl = document.getElementById("status-filter");
    const dateFilterEl = document.getElementById("date-filter");
    const resetBtn = document.getElementById("reset-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (roleFilterEl) {
      roleFilterEl.addEventListener("change", (e) => {
        roleFilter = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    if (statusFilterEl) {
      statusFilterEl.addEventListener("change", (e) => {
        statusFilter = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    if (dateFilterEl) {
      dateFilterEl.addEventListener("change", (e) => {
        dateFilter = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (roleFilterEl) roleFilterEl.value = "All Roles";
        if (statusFilterEl) statusFilterEl.value = "All Statuses";
        if (dateFilterEl) dateFilterEl.value = "";
        roleFilter = "All Roles";
        statusFilter = "All Statuses";
        dateFilter = "";
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

    // Suspend / Reactivate action logic
    const tbody = document.getElementById("users-tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest(".action-link");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const role = btn.getAttribute("data-role");
        if (!id || !role) return;

        let targetArray = null;
        let idField = "";

        if (role === "Customer") { targetArray = allCustomers; idField = "customer_id"; }
        else if (role === "Provider") { targetArray = allProviders; idField = "service_provider_id"; }
        else if (role === "Collective Manager") { targetArray = allCollectiveManagers; idField = "cm_id"; }
        else if (role === "Unit Manager") { targetArray = allUnitManagers; idField = "um_id"; }
        else if (role === "Super User") { targetArray = allSuperUsers; idField = "super_user_id"; }

        if (targetArray) {
          const userObj = targetArray.find(u => u[idField] === id);
          if (userObj) {
            // Confirm action
            const actionVerb = userObj.is_active ? "suspend" : "reactivate";
            if (!confirm(`Are you sure you want to ${actionVerb} this user?`)) return;

            // Toggle active status
            userObj.is_active = !userObj.is_active;
            userObj.updated_at = new Date().toISOString();

            // Save and refresh
            AppStore.save();
            USERS = transformUsers();
            
            renderKpis();
            renderTable();
          }
        }
      });
    }

    // Modal Handling
    const openBtn = document.getElementById("open-add-user-btn");
    const modal = document.getElementById("add-user-modal");
    const cancelBtn = document.getElementById("cancel-add-user");
    const form = document.getElementById("add-user-form");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        modal.style.display = "flex";
      });
    }

    if (cancelBtn && modal) {
      cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
        if (form) form.reset();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const role = document.getElementById("new-user-role").value;
        const name = document.getElementById("new-user-name").value.trim();
        const email = document.getElementById("new-user-email").value.trim();
        const phone = document.getElementById("new-user-phone").value.trim();

        if (!role || !name || !email || !phone) {
          alert("Please fill all required fields.");
          return;
        }

        const nowIso = new Date().toISOString();
        let targetArray = null;
        let idVal = "";
        let newRecord = {
          name,
          email,
          phone,
          password: "Password@123",
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
          pfp_url: "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70)
        };

        if (role === "Unit Manager") {
          targetArray = allUnitManagers;
          idVal = AppStore.nextId("UM");
          newRecord.um_id = idVal;
          newRecord.unit_id = null; // Unassigned initially
        } else if (role === "Collective Manager") {
          targetArray = allCollectiveManagers;
          idVal = AppStore.nextId("CM");
          newRecord.cm_id = idVal;
          newRecord.collective_id = null; // Unassigned initially
        } else if (role === "Super User") {
          targetArray = allSuperUsers;
          idVal = AppStore.nextId("SU");
          newRecord.super_user_id = idVal;
        }

        if (targetArray) {
          targetArray.push(newRecord);
          // Save to AppStore
          AppStore.save();
          // Recompute USERS
          USERS = transformUsers();
          // Reset view to page 1 to show the newly added user (or sort might put them at top)
          currentPage = 1;
          
          populateRoleFilter();
          renderKpis();
          renderTable();

          modal.style.display = "none";
          form.reset();
          alert(`New ${role} added successfully! Temporary password is Password@123`);
        }
      });
    }
  }

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initTopbar();
      renderKpis();
      populateRoleFilter();
      renderTable();
      setupEventListeners();
    });
  } else {
    initTopbar();
    renderKpis();
    populateRoleFilter();
    renderTable();
    setupEventListeners();
  }
});
