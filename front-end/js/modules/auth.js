/* =============================================================================
   TATKU UNITED — AUTH MODULE (API-backed)
   front-end/js/modules/auth.js
   ============================================================================= */

window.Auth = (() => {
  const API_BASE_URL =
    window.AUTH_API_BASE_URL ||
    "http://localhost:10000";

  const STORAGE_KEYS = {
    token: "tu_auth_token",
    session: "tu_auth_session",
    roleHint: "tu_login_role_hint",
    registeredRole: "tu_registered_role",
  };

  const ROLE_DASHBOARDS = {
    super_user: "/html/super_user/super_user_dashboard.html",
    collective_manager: "/html/collective_manager/dashboard.html",
    unit_manager: "/html/unit_manager/dashboard.html",
    provider: "/html/provider/dashboard.html",
    service_provider: "/html/provider/dashboard.html",
    customer: "/html/customer/home.html",
  };

  function toApiRole(role) {
    if (!role) return role;
    if (role === "provider") return "service_provider";
    return role;
  }

  function toUiRole(role) {
    if (!role) return role;
    if (role === "service_provider") return "provider";
    return role;
  }

  function sessionWithAliases(session) {
    if (!session) return null;
    const role = toUiRole(session.role);
    const isProvider = role === "provider";
    return {
      ...session,
      role,
      collectiveId: session.collectiveId || session.collective_id || null,
      unitId: session.unitId || session.unit_id || null,
      customerId: session.customerId || session.customer_id || null,
      service_provider_id:
        session.service_provider_id || (isProvider ? session.id : null),
      provider_id:
        session.provider_id || (isProvider ? session.id : null),
    };
  }

  function saveAuthState(token, session) {
    sessionStorage.setItem(STORAGE_KEYS.token, token);
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }

  function clearAuthState() {
    sessionStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem(STORAGE_KEYS.session);
  }

  function getToken() {
    return sessionStorage.getItem(STORAGE_KEYS.token);
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.session);
      if (!raw) return null;
      return sessionWithAliases(JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }

  function getRedirectUrl() {
    const session = getSession();
    if (!session) return "/html/auth_pages/login.html";
    return ROLE_DASHBOARDS[session.role] || "/html/auth_pages/login.html";
  }

  async function apiRequest(path, options) {
    const reqOptions = options || {};
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      reqOptions.headers || {},
    );

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...reqOptions,
      headers,
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Request failed with status ${res.status}`;
      throw new Error(Array.isArray(message) ? message.join(" ") : String(message));
    }

    return data;
  }

  async function login(email, password, roleHint) {
    const role = toApiRole(roleHint || sessionStorage.getItem(STORAGE_KEYS.roleHint) || "");
    const payload = { email: (email || "").trim().toLowerCase(), password };
    if (role) payload.role = role;

    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const user = data && data.user ? data.user : null;
    if (!user || !data.access_token) {
      throw new Error("Invalid login response from server");
    }

    const session = sessionWithAliases({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collective_id: user.collective_id || null,
      unit_id: user.unit_id || null,
      customer_id: user.customer_id || null,
      loginAt: Date.now(),
    });

    saveAuthState(data.access_token, session);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.roleHint);
    } catch (_) {}

    return { success: true, session };
  }

  async function register(payload) {
    const body = {
      fullName: payload.fullName,
      email: (payload.email || "").trim().toLowerCase(),
      phone: payload.phone,
      password: payload.password,
      role: toApiRole(payload.role),
      providerType: payload.providerType,
    };

    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });

    try {
      sessionStorage.setItem(STORAGE_KEYS.registeredRole, body.role);
    } catch (_) {}

    return data;
  }

  async function changePassword(currentPassword, newPassword) {
    const token = getToken();
    if (!token) return { success: false, error: "not_logged_in" };

    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { success: true };
    } catch (err) {
      const msg = String((err && err.message) || "").toLowerCase();
      if (msg.includes("current password")) {
        return { success: false, error: "invalid_current_password" };
      }
      if (msg.includes("unauthorized") || msg.includes("jwt")) {
        clearAuthState();
        return { success: false, error: "not_logged_in" };
      }
      return { success: false, error: "change_password_failed", message: err.message };
    }
  }

  function updateProfilePicture(imageDataUrl) {
    const session = getSession();
    if (!session) return { success: false, error: "not_logged_in" };
    if (!imageDataUrl) return { success: false, error: "invalid_image" };

    const updated = { ...session, pfp_url: imageDataUrl };
    saveAuthState(getToken() || "", updated);
    return { success: true, pfp_url: imageDataUrl };
  }

  function updateSession(sessionUpdates) {
    const token = getToken() || "";
    if (!token) return false;
    const current = getSession() || {};
    const merged = sessionWithAliases({ ...current, ...sessionUpdates });
    saveAuthState(token, merged);
    return true;
  }

  async function syncSessionFromServer() {
    const token = getToken();
    if (!token) return null;

    try {
      const me = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const existing = getSession() || {};
      const merged = sessionWithAliases({
        ...existing,
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        collective_id: me.collective_id || null,
        unit_id: me.unit_id || null,
        customer_id: me.customer_id || null,
      });
      saveAuthState(token, merged);
      return merged;
    } catch (_) {
      clearAuthState();
      return null;
    }
  }

  function requireSession(allowedRoles) {
    const session = getSession();
    if (!session) {
      window.location.replace("/html/auth_pages/login.html");
      return null;
    }

    const normalizedAllowed = (allowedRoles || []).map(toUiRole);
    if (!normalizedAllowed.includes(session.role)) {
      window.location.replace(getRedirectUrl());
      return null;
    }

    return session;
  }

  function isLoggedIn() {
    return !!getSession() && !!getToken();
  }

  function hasRole(role) {
    const session = getSession();
    if (!session) return false;
    return session.role === toUiRole(role);
  }

  function getCurrentUser() {
    return getSession();
  }

  async function logout() {
    const token = getToken();
    try {
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (_) {
      // ignore network failures during logout
    }
    clearAuthState();
    window.location.replace("/html/auth_pages/logout.html");
  }

  function requestLogout() {
    logout();
  }

  function getRegisteredRole() {
    return sessionStorage.getItem(STORAGE_KEYS.registeredRole) || "";
  }

  function syncUserAvatar() {
    const session = getSession();
    if (!session || !session.name) return;

    const initials = session.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TU";

    const avatars = document.querySelectorAll(".user-avatar");
    avatars.forEach((av) => {
      av.textContent = initials;
      // Optional: Set a consistent color based on name
      const palette = ["#3b82f6", "#0d9488", "#7c3aed", "#d97706", "#dc2626", "#16a34a"];
      const colorIndex = session.name.charCodeAt(0) % palette.length;
      av.style.backgroundColor = palette[colorIndex];
    });
  }

  function clearRegisteredRole() {
    sessionStorage.removeItem(STORAGE_KEYS.registeredRole);
  }

  return {
    API_BASE_URL,
    login,
    register,
    logout,
    requestLogout,
    requireSession,
    getSession,
    isLoggedIn,
    hasRole,
    getRedirectUrl,
    getCurrentUser,
    changePassword,
    updateProfilePicture,
    updateSession,
    syncSessionFromServer,
    syncUserAvatar,
    getToken,
    getRegisteredRole,
    clearRegisteredRole,
  };
})();
