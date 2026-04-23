/* =============================================================================
   TATKU UNITED — LOGOUT PAGE SCRIPT
   front-end/js/auth_pages/logout.js
   This file must clear session storage before anything else runs.
   ============================================================================= */

/* ── Step 1: Clear session immediately when logout page loads ── */
/* Session is already cleared by the time this page loads (Auth.logout()
   removes tu_auth_session + tu_auth_token before redirecting here).
   "Login Again" just navigates to the login page cleanly. */
document.getElementById("login-again").addEventListener("click", () => {
  window.location.href = "/front-end/html/auth_pages/login.html";
});
// Keep AppStore cache intact on logout.

/* ── Step 2: Auto-redirect countdown (optional UI) ── */
const redirectNote = document.getElementById("redirect-note");
const countdownEl = document.getElementById("countdown");
const cancelBtn = document.getElementById("cancel-redirect");

if (redirectNote && countdownEl) {
  redirectNote.style.display = "block";

  let seconds = 10;
  let cancelled = false;

  const timer = setInterval(() => {
    if (cancelled) {
      clearInterval(timer);
      return;
    }
    seconds--;
    countdownEl.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      window.location.replace("../../html/landing_page.html");
    }
  }, 1000);

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      cancelled = true;
      redirectNote.style.display = "none";
    });
  }
}
