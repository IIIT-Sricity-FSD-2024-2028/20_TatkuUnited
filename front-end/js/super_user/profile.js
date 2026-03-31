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
    showToast("Super User profile saved successfully!");
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
  }

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
      const idEl = document.querySelector(".readonly-field");
      
      if(nameEl) nameEl.value = currentUser.name || '';
      if(emailEl) emailEl.value = currentUser.email || '';
      if(phoneEl) phoneEl.value = currentUser.phone ? currentUser.phone.replace('+91', '') : '';
      if(idEl) idEl.value = currentUser.id || 'ADM-001';
      
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
