'use strict';

(function () {
  /* ── Clear any stored session data ── */
  try {
    sessionStorage.removeItem('registeredRole');
    sessionStorage.removeItem('userEmail');
  } catch (e) { /* ignore */ }

  /* ── Optional: auto-redirect countdown ── */
  var AUTO_REDIRECT = false;  // Set to true to enable
  var REDIRECT_SECONDS = 10;
  var REDIRECT_URL = '#';     // Replace with homepage URL

  var redirectNote  = document.getElementById('redirect-note');
  var countdownEl   = document.getElementById('countdown');
  var cancelBtn     = document.getElementById('cancel-redirect');
  var countdownTimer;
  var remaining = REDIRECT_SECONDS;

  if (AUTO_REDIRECT) {
    redirectNote.style.display = 'flex';

    countdownTimer = setInterval(function () {
      remaining--;
      countdownEl.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(countdownTimer);
        window.location.href = REDIRECT_URL;
      }
    }, 1000);

    cancelBtn.addEventListener('click', function () {
      clearInterval(countdownTimer);
      redirectNote.style.display = 'none';
    });
  }

  /* ── "Go to Homepage" link ── */
  var ghostBtn = document.querySelector('.btn-ghost');
  if (ghostBtn) {
    ghostBtn.addEventListener('click', function (e) {
      e.preventDefault();
      /* In production: window.location.href = '/'; */
      console.log('Navigating to homepage…');
    });
  }

  /* ── Keyboard: press Enter to login again ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var loginBtn = document.querySelector('.btn-primary');
      if (loginBtn) loginBtn.click();
    }
  });
})();
