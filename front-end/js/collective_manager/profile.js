// ── Collective Manager Profile JS ──
// Loaded after store.js + auth.js

let _session = null;
let _cm = null; // collective_manager row
let _collective = null; // collective row
let _myUnits = []; // units belonging to this collective

/* ─────────────────────────────────────────────
   BOOT — wait for AppStore then hydrate page
───────────────────────────────────────────── */
AppStore.ready.then(() => {
  // 1. Require a valid collective_manager session
  _session = Auth.requireSession(["collective_manager"]);
  if (!_session) return; // redirected by Auth

  const cmId = _session.id;
  const collectiveId = _session.collectiveId;

  // 2. Fetch rows from AppStore
  const allCMs = AppStore.getTable("collective_managers") || [];
  const allCollectives = AppStore.getTable("collectives") || [];
  const allUnits = AppStore.getTable("units") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allSectors = AppStore.getTable("sectors") || [];

  _cm = allCMs.find((c) => c.cm_id === cmId) || null;
  _collective =
    allCollectives.find((c) => c.collective_id === collectiveId) || null;
  _myUnits = allUnits.filter((u) => u.collective_id === collectiveId);

  // 3. Hydrate all UI sections
  hydrateHero(_cm, _collective, _myUnits, allProviders);
  hydratePersonalCard(_cm);
  hydrateCollectiveCard(_collective, allSectors);
  renderUnits(_myUnits, (allUnit) =>
    getUnitProviderCount(allUnit, allProviders),
  );
  renderActivities(_collective, _myUnits);
});

/* ─────────────────────────────────────────────
   HYDRATION HELPERS
───────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return "CM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function getUnitProviderCount(unit, allProviders) {
  return allProviders.filter((p) => p.unit_id === unit.unit_id).length;
}

function hydrateHero(cm, collective, units, allProviders) {
  const name = cm ? cm.name : "Collective Manager";
  const email = cm ? cm.email : "";
  const pfp = cm ? cm.pfp_url : null;
  const initials = getInitials(name);
  const unitCount = units.length;
  const unitIds = units.map((u) => u.unit_id);
  const provCount = allProviders.filter((p) =>
    unitIds.includes(p.unit_id),
  ).length;

  // Hero name / email
  document.getElementById("hero-name").textContent = name;
  document.getElementById("hero-email").textContent = email;

  // Avatar
  const av = document.getElementById("profile-avatar");
  if (pfp) {
    av.innerHTML = `<img src="${pfp}" alt="${name}" />`;
  } else {
    av.textContent = initials;
  }

  // Topbar avatar initials
  const topbarAv = document.getElementById("topbar-avatar");
  if (topbarAv) {
    if (pfp) {
      topbarAv.innerHTML = `<img src="${pfp}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    } else {
      topbarAv.textContent = initials;
    }
  }

  // Stats
  const unitsEl = document.getElementById("stat-units");
  if (unitsEl) unitsEl.textContent = unitCount;

  const provEl = document.getElementById("stat-providers");
  if (provEl) provEl.textContent = provCount;

  // Revenue stat is not in mock data — leave placeholder
}

function hydratePersonalCard(cm) {
  if (!cm) return;

  setVal("full-name", cm.name);
  setVal("email", cm.email);

  var rawPhone = cm.phone || "";
  var digits = String(rawPhone).replace(/\D/g, "").slice(-10);
  setVal("phone", digits);

  // DOB not in mock data — leave blank
  const dobEl = document.getElementById("dob");
  if (dobEl) dobEl.value = "";

  // Sync hero text too
  document.getElementById("hero-name").textContent = cm.name;
  document.getElementById("hero-email").textContent = cm.email;
}

function hydrateCollectiveCard(collective, allSectors) {
  if (!collective) return;

  setVal("collective-name", collective.collective_name);
  setVal("collective-id", collective.collective_id);

  // Derive region from the first sector linked to this collective
  const sectorIds = collective.sector_ids || [];
  const firstSector = allSectors.find((s) => sectorIds.includes(s.sector_id));
  if (firstSector) {
    setVal("region", firstSector.region);
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

/* ─────────────────────────────────────────────
   UNITS OVERVIEW
───────────────────────────────────────────── */
function renderUnits(units, countFn) {
  const el = document.getElementById("unit-list");
  if (!el) return;

  if (!units.length) {
    el.innerHTML =
      '<p style="color:var(--muted);font-size:.875rem;padding:.5rem 0">No units assigned to this collective.</p>';
    return;
  }

  el.innerHTML = units
    .map((u) => {
      const active = u.is_active;
      const dotCls = active ? "green" : "amber";
      const badgeText = active ? "Active" : "Inactive";
      const badgeCls = active ? "" : "amber";
      const count = countFn(u);
      return `
    <div class="unit-item">
      <div class="unit-item-left">
        <div class="unit-dot ${dotCls}"></div>
        <div>
          <div class="unit-name">${u.unit_name}</div>
          <div class="unit-sub">${count} provider${count !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <span class="unit-badge ${badgeCls}">${badgeText}</span>
    </div>
  `;
    })
    .join("");
}

/* ─────────────────────────────────────────────
   RECENT ACTIVITY  (derived from live data)
───────────────────────────────────────────── */
function renderActivities(collective, units) {
  const el = document.getElementById("activity-list");
  if (!el) return;

  // Build a plausible activity list from real data
  const events = [];

  if (collective) {
    events.push({
      title: "Collective created",
      desc: `${collective.collective_name} was registered on the platform`,
      time: formatDate(collective.created_at),
      color: "green",
    });
  }

  units.slice(0, 4).forEach((u) => {
    events.push({
      title: "Unit assigned",
      desc: `${u.unit_name} is part of your collective`,
      time: formatDate(u.created_at),
      color: u.is_active ? "" : "amber",
    });
  });

  if (!events.length) {
    el.innerHTML =
      '<p style="color:var(--muted);font-size:.875rem;padding:.5rem 0">No recent activity.</p>';
    return;
  }

  el.innerHTML = events
    .map(
      (a) => `
    <div class="act-item">
      <div class="act-dot ${a.color}"></div>
      <div class="act-body">
        <div class="act-title">${a.title}</div>
        <div class="act-desc">${a.desc}</div>
        <div class="act-time">${a.time}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    return new Date(isoStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return isoStr;
  }
}

/* ─────────────────────────────────────────────
   SYNC FUNCTIONS (called by oninput in HTML)
───────────────────────────────────────────── */
function syncName() {
  const v = document.getElementById("full-name").value.trim();
  const fallback = _cm && _cm.name ? _cm.name : "Collective Manager";
  document.getElementById("hero-name").textContent = v || fallback;

  const av = document.getElementById("profile-avatar");
  // Only update text initials (not if img tag is rendered)
  if (!av.querySelector("img")) {
    av.textContent = getInitials(v || fallback);
  }

  const topbarAv = document.getElementById("topbar-avatar");
  if (topbarAv && !topbarAv.querySelector("img")) {
    topbarAv.textContent = getInitials(v || fallback);
  }
}

function syncEmail() {
  const v = document.getElementById("email").value.trim();
  const fallback = _cm && _cm.email ? _cm.email : "";
  document.getElementById("hero-email").textContent = v || fallback;
}

/* ─────────────────────────────────────────────
   SAVE / MODAL / TOAST
───────────────────────────────────────────── */
function saveSection(section) {
  if (section === "personal") {
    if (!_cm) {
      showToast("Profile not loaded.");
      return;
    }

    var name = (document.getElementById("full-name").value || "").trim();
    var email = (document.getElementById("email").value || "").trim();
    var rawPhone = (document.getElementById("phone").value || "").trim();
    var dob =
      (document.getElementById("dob")
        ? document.getElementById("dob").value
        : "") || "";

    if (!name) {
      showToast("Name cannot be empty.");
      return;
    }
    if (rawPhone && !/^\d{10}$/.test(rawPhone)) {
      showToast("Phone must be exactly 10 digits.");
      return;
    }

    _cm.name = name;
    _cm.email = email;
    _cm.phone = rawPhone;
    if (dob) _cm.dob = dob;
    _cm.updated_at = new Date().toISOString();

    AppStore.save();

    document.getElementById("hero-name").textContent = name;
    document.getElementById("hero-email").textContent = email;
    showToast("Personal information saved ✓");
    return;
  }

  if (section === "collective") {
    if (!_collective) {
      showToast("Collective not loaded.");
      return;
    }

    var collectiveName = (
      document.getElementById("collective-name").value || ""
    ).trim();
    var region = (document.getElementById("region").value || "").trim();

    if (!collectiveName) {
      showToast("Collective name cannot be empty.");
      return;
    }

    _collective.collective_name = collectiveName;
    if (region) _collective.region = region;
    _collective.updated_at = new Date().toISOString();

    AppStore.save();
    showToast("Collective details saved ✓");
    return;
  }

  showToast("Changes saved!");
}

function openPwdModal() {
  wirePasswordVisibilityToggles();
  document.getElementById("pwd-modal").classList.add("open");
}
function closePwdModal(e) {
  if (e.target === document.getElementById("pwd-modal")) closePwdModalBtn();
}
function closePwdModalBtn() {
  document.getElementById("pwd-modal").classList.remove("open");
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

  const passwordCheck =
    window.Auth && typeof Auth.validatePasswordPolicy === "function"
      ? Auth.validatePasswordPolicy(newPwd)
      : { valid: newPwd.length >= 8 };

  if (!passwordCheck.valid) {
    showToast(
      passwordCheck.error ||
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character with no spaces.",
    );
    return;
  }

  const res = Auth.changePassword(currentPwd, newPwd);
  if (res.success) {
    showToast("Password updated successfully!");
    closePwdModalBtn();
  } else {
    const errorMap = {
      invalid_current_password: "Current password is incorrect.",
      invalid_new_password:
        res.message ||
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character with no spaces.",
      new_password_same_as_current:
        "New password must be different from current password.",
      not_logged_in: "Session expired. Please log in again.",
    };
    showToast(errorMap[res.error] || "Failed to update password.");
  }
}

function updateAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith("image/")) {
    showToast("Please choose a valid image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("Profile photo must be under 2 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;
    const res = Auth.updateProfilePicture(imageData);
    if (!res.success) {
      showToast("Unable to update profile photo.");
      return;
    }

    if (_cm) {
      _cm.pfp_url = imageData;
    }

    document.getElementById("profile-avatar").innerHTML =
      `<img src="${imageData}" alt="avatar" />`;
    const topbarAv = document.getElementById("topbar-avatar");
    if (topbarAv) {
      topbarAv.innerHTML = `<img src="${imageData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    }
    showToast("Profile photo updated ✓");
  };
  reader.readAsDataURL(file);
}

function confirmDelete() {
  if (
    confirm(
      "Are you sure you want to deactivate your account? This cannot be undone.",
    )
  ) {
    showToast("Account deactivation requested. You will be contacted shortly.");
  }
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
