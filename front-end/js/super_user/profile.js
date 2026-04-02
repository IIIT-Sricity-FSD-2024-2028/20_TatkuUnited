/* profile.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allBookings = AppStore.getTable("bookings") || [];
  const allTransactions = AppStore.getTable("transactions") || [];
  const allSuperUsers = AppStore.getTable("super_users") || [];
  const currentUser = Auth.getCurrentUser();



  const permissions = [
    {
      name: "Full User Management",
      desc: "Create, suspend, delete any account",
      cls: "",
    },
    {
      name: "Platform Configuration",
      desc: "Modify all system settings",
      cls: "",
    },
    {
      name: "Financial Controls",
      desc: "Access revenue, payout & billing data",
      cls: "",
    },
    {
      name: "Security Administration",
      desc: "Manage roles, sessions & 2FA enforcement",
      cls: "",
    },
    {
      name: "Audit Log Access",
      desc: "View complete system event history",
      cls: "",
    },
    {
      name: "Emergency Overrides",
      desc: "Force-terminate jobs and escalate issues",
      cls: "yellow",
    },
  ];



  /* ── 5. Render functions ── */
  function renderPermissions() {
    const el = document.getElementById("perm-list");
    if (!el) return;
    el.innerHTML = permissions
      .map(
        (p) => `
      <div class="perm-item ${p.cls}">
        <div class="perm-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div class="perm-name">${p.name}</div>
          <div class="perm-desc">${p.desc}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }



  function syncName() {
    const v = document.getElementById("full-name")?.value.trim();
    const heroName = document.getElementById("hero-name");
    const topbarName = document.getElementById("topbar-name");
    if (heroName) heroName.textContent = v || "Super User";
    if (topbarName) topbarName.textContent = v || "Super User";
  }

  function syncEmail() {
    const v = document.getElementById("email")?.value.trim();
    const heroEmail = document.getElementById("hero-email");
    if (heroEmail) heroEmail.textContent = v || "super_user@tatku.com";
  }

  function saveSection(section) {
    if (section === 'personal') {
      const suTable = AppStore.getTable('super_users') || [];
      const session = Auth.getSession();
      const suRow = suTable.find(s => s.super_user_id === (session && session.id));

      const name  = (document.getElementById('full-name')?.value || '').trim();
      const rawPhone = (document.getElementById('phone')?.value || '').trim();
      const codeSpan = document.getElementById('phone-code');
      const countryCode = codeSpan ? codeSpan.textContent : '+91';

      if (!name) { showToast('Name cannot be empty.'); return; }
      if (rawPhone && !/^\d{10}$/.test(rawPhone)) {
        showToast('Phone must be exactly 10 digits.'); return;
      }

      if (suRow) {
        suRow.name  = name;
        suRow.phone = rawPhone ? countryCode + rawPhone : (suRow.phone || '');
        suRow.updated_at = new Date().toISOString();
        AppStore.save();
      }

      syncName();
      syncEmail();
      showToast('Super User profile saved successfully ✓');
      return;
    }
    showToast('Changes saved!');
  }

  function openPwdModal() {
    const pwdModal = document.getElementById("pwd-modal");
    if (pwdModal) pwdModal.classList.add("open");
  }

  function closePwdModal(e) {
    if (e.target === document.getElementById("pwd-modal")) closePwdModalBtn();
  }

  function closePwdModalBtn() {
    const pwdModal = document.getElementById("pwd-modal");
    if (pwdModal) pwdModal.classList.remove("open");
    // Clear fields
    const fields = ["pwd-current", "pwd-new", "pwd-confirm"];
    fields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  function handlePasswordChange() {
    const currentPwd = document.getElementById("pwd-current")?.value;
    const newPwd = document.getElementById("pwd-new")?.value;
    const confirmPwd = document.getElementById("pwd-confirm")?.value;

    if (!currentPwd || !newPwd || !confirmPwd) {
      showToast("Please fill in all password fields.");
      return;
    }

    if (newPwd !== confirmPwd) {
      showToast("New passwords do not match.");
      return;
    }

    if (newPwd.length < 12) {
      showToast("New password must be at least 12 characters.");
      return;
    }

    const res = Auth.changePassword(currentPwd, newPwd);
    if (res.success) {
      showToast("Password updated successfully!");
      closePwdModalBtn();
    } else {
      const errorMap = {
        invalid_current_password: "Current password is incorrect.",
        not_logged_in: "Session expired. Please log in again.",
      };
      showToast(errorMap[res.error] || "Failed to update password.");
    }
  }

  // Export to window for HTML onclick/oninput handlers
  window.openPwdModal = openPwdModal;
  window.closePwdModal = closePwdModal;
  window.closePwdModalBtn = closePwdModalBtn;
  window.handlePasswordChange = handlePasswordChange;
  window.syncName = syncName;
  window.syncEmail = syncEmail;
  window.saveSection = saveSection;
  window.updateAvatar = updateAvatar;

  function updateAvatar(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const av = document.getElementById("profile-avatar");
      if (av)
        av.innerHTML = `<img src="${e.target.result}" alt="Super User" />`;
    };
    reader.readAsDataURL(input.files[0]);
  }

  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
    }
  }

  /* ── Event Listeners ── */
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");

  if (fullNameInput) fullNameInput.addEventListener("input", syncName);
  if (emailInput) emailInput.addEventListener("input", syncEmail);

  /* ── Initialize on DOM ready ── */
  function init() {
    if (currentUser) {
      const nameEl = document.getElementById("full-name");
      const emailEl = document.getElementById("email");
      const phoneEl = document.getElementById("phone");
      const codeSpan = document.getElementById("phone-code");
      const idEl = document.getElementById("super-user-id");

      if(nameEl) nameEl.value = currentUser.name || '';
      if(emailEl) emailEl.value = currentUser.email || '';

      // Parse phone: detect and strip country code
      const rawPhone = currentUser.phone || '';
      const CODES = ['+971', '+44', '+65', '+91', '+61', '+1'];
      let matchedCode = '+91';
      let digits = rawPhone;
      for (const c of CODES) {
        if (rawPhone.startsWith(c)) {
          matchedCode = c;
          digits = rawPhone.slice(c.length);
          break;
        }
      }
      if (codeSpan) codeSpan.textContent = matchedCode;
      if (phoneEl) phoneEl.value = digits;

      if(idEl) idEl.value = currentUser.id || '';

      const avatarEl = document.getElementById("profile-avatar");
      if(avatarEl && currentUser.pfp_url) {
        avatarEl.innerHTML = `<img src="${currentUser.pfp_url}" alt="Super User" style="border-radius:50%;width:100%;height:100%;object-fit:cover;" />`;
      }
      syncName();
      syncEmail();
    }
    
    // Populate Hero Stats dynamically
    const collectivesCount = (AppStore.getTable("collectives") || []).length;
    const unitsCount = (AppStore.getTable("units") || []).filter(u => u.is_active).length;
    const totalUsers = (window.AuthRegistry || []).length;
    
    const collEl = document.getElementById("hero-collectives");
    const unitsEl = document.getElementById("hero-units");
    const usersEl = document.getElementById("hero-users");
    
    if(collEl) collEl.textContent = collectivesCount;
    if(unitsEl) unitsEl.textContent = unitsCount;
    if(usersEl) usersEl.textContent = totalUsers;

    renderPermissions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
});
