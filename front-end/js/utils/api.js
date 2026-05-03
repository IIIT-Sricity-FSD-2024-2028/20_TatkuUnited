/* =============================================================================
   TATKU UNITED — SHARED API CLIENT
   front-end/js/utils/api.js

   Central fetch wrapper used by every page to talk to the NestJS backend.
   Must be loaded AFTER auth.js so that Auth.getToken / Auth.getSession exist.

   Features:
     • Single configurable baseURL
     • Automatic Bearer token from Auth.getToken()
     • Automatic x-role and x-id header injection from session
     • Typed convenience methods: get, post, patch, put, delete
     • Unified error interceptor with toast UI
     • 401 → auto-logout, 403 → forbidden toast, 4xx/5xx → descriptive toast
   ============================================================================= */

window.Api = (() => {
  "use strict";

  // ── Configuration ─────────────────────────────────────────────────────────
  const BASE_URL =
    window.API_BASE_URL ||
    "http://localhost:10000";

  // UI role → backend role mapping (mirrors Auth.toApiRole)
  function toApiRole(role) {
    if (!role) return "";
    if (role === "provider") return "service_provider";
    return role;
  }

  // ── Toast notification system ─────────────────────────────────────────────
  // Renders a small floating toast at the top-right of the viewport.
  // Severity: "error" | "warn" | "info" | "success"

  let _toastContainer = null;

  function _ensureToastContainer() {
    if (_toastContainer && document.body.contains(_toastContainer)) return;

    _toastContainer = document.createElement("div");
    _toastContainer.id = "api-toast-container";
    Object.assign(_toastContainer.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "99999",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      pointerEvents: "none",
      maxWidth: "420px",
      width: "100%",
    });
    document.body.appendChild(_toastContainer);
  }

  const _TOAST_COLORS = {
    error:   { bg: "#1a0a0a", border: "#ef4444", accent: "#fca5a5", icon: "✕" },
    warn:    { bg: "#1a1400", border: "#f59e0b", accent: "#fcd34d", icon: "⚠" },
    info:    { bg: "#0a0f1a", border: "#3b82f6", accent: "#93c5fd", icon: "ℹ" },
    success: { bg: "#0a1a0a", border: "#22c55e", accent: "#86efac", icon: "✓" },
  };

  function showToast(message, severity, durationMs) {
    severity = severity || "error";
    durationMs = durationMs || 5000;

    _ensureToastContainer();

    const colors = _TOAST_COLORS[severity] || _TOAST_COLORS.error;

    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    Object.assign(toast.style, {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "14px 18px",
      background: colors.bg,
      border: "1px solid " + colors.border,
      borderLeft: "4px solid " + colors.border,
      borderRadius: "10px",
      color: "#f1f5f9",
      fontSize: "13.5px",
      lineHeight: "1.5",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      pointerEvents: "auto",
      cursor: "pointer",
      opacity: "0",
      transform: "translateX(40px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      backdropFilter: "blur(12px)",
      maxWidth: "100%",
      wordBreak: "break-word",
    });

    const icon = document.createElement("span");
    Object.assign(icon.style, {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.accent,
      flexShrink: "0",
      marginTop: "1px",
    });
    icon.textContent = colors.icon;

    const body = document.createElement("div");
    body.style.flex = "1";

    const title = document.createElement("div");
    Object.assign(title.style, {
      fontWeight: "600",
      fontSize: "13px",
      color: colors.accent,
      marginBottom: "2px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    });
    title.textContent = severity === "error" ? "Error"
                       : severity === "warn"  ? "Warning"
                       : severity === "info"  ? "Info"
                       : "Success";

    const msg = document.createElement("div");
    msg.style.color = "#e2e8f0";
    msg.textContent = message;

    body.appendChild(title);
    body.appendChild(msg);
    toast.appendChild(icon);
    toast.appendChild(body);

    // Dismiss on click
    toast.addEventListener("click", () => _dismissToast(toast));

    _toastContainer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    });

    // Auto-dismiss
    const timer = setTimeout(() => _dismissToast(toast), durationMs);
    toast._timer = timer;
  }

  function _dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._timer);
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // ── ApiError class ────────────────────────────────────────────────────────

  
  let _overlayShown = false;
  function showServerUnreachableOverlay() {
    if (_overlayShown) return;
    _overlayShown = true;
    
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(10, 15, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: '999999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '\'DM Sans\', system-ui, sans-serif',
      color: '#f8fafc',
      textAlign: 'center',
      padding: '20px'
    });

    const icon = document.createElement('div');
    icon.innerHTML = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    icon.style.marginBottom = '24px';

    const title = document.createElement('h1');
    title.textContent = 'API Unavailable';
    title.style.fontSize = '32px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '16px';
    title.style.margin = '0 0 16px 0';

    const message = document.createElement('p');
    message.textContent = 'The server is unreachable or offline. Please check your connection or try again later.';
    message.style.fontSize = '16px';
    message.style.color = '#94a3b8';
    message.style.maxWidth = '400px';
    message.style.lineHeight = '1.5';
    message.style.margin = '0 0 32px 0';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry Connection';
    Object.assign(retryBtn.style, {
      padding: '12px 24px',
      backgroundColor: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    });
    retryBtn.onmouseover = () => retryBtn.style.backgroundColor = '#1d4ed8';
    retryBtn.onmouseout = () => retryBtn.style.backgroundColor = '#2563eb';
    retryBtn.onclick = () => window.location.reload();

    overlay.appendChild(icon);
    overlay.appendChild(title);
    overlay.appendChild(message);
    overlay.appendChild(retryBtn);

    document.body.appendChild(overlay);
  }

  class ApiError extends Error {
    constructor(status, statusText, body) {
      const message = ApiError._extractMessage(body, status, statusText);
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.statusText = statusText;
      this.body = body;
    }

    static _extractMessage(body, status, statusText) {
      if (body && typeof body === "object") {
        // NestJS returns { message: string | string[], error: string, statusCode }
        if (body.message) {
          return Array.isArray(body.message)
            ? body.message.join(". ")
            : String(body.message);
        }
        if (body.error) return String(body.error);
      }
      return "Request failed: " + status + " " + (statusText || "");
    }
  }

  // ── Core request function ─────────────────────────────────────────────────

  async function request(method, path, options) {
    options = options || {};

    // Build headers
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Inject Bearer token
    const token =
      (window.Auth && Auth.getToken && Auth.getToken()) || null;
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    // Inject x-role and x-id from current session
    const session =
      (window.Auth && Auth.getSession && Auth.getSession()) || null;
    if (session) {
      headers["x-role"] = toApiRole(session.role);
      if (session.id) {
        headers["x-id"] = session.id;
      }
    }

    // Allow caller to override / add headers
    if (options.headers) {
      Object.keys(options.headers).forEach((key) => {
        headers[key] = options.headers[key];
      });
    }

    // Build fetch init
    const fetchInit = {
      method: method.toUpperCase(),
      headers: headers,
      credentials: "include",
    };

    // Attach body for non-GET methods
    if (options.body !== undefined && method.toUpperCase() !== "GET") {
      fetchInit.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    // Build full URL
    const url = BASE_URL + path;

    let response;
    try {
      response = await fetch(url, fetchInit);
    } catch (networkErr) {
      const msg = "Network error — please check your connection and make sure the API server is running.";
      if (!options.silent) showToast(msg, "error", 6000);
      showServerUnreachableOverlay();
      throw new ApiError(0, "NetworkError", { message: msg });
    }

    // Parse response body (may be empty for 204)
    let body = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch (_) {
        body = null;
      }
    } else {
      // Attempt text fallback for non-JSON error pages
      try {
        const text = await response.text();
        if (text) body = { message: text };
      } catch (_) {
        body = null;
      }
    }

    // ── Error interceptor ─────────────────────────────────────────────────
    if (!response.ok) {
      const err = new ApiError(response.status, response.statusText, body);

      // 401 Unauthorized → session expired, redirect to login
      if (response.status === 401) {
        if (!options.silent) {
          showToast("Session expired — please log in again.", "warn", 4000);
        }
        // Clear auth state and redirect after a brief delay
        if (window.Auth && Auth.logout) {
          setTimeout(() => {
            // Clear without making the /auth/logout API call (token is already invalid)
            sessionStorage.removeItem("tu_auth_token");
            sessionStorage.removeItem("tu_auth_session");
            window.location.replace("/html/auth_pages/login.html");
          }, 1500);
        }
        throw err;
      }

      // 403 Forbidden
      if (response.status === 403) {
        if (!options.silent) {
          showToast(err.message || "You do not have permission to perform this action.", "warn", 5000);
        }
        throw err;
      }

      // 404 Not Found
      if (response.status === 404) {
        if (!options.silent) {
          showToast(err.message || "The requested resource was not found.", "info", 4000);
        }
        throw err;
      }

      // 409 Conflict
      if (response.status === 409) {
        if (!options.silent) {
          showToast(err.message || "A conflict occurred — the resource may already exist.", "warn", 5000);
        }
        throw err;
      }

      // 400 Bad Request (validation errors)
      if (response.status === 400) {
        if (!options.silent) {
          showToast(err.message || "Invalid request — please check your input.", "error", 5000);
        }
        throw err;
      }

      // 500+ Server errors
      if (response.status >= 500) {
        if (!options.silent) {
          showToast("Server error — please try again later.", "error", 6000);
        }
        throw err;
      }

      // Any other error
      if (!options.silent) {
        showToast(err.message, "error", 5000);
      }
      throw err;
    }

    return body;
  }

  // ── Convenience methods ───────────────────────────────────────────────────

  function get(path, options) {
    return request("GET", path, options);
  }

  function post(path, body, options) {
    return request("POST", path, Object.assign({}, options, { body: body }));
  }

  function patch(path, body, options) {
    return request("PATCH", path, Object.assign({}, options, { body: body }));
  }

  function put(path, body, options) {
    return request("PUT", path, Object.assign({}, options, { body: body }));
  }

  function del(path, options) {
    return request("DELETE", path, options);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    BASE_URL: BASE_URL,
    request: request,
    get: get,
    post: post,
    patch: patch,
    put: put,
    del: del,
    showToast: showToast,
    ApiError: ApiError,
  };
})();
