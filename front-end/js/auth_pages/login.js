'use strict';

(function () {
  /* ── DOM refs ── */
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleSelect    = document.getElementById('role');
  const loginBtn      = document.getElementById('login-btn');
  const btnText       = loginBtn.querySelector('.btn-text');
  const spinner       = document.getElementById('spinner');
  const togglePwdBtn  = document.getElementById('toggle-password');
  const eyeOpen       = togglePwdBtn.querySelector('.eye-open');
  const eyeClosed     = togglePwdBtn.querySelector('.eye-closed');
  const alert         = document.getElementById('alert');
  const emailError    = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  /* ── Toggle password visibility ── */
  togglePwdBtn.addEventListener('click', function () {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeOpen.style.display   = isPassword ? 'none'  : 'inline';
    eyeClosed.style.display = isPassword ? 'inline' : 'none';
  });

  /* ── Validation helpers ── */
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function clearErrors() {
    emailError.textContent    = '';
    passwordError.textContent = '';
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');
    alert.className = 'alert';
    alert.textContent = '';
  }

  function showAlert(msg, type) {
    alert.textContent = msg;
    alert.className   = 'alert ' + type;
  }

  /* ── Real-time inline validation ── */
  emailInput.addEventListener('blur', function () {
    if (this.value && !isValidEmail(this.value)) {
      emailError.textContent = 'Please enter a valid email address.';
      this.classList.add('invalid');
    } else {
      emailError.textContent = '';
      this.classList.remove('invalid');
    }
  });

  passwordInput.addEventListener('blur', function () {
    if (this.value && this.value.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      this.classList.add('invalid');
    } else {
      passwordError.textContent = '';
      this.classList.remove('invalid');
    }
  });

  /* ── Simulate loading state ── */
  function setLoading(on) {
    loginBtn.disabled = on;
    btnText.style.display = on ? 'none' : 'inline';
    spinner.style.display = on ? 'inline-block' : 'none';
  }

  /* ── Login handler ── */
  loginBtn.addEventListener('click', function () {
    clearErrors();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    const role     = roleSelect.value;

    let valid = true;

    if (!email) {
      emailError.textContent = 'Email address is required.';
      emailInput.classList.add('invalid');
      valid = false;
    } else if (!isValidEmail(email)) {
      emailError.textContent = 'Please enter a valid email address.';
      emailInput.classList.add('invalid');
      valid = false;
    }

    if (!password) {
      passwordError.textContent = 'Password is required.';
      passwordInput.classList.add('invalid');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    /* Simulate API call */
    setTimeout(function () {
      setLoading(false);

      /* Demo: treat any well-formed email/password as success */
      const fakeSuccess = password.length >= 6;

      if (fakeSuccess) {
        showAlert('✓ Login successful! Redirecting…', 'success');
        /* Simulate redirect after short delay */
        setTimeout(function () {
        /* Role-based redirect */
          const roleRoutes = {
            customer:           '../customer/home.html',
            unit_manager:       '../unit_manager/dashboard.html',
            collective_manager: '../collective_manager/dashboard.html',
            service_provider:   '../provider/dashboard.html',
            admin:              '../admin/admin_dashboard.html',
          };
          window.location.href = roleRoutes[role] || '../customer/home.html';
        }, 1200);
      } else {
        showAlert('Invalid email or password. Please try again.', 'error');
      }
    }, 1400);
  });

  /* ── Enter key support ── */
  [emailInput, passwordInput].forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') loginBtn.click();
    });
  });

  /* ── Social buttons (demo) ── */
  document.getElementById('google-btn').addEventListener('click', function () {
    showAlert('Google sign-in is not configured in this demo.', 'error');
  });

  document.getElementById('facebook-btn').addEventListener('click', function () {
    showAlert('Facebook sign-in is not configured in this demo.', 'error');
  });
})();
