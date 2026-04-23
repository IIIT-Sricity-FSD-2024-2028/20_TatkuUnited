/* =============================================================================
   TATKU UNITED — LOGIN PAGE SCRIPT
   front-end/js/auth_pages/login.js
   Depends on: store.js, auth.js, helpers.js (all loaded before this file)
   ============================================================================= */

if (Auth.isLoggedIn()) {
  window.location.replace(Auth.getRedirectUrl());
}

(function () {

  /* ── DOM refs ── */
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");
  const toggleIcon = document.getElementById("toggle-icon");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("btn-login");

  function getSafeNextUrl() {
    const rawNext = new URLSearchParams(window.location.search).get("next");
    if (!rawNext) return null;

    try {
      const nextUrl = new URL(rawNext, window.location.origin);
      const isSameOrigin = nextUrl.origin === window.location.origin;
      const isAppPath = nextUrl.pathname.startsWith("/front-end/html/");
      if (!isSameOrigin || !isAppPath) return null;

      return nextUrl.pathname + nextUrl.search + nextUrl.hash;
    } catch (_) {
      return null;
    }
  }

  /* ── Helpers ── */
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("visible");
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.remove("visible");
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Signing in…" : "Sign In";
  }

  function applyRegisterRestrictionState() {
    const registerHintLink = document.querySelector(".register-link");
    if (!registerHintLink) return;

    if (window.location.search.includes("maintenance=1")) {
      registerHintLink.classList.add("register-link--disabled");
      registerHintLink.href = "javascript:void(0)";
      registerHintLink.textContent = "Registration temporarily unavailable";
    }
  }

  applyRegisterRestrictionState();

  const urlError = new URLSearchParams(window.location.search).get("error");
  if (urlError === "provider_suspended") {
    showError(
      "Provider access is currently suspended by platform settings. Contact Super User.",
    );
  } else if (urlError === "maintenance") {
    showError(
      "Maintenance mode is active. Only Super User admin access is available right now.",
    );
  }

  async function attemptLogin(email, password) {
    clearError();

    /* Client-side validation first */
    const validation = Validators.validateLogin({ email, password });
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setLoading(true);

    try {
      const result = await Auth.login(email, password);
      setLoading(false);

      if (result.success) {
        const nextUrl = getSafeNextUrl();
        window.location.replace(nextUrl || Auth.getRedirectUrl());
        return;
      }

      showError("Invalid email or password.");
    } catch (err) {
      setLoading(false);
      const msg = String((err && err.message) || "").toLowerCase();
      if (msg.includes("approval") || msg.includes("pending")) {
        showError(
          "Your provider account is pending collective manager approval. You can log in after approval.",
        );
      } else
      if (msg.includes("inactive")) {
        showError("Your account is inactive. Contact support.");
      } else if (msg.includes("multiple roles")) {
        showError("This email has multiple roles. Please contact support.");
      } else {
        showError("Invalid email or password.");
      }
    }
  }

  /* ── Form submit ── */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    attemptLogin(email, password);
  });

  /* ── Clear error when user starts typing ── */
  emailInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);

  /* ── Password show/hide toggle ── */
  let passwordVisible = false;
  toggleBtn.addEventListener("click", () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? "text" : "password";
    toggleIcon.textContent = passwordVisible ? "🙈" : "👁";
  });
})();
