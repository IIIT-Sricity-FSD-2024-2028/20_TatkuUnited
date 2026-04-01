/* manage_skills.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allSkills = AppStore.getTable("skills") || [];
  const allProviderSkills = AppStore.getTable("provider_skills") || [];
  const allServiceSkills = AppStore.getTable("service_skills") || [];

  /* ── 3. Transform and enrich skills ── */
  function transformSkills(skillsList) {
    return skillsList.map((sk, idx) => {
      // Count providers with this skill
      const providersWithSkill = allProviderSkills.filter(
        (ps) => ps.skill_id === sk.skill_id,
      ).length;

      // Count unique services mapped to this skill from service_skills.
      const servicesForSkill = new Set(
        allServiceSkills
          .filter((ss) => ss.skill_id === sk.skill_id)
          .map((ss) => ss.service_id),
      ).size;

      // Determine status (derived from providers count)
      const status = providersWithSkill > 0 ? "Active" : "Inactive";

      return {
        skillId: sk.skill_id,
        id: parseInt(sk.skill_id.replace("SKL", "")) || idx + 1,
        name: sk.skill_name,
        desc: sk.description,
        providers: providersWithSkill,
        services: servicesForSkill,
        status: status,
      };
    });
  }

  let skills = transformSkills(allSkills);
  function refreshSkillsFromStore() {
    skills = transformSkills(AppStore.getTable("skills") || []);
  }

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

    if (kpiTotal) kpiTotal.textContent = skills.length;
    if (kpiActive) kpiActive.textContent = active;
    if (kpiInactive) kpiInactive.textContent = inactive;
  }

  /* ── table ── */
  function renderTable(data) {
    const tbody = document.getElementById("skillsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-faint)">No skills found matching your filters.</td></tr>`;
    } else {
      data.forEach((sk, idx) => {
        const tr = document.createElement("tr");
        tr.style.animationDelay = idx * 0.04 + "s";
        tr.innerHTML = `
          <td class="skill-name-col">${sk.name}</td>
          <td class="desc-cell" title="${sk.desc}">${truncate(sk.desc)}</td>
          <td class="num-cell">${sk.providers}</td>
          <td class="num-cell">${sk.services}</td>
          <td>
            <div class="tbl-actions">
              <button class="tbl-icon-btn btn-edit" data-id="${sk.id}" title="Edit Skill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="tbl-icon-btn btn-delete" data-skill-id="${sk.skillId}" title="Delete Skill">
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

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = skills.find((s) => s.skillId === btn.dataset.skillId);
        if (sk) openDeleteModal(sk);
      });
    });
  }

  /* ── filters ── */
  function applyFilters() {
    const search =
      document.getElementById("skillSearch")?.value.toLowerCase() || "";
    const filtered = skills.filter((sk) => {
      const matchSearch =
        sk.name.toLowerCase().includes(search) ||
        sk.desc.toLowerCase().includes(search);
      return matchSearch;
    });
    renderTable(filtered);
    updateKPIs(filtered);
  }

  function setupEventListeners() {
    const skillSearch = document.getElementById("skillSearch");

    if (skillSearch) skillSearch.addEventListener("input", applyFilters);
  }

  /* ── add/edit modal ── */
  function openModal(sk) {
    editingId = sk ? sk.skillId : null;
    const modalTitle = document.getElementById("modalTitle");
    const skillName = document.getElementById("skillName");
    const skillDesc = document.getElementById("skillDesc");
    const btnSave = document.getElementById("btnSave");
    const modalOverlay = document.getElementById("modalOverlay");

    if (modalTitle)
      modalTitle.textContent = sk ? "Edit Skill" : "Add New Skill";
    if (skillName) skillName.value = sk ? sk.name : "";
    if (skillDesc) skillDesc.value = sk ? sk.desc : "";
    if (btnSave) btnSave.textContent = sk ? "Save Changes" : "Add Skill";
    if (modalOverlay) modalOverlay.classList.add("open");
  }

  function closeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) modalOverlay.classList.remove("open");
  }

  function openDeleteModal(sk) {
    deletingId = sk.skillId;
    const deleteSkillName = document.getElementById("deleteSkillName");
    if (deleteSkillName) deleteSkillName.textContent = sk.name;
    const deleteOverlay = document.getElementById("deleteOverlay");
    if (deleteOverlay) deleteOverlay.classList.add("open");
  }

  function closeDeleteModal() {
    const deleteOverlay = document.getElementById("deleteOverlay");
    if (deleteOverlay) deleteOverlay.classList.remove("open");
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
  const deleteClose = document.getElementById("deleteClose");
  const deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
  const deleteOverlay = document.getElementById("deleteOverlay");

  if (btnAddSkill) btnAddSkill.addEventListener("click", () => openModal(null));
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
  if (deleteClose) deleteClose.addEventListener("click", closeDeleteModal);
  if (deleteCancelBtn)
    deleteCancelBtn.addEventListener("click", closeDeleteModal);
  if (deleteOverlay) {
    deleteOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });
  }
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", () => {
      const skillsTable = AppStore.getTable("skills") || [];
      const providerSkillsTable = AppStore.getTable("provider_skills") || [];
      const serviceSkillsTable = AppStore.getTable("service_skills") || [];
      const storeSkill = skillsTable.find((s) => s.skill_id === deletingId);

      if (storeSkill) {
        const skillIndex = skillsTable.findIndex(
          (s) => s.skill_id === deletingId,
        );
        if (skillIndex !== -1) skillsTable.splice(skillIndex, 1);

        for (let i = providerSkillsTable.length - 1; i >= 0; i -= 1) {
          if (providerSkillsTable[i].skill_id === deletingId) {
            providerSkillsTable.splice(i, 1);
          }
        }

        for (let i = serviceSkillsTable.length - 1; i >= 0; i -= 1) {
          if (serviceSkillsTable[i].skill_id === deletingId) {
            serviceSkillsTable.splice(i, 1);
          }
        }

        AppStore.save();
        refreshSkillsFromStore();
        showToast(`✓ "${storeSkill.skill_name}" permanently deleted`);
      }

      closeDeleteModal();
      applyFilters();
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const name = document.getElementById("skillName")?.value.trim();
      const desc = document.getElementById("skillDesc")?.value.trim();

      if (!name) {
        showToast("⚠ Skill name is required");
        return;
      }
      if (!desc) {
        showToast("⚠ Description is required");
        return;
      }

      const skillsTable = AppStore.getTable("skills") || [];
      const duplicateSkill = skillsTable.find(
        (s) =>
          s.skill_name.toLowerCase() === name.toLowerCase() &&
          s.skill_id !== editingId,
      );
      if (duplicateSkill) {
        showToast("⚠ Skill name already exists");
        return;
      }

      if (editingId) {
        const storeSkill = skillsTable.find((s) => s.skill_id === editingId);
        if (storeSkill) {
          storeSkill.skill_name = name;
          storeSkill.description = desc;
          AppStore.save();
          refreshSkillsFromStore();
          showToast(`✓ "${name}" updated successfully`);
        }
      } else {
        skillsTable.push({
          skill_id: AppStore.nextId("SKL"),
          skill_name: name,
          description: desc,
        });
        AppStore.save();
        refreshSkillsFromStore();
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
