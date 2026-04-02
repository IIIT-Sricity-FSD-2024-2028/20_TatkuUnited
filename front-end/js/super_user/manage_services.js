/* manage_services.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allServices = AppStore.getTable("services") || [];
  const allCategories = AppStore.getTable("categories") || [];
  let allServiceContent = AppStore.getTable("service_content") || [];

  function updateNotificationBadges() {
    const unread = (AppStore.getTable("super_user_notifications") || []).filter(
      (n) => !n.is_read,
    ).length;
    document.querySelectorAll(".notif-badge").forEach((badge) => {
      if (unread > 0) {
        badge.textContent = String(unread);
        badge.style.display = "flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    });
  }

  /* ── 3. Transform and enrich services ── */
  function transformServices(servicesList) {
    return servicesList.map((svc, idx) => {
      // Find category info
      const category = allCategories.find(
        (c) => c.category_id === svc.category_id,
      );
      const categoryName = category ? category.category_name : "Unknown";

      // Determine status (based on is_available field from mockData)
      const status = svc.is_available ? "Active" : "Inactive";

      return {
        serviceId: svc.service_id,
        id: parseInt(svc.service_id.replace("SVC", "")) || idx + 1,
        name: svc.service_name,
        desc: svc.description,
        categoryId: svc.category_id,
        categoryName: categoryName,
        basePrice: svc.base_price,
        duration: svc.estimated_duration_min,
        rating:
          typeof svc.average_rating === "number" && (svc.rating_count || 0) > 0
            ? svc.average_rating
            : null,
        ratingCount: svc.rating_count || 0,
        isAvailable: svc.is_available,
        status: status,
        imageUrl: svc.image_url,
      };
    });
  }

  let services = transformServices(allServices);
  const PAGE_SIZE = 8;
  let currentPage = 1;
  let filteredServices = services.slice();
  let tableActionsBound = false;

  function refreshServicesFromStore() {
    services = transformServices(AppStore.getTable("services") || []);
    filteredServices = services.slice();
    allServiceContent = AppStore.getTable("service_content") || [];
  }

  let editingId = null;
  let deletingId = null;

  /* ── Helpers ── */
  function truncate(str, n = 50) {
    return str.length > n ? str.slice(0, n) + "…" : str;
  }

  function populateCategoryDropdown() {
    const categorySelect = document.getElementById("serviceCategory");
    const categoryFilter = document.getElementById("categoryFilter");
    if (!categorySelect) return;

    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
    }

    allCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.category_name;
      categorySelect.appendChild(option);

      if (categoryFilter) {
        const filterOption = option.cloneNode(true);
        categoryFilter.appendChild(filterOption);
      }
    });
  }

  function updateKPIs(data) {
    const active = data.filter((s) => s.status === "Active").length;
    const inactive = data.filter((s) => s.status === "Inactive").length;

    const kpiTotal = document.getElementById("kpiTotal");
    const kpiActive = document.getElementById("kpiActive");
    const kpiInactive = document.getElementById("kpiInactive");

    if (kpiTotal) kpiTotal.textContent = services.length;
    if (kpiActive) kpiActive.textContent = active;
    if (kpiInactive) kpiInactive.textContent = inactive;
  }

  /* ── Table ── */
  function renderTable(data) {
    const tbody = document.getElementById("servicesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const totalRows = data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = data.slice(start, start + PAGE_SIZE);

    if (totalRows === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-faint)">No services found matching your filters.</td></tr>`;
    } else {
      pageRows.forEach((svc, idx) => {
        const tr = document.createElement("tr");
        tr.style.animationDelay = idx * 0.04 + "s";

        const statusClass =
          svc.status === "Active" ? "status-active" : "status-inactive";
        const ratingDisplay =
          typeof svc.rating === "number" ? svc.rating.toFixed(2) : "N/A";
        const toggleClass = svc.isAvailable ? "is-on" : "is-off";
        const toggleTitle = svc.isAvailable
          ? "Deactivate Service"
          : "Activate Service";
        const toggleIcon = svc.isAvailable
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></svg>`;

        tr.innerHTML = `
          <td class="service-name-col">${svc.name}</td>
          <td class="cat-col">${svc.categoryName}</td>
          <td class="desc-cell" title="${svc.desc}">${truncate(svc.desc, 40)}</td>
          <td class="rating-cell">⭐ ${ratingDisplay}</td>
          <td>
            <span class="status-badge ${statusClass}">${svc.status}</span>
          </td>
          <td>
            <div class="tbl-actions">
              <button class="tbl-icon-btn btn-edit" data-id="${svc.id}" title="Edit Service">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="tbl-icon-btn btn-toggle ${toggleClass}" data-service-id="${svc.serviceId}" title="${toggleTitle}" aria-label="${toggleTitle}">
                ${toggleIcon}
              </button>
              <button class="tbl-icon-btn btn-row-delete" data-service-id="${svc.serviceId}" title="Delete Service">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* Footer */
    const active = data.filter((s) => s.status === "Active").length;
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
          <span>${shownText}</span> · <span class="active-count">${active} active</span>
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
  }

  function bindTableActions() {
    if (tableActionsBound) return;

    const tbody = document.getElementById("servicesTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.classList.contains("btn-edit")) {
        const svc = services.find((s) => s.id === parseInt(btn.dataset.id));
        if (svc) openModal(svc);
        return;
      }

      if (btn.classList.contains("btn-row-delete")) {
        const svc = services.find((s) => s.serviceId === btn.dataset.serviceId);
        if (svc) openDeleteModal(svc);
        return;
      }

      if (btn.classList.contains("btn-toggle")) {
        const svc = services.find((s) => s.serviceId === btn.dataset.serviceId);
        if (svc) toggleServiceAvailability(svc);
      }
    });

    tableActionsBound = true;
  }

  /* ── Toggle Availability ── */
  function toggleServiceAvailability(svc) {
    const servicesTable = AppStore.getTable("services") || [];
    const storeService = servicesTable.find(
      (s) => s.service_id === svc.serviceId,
    );

    if (storeService) {
      storeService.is_available = !storeService.is_available;
      AppStore.save();
      refreshServicesFromStore();
      const action = storeService.is_available ? "activated" : "deactivated";
      showToast(`✓ "${svc.name}" ${action}`);
      applyFilters();
    }
  }

  /* ── Filters ── */
  function applyFilters(resetPage = true) {
    const search =
      document.getElementById("serviceSearch")?.value.toLowerCase() || "";
    const categoryFilter = document.getElementById("categoryFilter")?.value || "";

    filteredServices = services.filter((svc) => {
      const matchSearch =
        svc.name.toLowerCase().includes(search) ||
        svc.desc.toLowerCase().includes(search) ||
        svc.categoryName.toLowerCase().includes(search);
      
      const matchCategory = !categoryFilter || svc.categoryId === categoryFilter;

      return matchSearch && matchCategory;
    });
    if (resetPage) currentPage = 1;
    renderTable(filteredServices);
    updateKPIs(filteredServices);
  }

  function setupEventListeners() {
    const serviceSearch = document.getElementById("serviceSearch");
    if (serviceSearch) serviceSearch.addEventListener("input", applyFilters);

    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  }

  /* ── Add/Edit Modal ── */
  function openModal(svc) {
    editingId = svc ? svc.serviceId : null;
    // Refresh service_content from store
    allServiceContent = AppStore.getTable("service_content") || [];

    const modalTitle = document.getElementById("modalTitle");
    const serviceName = document.getElementById("serviceName");
    const serviceCategory = document.getElementById("serviceCategory");
    const serviceDesc = document.getElementById("serviceDesc");
    const servicePrice = document.getElementById("servicePrice");
    const serviceDuration = document.getElementById("serviceDuration");
    const serviceAvailable = document.getElementById("serviceAvailable");
    const serviceHowItWorks = document.getElementById("serviceHowItWorks");
    const serviceWhatCovered = document.getElementById("serviceWhatCovered");
    const serviceWhatNotCovered = document.getElementById(
      "serviceWhatNotCovered",
    );
    const btnSave = document.getElementById("btnSave");
    const modalOverlay = document.getElementById("modalOverlay");

    if (modalTitle)
      modalTitle.textContent = svc ? "Edit Service" : "Add New Service";
    if (serviceName) serviceName.value = svc ? svc.name : "";
    if (serviceCategory) serviceCategory.value = svc ? svc.categoryId : "";
    if (serviceDesc) serviceDesc.value = svc ? svc.desc : "";
    if (servicePrice) servicePrice.value = svc ? svc.basePrice : "";
    if (serviceDuration) serviceDuration.value = svc ? svc.duration : "";
    if (serviceAvailable)
      serviceAvailable.checked = svc ? svc.isAvailable : true;

    // Populate service_content fields when editing
    if (
      svc &&
      serviceHowItWorks &&
      serviceWhatCovered &&
      serviceWhatNotCovered
    ) {
      const content = allServiceContent.find(
        (c) => c.service_id === svc.serviceId,
      );
      if (content) {
        // Format how_it_works array into textarea format
        const howItWorksText = content.how_it_works
          .map((step) => `${step.step_title} | ${step.step_description}`)
          .join("\n");
        serviceHowItWorks.value = howItWorksText;

        // Format what_is_covered array into textarea format
        const whatCoveredText = content.what_is_covered.join("\n");
        serviceWhatCovered.value = whatCoveredText;

        // Format what_is_not_covered array into textarea format
        const whatNotCoveredText = content.what_is_not_covered.join("\n");
        serviceWhatNotCovered.value = whatNotCoveredText;
      }
    } else {
      // Clear service_content fields when adding new service
      if (serviceHowItWorks) serviceHowItWorks.value = "";
      if (serviceWhatCovered) serviceWhatCovered.value = "";
      if (serviceWhatNotCovered) serviceWhatNotCovered.value = "";
    }

    if (btnSave) btnSave.textContent = svc ? "Save Changes" : "Add Service";
    if (modalOverlay) modalOverlay.classList.add("open");
  }

  function closeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) modalOverlay.classList.remove("open");
  }

  function openDeleteModal(svc) {
    deletingId = svc.serviceId;
    const deleteServiceName = document.getElementById("deleteServiceName");
    if (deleteServiceName) deleteServiceName.textContent = svc.name;
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

  /* ── Event Handlers ── */
  const btnAddService = document.getElementById("btnAddService");
  const modalClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSave = document.getElementById("btnSave");
  const modalOverlay = document.getElementById("modalOverlay");
  const deleteClose = document.getElementById("deleteClose");
  const deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
  const deleteOverlay = document.getElementById("deleteOverlay");

  if (btnAddService)
    btnAddService.addEventListener("click", () => openModal(null));
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

  /* ── Delete Service ── */
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", () => {
      const servicesTable = AppStore.getTable("services") || [];
      const storeService = servicesTable.find(
        (s) => s.service_id === deletingId,
      );

      if (storeService) {
        const serviceIndex = servicesTable.findIndex(
          (s) => s.service_id === deletingId,
        );
        if (serviceIndex !== -1) servicesTable.splice(serviceIndex, 1);

        AppStore.save();
        refreshServicesFromStore();
        showToast(`✓ "${storeService.service_name}" permanently deleted`);
      }

      closeDeleteModal();
      applyFilters();
    });
  }

  /* ── Save Service ── */
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const name = document.getElementById("serviceName")?.value.trim();
      const categoryId = document.getElementById("serviceCategory")?.value;
      const desc = document.getElementById("serviceDesc")?.value.trim();
      const price = parseFloat(
        document.getElementById("servicePrice")?.value || 0,
      );
      const duration = parseFloat(
        document.getElementById("serviceDuration")?.value || 0,
      );
      const isAvailable =
        document.getElementById("serviceAvailable")?.checked || true;
      const howItWorksText =
        document.getElementById("serviceHowItWorks")?.value.trim() || "";
      const whatCoveredText =
        document.getElementById("serviceWhatCovered")?.value.trim() || "";
      const whatNotCoveredText =
        document.getElementById("serviceWhatNotCovered")?.value.trim() || "";

      // Validation
      if (!name) {
        showToast("⚠ Service name is required");
        return;
      }
      if (!categoryId) {
        showToast("⚠ Category is required");
        return;
      }
      if (!desc) {
        showToast("⚠ Description is required");
        return;
      }
      if (price < 0) {
        showToast("⚠ Price must be positive");
        return;
      }
      if (duration < 0) {
        showToast("⚠ Duration must be positive");
        return;
      }

      const servicesTable = AppStore.getTable("services") || [];
      const duplicateService = servicesTable.find(
        (s) =>
          s.service_name.toLowerCase() === name.toLowerCase() &&
          s.service_id !== editingId,
      );
      if (duplicateService) {
        showToast("⚠ Service name already exists");
        return;
      }

      // Helper to parse service content
      function parseServiceContent(
        howItWorksText,
        whatCoveredText,
        whatNotCoveredText,
      ) {
        // Parse how_it_works: "Title | Description" format
        const howItWorks = howItWorksText
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const [title, description] = line.split("|").map((s) => s.trim());
            return {
              step_title: title || "",
              step_description: description || "",
            };
          });

        // Parse what_is_covered: one item per line
        const whatIsCovered = whatCoveredText
          .split("\n")
          .filter((line) => line.trim());

        // Parse what_is_not_covered: one item per line
        const whatIsNotCovered = whatNotCoveredText
          .split("\n")
          .filter((line) => line.trim());

        return {
          how_it_works: howItWorks,
          what_is_covered: whatIsCovered,
          what_is_not_covered: whatIsNotCovered,
        };
      }

      if (editingId) {
        const storeService = servicesTable.find(
          (s) => s.service_id === editingId,
        );
        if (storeService) {
          storeService.service_name = name;
          storeService.category_id = categoryId;
          storeService.description = desc;
          storeService.base_price = price;
          storeService.estimated_duration_min = duration;
          storeService.is_available = isAvailable;

          // Update or create service_content
          const serviceContentTable =
            AppStore.getTable("service_content") || [];
          let contentRecord = serviceContentTable.find(
            (c) => c.service_id === editingId,
          );
          if (!contentRecord) {
            contentRecord = { service_id: editingId };
            serviceContentTable.push(contentRecord);
          }

          const parsedContent = parseServiceContent(
            howItWorksText,
            whatCoveredText,
            whatNotCoveredText,
          );
          contentRecord.how_it_works = parsedContent.how_it_works;
          contentRecord.what_is_covered = parsedContent.what_is_covered;
          contentRecord.what_is_not_covered = parsedContent.what_is_not_covered;

          AppStore.save();
          refreshServicesFromStore();
          showToast(`✓ "${name}" updated successfully`);
        }
      } else {
        // Generate next service ID
        const nextId = AppStore.nextId("SVC");
        servicesTable.push({
          service_id: nextId,
          service_name: name,
          category_id: categoryId,
          description: desc,
          image_url:
            "https://placehold.co/400x200/6B7280/white?text=" +
            encodeURIComponent(name),
          base_price: price,
          estimated_duration_min: duration,
          average_rating: null,
          rating_count: 0,
          is_available: isAvailable,
        });

        // Create service_content for new service
        const serviceContentTable = AppStore.getTable("service_content") || [];
        const parsedContent = parseServiceContent(
          howItWorksText,
          whatCoveredText,
          whatNotCoveredText,
        );
        serviceContentTable.push({
          service_id: nextId,
          how_it_works: parsedContent.how_it_works,
          what_is_covered: parsedContent.what_is_covered,
          what_is_not_covered: parsedContent.what_is_not_covered,
        });

        AppStore.save();
        refreshServicesFromStore();
        showToast(`✓ "${name}" added to service catalog`);
      }
      closeModal();
      applyFilters();
    });
  }

  /* ── Initialize on DOM ready ── */
  function init() {
    updateNotificationBadges();
    populateCategoryDropdown();
    setupEventListeners();
    bindTableActions();
    renderTable(services);
    updateKPIs(services);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
});
