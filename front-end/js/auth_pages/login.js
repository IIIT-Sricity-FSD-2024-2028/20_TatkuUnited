/* =============================================================================
   TATKU UNITED — LOGIN PAGE SCRIPT
   front-end/js/auth_pages/login.js
   Depends on: store.js, auth.js, helpers.js (all loaded before this file)
   ============================================================================= */

/* Always wipe any leftover session when the login page loads.
   The login page is a clean-slate boundary — no session should persist here. */
sessionStorage.removeItem("fsd_session");

AppStore.ready.then(() => {
  /* Belt-and-suspenders: ensure session is gone even if AppStore resolved
     from a cached localStorage fetch before the sync removal above ran. */
  sessionStorage.removeItem("fsd_session");

  /* Auth.isLoggedIn() will now always be false on fresh login page load */
  if (Auth.isLoggedIn()) {
    window.location.replace(Auth.getRedirectUrl());
    return;
  }

  /* ── DOM refs ── */
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");
  const toggleIcon = document.getElementById("toggle-icon");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("btn-login");
  const demoTiles = document.querySelectorAll(".demo-tile");
  const demoSection = document.querySelector(".demo-section");

  const platformSettings =
    window.AppStore && typeof AppStore.getPlatformSettings === "function"
      ? AppStore.getPlatformSettings()
      : null;
  const isMaintenanceMode = !!(
    platformSettings && platformSettings.maintenanceMode
  );
  const isProviderSuspended = !!(
    platformSettings && platformSettings.accountSuspension
  );

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

  function renderSuspensionBanner() {
    if ((!isProviderSuspended && !isMaintenanceMode) || !demoSection) return;

    const existing = document.getElementById("provider-suspension-banner");
    if (existing) return;

    const banner = document.createElement("p");
    banner.id = "provider-suspension-banner";
    banner.className = "platform-warning";
    banner.textContent = isMaintenanceMode
      ? "Maintenance mode is active. Only Super User admin login is available right now."
      : "Provider access is temporarily suspended by Super User platform settings.";
    demoSection.insertAdjacentElement("afterbegin", banner);
  }

  function applyDemoTileSuspensionState() {
    if (!isProviderSuspended && !isMaintenanceMode) return;

    demoTiles.forEach((tile) => {
      const isSuperUserTile = tile.classList.contains("demo-tile--superuser");
      const shouldDisable = isMaintenanceMode
        ? !isSuperUserTile
        : tile.classList.contains("demo-tile--provider");

      if (!shouldDisable) return;

      tile.classList.add("demo-tile--disabled");
      tile.setAttribute("aria-disabled", "true");
      tile.title = isMaintenanceMode
        ? "Only Super User login is allowed during maintenance mode"
        : "Provider login is suspended by platform settings";
    });

    const registerHintLink = document.querySelector(".register-link");
    if (isMaintenanceMode && registerHintLink) {
      registerHintLink.classList.add("register-link--disabled");
      registerHintLink.href = "javascript:void(0)";
      registerHintLink.textContent = "Registration temporarily unavailable";
    }
  }

  renderSuspensionBanner();
  applyDemoTileSuspensionState();

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

  function attemptLogin(email, password) {
    clearError();

    /* Client-side validation first */
    const validation = Validators.validateLogin({ email, password });
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setLoading(true);

    /* Auth.login is synchronous (in-memory) but we defer one tick
       so the loading state renders visibly */
    setTimeout(() => {
      const result = Auth.login(email, password);
      setLoading(false);

      if (result.success) {
        window.location.replace(Auth.getRedirectUrl());
        return;
      }

      if (result.error === "account_inactive") {
        showError("Your account has been deactivated. Contact support.");
      } else if (result.error === "maintenance_mode_active") {
        showError(
          "Maintenance mode is active. Only Super User admin access is available right now.",
        );
      } else if (result.error === "provider_suspended_by_platform") {
        showError(
          "Provider access is currently suspended by platform settings. Contact Super User.",
        );
      } else {
        showError("Invalid email or password.");
      }
    }, 50);
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

  /* ── Demo tile click: fill fields and login immediately ── */
  demoTiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      if (
        isMaintenanceMode &&
        !tile.classList.contains("demo-tile--superuser")
      ) {
        showError(
          "Maintenance mode is active. Only Super User admin access is available right now.",
        );
        return;
      }

      if (
        isProviderSuspended &&
        tile.classList.contains("demo-tile--provider")
      ) {
        showError(
          "Provider access is currently suspended by platform settings. Contact Super User.",
        );
        return;
      }

      const email = tile.dataset.email;
      const password = tile.dataset.password;

      emailInput.value = email;
      passwordInput.value = password;

      /* Show password briefly so user sees it was filled */
      passwordInput.type = "text";
      toggleIcon.textContent = "🙈";
      passwordVisible = true;

      attemptLogin(email, password);
    });
  });
});
