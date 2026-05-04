/* manage_skills.js — API-backed */

(async () => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull from API ── */
  let allSkills = [];
  try { allSkills = await Api.get("/skills") || []; } catch (_) {}

  /* ── 3. Transform and enrich skills ── */
  function transformSkills(skillsList) {
    return skillsList.map((sk, idx) => {
      const providersWithSkill = sk.provider_count || 0;
      const servicesForSkill = sk.service_count || 0;
      const status = providersWithSkill > 0 ? "Active" : "Inactive";

      return {
        skillId: sk.skill_id,
        id: parseInt(sk.skill_id.replace("SKL", "")) || idx + 1,
        name: sk.skill_name,
        desc: sk.description || "",
        providers: providersWithSkill,
        services: servicesForSkill,
        status: status,
      };
    });
  }

  let skills = transformSkills(allSkills);
  const PAGE_SIZE = 8;
  let currentPage = 1;
  let filteredSkills = skills.slice();

  async function refreshSkills() {
    try {
      allSkills = await Api.get("/skills") || [];
      skills = transformSkills(allSkills);
      filteredSkills = skills.slice();
    } catch (err) {
      console.error("[skills] Load failed:", err);
    }
  }

  let editingId = null;
  let deletingId = null;

  /* ── helpers ── */
  function truncate(str, n = 55) {
    return str.length > n ? str.slice(0, n) + "…" : str;
  }

  function updateKPIs(data) {
    const kpiTotal = document.getElementById("kpiTotal");
    if (kpiTotal) kpiTotal.textContent = data.length;
  }

  /* ── table ── */
  function renderTable(data) {
    const tbody = document.getElementById("skillsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const totalRows = data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = data.slice(start, start + PAGE_SIZE);

    if (totalRows === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-faint)">No skills found matching your filters.</td></tr>`;
    } else {
      pageRows.forEach((sk, idx) => {
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
    const tableFooter = document.getElementById("tableFooter");
    if (tableFooter) {
      const shownEnd = Math.min(start + PAGE_SIZE, totalRows);
      const shownText =
        totalRows === 0
          ? "Showing 0-0 of 0"
          : `Showing ${start + 1}-${shownEnd} of ${totalRows}`;

      const pageButtons = Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(
          (pageNum) =>
            `<button class="page-btn ${pageNum === currentPage ? "active" : ""}" data-page="${pageNum}" type="button">${pageNum}</button>`,
        )
        .join("");

      tableFooter.innerHTML = `
        <div class="table-meta">
          <span>${shownText}</span>
        </div>
        <div class="pagination-wrap">
          <button class="page-arrow" data-page-action="prev" type="button" ${currentPage <= 1 ? "disabled" : ""}>‹</button>
          <div class="page-numbers">${pageButtons}</div>
          <button class="page-arrow" data-page-action="next" type="button" ${currentPage >= totalPages ? "disabled" : ""}>›</button>
        </div>
      `;

      tableFooter.querySelectorAll(".page-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentPage = Number(btn.dataset.page);
          renderTable(data);
        });
      });

      const prevBtn = tableFooter.querySelector('[data-page-action="prev"]');
      const nextBtn = tableFooter.querySelector('[data-page-action="next"]');

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage -= 1;
            renderTable(data);
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          if (currentPage < totalPages) {
            currentPage += 1;
            renderTable(data);
          }
        });
      }
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
  function applyFilters(resetPage = true) {
    const search =
      document.getElementById("skillSearch")?.value.toLowerCase() || "";
    filteredSkills = skills.filter((sk) => {
      const matchSearch =
        sk.name.toLowerCase().includes(search) ||
        sk.desc.toLowerCase().includes(search);
      return matchSearch;
    });
    if (resetPage) currentPage = 1;
    renderTable(filteredSkills);
    updateKPIs(filteredSkills);
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

  /* ── Delete Skill ── */
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", async () => {
      if (!deletingId) return;

      try {
        await Api.del("/skills/" + deletingId);
        await refreshSkills();
        showToast("Skill deleted successfully");
      } catch (err) {
        console.error("[skills] Delete failed:", err);
      }

      closeDeleteModal();
      applyFilters();
    });
  }

  /* ── Save Skill ── */
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const name = document.getElementById("skillName")?.value.trim();
      const desc = document.getElementById("skillDesc")?.value.trim();

      if (!name) { showToast("⚠ Skill name is required"); return; }
      if (!desc) { showToast("⚠ Description is required"); return; }

      // Duplicate check against cached list
      const dup = skills.find(
        (s) => s.name.toLowerCase() === name.toLowerCase() && s.skillId !== editingId,
      );
      if (dup) { showToast("⚠ Skill name already exists"); return; }

      try {
        if (editingId) {
          await Api.patch("/skills/" + editingId, {
            name: name,
            description: desc,
          });
          showToast(`✓ "${name}" updated successfully`);
        } else {
          await Api.post("/skills", {
            name: name,
            description: desc,
          });
          showToast(`✓ "${name}" added to skill catalog`);
        }
        await refreshSkills();
      } catch (err) {
        console.error("[skills] Save failed:", err);
      }
      closeModal();
      applyFilters();
    });
  }

  /* ── Initialize ── */
  setupEventListeners();
  renderTable(skills);
  updateKPIs(skills);
})();
