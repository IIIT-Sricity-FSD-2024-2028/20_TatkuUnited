/* =============================================================================
   TATKU UNITED — AUTH MODULE
   front-end/js/modules/auth.js
   Depends on: js/data/store.js (AppStore must be loaded first)
   ============================================================================= */

window.Auth = (() => {
  const PLATFORM_SETTINGS_KEY = "fsd_platform_settings";

  /* ─── Role → Dashboard URL map ─── */
  const ROLE_DASHBOARDS = {
    super_user: "/front-end/html/super_user/super_user_dashboard.html",
    collective_manager: "/front-end/html/collective_manager/dashboard.html",
    unit_manager: "/front-end/html/unit_manager/dashboard.html",
    provider: "/front-end/html/provider/dashboard.html",
    customer: "/front-end/html/customer/home.html",
  };

  function _getPlatformSettings() {
    try {
      if (
        window.AppStore &&
        typeof AppStore.getPlatformSettings === "function"
      ) {
        return AppStore.getPlatformSettings();
      }

      const raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function _isProviderSuspended(role) {
    if (role !== "provider") return false;
    const settings = _getPlatformSettings();
    return !!(settings && settings.accountSuspension);
  }

  function _isMaintenanceModeEnabled() {
    const settings = _getPlatformSettings();
    return !!(settings && settings.maintenanceMode);
  }

  function _isRoleBlockedByMaintenance(role) {
    if (!role) return false;
    if (!_isMaintenanceModeEnabled()) return false;
    return role !== "super_user";
  }
  /* =========================================================================
     BUILD AUTH REGISTRY
     Called once inside AppStore.ready.then() — populates window.AuthRegistry
     ========================================================================= */
  function _buildRegistry() {
    const registry = [];

    /* 1. collective_managers */
    const collectiveManagers = AppStore.getTable("collective_managers") || [];
    collectiveManagers.forEach((cm) => {
      registry.push({
        id: cm.cm_id,
        name: cm.name,
        email: cm.email,
        password: cm.password,
        role: "collective_manager",
        scopeId: cm.collective_id,
        unitId: null,
        collectiveId: cm.collective_id,
        is_active: cm.is_active,
        pfp_url: cm.pfp_url || null,
      });
    });

    /* 2. unit_managers */
    const unitManagers = AppStore.getTable("unit_managers") || [];
    unitManagers.forEach((um) => {
      registry.push({
        id: um.um_id,
        name: um.name,
        email: um.email,
        password: um.password,
        role: "unit_manager",
        scopeId: um.unit_id,
        unitId: um.unit_id,
        collectiveId: null,
        is_active: um.is_active,
        pfp_url: um.pfp_url || null,
      });
    });

    /* 3. service_providers */
    const providers = AppStore.getTable("service_providers") || [];
    providers.forEach((sp) => {
      registry.push({
        id: sp.service_provider_id,
        name: sp.name,
        email: sp.email,
        password: sp.password,
        role: "provider",
        scopeId: sp.unit_id,
        unitId: sp.unit_id,
        collectiveId: null,
        is_active: sp.is_active,
        pfp_url: sp.pfp_url || null,
      });
    });

    /* 4. customers */
    const customers = AppStore.getTable("customers") || [];
    customers.forEach((c) => {
      registry.push({
        id: c.customer_id,
        name: c.full_name || c.name,
        email: c.email,
        password: c.password,
        role: "customer",
        scopeId: c.customer_id,
        unitId: null,
        collectiveId: null,
        is_active: c.is_active,
        pfp_url: c.pfp_url || null,
      });
    });

    /* 5. super_users (from mockData) */
    const superUsers = AppStore.getTable("super_users") || [];
    superUsers.forEach((su) => {
      registry.push({
        id: su.super_user_id,
        name: su.name,
        email: su.email,
        password: su.password || "SuperUser@123",
        role: "super_user",
        scopeId: null,
        unitId: null,
        collectiveId: null,
        is_active: su.is_active,
        phone: su.phone || null,
        pfp_url: su.pfp_url || null,
      });
    });

    window.AuthRegistry = registry;
  }

  /* =========================================================================
     Auth.login(email, password)
     ========================================================================= */
  function login(email, password) {
    const normEmail = (email || "").trim().toLowerCase();
    const entry = (window.AuthRegistry || []).find(
      (u) => (u.email || "").trim().toLowerCase() === normEmail,
    );

    if (!entry) {
      return { success: false, error: "invalid_credentials" };
    }
    if (!entry.is_active) {
      return { success: false, error: "account_inactive" };
    }
    if (_isRoleBlockedByMaintenance(entry.role)) {
      return { success: false, error: "maintenance_mode_active" };
    }
    if (_isProviderSuspended(entry.role)) {
      return { success: false, error: "provider_suspended_by_platform" };
    }
    if (entry.password !== password) {
      return { success: false, error: "invalid_credentials" };
    }

    /* Build session */
    const session = {
      id: entry.id,
      name: entry.name,
      email: entry.email,
      role: entry.role,
      scopeId: entry.scopeId,
      unitId: entry.unitId,
      collectiveId: entry.collectiveId,
      pfp_url: entry.pfp_url,
      loginAt: Date.now(),
    };

    sessionStorage.setItem("fsd_session", JSON.stringify(session));

    return { success: true, session };
  }

  /* =========================================================================
     Auth.logout()
     ========================================================================= */
  function logout() {
    sessionStorage.removeItem("fsd_session");
    window.location.replace("/front-end/html/auth_pages/logout.html");
  }

  /* =========================================================================
     Auth.requireSession(allowedRoles)
     ========================================================================= */
  function requireSession(allowedRoles) {
    /* 1. Parse session from sessionStorage */
    let session = null;
    try {
      const raw = sessionStorage.getItem("fsd_session");
      if (!raw) throw new Error("no session");
      session = JSON.parse(raw);
      if (!session || !session.role) throw new Error("invalid session");
    } catch (_) {
      window.location.replace("/front-end/html/auth_pages/login.html");
      return null;
    }

    /* 3. Role authorisation */
    if (!allowedRoles.includes(session.role)) {
      const dest =
        ROLE_DASHBOARDS[session.role] ||
        "/front-end/html/auth_pages/login.html";
      window.location.replace(dest);
      return null;
    }

    if (_isRoleBlockedByMaintenance(session.role)) {
      sessionStorage.removeItem("fsd_session");
      localStorage.removeItem("fsd_session");
      window.location.replace(
        "/front-end/html/landing_page.html?maintenance=1",
      );
      return null;
    }

    if (_isProviderSuspended(session.role)) {
      sessionStorage.removeItem("fsd_session");
      localStorage.removeItem("fsd_session");
      window.location.replace(
        "/front-end/html/auth_pages/login.html?error=provider_suspended",
      );
      return null;
    }

    /* 4. Block back-button re-entry after logout */
    history.replaceState(null, "", location.href);

    return session;
  }

  /* =========================================================================
     Auth.getSession()
     ========================================================================= */
  function getSession() {
    try {
      const raw = sessionStorage.getItem("fsd_session");
      if (!raw) return null;
      return JSON.parse(raw) || null;
    } catch (_) {
      return null;
    }
  }

  /* =========================================================================
     Auth.isLoggedIn()
     ========================================================================= */
  function isLoggedIn() {
    return !!getSession();
  }

  /* =========================================================================
     Auth.hasRole(role)
     ========================================================================= */
  function hasRole(role) {
    const session = getSession();
    return session ? session.role === role : false;
  }

  /* =========================================================================
     Auth.getRedirectUrl()
     ========================================================================= */
  function getRedirectUrl() {
    const session = getSession();
    if (!session) return "/front-end/html/auth_pages/login.html";
    return (
      ROLE_DASHBOARDS[session.role] || "/front-end/html/auth_pages/login.html"
    );
  }

  /* =========================================================================
     Auth.getCurrentUser()
     Returns full AuthRegistry entry; for providers, attaches .documents
     ========================================================================= */
  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;

    const entry = (window.AuthRegistry || []).find(
      (u) => u.id === session.id && u.role === session.role,
    );
    if (!entry) return null;

    if (session.role === "provider") {
      const allDocs = AppStore.getTable("provider_documents") || [];
      entry.documents = allDocs.filter(
        (d) => d.service_provider_id === session.id,
      );
    }

    return entry;
  }

  /* =========================================================================
     Auth.changePassword(currentPassword, newPassword)
     ========================================================================= */
  function changePassword(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: "not_logged_in" };

    if (user.password !== currentPassword) {
      return { success: false, error: "invalid_current_password" };
    }

    const tableMap = {
      super_user: "super_users",
      collective_manager: "collective_managers",
      unit_manager: "unit_managers",
      provider: "service_providers",
      customer: "customers",
    };

    const idKeyMap = {
      super_user: "super_user_id",
      collective_manager: "cm_id",
      unit_manager: "um_id",
      provider: "service_provider_id",
      customer: "customer_id",
    };

    const tableName = tableMap[user.role];
    const idKey = idKeyMap[user.role];
    const table = AppStore.getTable(tableName);

    if (!table) return { success: false, error: "table_not_found" };

    const row = table.find((r) => r[idKey] === user.id);
    if (!row) return { success: false, error: "user_not_found_in_store" };

    /* Update password */
    row.password = newPassword;

    /* Persist to localStorage */
    AppStore.save();

    /* Rebuild registry for future operations */
    _buildRegistry();

    return { success: true };
  }

  /* =========================================================================
     Auth.updateProfilePicture(imageDataUrl)
     ========================================================================= */
  function updateProfilePicture(imageDataUrl) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: "not_logged_in" };

    const cleanValue = (imageDataUrl || "").trim();
    if (!cleanValue) return { success: false, error: "invalid_image" };

    const tableMap = {
      super_user: "super_users",
      collective_manager: "collective_managers",
      unit_manager: "unit_managers",
      provider: "service_providers",
      customer: "customers",
    };

    const idKeyMap = {
      super_user: "super_user_id",
      collective_manager: "cm_id",
      unit_manager: "um_id",
      provider: "service_provider_id",
      customer: "customer_id",
    };

    const tableName = tableMap[user.role];
    const idKey = idKeyMap[user.role];
    const table = AppStore.getTable(tableName);

    if (!table) return { success: false, error: "table_not_found" };

    const row = table.find((r) => r[idKey] === user.id);
    if (!row) return { success: false, error: "user_not_found_in_store" };

    row.pfp_url = cleanValue;
    row.updated_at = new Date().toISOString();

    AppStore.save();

    const activeSession = getSession();
    if (activeSession) {
      activeSession.pfp_url = cleanValue;
      sessionStorage.setItem("fsd_session", JSON.stringify(activeSession));
    }

    _buildRegistry();

    return { success: true, pfp_url: cleanValue };
  }

  /* ─── Initialise registry once AppStore is ready ─── */
  AppStore.ready.then(() => {
    _buildRegistry();
  });

  /* ─── Bfcache Back-Button Reload ─── */
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && !getSession()) {
      window.location.reload();
    }
  });

  /* ─── Public API ─── */
  return {
    login,
    logout,
    requireSession,
    getSession,
    isLoggedIn,
    hasRole,
    getRedirectUrl,
    getCurrentUser,
    changePassword,
    updateProfilePicture,
    isMaintenanceModeEnabled: _isMaintenanceModeEnabled,
  };
})();
