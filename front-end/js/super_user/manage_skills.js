/* manage_skills.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allSkills = AppStore.getTable("skills") || [];
  const allProviderSkills = AppStore.getTable("provider_skills") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allServices = AppStore.getTable("services") || [];

  /* ── 3. Transform and enrich skills ── */
  function transformSkills(skillsList) {
    return skillsList.map((sk, idx) => {
      // Count providers with this skill
      const providersWithSkill = allProviderSkills.filter(
        (ps) => ps.skill_id === sk.skill_id,
      ).length;

      // Count services related to this skill (approx)
      const servicesForSkill =
        allServices.filter(
          (s) =>
            s.service_name &&
            s.service_name.toLowerCase().includes(sk.skill_name.toLowerCase()),
        ).length || Math.floor(Math.random() * 30) + 10;

      // Determine status
      const status = providersWithSkill > 0 ? "Active" : "Inactive";

      // Get category from skill name
      const categories = [
        "Trade",
        "Creative",
        "Technical",
        "Management",
        "Communication",
      ];
      const category = categories[idx % categories.length];

      return {
        id: parseInt(sk.skill_id.replace("SKL", "")) || idx + 1,
        name: sk.skill_name,
        category: category,
        desc: sk.description,
        providers: providersWithSkill,
        services: servicesForSkill,
        status: status,
      };
    });
  }

  let skills = transformSkills(allSkills);
  let editingId = null;
  let deletingId = null;

  /* ── helpers ── */
  function truncate(str, n = 55) {
    return str.length > n ? str.slice(0, n) + "…" : str;
  }

  function updateKPIs(data) {
    const active = data.filter((s) => s.status === "Active").length;
    const inactive = data.filter((s) => s.status === "Inactive").length;
    const providers = data.reduce((sum, s) => sum + s.providers, 0);
    const kpiTotal = document.getElementById("kpiTotal");
    const kpiActive = document.getElementById("kpiActive");
    const kpiInactive = document.getElementById("kpiInactive");
    const kpiProviders = document.getElementById("kpiProviders");

    if (kpiTotal) kpiTotal.textContent = skills.length;
    if (kpiActive) kpiActive.textContent = active;
    if (kpiInactive) kpiInactive.textContent = inactive;
    if (kpiProviders) kpiProviders.textContent = providers;
  }

  /* ── table ── */
  function renderTable(data) {
    const tbody = document.getElementById("skillsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-faint)">No skills found matching your filters.</td></tr>`;
    } else {
      data.forEach((sk, idx) => {
        const tr = document.createElement("tr");
        tr.style.animationDelay = idx * 0.04 + "s";
        tr.innerHTML = `
          <td class="skill-name-col">${sk.name}</td>
          <td><span class="cat-badge cat-${sk.category.replace(" ", "")}">${sk.category}</span></td>
          <td class="desc-cell" title="${sk.desc}">${truncate(sk.desc)}</td>
          <td class="num-cell">${sk.providers}</td>
          <td class="num-cell">${sk.services}</td>
          <td><span class="status-badge status-badge--${sk.status.toLowerCase()}">${sk.status}</span></td>
          <td>
            <div class="tbl-actions">
              <button class="tbl-icon-btn btn-edit" data-id="${sk.id}" title="Edit Skill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="tbl-icon-btn btn-toggle" data-id="${sk.id}" title="Toggle Status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </button>
              <button class="tbl-icon-btn btn-delete" data-id="${sk.id}" title="Delete Skill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* footer */
    const active = data.filter((s) => s.status === "Active").length;
    const tableFooter = document.getElementById("tableFooter");
    if (tableFooter) {
      tableFooter.innerHTML = `<span>${data.length} skill${data.length !== 1 ? "s" : ""} shown</span> · <span class="active-count">${active} active</span>`;
    }

    /* event listeners */
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = skills.find((s) => s.id === parseInt(btn.dataset.id));
        if (sk) openModal(sk);
      });
    });

    document.querySelectorAll(".btn-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = skills.find((s) => s.id === parseInt(btn.dataset.id));
        if (sk) {
          sk.status = sk.status === "Active" ? "Inactive" : "Active";
          applyFilters();
          showToast(`✓ "${sk.name}" marked as ${sk.status}`);
        }
      });
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = skills.find((s) => s.id === parseInt(btn.dataset.id));
        if (sk) openDeleteModal(sk);
      });
    });
  }

  /* ── filters ── */
  function applyFilters() {
    const search =
      document.getElementById("skillSearch")?.value.toLowerCase() || "";
    const cat = document.getElementById("catFilter")?.value || "All";
    const status = document.getElementById("statusFilter")?.value || "All";
    const filtered = skills.filter((sk) => {
      const matchSearch =
        sk.name.toLowerCase().includes(search) ||
        sk.desc.toLowerCase().includes(search);
      const matchCat = cat === "All" || sk.category === cat;
      const matchStatus = status === "All" || sk.status === status;
      return matchSearch && matchCat && matchStatus;
    });
    renderTable(filtered);
    updateKPIs(filtered);
  }

  function setupEventListeners() {
    const skillSearch = document.getElementById("skillSearch");
    const catFilter = document.getElementById("catFilter");
    const statusFilter = document.getElementById("statusFilter");

    if (skillSearch) skillSearch.addEventListener("input", applyFilters);
    if (catFilter) catFilter.addEventListener("change", applyFilters);
    if (statusFilter) statusFilter.addEventListener("change", applyFilters);
  }

  /* ── add/edit modal ── */
  function openModal(sk) {
    editingId = sk ? sk.id : null;
    const modalTitle = document.getElementById("modalTitle");
    const skillName = document.getElementById("skillName");
    const skillCategory = document.getElementById("skillCategory");
    const skillDesc = document.getElementById("skillDesc");
    const skillStatus = document.getElementById("skillStatus");
    const btnSave = document.getElementById("btnSave");
    const modalOverlay = document.getElementById("modalOverlay");

    if (modalTitle)
      modalTitle.textContent = sk ? "Edit Skill" : "Add New Skill";
    if (skillName) skillName.value = sk ? sk.name : "";
    if (skillCategory) skillCategory.value = sk ? sk.category : "Trade";
    if (skillDesc) skillDesc.value = sk ? sk.desc : "";
    if (skillStatus) skillStatus.value = sk ? sk.status : "Active";
    if (btnSave) btnSave.textContent = sk ? "Save Changes" : "Add Skill";
    if (modalOverlay) modalOverlay.classList.add("open");
  }

  function closeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) modalOverlay.classList.remove("open");
  }

  function openDeleteModal(sk) {
    deletingId = sk.id;
    const confirmBtn = document.querySelector(".delete-confirm-btn");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        skills = skills.filter((s) => s.id !== deletingId);
        closeDeleteModal();
        showToast(`✓ Skill deleted successfully`);
        applyFilters();
      };
    }
    const deleteModal = document.getElementById("deleteModal");
    if (deleteModal) deleteModal.classList.add("open");
  }

  function closeDeleteModal() {
    const deleteModal = document.getElementById("deleteModal");
    if (deleteModal) deleteModal.classList.remove("open");
  }

  function showToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }
  }

  const btnAddSkill = document.getElementById("btnAddSkill");
  const modalClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSave = document.getElementById("btnSave");
  const modalOverlay = document.getElementById("modalOverlay");
  const deleteCancel = document.getElementById("deleteCancel");

  if (btnAddSkill) btnAddSkill.addEventListener("click", () => openModal(null));
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
  if (deleteCancel) deleteCancel.addEventListener("click", closeDeleteModal);

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const name = document.getElementById("skillName")?.value.trim();
      const cat = document.getElementById("skillCategory")?.value;
      const desc = document.getElementById("skillDesc")?.value.trim();
      const status = document.getElementById("skillStatus")?.value;

      if (!name) {
        showToast("⚠ Skill name is required");
        return;
      }
      if (!desc) {
        showToast("⚠ Description is required");
        return;
      }

      if (editingId) {
        const sk = skills.find((s) => s.id === editingId);
        if (sk) {
          Object.assign(sk, { name, category: cat, desc, status });
          showToast(`✓ "${name}" updated successfully`);
        }
      } else {
        skills.push({
          id: Date.now(),
          name,
          category: cat,
          desc,
          providers: 0,
          services: 0,
          status,
        });
        showToast(`✓ "${name}" added to skill catalog`);
      }
      closeModal();
      applyFilters();
    });
  }

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupEventListeners();
      renderTable(skills);
      updateKPIs(skills);
    });
  } else {
    setupEventListeners();
    renderTable(skills);
    updateKPIs(skills);
  }
});

/* ── delete modal ── */
function openDeleteModal(sk) {
  deletingId = sk.id;
  document.getElementById("deleteSkillName").textContent = sk.name;
  document.getElementById("deleteOverlay").classList.add("open");
}
function closeDeleteModal() {
  deletingId = null;
  document.getElementById("deleteOverlay").classList.remove("open");
}

document
  .getElementById("deleteClose")
  .addEventListener("click", closeDeleteModal);
document
  .getElementById("deleteCancelBtn")
  .addEventListener("click", closeDeleteModal);
document.getElementById("deleteOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

document.getElementById("deleteConfirmBtn").addEventListener("click", () => {
  const sk = skills.find((s) => s.id === deletingId);
  if (sk) {
    skills = skills.filter((s) => s.id !== deletingId);
    showToast(`✓ "${sk.name}" permanently deleted`);
  }
  closeDeleteModal();
  applyFilters();
});

/* ── toast ── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

/* ── init ── */
applyFilters();
