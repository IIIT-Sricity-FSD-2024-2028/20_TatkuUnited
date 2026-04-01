/* manage_categories.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allCategories = AppStore.getTable("categories") || [];

  /* ── 3. Transform and enrich categories ── */
  function transformCategories(categoriesList) {
    return categoriesList.map((cat, idx) => {
      // Determine status based on is_available
      const status = cat.is_available ? "Active" : "Inactive";

      return {
        categoryId: cat.category_id,
        id: parseInt(cat.category_id.replace("CAT", "")) || idx + 1,
        name: cat.category_name,
        desc: cat.description,
        rating: cat.average_rating || 0.0,
        status: status,
        isAvailable: cat.is_available,
        parentId: cat.parent_id || null,
      };
    });
  }

  let categories = transformCategories(allCategories);
  let tableActionsBound = false;
  function refreshCategoriesFromStore() {
    categories = transformCategories(AppStore.getTable("categories") || []);
  }

  let editingId = null;
  let deletingId = null;

  /* ── helpers ── */
  function truncate(str, n = 55) {
    return str.length > n ? str.slice(0, n) + "…" : str;
  }

  function getParentCategoryName(parentId) {
    if (!parentId) return null;
    const parent = categories.find((c) => c.categoryId === parentId);
    return parent ? parent.name : null;
  }

  function updateKPIs(data) {
    const active = data.filter((c) => c.status === "Active").length;
    const inactive = data.filter((c) => c.status === "Inactive").length;
    const avgRating =
      data.length > 0
        ? (data.reduce((sum, c) => sum + c.rating, 0) / data.length).toFixed(2)
        : 0;

    const kpiTotal = document.getElementById("kpiTotal");
    const kpiActive = document.getElementById("kpiActive");
    const kpiInactive = document.getElementById("kpiInactive");
    const kpiAvgRating = document.getElementById("kpiAvgRating");

    if (kpiTotal) kpiTotal.textContent = categories.length;
    if (kpiActive) kpiActive.textContent = active;
    if (kpiInactive) kpiInactive.textContent = inactive;
    if (kpiAvgRating) kpiAvgRating.textContent = avgRating;
  }

  /* ── table ── */
  function renderTable(data) {
    const tbody = document.getElementById("categoriesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-faint)">No categories found matching your filters.</td></tr>`;
    } else {
      data.forEach((cat, idx) => {
        const tr = document.createElement("tr");
        tr.style.animationDelay = idx * 0.04 + "s";
        const statusClass =
          cat.status === "Active"
            ? "status-badge--active"
            : "status-badge--inactive";
        const ratingStars =
          "★".repeat(Math.floor(cat.rating)) +
          (cat.rating % 1 >= 0.5 ? "½" : "");

        tr.innerHTML = `
          <td class="category-name-col">${cat.name}</td>
          <td class="desc-cell" title="${cat.desc}">${truncate(cat.desc)}</td>
          <td>
            <span class="status-badge ${statusClass}">${cat.status}</span>
          </td>
          <td class="rating-cell" title="${cat.rating} / 5.0">${cat.rating.toFixed(2)} ⭐</td>
          <td>
            <div class="tbl-actions">
              <button class="tbl-icon-btn btn-edit" data-id="${cat.id}" title="Edit Category">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="tbl-icon-btn btn-delete" data-category-id="${cat.categoryId}" title="Delete Category">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* footer */
    const active = data.filter((c) => c.status === "Active").length;
    const tableFooter = document.getElementById("tableFooter");
    if (tableFooter) {
      tableFooter.innerHTML = `<span>${data.length} category${data.length !== 1 ? "ies" : ""} shown</span> · <span class="active-count">${active} active</span>`;
    }
  }

  function bindTableActions() {
    if (tableActionsBound) return;

    const tbody = document.getElementById("categoriesTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.classList.contains("btn-edit")) {
        const cat = categories.find((c) => c.id === parseInt(btn.dataset.id));
        if (cat) openModal(cat);
        return;
      }

      if (btn.classList.contains("btn-delete")) {
        const cat = categories.find(
          (c) => c.categoryId === btn.dataset.categoryId,
        );
        if (cat) openDeleteModal(cat);
      }
    });

    tableActionsBound = true;
  }

  /* ── filters ── */
  function applyFilters() {
    const search =
      document.getElementById("categorySearch")?.value.toLowerCase() || "";
    const filtered = categories.filter((cat) => {
      const matchSearch =
        cat.name.toLowerCase().includes(search) ||
        cat.desc.toLowerCase().includes(search);
      return matchSearch;
    });
    renderTable(filtered);
    updateKPIs(filtered);
  }

  function setupEventListeners() {
    const categorySearch = document.getElementById("categorySearch");

    if (categorySearch) categorySearch.addEventListener("input", applyFilters);
  }

  /* ── populate parent category dropdown ── */
  function populateParentDropdown() {
    const select = document.getElementById("categoryParent");
    if (!select) return;

    // Keep the first option
    const currentValue = select.value;
    let options = select.querySelectorAll("option");

    // Clear all options except the first one
    while (options.length > 1) {
      options[1].remove();
      options = select.querySelectorAll("option");
    }

    // Add all categories except the one being edited
    categories.forEach((cat) => {
      if (editingId === null || cat.categoryId !== editingId) {
        const option = document.createElement("option");
        option.value = cat.categoryId;
        option.textContent = cat.name;
        select.appendChild(option);
      }
    });
  }

  /* ── add/edit modal ── */
  function openModal(cat) {
    editingId = cat ? cat.categoryId : null;
    const modalTitle = document.getElementById("modalTitle");
    const categoryName = document.getElementById("categoryName");
    const categoryDesc = document.getElementById("categoryDesc");
    const categoryStatus = document.getElementById("categoryStatus");
    const categoryParent = document.getElementById("categoryParent");
    const btnSave = document.getElementById("btnSave");
    const modalOverlay = document.getElementById("modalOverlay");
    const statusText = document.getElementById("statusText");

    populateParentDropdown();

    if (modalTitle)
      modalTitle.textContent = cat ? "Edit Category" : "Add New Category";
    if (categoryName) categoryName.value = cat ? cat.name : "";
    if (categoryDesc) categoryDesc.value = cat ? cat.desc : "";
    if (categoryStatus) categoryStatus.checked = cat ? cat.isAvailable : true;
    if (statusText)
      statusText.textContent = (cat ? cat.isAvailable : true)
        ? "Active"
        : "Inactive";
    if (categoryParent)
      categoryParent.value = cat && cat.parentId ? cat.parentId : "";
    if (btnSave) btnSave.textContent = cat ? "Save Changes" : "Add Category";
    if (modalOverlay) modalOverlay.classList.add("open");

    // Update status text when checkbox changes
    if (categoryStatus) {
      categoryStatus.addEventListener("change", function () {
        if (statusText)
          statusText.textContent = this.checked ? "Active" : "Inactive";
      });
    }
  }

  function closeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) modalOverlay.classList.remove("open");
  }

  function openDeleteModal(cat) {
    deletingId = cat.categoryId;
    const deleteCategoryName = document.getElementById("deleteCategoryName");
    if (deleteCategoryName) deleteCategoryName.textContent = cat.name;
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

  const btnAddCategory = document.getElementById("btnAddCategory");
  const modalClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSave = document.getElementById("btnSave");
  const modalOverlay = document.getElementById("modalOverlay");
  const deleteClose = document.getElementById("deleteClose");
  const deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
  const deleteOverlay = document.getElementById("deleteOverlay");

  if (btnAddCategory)
    btnAddCategory.addEventListener("click", () => openModal(null));
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
      const categoriesTable = AppStore.getTable("categories") || [];
      const storeCat = categoriesTable.find(
        (c) => c.category_id === deletingId,
      );

      if (storeCat) {
        const catIndex = categoriesTable.findIndex(
          (c) => c.category_id === deletingId,
        );
        if (catIndex !== -1) categoriesTable.splice(catIndex, 1);

        AppStore.save();
        refreshCategoriesFromStore();
        showToast(`✓ "${storeCat.category_name}" permanently deleted`);
      }

      closeDeleteModal();
      applyFilters();
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const name = document.getElementById("categoryName")?.value.trim();
      const desc = document.getElementById("categoryDesc")?.value.trim();
      const isAvailable =
        document.getElementById("categoryStatus")?.checked || false;
      const parentId = document.getElementById("categoryParent")?.value || null;

      if (!name) {
        showToast("⚠ Category name is required");
        return;
      }
      if (!desc) {
        showToast("⚠ Description is required");
        return;
      }

      const categoriesTable = AppStore.getTable("categories") || [];
      const duplicateCategory = categoriesTable.find(
        (c) =>
          c.category_name.toLowerCase() === name.toLowerCase() &&
          c.category_id !== editingId,
      );
      if (duplicateCategory) {
        showToast("⚠ Category name already exists");
        return;
      }

      if (editingId) {
        const storeCat = categoriesTable.find(
          (c) => c.category_id === editingId,
        );
        if (storeCat) {
          storeCat.category_name = name;
          storeCat.description = desc;
          storeCat.is_available = isAvailable;
          storeCat.parent_id = parentId && parentId !== "" ? parentId : null;
          AppStore.save();
          refreshCategoriesFromStore();
          showToast(`✓ "${name}" updated successfully`);
        }
      } else {
        categoriesTable.push({
          category_id: AppStore.nextId("CAT"),
          category_name: name,
          description: desc,
          icon: "📦",
          image_url:
            "https://placehold.co/400x200/6b7280/white?text=" +
            encodeURIComponent(name),
          is_available: isAvailable,
          average_rating: 4.73,
          rating_count: 0,
          parent_id: parentId && parentId !== "" ? parentId : null,
        });
        AppStore.save();
        refreshCategoriesFromStore();
        showToast(`✓ "${name}" added to category catalog`);
      }
      closeModal();
      applyFilters();
    });
  }

  /* ── Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupEventListeners();
      bindTableActions();
      renderTable(categories);
      updateKPIs(categories);
    });
  } else {
    setupEventListeners();
    bindTableActions();
    renderTable(categories);
    updateKPIs(categories);
  }
});
