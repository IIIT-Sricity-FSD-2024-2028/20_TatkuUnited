// ── Work Hours (persisted via shared store) ──────────────────────────────────
const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";

function getWorkHours() {
  const data = window.getData ? window.getData() : null;
  if (data && data.workingHours) {
    return {
      start: data.workingHours.start || DEFAULT_START,
      end: data.workingHours.end || DEFAULT_END,
    };
  }
  return { start: DEFAULT_START, end: DEFAULT_END };
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

function saveWorkHours() {
  const startEl = document.getElementById("work-start");
  const endEl = document.getElementById("work-end");
  if (!startEl || !endEl) return;

  const start = startEl.value;
  const end = endEl.value;

  if (start >= end) {
    showToast("⚠ End time must be after start time.", true);
    return;
  }

  if (window.getData) {
    const data = window.getData();
    if (data) {
      if (!data.workingHours) data.workingHours = {};
      data.workingHours.start = start;
      data.workingHours.end = end;
      window.setData(data);
    }
  }

  updateWorkHoursPreview();
  showToast("Work hours saved!");
}

function saveSection(section) {
  if (window.getData) {
    const data = window.getData();
    if (data && data.provider) {
      if (section === "personal") {
        const nameEl = document.getElementById("full-name");
        const emailEl = document.getElementById("email");
        const phoneEl = document.getElementById("phone");
        const addrEl = document.getElementById("address");

        if (nameEl) data.provider.name = nameEl.value;
        if (emailEl) data.provider.email = emailEl.value;
        if (phoneEl) {
          data.provider.phone = (phoneEl.value || "").trim();
        }

        if (addrEl) data.provider.address = addrEl.value;

        // Update topbar instantly
        document
          .querySelectorAll(".user-chip span")
          .forEach((el) => (el.textContent = data.provider.name || "Provider"));
      } else if (section === "professional") {
        const skillsRows = document.querySelectorAll(".skill-row");
        data.provider.skills = Array.from(skillsRows).map((row) =>
          row.getAttribute("data-skill"),
        );

        // Serialize File objects generically for JSON mock-storage safety
        data.provider.resumeFiles = uploadedFiles["resume-list"].map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type || "application/pdf",
        }));
        data.provider.certFiles = uploadedFiles["certs-list"].map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type || "application/pdf",
        }));

        const serviceCatEl = document.getElementById("service-cat");
        const experienceEl = document.getElementById("experience");
        if (serviceCatEl) data.provider.service_category = serviceCatEl.value;
        if (experienceEl) data.provider.experience = experienceEl.value;
      }

      window.setData(data);
    }
  }
  showToast(
    section === "personal"
      ? "Personal info saved!"
      : "Professional details saved!",
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

    if (window.getData && window.setData) {
      const data = window.getData();
      if (data && data.provider) {
        data.provider.pfp_url = imageData;
        window.setData(data);
      }
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

function requestVerifySkill() {
  const select = document.getElementById("new-skill-select");
  const skill = select.value;

  if (!skill) {
    showToast("Please choose a skill from the list first.", true);
    return;
  }

  const list = document.getElementById("skills-list");
  if (list && !document.querySelector(`.skill-row[data-skill="${skill}"]`)) {
    const el = document.createElement("div");
    el.className = "skill-row new-skill-anim";
    el.setAttribute("data-skill", skill);
    el.innerHTML = `<span class="skill-badge" style="background:var(--primary-light); color:var(--primary); border:none;"><svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${skill}</span>`;
    list.appendChild(el);
  }

  const btn = document.getElementById("btn-request-verify");
  btn.disabled = true;
  btn.textContent = "Added ✓";

  setTimeout(() => {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Request Verification`;
    btn.disabled = false;
    select.value = "";
    toggleAddSkill();

    // Auto-save the new skill to global state
    saveSection("professional");
  }, 1000);

  showToast(`Skill "${skill}" requested for verification.`);
}

function showPasswordModal() {
  wirePasswordVisibilityToggles();
  document.getElementById("pwd-modal").classList.add("open");
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

function handlePasswordChange() {
  const currentPwd = document.getElementById("pwd-current")?.value;
  const newPwd = document.getElementById("pwd-new")?.value;
  const confirmPwd = document.getElementById("pwd-confirm")?.value;

  if (!currentPwd || !newPwd || !confirmPwd) {
    showToast("Please fill in all password fields.", true);
    return;
  }

  if (newPwd !== confirmPwd) {
    showToast("New passwords do not match.", true);
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
      true,
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
    showToast(errorMap[res.error] || "Failed to update password.", true);
  }
}

function confirmDeactivate() {
  const data = window.getData();
  if (!data || !data.provider) return;

  if (data.provider.account_status === "inactive") {
    showToast("Account is already deactivated.", true);
    return;
  }

  if (
    confirm(
      "Are you sure you want to deactivate your account? This action cannot be undone.",
    )
  ) {
    const unfinishedJobs = data.jobs.filter((j) =>
      ["assigned", "inprogress", "pending"].includes(j.status),
    );

    if (unfinishedJobs.length === 0) {
      // Immediate deactivation
      data.provider.account_status = "inactive";
      data.provider.is_active = false;
      data.provider.deactivation_requested = true;
      window.setData(data);
      showToast("Account deactivated successfully. Logging out...");
      setTimeout(() => {
        window.location.href = "../auth_pages/logout.html";
      }, 2000);
    } else {
      // Pending deactivation
      data.provider.account_status = "pending_deactivation";
      data.provider.deactivation_requested = true;
      window.setData(data);
      updateDeactivationUI("pending_deactivation");
      showToast(
        "Notice: Your account will only deactivate once all currently assigned jobs are completed.",
      );
    }
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
document.addEventListener("DOMContentLoaded", () => {
  if (window.initData) {
    window.initData().then(() => {
      const data = window.getData();
      if (!data || !data.provider) return;

      const sp = data.provider;
      updateDeactivationUI(sp.account_status);

      // Topbar styling
      document
        .querySelectorAll(".user-chip span")
        .forEach((el) => (el.textContent = sp.name || "Provider"));
      if (sp.pfp_url) {
        document.querySelectorAll(".user-avatar").forEach((el) => {
          el.innerHTML = `<img src="${sp.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        });
      }

      renderProviderAvatar(sp.pfp_url, sp.name);

      // Fill Personal Information
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

      // Fill Professional Details
      const serviceCatEl = document.getElementById("service-cat");
      const experienceEl = document.getElementById("experience");
      if (serviceCatEl)
        serviceCatEl.value = sp.service_category || "Home Cleaning";
      if (experienceEl) experienceEl.value = sp.experience || "8";

      // Fill Skills Data
      const skillsList = document.getElementById("skills-list");
      if (skillsList && sp.skills) {
        skillsList.innerHTML = sp.skills
          .map(
            (skill) => `
          <div class="skill-row" data-skill="${skill}">
            <span class="skill-badge">
              <svg viewBox="0 0 24 24" width="13" height="13">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              ${skill}
            </span>
          </div>
        `,
          )
          .join("");
      }

      // Fill Files Data
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
      initWorkHours();
    });
  } else {
    initWorkHours();
  }
});
