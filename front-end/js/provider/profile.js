// ── Work Hours (persisted via API) ───────────────────────────────
const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";
let _spId = null;

function getWorkHours() {
  return {
    start: document.getElementById("work-start")?.value || DEFAULT_START,
    end: document.getElementById("work-end")?.value || DEFAULT_END,
  };
}

function initWorkHours() {
  const { start, end } = getWorkHours();
  const startEl = document.getElementById("work-start");
  const endEl = document.getElementById("work-end");
  if (startEl) startEl.value = start;
  if (endEl) endEl.value = end;
  updateWorkHoursPreview();
}

function updateWorkHoursPreview() {
  const startEl = document.getElementById("work-start");
  const endEl = document.getElementById("work-end");
  const preview = document.getElementById("work-hours-preview");
  if (!startEl || !endEl || !preview) return;

  const start = startEl.value;
  const end = endEl.value;

  if (start >= end) {
    preview.textContent = "⚠ End time must be after start time.";
    preview.style.color = "var(--accent-red)";
    return;
  }

  const fmt = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const totalMins = endMin - startMin;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const dur = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

  preview.textContent = `Active window: ${fmt(start)} – ${fmt(end)} (${dur})`;
  preview.style.color = "var(--accent-green)";
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

async function saveWorkHours() {
  const { start, end } = getWorkHours();
  if (start >= end) {
    showToast("⚠ End time must be after start time.", true);
    return;
  }

  if (_spId) {
    try {
      await Api.patch("/service-providers/working-hours/" + _spId, {
        hour_start: start,
        hour_end: end,
      });
      showToast("Work hours saved!");
    } catch (err) {
      showToast("Failed to save work hours.", true);
    }
  }
  updateWorkHoursPreview();
}

async function saveSection(section) {
  if (!_spId) return;

  if (section === "personal") {
    const nameEl = document.getElementById("full-name");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const addrEl = document.getElementById("address");

    const payload = {};
    if (nameEl) payload.name = nameEl.value;
    if (emailEl) payload.email = emailEl.value;
    if (phoneEl) payload.phone = (phoneEl.value || "").trim();
    if (addrEl) payload.address = addrEl.value;

    try {
      await Api.patch("/service-providers/" + _spId, payload);
      if (payload.name) {
        document.querySelectorAll(".user-chip span").forEach((el) => (el.textContent = payload.name));
      }
    } catch (err) {
      console.error("[profile] Save failed:", err);
      return;
    }
  } else if (section === "professional") {
    const skillsRows = document.querySelectorAll(".skill-row");
    const skills = Array.from(skillsRows).map((row) => row.getAttribute("data-skill"));
    const serviceCatEl = document.getElementById("service-cat");
    const experienceEl = document.getElementById("experience");

    const payload = { skills };
    if (serviceCatEl) payload.service_category = serviceCatEl.value;
    if (experienceEl) payload.experience = experienceEl.value;

    try {
      await Api.patch("/service-providers/" + _spId, payload);
    } catch (err) {
      console.error("[profile] Save failed:", err);
      return;
    }
  }

  showToast(
    section === "personal" ? "Personal info saved!" : "Professional details saved!",
  );
}

function renderProviderAvatar(imageSrc, name) {
  const avatarEl = document.getElementById("profile-avatar");
  if (!avatarEl) return;

  if (imageSrc) {
    avatarEl.innerHTML = `<img src="${imageSrc}" alt="Provider avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    return;
  }

  const fallback = (name || "Provider")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  avatarEl.textContent = fallback || "P";
}

function updateAvatar(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];

  if (!file.type.startsWith("image/")) {
    showToast("Please choose a valid image file.", true);
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast("Profile photo must be under 2 MB.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;
    const authRes = Auth.updateProfilePicture(imageData);
    if (!authRes.success) {
      showToast("Unable to update profile photo.", true);
      return;
    }

    renderProviderAvatar(
      imageData,
      document.getElementById("full-name")?.value,
    );
    document.querySelectorAll(".user-avatar").forEach((el) => {
      el.innerHTML = `<img src="${imageData}" alt="Provider" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    });
    showToast("Profile photo updated ✓");
  };
  reader.readAsDataURL(file);
}

// ── Resume & Certificates Upload ─────────────────────────────────────────────
const ALLOWED_RESUME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_CERTS = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Tracks uploaded files per list so duplicates are rejected
const uploadedFiles = { "resume-list": [], "certs-list": [] };

function handleDragOver(e, zoneId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.add("drag-over");
}

function handleDragLeave(zoneId) {
  document.getElementById(zoneId).classList.remove("drag-over");
}

function handleDrop(e, inputId) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  const zoneId = input.closest(".upload-zone").id;
  document.getElementById(zoneId).classList.remove("drag-over");

  const listId = inputId === "resume-input" ? "resume-list" : "certs-list";
  const multi = inputId === "certs-input";
  const allowed = multi ? ALLOWED_CERTS : ALLOWED_RESUME;

  const files = Array.from(e.dataTransfer.files);
  processFiles(files, listId, multi, allowed);
}

function handleFileSelect(input, listId, multi) {
  const allowed = multi ? ALLOWED_CERTS : ALLOWED_RESUME;
  const files = Array.from(input.files);
  processFiles(files, listId, multi, allowed);
  input.value = ""; // reset so same file can be re-selected after removal
}

function processFiles(files, listId, multi, allowed) {
  if (!multi) {
    // For resume: replace existing file
    uploadedFiles[listId] = [];
    document.getElementById(listId).innerHTML = "";
  }

  let rejected = 0;
  for (const file of files) {
    if (!allowed.includes(file.type)) {
      rejected++;
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected++;
      continue;
    }
    if (
      uploadedFiles[listId].some(
        (f) => f.name === file.name && f.size === file.size,
      )
    )
      continue;

    uploadedFiles[listId].push(file);
    renderFileItem(file, listId);
  }

  if (rejected)
    showToast(`${rejected} file(s) skipped — wrong type or over 5 MB.`, true);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon() {
  return `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}

function renderFileItem(file, listId) {
  const list = document.getElementById(listId);
  const item = document.createElement("div");
  item.className = "upload-file-item";
  item.dataset.name = file.name;
  item.dataset.size = file.size;
  item.innerHTML = `
    <div class="upload-file-icon">${getFileIcon()}</div>
    <div class="upload-file-info">
      <div class="upload-file-name" title="${file.name}">${file.name}</div>
      <div class="upload-file-size">${formatBytes(file.size)}</div>
    </div>
    <div class="upload-file-status">
      <svg viewBox="0 0 24 24" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
      Uploaded
    </div>
    <button class="btn-remove-file" title="Remove" onclick="removeUploadedFile(this, '${listId}')">
      <svg viewBox="0 0 24 24" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  list.appendChild(item);
}

function removeUploadedFile(btn, listId) {
  const item = btn.closest(".upload-file-item");
  const name = item.dataset.name;
  const size = Number(item.dataset.size);
  uploadedFiles[listId] = uploadedFiles[listId].filter(
    (f) => !(f.name === name && f.size === size),
  );
  item.style.animation = "none";
  item.style.opacity = "0";
  item.style.transform = "translateY(-4px)";
  item.style.transition = "opacity .18s, transform .18s";
  setTimeout(() => item.remove(), 180);
}

function toggleAddSkill() {
  const panel = document.getElementById("add-skill-panel");
  const toggle = document.getElementById("add-skill-toggle");
  const open = panel.classList.toggle("open");
  toggle.classList.toggle("open", open);
}

// ── Skills: dynamic fetch & render ──────────────────────────────────────────
let _allSkills = [];      // from /skills
let _providerSkills = []; // from /provider-skills/provider/{id}

async function fetchAndRenderSkills() {
  if (!_spId) return;

  try {
    _allSkills = await Api.get("/skills", { silent: true }) || [];
  } catch (_) { _allSkills = []; }

  try {
    _providerSkills = await Api.get("/provider-skills/provider/" + _spId, { silent: true }) || [];
  } catch (_) { _providerSkills = []; }

  renderSkillsList();
  populateSkillDropdown();
}

function renderSkillsList() {
  const skillsList = document.getElementById("skills-list");
  if (!skillsList) return;

  if (_providerSkills.length === 0) {
    skillsList.innerHTML = `<div style="color:var(--text-secondary,#94a3b8); font-size:0.85rem; padding:8px 0;">No skills registered yet.</div>`;
    return;
  }

  skillsList.innerHTML = _providerSkills.map(ps => {
    const skill = _allSkills.find(s => s.skill_id === ps.skill_id);
    const skillName = skill ? skill.skill_name : ps.skill_id;
    const isVerified = ps.verification_status === "Verified";

    if (isVerified) {
      return `
      <div class="skill-row" data-skill="${skillName}" data-skill-id="${ps.skill_id}">
        <span class="skill-badge">
          <svg viewBox="0 0 24 24" width="13" height="13">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          ${skillName}
        </span>
      </div>`;
    } else {
      return `
      <div class="skill-row new-skill-anim" data-skill="${skillName}" data-skill-id="${ps.skill_id}">
        <span class="skill-badge" style="background:var(--primary-light,#eff6ff); color:var(--primary,#3b82f6); border:none;">
          <svg viewBox="0 0 24 24" width="13" height="13">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${skillName}
          <span style="font-size:0.7rem; opacity:0.8; margin-left:4px;">(Pending Approval)</span>
        </span>
      </div>`;
    }
  }).join("");
}

function populateSkillDropdown() {
  const select = document.getElementById("new-skill-select");
  if (!select) return;

  // Keep only the placeholder
  select.innerHTML = `<option value="">— Choose a skill —</option>`;

  // Exclude skills the provider already has (verified or pending)
  const heldSkillIds = new Set(_providerSkills.map(ps => ps.skill_id));
  const available = _allSkills.filter(s => !heldSkillIds.has(s.skill_id));

  available.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.skill_id;
    opt.textContent = s.skill_name;
    select.appendChild(opt);
  });
}

async function requestVerifySkill() {
  const select = document.getElementById("new-skill-select");
  const skillId = select.value;

  if (!skillId) {
    showToast("Please choose a skill from the list first.", true);
    return;
  }

  const btn = document.getElementById("btn-request-verify");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    await Api.post("/provider-skills", {
      service_provider_id: _spId,
      skill_id: skillId,
    });

    btn.textContent = "Added ✓";
    const skill = _allSkills.find(s => s.skill_id === skillId);
    showToast(`Skill "${skill ? skill.skill_name : skillId}" requested for verification.`);

    // Re-fetch and re-render skills
    await fetchAndRenderSkills();

    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Request Verification`;
      btn.disabled = false;
      select.value = "";
      toggleAddSkill();
    }, 1000);
  } catch (err) {
    console.error("[profile] Skill request failed:", err);
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Request Verification`;
    btn.disabled = false;
  }
}

function showPasswordModal() {
  document.getElementById("pwd-modal").classList.add("open");
}
function closePwdModalBtn() {
  document.getElementById("pwd-modal").classList.remove("open");
  const fields = ["pwd-current", "pwd-new", "pwd-confirm"];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
function closePwdModal(e) {
  if (e.target === document.getElementById("pwd-modal")) closePwdModalBtn();
}

function handlePasswordChange() {
  const currentPwd = document.getElementById("pwd-current")?.value;
  const newPwd = document.getElementById("pwd-new")?.value;
  const confirmPwd = document.getElementById("pwd-confirm")?.value;

  if (!currentPwd || !newPwd || !confirmPwd) {
    showToast("Please fill in all password fields.", true);
    return;
  }

  if (newPwd.length < 8) {
    showToast("New password must be at least 8 characters.", true);
    return;
  }

  if (newPwd !== confirmPwd) {
    showToast("New passwords do not match.", true);
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
    showToast(errorMap[res.error] || "Failed to update password.", true);
  }
}

async function confirmDeactivate() {
  if (!_spId) return;

  if (!confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) return;

  try {
    await Api.patch("/service-providers/" + _spId, {
      is_active: false,
      account_status: "inactive",
    });
    showToast("Account deactivated successfully. Logging out...");
    setTimeout(() => {
      Auth.logout();
    }, 2000);
  } catch (err) {
    console.error("[profile] Deactivate failed:", err);
  }
}

function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.background = isError ? "var(--accent-red)" : "#0f172a";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function updateDeactivationUI(status) {
  const deactBtn = document.querySelector(".btn-deactivate");
  const deactSub = document.querySelector(".danger-sub");
  if (!deactBtn || !deactSub) return;
  if (status === "pending_deactivation") {
    deactBtn.disabled = true;
    deactBtn.style.opacity = "0.5";
    deactBtn.textContent = "Pending...";
    deactSub.innerHTML = `<span style="color:var(--accent-red); font-weight:600;">⚠ Account deactivation will occur automatically once your remaining jobs are completed.</span>`;
  } else if (status === "inactive") {
    deactBtn.disabled = true;
    deactBtn.textContent = "Deactivated";
    deactSub.textContent = "Account deactivated.";
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
(async () => {
  const session = Auth.requireSession(["provider"]);
  if (!session) return;
  _spId = session.id;

  let sp = {};
  try {
    sp = await Api.get("/service-providers/" + _spId, { silent: true }) || {};
  } catch (_) {}

  updateDeactivationUI(sp.account_status);

  // Topbar
  document.querySelectorAll(".user-chip span").forEach((el) => (el.textContent = session.name || "Provider"));
  if (sp.pfp_url) {
    document.querySelectorAll(".user-avatar").forEach((el) => {
      el.innerHTML = `<img src="${sp.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    });
  }

  renderProviderAvatar(sp.pfp_url, sp.name);

  // Personal info
  const nameEl = document.getElementById("full-name");
  const emailEl = document.getElementById("email");
  const phoneEl = document.getElementById("phone");
  const addrEl = document.getElementById("address");

  if (nameEl) nameEl.value = sp.name || "";
  if (emailEl) emailEl.value = sp.email || "";
  if (phoneEl) {
    const rawPhone = sp.phone ? String(sp.phone) : "";
    phoneEl.value = rawPhone.replace(/\D/g, "").slice(-10);
  }
  if (addrEl) addrEl.value = sp.address || "";

  // Professional
  const serviceCatEl = document.getElementById("service-cat");
  const experienceEl = document.getElementById("experience");
  if (serviceCatEl) serviceCatEl.value = sp.service_category || "Home Cleaning";
  if (experienceEl) experienceEl.value = sp.experience || "8";

  // Skills – fetch from provider-skills API
  await fetchAndRenderSkills();


  // Files
  if (sp.resumeFiles && sp.resumeFiles.length > 0) {
    sp.resumeFiles.forEach((f) => {
      uploadedFiles["resume-list"].push(f);
      renderFileItem(f, "resume-list");
    });
  }
  if (sp.certFiles && sp.certFiles.length > 0) {
    sp.certFiles.forEach((f) => {
      uploadedFiles["certs-list"].push(f);
      renderFileItem(f, "certs-list");
    });
  }

  // Work hours
  try {
    // Working hours are stored on the provider object itself
    const wh = await Api.get("/service-providers/" + _spId, { silent: true });
    if (wh && wh.hour_start) {
      const whStartEl = document.getElementById("work-start");
      const whEndEl = document.getElementById("work-end");
      if (whStartEl) whStartEl.value = wh.hour_start;
      if (whEndEl) whEndEl.value = wh.hour_end;
    }
  } catch (_) {}

  initWorkHours();
})();
