/* =============================================================================
   TATKU UNITED — LOGOUT PAGE SCRIPT
   front-end/js/auth_pages/logout.js
   This file must clear session storage before anything else runs.
   ============================================================================= */

/* ── Step 1: Clear session immediately when logout page loads ── */
/* If a user clicked a direct link to logout.html without triggering Auth.logout() first,
   we need to ensure the session is wiped here and tell the backend to invalidate the token. */
if (window.Auth && window.Auth.getToken && window.Auth.getToken()) {
  const token = window.Auth.getToken();
  
  // Clear frontend state immediately
  sessionStorage.removeItem("tu_auth_token");
  sessionStorage.removeItem("tu_auth_session");
  localStorage.removeItem("tu_auth_token");
  localStorage.removeItem("tu_auth_session");
  
  // Best-effort call to backend to invalidate token
  if (window.Api) {
    window.Api.post("/auth/logout", {}, { 
      silent: true, 
      headers: { Authorization: `Bearer ${token}` } 
    }).catch(() => {});
  }
}

document.getElementById("login-again").addEventListener("click", () => {
  window.location.href = "/html/auth_pages/login.html";
});

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
