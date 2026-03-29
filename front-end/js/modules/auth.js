/* =============================================================================
   TATKU UNITED — AUTH MODULE
   front-end/js/modules/auth.js
   Depends on: js/data/store.js (AppStore must be loaded first)
   ============================================================================= */

window.Auth = (() => {

  /* ─── Role → Dashboard URL map ─── */
  const ROLE_DASHBOARDS = {
    superuser: "/front-end/html/super_user/super_user_dashboard.html",
    collective_manager: "/front-end/html/collective_manager/dashboard.html",
    unit_manager: "/front-end/html/unit_manager/dashboard.html",
    provider: "/front-end/html/provider/dashboard.html",
    customer: "/front-end/html/customer/home.html",
  };

  /* ─── Hard-coded superuser ─── */
  const SUPERUSER = {
    id: "SUPER001",
    name: "System Admin",
    email: "super_user@fsd.com",
    password: "Admin@1234",
    role: "superuser",
    scopeId: null,
    unitId: null,
    collectiveId: null,
    is_active: true,
    pfp_url: "https://i.pravatar.cc/150?img=70",
  };

  /* =========================================================================
     BUILD AUTH REGISTRY
     Called once inside AppStore.ready.then() — populates window.AuthRegistry
     ========================================================================= */
  function _buildRegistry() {
    const registry = [];

    /* 1. collective_managers */
    const collectiveManagers = AppStore.getTable("collective_managers") || [];
    collectiveManagers.forEach(cm => {
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
    unitManagers.forEach(um => {
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
    providers.forEach(sp => {
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
    customers.forEach(c => {
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

    /* 5. Hard-coded superuser */
    registry.push(SUPERUSER);

    window.AuthRegistry = registry;
  }

  /* =========================================================================
     Auth.login(email, password)
     ========================================================================= */
  function login(email, password) {
    const normEmail = (email || "").trim().toLowerCase();
    const entry = (window.AuthRegistry || []).find(u => u.email === normEmail);

    if (!entry) {
      return { success: false, error: "invalid_credentials" };
    }
    if (!entry.is_active) {
      return { success: false, error: "account_inactive" };
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

    localStorage.setItem("fsd_session", JSON.stringify(session));
    sessionStorage.setItem("fsd_session_alive", "1");

    return { success: true, session };
  }

  /* =========================================================================
     Auth.logout()
     ========================================================================= */
  function logout() {
    localStorage.removeItem("fsd_session");
    localStorage.removeItem("fsd_store");
    sessionStorage.removeItem("fsd_session_alive");
    window.location.replace("/front-end/html/auth_pages/logout.html");
  }

  /* =========================================================================
     Auth.requireSession(allowedRoles)
     ========================================================================= */
  function requireSession(allowedRoles) {
    /* 1. Parse session from localStorage */
    let session = null;
    try {
      const raw = localStorage.getItem("fsd_session");
      if (!raw) throw new Error("no session");
      session = JSON.parse(raw);
      if (!session || !session.role) throw new Error("invalid session");
    } catch (_) {
      window.location.replace("/front-end/html/auth_pages/login.html");
      return null;
    }

    /* 2. Check tab-scoped alive flag */
    if (!sessionStorage.getItem("fsd_session_alive")) {
      window.location.replace("/front-end/html/auth_pages/login.html");
      return null;
    }

    /* 3. Role authorisation */
    if (!allowedRoles.includes(session.role)) {
      const dest = ROLE_DASHBOARDS[session.role] || "/front-end/html/auth_pages/login.html";
      window.location.replace(dest);
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
      const raw = localStorage.getItem("fsd_session");
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
    return !!getSession() && !!sessionStorage.getItem("fsd_session_alive");
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
    return ROLE_DASHBOARDS[session.role] || "/front-end/html/auth_pages/login.html";
  }

  /* =========================================================================
     Auth.getCurrentUser()
     Returns full AuthRegistry entry; for providers, attaches .documents
     ========================================================================= */
  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;

    const entry = (window.AuthRegistry || []).find(u => u.id === session.id && u.role === session.role);
    if (!entry) return null;

    if (session.role === "provider") {
      const allDocs = AppStore.getTable("provider_documents") || [];
      entry.documents = allDocs.filter(d => d.service_provider_id === session.id);
    }

    return entry;
  }

  /* ─── Initialise registry once AppStore is ready ─── */
  AppStore.ready.then(() => {
    _buildRegistry();
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
  };

})();
