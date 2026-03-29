/* =============================================================================
   TATKU UNITED — LOGIN PAGE SCRIPT
   front-end/js/auth_pages/login.js
   Depends on: store.js, auth.js, helpers.js (all loaded before this file)
   ============================================================================= */

/* Always wipe any leftover session when the login page loads.
   The login page is a clean-slate boundary — no session should persist here. */
localStorage.removeItem("fsd_session");
sessionStorage.removeItem("fsd_session_alive");

AppStore.ready.then(() => {

  /* Belt-and-suspenders: ensure session is gone even if AppStore resolved
     from a cached localStorage fetch before the sync removal above ran. */
  localStorage.removeItem("fsd_session");
  sessionStorage.removeItem("fsd_session_alive");

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
  demoTiles.forEach(tile => {
    tile.addEventListener("click", () => {
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