"use strict";

(function () {
  var currentStep = 1;
  var selectedRole = "customer";
  var selectedProviderType = "individual";

  var step1Panel = document.getElementById("step-1");
  var step2Panel = document.getElementById("step-2");
  var step3Panel = document.getElementById("step-3");

  var dot1 = document.getElementById("step-1-dot");
  var dot2 = document.getElementById("step-2-dot");
  var dot3 = document.getElementById("step-3-dot");
  var lines = document.querySelectorAll(".step-line");

  var roleCards = document.querySelectorAll(".role-card");
  var roleValue = document.getElementById("role-value");
  var toggleBtns = document.querySelectorAll(".toggle-btn");
  var providerTypeInput = document.getElementById("provider-type");

  var fullnameInput = document.getElementById("fullname");
  var emailInput = document.getElementById("email");
  var phoneInput = document.getElementById("phone");
  var passwordInput = document.getElementById("password");
  var confirmInput = document.getElementById("confirm-password");
  var termsCheck = document.getElementById("terms");

  var next1Btn = document.getElementById("next-1");
  var back1Btn = document.getElementById("back-1");
  var next2Btn = document.getElementById("next-2");
  var back2Btn = document.getElementById("back-2");
  var submitBtn = document.getElementById("submit-btn");
  var submitText = document.getElementById("submit-text");
  var spinner = document.getElementById("spinner");

  var alert = document.getElementById("alert");

  function showAlert(msg, type) {
    alert.textContent = msg;
    alert.className = "alert " + type;
    alert.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearAlert() {
    alert.className = "alert";
    alert.textContent = "";
  }

  function setError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    [
      "fullname-error",
      "email-error",
      "phone-error",
      "password-error",
      "confirm-error",
      "terms-error",
    ].forEach(function (id) {
      setError(id, "");
    });
    document.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
    document.querySelectorAll(".valid").forEach(function (el) {
      el.classList.remove("valid");
    });
    clearAlert();
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function isValidFullName(val) {
    return /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(val.trim());
  }

  function isValidPhone(val) {
    return /^(?!([0-9])\1{9})\d{10}$/.test(val.trim());
  }

  function validatePasswordPolicy(password) {
    var pwd = password || "";
    var error =
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character with no spaces.";

    if (pwd.length < 8) return { valid: false, error: error };
    if (/\s/.test(pwd)) return { valid: false, error: error };
    if (!/[A-Z]/.test(pwd)) return { valid: false, error: error };
    if (!/[a-z]/.test(pwd)) return { valid: false, error: error };
    if (!/[0-9]/.test(pwd)) return { valid: false, error: error };
    if (!/[^A-Za-z0-9]/.test(pwd)) return { valid: false, error: error };

    return { valid: true };
  }

  function goToStep(n) {
    [step1Panel, step2Panel, step3Panel].forEach(function (p) {
      p.classList.remove("active");
    });
    [dot1, dot2, dot3].forEach(function (d) {
      d.classList.remove("active", "done");
    });
    lines.forEach(function (l) {
      l.classList.remove("done");
    });

    if (n === 1) {
      step1Panel.classList.add("active");
      dot1.classList.add("active");
    } else if (n === 2) {
      step2Panel.classList.add("active");
      dot1.classList.add("done");
      dot2.classList.add("active");
      lines[0].classList.add("done");
    } else if (n === 3) {
      step3Panel.classList.add("active");
      dot1.classList.add("done");
      dot2.classList.add("done");
      dot3.classList.add("active");
      lines[0].classList.add("done");
      lines[1].classList.add("done");
    }

    currentStep = n;
    clearAlert();
  }

  roleCards.forEach(function (card) {
    card.addEventListener("click", function () {
      roleCards.forEach(function (c) {
        c.classList.remove("selected");
      });
      card.classList.add("selected");
      selectedRole = card.getAttribute("data-role");
      roleValue.value = selectedRole;
    });
  });

  toggleBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggleBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      selectedProviderType = btn.getAttribute("data-type");
      providerTypeInput.value = selectedProviderType;
    });
  });

  function wireToggle(btnId, inputEl) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isPassword = inputEl.type === "password";
      inputEl.type = isPassword ? "text" : "password";
      btn.querySelector(".eye-open").style.display = isPassword
        ? "none"
        : "inline";
      btn.querySelector(".eye-closed").style.display = isPassword
        ? "inline"
        : "none";
    });
  }

  wireToggle("toggle-pwd", passwordInput);
  wireToggle("toggle-cpwd", confirmInput);

  phoneInput.addEventListener("input", function () {
    var digitsOnly = this.value.replace(/\D/g, "").slice(0, 10);
    if (this.value !== digitsOnly) this.value = digitsOnly;
  });

  passwordInput.addEventListener("input", function () {
    var val = passwordInput.value;
    var score = 0;
    if (val.length >= 8) score++;
    if (/[a-z]/.test(val)) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    if (/\s/.test(val)) score = Math.max(0, score - 1);

    var fill = document.getElementById("strength-fill");
    var label = document.getElementById("strength-label");
    var pct = (score / 5) * 100;
    fill.style.width = pct + "%";

    var colors = ["#EF4444", "#F59E0B", "#FACC15", "#10B981", "#059669"];
    var labels = ["Weak", "Fair", "Okay", "Good", "Strong"];

    if (val.length === 0) {
      fill.style.width = "0%";
      label.textContent = "";
    } else {
      var idx = Math.min(labels.length - 1, Math.max(0, score - 1));
      fill.style.background = colors[idx];
      label.textContent = labels[idx];
      label.style.color = colors[idx];
    }
  });

  next1Btn.addEventListener("click", function () {
    goToStep(2);
  });

  back1Btn.addEventListener("click", function () {
    goToStep(1);
  });

  next2Btn.addEventListener("click", function () {
    clearErrors();
    var valid = true;

    var fullname = fullnameInput.value.trim();
    var email = emailInput.value.trim();
    var phone = phoneInput.value.trim();

    if (!fullname || fullname.length < 2) {
      setError("fullname-error", "Please enter your full name (min. 2 characters).");
      fullnameInput.classList.add("invalid");
      valid = false;
    } else if (!isValidFullName(fullname)) {
      setError("fullname-error", "Name can contain letters and spaces only.");
      fullnameInput.classList.add("invalid");
      valid = false;
    }

    if (!email) {
      setError("email-error", "Email address is required.");
      emailInput.classList.add("invalid");
      valid = false;
    } else if (!isValidEmail(email)) {
      setError("email-error", "Please enter a valid email address.");
      emailInput.classList.add("invalid");
      valid = false;
    }

    if (!phone) {
      setError("phone-error", "Phone number is required.");
      phoneInput.classList.add("invalid");
      valid = false;
    } else if (!isValidPhone(phone)) {
      setError(
        "phone-error",
        "Enter a valid 10-digit phone number (digits only, not all same digit).",
      );
      phoneInput.classList.add("invalid");
      valid = false;
    }

    if (valid) goToStep(3);
  });

  back2Btn.addEventListener("click", function () {
    goToStep(2);
  });

  submitBtn.addEventListener("click", async function () {
    clearErrors();
    var valid = true;

    var password = passwordInput.value;
    var confirm = confirmInput.value;

    var passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      setError("password-error", passwordCheck.error);
      passwordInput.classList.add("invalid");
      valid = false;
    }

    if (!confirm) {
      setError("confirm-error", "Please confirm your password.");
      confirmInput.classList.add("invalid");
      valid = false;
    } else if (password !== confirm) {
      setError("confirm-error", "Passwords do not match.");
      confirmInput.classList.add("invalid");
      valid = false;
    }

    if (!termsCheck.checked) {
      setError("terms-error", "You must agree to the Terms of Service to continue.");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitText.style.display = "none";
    spinner.style.display = "inline-block";

    try {
      await Auth.register({
        fullName: fullnameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: password,
        role: selectedRole,
        providerType: selectedProviderType,
      });

      if (selectedRole === "service_provider") {
        sessionStorage.setItem(
          "tu_register_notice",
          "Your provider registration request was submitted. You can sign in after collective manager approval.",
        );
      }

      window.location.href = "register-success.html";
    } catch (err) {
      submitBtn.disabled = false;
      submitText.style.display = "inline";
      spinner.style.display = "none";

      var msg = String((err && err.message) || "").toLowerCase();
      if (msg.includes("already exists")) {
        showAlert(
          "An account with this email already exists. Please log in or use a different email.",
          "error",
        );
        goToStep(2);
      } else {
        showAlert("Could not complete registration. Please try again later.", "error");
      }
    }
  });

  emailInput.addEventListener("blur", function () {
    if (this.value && !isValidEmail(this.value)) {
      setError("email-error", "Please enter a valid email address.");
      this.classList.add("invalid");
    } else if (this.value) {
      setError("email-error", "");
      this.classList.remove("invalid");
      this.classList.add("valid");
    }
  });

  confirmInput.addEventListener("input", function () {
    if (passwordInput.value && this.value) {
      if (this.value !== passwordInput.value) {
        setError("confirm-error", "Passwords do not match.");
        this.classList.add("invalid");
      } else {
        setError("confirm-error", "");
        this.classList.remove("invalid");
        this.classList.add("valid");
      }
    }
  });
})();
