// ===== CART BADGE =====
function getCustomerSessionId() {
  const session = Auth.getSession();
  return session && session.role === "customer" ? session.id : null;
}
function getCart() {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

// ===== TOAST =====
function showProfileToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ===== AVATAR =====
function updateAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showProfileToast("Please choose a valid image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showProfileToast("Profile photo must be under 2 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;
    const res = Auth.updateProfilePicture(imageData);
    if (!res.success) {
      showProfileToast("Unable to update profile photo. Please try again.");
      return;
    }

    const el = document.getElementById("profile-avatar");
    el.innerHTML = `<img src="${imageData}" alt="avatar"/>`;
  };
  reader.readAsDataURL(file);
  showProfileToast("Profile photo updated!");
}

// ===== NAME / EMAIL SYNC =====
function syncName() {
  const val = document.getElementById("full-name").value;
  document.getElementById("hero-name").textContent = val || "Your Name";
  const initials = val
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatar = document.getElementById("profile-avatar");
  if (!avatar.querySelector("img")) avatar.textContent = initials || "SC";
}
function syncEmail() {
  const val = document.getElementById("email").value;
  document.getElementById("hero-email").textContent = val || "";
}

// ===== SAVE SECTION =====
function saveSection(section) {
  if (section === "personal") {
    const session = Auth.getCurrentUser();
    if (session) {
      const nameVal = document.getElementById("full-name").value;
      const emailVal = document.getElementById("email").value;
      const phoneVal = (document.getElementById("phone").value || "").trim();
      const dobVal = document.getElementById("dob").value;
      const codeSpan = document.getElementById("phone-code");
      const countryCode = codeSpan ? codeSpan.textContent : "+91";

      if (phoneVal && !/^\d{10}$/.test(phoneVal)) {
        showProfileToast("Phone must be exactly 10 digits.");
        return;
      }

      if (phoneVal && !/^\d{10}$/.test(phoneVal)) {
        showProfileToast("Phone must be exactly 10 digits.");
        return;
      }

      CRUD.updateRecord("customers", "customer_id", session.id, {
        full_name: nameVal,
        email: emailVal,
        phone: phoneVal ? countryCode + phoneVal : "",
        dob: dobVal,
      });
      // Updating session state in sessionStorage using the correct key
      const activeSession = Auth.getSession();
      if (activeSession) {
        activeSession.name = nameVal;
        activeSession.email = emailVal;
        sessionStorage.setItem("fsd_session", JSON.stringify(activeSession));
      }
    }
  }
  showProfileToast(
    section === "personal" ? "Personal info saved!" : "Changes saved!",
  );
}

// ===== ADDRESSES =====
let addresses = [];

function renderAddresses() {
  document.getElementById("addresses-list").innerHTML = addresses
    .map(
      (a) => `
    <div class="address-item">
      <div class="address-icon">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="address-body">
        <div class="address-tag">${a.tag}</div>
        <div class="address-text">${a.text}</div>
      </div>
      <div class="address-actions">
        <!-- Edit hidden for brevity -->
        <button class="addr-btn del" onclick="deleteAddress(${a.id})">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function saveAddressesToStore() {
  const session = Auth.getSession();
  if (session) {
    CRUD.updateRecord("customers", "customer_id", session.id, {
      saved_addresses: addresses,
    });
  }
}

function deleteAddress(id) {
  const idx = addresses.findIndex((a) => a.id === id);
  if (idx > -1) {
    addresses.splice(idx, 1);
    saveAddressesToStore();
    renderAddresses();
    showProfileToast("Address removed.");
  }
}

function saveNewAddress() {
  const inputEl = document.getElementById("new-address-input");
  if (!inputEl) return;
  const text = inputEl.value;
  if (text && text.trim()) {
    const newAddr = { id: Date.now(), tag: "Other", text: text.trim() };
    addresses.push(newAddr);
    saveAddressesToStore();
    renderAddresses();
    inputEl.value = "";
    document.getElementById("add-address-form").style.display = "none";
    showProfileToast("Address added!");
  } else {
    showProfileToast("Please enter an address.");
  }
}

// ===== PAYMENT METHODS =====
let payments = [];

function renderPayments() {
  document.getElementById("payment-list").innerHTML = payments
    .map(
      (p) => `
    <div class="payment-item">
      <div class="payment-icon" style="background:${p.bg}">
        <svg viewBox="0 0 24 24" style="stroke:${p.stroke}">
          ${
            p.type === "upi"
              ? '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'
              : '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="9" y2="15"/>'
          }
        </svg>
      </div>
      <div class="payment-body">
        <div class="payment-label">${p.label}</div>
        <div class="payment-sub">${p.sub}</div>
      </div>
      ${p.isDefault ? `<span class="payment-default">Default</span>` : `<button class="addr-btn" onclick="setDefaultPayment('${p.id}')">Set Default</button>`}
    </div>
  `,
    )
    .join("");
}

function savePaymentsToStore() {
  const session = Auth.getSession();
  if (session) {
    CRUD.updateRecord("customers", "customer_id", session.id, {
      saved_payments: payments,
    });
  }
}

function setDefaultPayment(id) {
  payments.forEach((p) => (p.isDefault = false));
  const match = payments.find((p) => p.id == id);
  if (match) match.isDefault = true;
  savePaymentsToStore();
  renderPayments();
  showProfileToast("Default payment method updated.");
}

// ===== PREFERENCES =====
let preferences = { email: true, sms: true };
function updatePreference(key, isChecked) {
  preferences[key] = isChecked;
  const session = Auth.getSession();
  if (session) {
    CRUD.updateRecord("customers", "customer_id", session.id, {
      preferences: preferences,
    });
  }
  showProfileToast(
    key === "email" ? "Email notifications updated" : "SMS reminders updated",
  );
}

// ===== RECENT ACTIVITY =====
const badgeCls = {
  completed: "badge-completed",
  upcoming: "badge-upcoming",
  cancelled: "badge-cancelled",
};
const badgeLbl = {
  completed: "Completed",
  upcoming: "Upcoming",
  cancelled: "Cancelled",
};

function renderActivity() {
  const session = Auth.getCurrentUser();
  if (!session) return;
  const allBookings = AppStore.getTable("bookings") || [];
  const myBookings = allBookings
    .filter((b) => b.customer_id === session.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  if (myBookings.length === 0) {
    document.getElementById("activity-list").innerHTML =
      '<p style="color:var(--text-2);font-size:14px;">No recent activity</p>';
    return;
  }

  document.getElementById("activity-list").innerHTML = myBookings
    .map((b) => {
      const dateObj = new Date(b.scheduled_at);
      const isPending = b.status === "PENDING";
      const isCancelled = b.status === "CANCELLED";
      const isPast = dateObj < new Date() && !isCancelled;
      const status = isCancelled
        ? "cancelled"
        : isPending || !isPast
          ? "upcoming"
          : "completed";

      const icon =
        status === "completed"
          ? `<rect x="2" y="7" width="20" height="12" rx="2"/><path d="M17 11h1M6 11h6"/>`
          : status === "cancelled"
            ? `<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>`
            : `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`;
      const bg =
        status === "completed"
          ? "#f0fdfa"
          : status === "cancelled"
            ? "#fee2e2"
            : "#eff6ff";
      const stroke =
        status === "completed"
          ? "#0d9488"
          : status === "cancelled"
            ? "#ef4444"
            : "#3b82f6";

      return `
        <div class="activity-item" onclick="window.location='bookings.html'">
          <div class="activity-dot" style="background:${bg}">
            <svg viewBox="0 0 24 24" style="stroke:${stroke}">${icon}</svg>
          </div>
          <div class="activity-body">
            <div class="activity-name">${b.service_name || "Home Service"}</div>
            <div class="activity-date">${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
          <span class="activity-badge ${badgeCls[status]}">${badgeLbl[status]}</span>
        </div>
      `;
    })
    .join("");
}

// ===== PASSWORD MODAL =====
function openPwdModal() {
  wirePasswordVisibilityToggles();
  document.getElementById("pwd-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closePwdModalBtn() {
  document.getElementById("pwd-modal").classList.remove("open");
  document.body.style.overflow = "";
  const fields = ["pwd-current", "pwd-new", "pwd-confirm"];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      el.type = "password";
    }
  });
  resetPasswordVisibilityToggles();
}
function closePwdModal(e) {
  if (e.target === document.getElementById("pwd-modal")) closePwdModalBtn();
}

function wirePasswordVisibilityToggles() {
  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    if (btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";

      const eyeOpen = btn.querySelector(".eye-open");
      const eyeClosed = btn.querySelector(".eye-closed");
      if (eyeOpen) eyeOpen.style.display = shouldShow ? "none" : "inline";
      if (eyeClosed) eyeClosed.style.display = shouldShow ? "inline" : "none";
    });
  });
}

function resetPasswordVisibilityToggles() {
  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    const eyeOpen = btn.querySelector(".eye-open");
    const eyeClosed = btn.querySelector(".eye-closed");
    if (eyeOpen) eyeOpen.style.display = "inline";
    if (eyeClosed) eyeClosed.style.display = "none";
  });
}

wirePasswordVisibilityToggles();

function savePassword() {
  const currentVal = document.getElementById("pwd-current")?.value;
  const newVal = document.getElementById("pwd-new")?.value;
  const confirmVal = document.getElementById("pwd-confirm")?.value;

  if (!currentVal || !newVal || !confirmVal) {
    showProfileToast("Please fill in all password fields.");
    return;
  }

  if (newVal !== confirmVal) {
    showProfileToast("Your new passwords do not perfectly match");
    return;
  }

  const passwordCheck =
    window.Auth && typeof Auth.validatePasswordPolicy === "function"
      ? Auth.validatePasswordPolicy(newVal)
      : { valid: newVal.length >= 8 };

  if (!passwordCheck.valid) {
    showProfileToast(
      passwordCheck.error ||
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character with no spaces.",
    );
    return;
  }

  const res = Auth.changePassword(currentVal, newVal);
  if (res.success) {
    showProfileToast("Password successfully updated!");
    closePwdModalBtn();
  } else {
    const errorMap = {
      invalid_current_password: "Current password is incorrect",
      invalid_new_password:
        res.message ||
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character with no spaces.",
      new_password_same_as_current:
        "New password must be different from current password.",
      not_logged_in: "Session expired. Please log in again.",
    };
    showProfileToast(errorMap[res.error] || "Failed to update password");
  }
}

// ===== DANGER & LOGOUT =====
function confirmDelete() {
  const session = Auth.getSession();
  if (!session || session.role !== "customer") {
    showProfileToast("Session expired. Please log in again.");
    return;
  }

  showConfirmDialog({
    title: "Delete Account",
    message:
      "Are you sure you want to permanently delete your account? This action cannot be reverted.",
    confirmLabel: "Delete Permanently",
    cancelLabel: "Cancel",
    onConfirm: () => {
      const customers = AppStore.getTable("customers") || [];
      const index = customers.findIndex((c) => c.customer_id === session.id);

      if (index === -1) {
        showProfileToast("Account not found.");
        return;
      }

      customers.splice(index, 1);

      if (Array.isArray(window.AuthRegistry)) {
        window.AuthRegistry = window.AuthRegistry.filter(
          (u) => !(u.role === "customer" && u.id === session.id),
        );
      }

      AppStore.save();
      Auth.logout();
    },
  });
}

function confirmLogout() {
  Auth.requestLogout();
}

// ===== INIT =====
AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  /* ── Personalize profile with session data ── */
  const heroName = document.getElementById("hero-name");
  const heroEmail = document.getElementById("hero-email");
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");

  if (heroName) heroName.textContent = session.name || "Your Name";
  if (heroEmail) heroEmail.textContent = session.email || "";
  if (fullNameInput) fullNameInput.value = session.name || "";
  if (emailInput) emailInput.value = session.email || "";

  /* ── Update avatar initials ── */
  const initials = (session.name || "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatar = document.getElementById("profile-avatar");
  if (avatar) {
    if (session.pfp_url) {
      avatar.innerHTML = `<img src="${session.pfp_url}" alt="avatar"/>`;
    } else if (!avatar.querySelector("img")) {
      avatar.textContent = initials || "U";
    }
  }

  // Load customer data to populate addresses/payments
  const customers = AppStore.getTable("customers") || [];
  const me = customers.find((c) => c.customer_id === session.id) || {};
  addresses = me.saved_addresses || [
    { id: 1, tag: "Home", text: me.address || "Address pending setup" },
  ];
  payments = me.saved_payments || [
    {
      id: "p1",
      type: "upi",
      label: session.email
        ? session.email.split("@")[0] + "@okaxis"
        : "user@upi",
      sub: "UPI",
      isDefault: true,
      bg: "#f0fdfa",
      stroke: "#0d9488",
    },
    {
      id: "p2",
      type: "card",
      label: "HDFC Bank •••• 4821",
      sub: "Visa Credit Card",
      isDefault: false,
      bg: "#eff6ff",
      stroke: "#2563eb",
    },
  ];

  const phoneInput = document.getElementById("phone");
  const dobInput = document.getElementById("dob");

  // Keep backward compatibility for old values with country code.
  const rawPhone = me.phone ? String(me.phone) : "";
  const digits = rawPhone.replace(/\D/g, "").slice(-10);
  if (phoneInput) phoneInput.value = digits;

  if (dobInput && me.dob) dobInput.value = me.dob;

  // Load preferences
  preferences =
    me.hasOwnProperty("preferences") && me.preferences
      ? me.preferences
      : { email: true, sms: true };
  const prefEmail = document.getElementById("pref-email");
  const prefSms = document.getElementById("pref-sms");
  if (prefEmail) prefEmail.checked = !!preferences.email;
  if (prefSms) prefSms.checked = !!preferences.sms;

  renderAddresses();
  renderPayments();
  renderActivity();
  updateCartBadge();
});
