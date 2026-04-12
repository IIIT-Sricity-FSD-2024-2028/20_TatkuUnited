/* collective_unit.js */
// Depends on: store.js -> auth.js (loaded before this script)

AppStore.ready.then(function () {
  var session = Auth.requireSession(["super_user"]);
  if (!session) return;

  function updateNotificationBadges() {
    var unread = (AppStore.getTable("super_user_notifications") || []).filter(
      function (n) {
        return !n.is_read;
      },
    ).length;
    document.querySelectorAll(".notif-badge").forEach(function (badge) {
      if (unread > 0) {
        badge.textContent = String(unread);
        badge.style.display = "flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    });
  }

  var PAGE_SIZE = 5;
  var state = {
    selectedCollectiveId: null,
    selectedUnitId: null,
    editingUnitId: null,
    providerPage: 1,
    quickSearch: "",
    sector: "All Sectors",
    manager: "All Managers",
    skill: "All Skills",
    reassignProviderId: null,
    selectedCmId: null,
    reassignCmId: null,
    reassignCollectiveId: null,
    editingCollectiveId: null,
    editCmId: null,
    collectivePage: 1,
    COLLECTIVE_PAGE_SIZE: 4,
    collectiveManager: "All Managers",
  };

  var el = {
    logoutBtn: document.getElementById("logout-btn"),
    createUnitBtn: document.getElementById("btn-create-unit"),
    createCollectiveBtn: document.getElementById("btn-create-collective"),
    searchInput: document.getElementById("quick-search"),
    sectorFilter: document.getElementById("city-filter"),
    managerFilter: document.getElementById("manager-filter"),
    collectiveManagerFilter: document.getElementById("collective-manager-filter"),
    collectivesGrid: document.getElementById("collectives-grid"),
    providersTbody: document.getElementById("providers-tbody"),
    providerTitle: document.getElementById("provider-section-title"),
    providerSubtitle: document.getElementById("provider-section-subtitle"),
    tableInfo: document.getElementById("table-info"),
    prevPageBtn: document.getElementById("providers-prev-page"),
    nextPageBtn: document.getElementById("providers-next-page"),
    collectivesPrevPageBtn: document.getElementById("collectives-prev-page"),
    collectivesNextPageBtn: document.getElementById("collectives-next-page"),
    collectivesTableInfo: document.getElementById("collectives-table-info"),
    collectivesPages: document.getElementById("collectives-pages"),
    exportBtn: document.getElementById("btn-export-providers"),
    collectiveModal: document.getElementById("collective-modal"),
    collectiveModalClose: document.getElementById("collective-modal-close"),
    collectiveCancelBtn: document.getElementById("collective-cancel-btn"),
    collectiveForm: document.getElementById("collective-form"),
    collectiveNameInput: document.getElementById("collective-name-input"),
    collectiveStatusSelect: document.getElementById("collective-status-select"),
    collectiveSectorSelect: document.getElementById("collective-sector-select"),
    collectiveNameError: document.getElementById("collective-name-error"),
    collectiveSectorError: document.getElementById("collective-sector-error"),
    collectiveManagerInput: document.getElementById("collective-manager-input"),
    collectiveManagerDropdown: document.getElementById("collective-manager-dropdown"),
    collectiveManagerError: document.getElementById("collective-manager-error"),
    unitModal: document.getElementById("unit-modal"),
    unitModalClose: document.getElementById("unit-modal-close"),
    unitCancelBtn: document.getElementById("unit-cancel-btn"),
    unitForm: document.getElementById("unit-form"),
    unitNameInput: document.getElementById("unit-name-input"),
    unitCollectiveSelect: document.getElementById("unit-collective-select"),
    unitManagerSelect: document.getElementById("unit-manager-select"),
    unitStatusSelect: document.getElementById("unit-status-select"),
    unitSubmitBtn: document.getElementById("unit-submit-btn"),
    unitNameError: document.getElementById("unit-name-error"),
    unitCollectiveError: document.getElementById("unit-collective-error"),
    unitManagerError: document.getElementById("unit-manager-error"),
    unitModalTitle: document.getElementById("unit-modal-title"),
    confirmModal: document.getElementById("confirm-modal"),
    confirmModalClose: document.getElementById("confirm-modal-close"),
    confirmMessage: document.getElementById("confirm-modal-message"),
    confirmCancelBtn: document.getElementById("confirm-cancel-btn"),
    confirmOkBtn: document.getElementById("confirm-ok-btn"),
    reassignModal: document.getElementById("reassign-modal"),
    reassignModalClose: document.getElementById("reassign-modal-close"),
    reassignForm: document.getElementById("reassign-form"),
    reassignUnitSelect: document.getElementById("reassign-unit-select"),
    reassignUnitError: document.getElementById("reassign-unit-error"),
    reassignCancelBtn: document.getElementById("reassign-cancel-btn"),
    reassignCmModal: document.getElementById("reassign-cm-modal"),
    reassignCmModalClose: document.getElementById("reassign-cm-modal-close"),
    reassignCmForm: document.getElementById("reassign-cm-form"),
    reassignCmInput: document.getElementById("reassign-cm-input"),
    reassignCmDropdown: document.getElementById("reassign-cm-dropdown"),
    reassignCmError: document.getElementById("reassign-cm-error"),
    reassignCmCancelBtn: document.getElementById("reassign-cm-cancel-btn"),
    editCollectiveModal: document.getElementById("edit-collective-modal"),
    editCollectiveModalClose: document.getElementById("edit-collective-modal-close"),
    editCollectiveForm: document.getElementById("edit-collective-form"),
    editCollectiveCmInput: document.getElementById("edit-collective-cm-input"),
    editCollectiveCmDropdown: document.getElementById("edit-collective-cm-dropdown"),
    editCollectiveCmError: document.getElementById("edit-collective-cm-error"),
    editCollectiveSectorSelect: document.getElementById("edit-collective-sector-select"),
    editCollectiveSectorError: document.getElementById("edit-collective-sector-error"),
    editCollectiveCancelBtn: document.getElementById("edit-collective-cancel-btn"),
  };

  var confirmHandler = null;
  var alertTimeout = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getInitials(name) {
    if (!name) return "NA";
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "NA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function deriveSkillFromUnitName(unitName) {
    var n = String(unitName || "").toLowerCase();
    if (n.indexOf("plumb") !== -1) return "Plumbing";
    if (n.indexOf("elect") !== -1) return "Electrical";
    if (n.indexOf("ac") !== -1 || n.indexOf("appliance") !== -1) {
      return "AC & Appliances";
    }
    if (n.indexOf("paint") !== -1) return "Painting";
    if (n.indexOf("pest") !== -1) return "Pest Control";
    if (n.indexOf("clean") !== -1) return "Cleaning";
    if (n.indexOf("carpent") !== -1 || n.indexOf("furniture") !== -1) {
      return "Carpentry";
    }
    if (n.indexOf("garden") !== -1 || n.indexOf("landscape") !== -1) {
      return "Landscaping";
    }
    return "General";
  }

  function notify(message, tone) {
    var alertEl = document.getElementById("ui-alert");
    if (!alertEl) return;

    var normalizedTone = tone;
    if (!normalizedTone) {
      normalizedTone =
        /created|updated|assigned|removed|reassigned|saved/i.test(
          String(message),
        )
          ? "success"
          : "error";
    }

    alertEl.classList.remove("ui-alert--success", "ui-alert--error", "show");
    alertEl.textContent = String(message || "");
    if (normalizedTone === "success") {
      alertEl.classList.add("ui-alert--success");
    } else {
      alertEl.classList.add("ui-alert--error");
    }

    if (alertTimeout) {
      clearTimeout(alertTimeout);
      alertTimeout = null;
    }

    requestAnimationFrame(function () {
      alertEl.classList.add("show");
    });

    alertTimeout = setTimeout(function () {
      alertEl.classList.remove("show");
    }, 2600);
  }

  function normalizeName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function setFieldError(inputEl, errorEl, message) {
    if (!inputEl || !errorEl) return;
    if (message) {
      inputEl.classList.add("input-invalid");
      errorEl.textContent = message;
    } else {
      inputEl.classList.remove("input-invalid");
      errorEl.textContent = "";
    }
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden", "false");
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden", "true");
  }

  function resetCollectiveForm() {
    if (el.collectiveForm) el.collectiveForm.reset();
    if (el.collectiveStatusSelect) el.collectiveStatusSelect.value = "true";
    state.selectedCmId = null;
    if (el.collectiveManagerInput) el.collectiveManagerInput.value = "";
    if (el.collectiveManagerDropdown) el.collectiveManagerDropdown.innerHTML = "";
    if (el.collectiveManagerDropdown) el.collectiveManagerDropdown.style.display = "none";
    setFieldError(el.collectiveNameInput, el.collectiveNameError, "");
    setFieldError(el.collectiveSectorSelect, el.collectiveSectorError, "");
    setFieldError(el.collectiveManagerInput, el.collectiveManagerError, "");
  }

  function resetUnitForm() {
    if (el.unitForm) el.unitForm.reset();
    if (el.unitStatusSelect) el.unitStatusSelect.value = "true";
    setFieldError(el.unitNameInput, el.unitNameError, "");
    setFieldError(el.unitCollectiveSelect, el.unitCollectiveError, "");
    setFieldError(el.unitManagerSelect, el.unitManagerError, "");
    state.editingUnitId = null;
    if (el.unitModalTitle) el.unitModalTitle.textContent = "Create New Unit";
    if (el.unitSubmitBtn) el.unitSubmitBtn.textContent = "Create Unit";
  }

  function populateCollectiveFormOptions() {
    var tables = getTables();
    if (!el.collectiveSectorSelect) return;

    var usedSectorIds = getUsedSectorIds(null);

    el.collectiveSectorSelect.innerHTML = "";
    tables.sectors
      .slice()
      .sort(function (a, b) {
        return String(a.sector_name).localeCompare(String(b.sector_name));
      })
      .forEach(function (sector) {
        var option = document.createElement("option");
        option.value = sector.sector_id;
        var taken = usedSectorIds.indexOf(sector.sector_id) !== -1;
        option.textContent =
          sector.sector_id +
          " - " +
          sector.sector_name +
          " (" +
          (sector.region || "Unknown") +
          ")" +
          (taken ? " [TAKEN]" : "");
        if (taken) {
          option.disabled = true;
          option.style.color = "#9ca3af";
        }
        el.collectiveSectorSelect.appendChild(option);
      });
  }

  function getUsedSectorIds(excludeCollectiveId) {
    var collectives = AppStore.getTable("collectives") || [];
    var used = [];
    collectives.forEach(function (c) {
      if (c.collective_id === excludeCollectiveId) return;
      var ids = Array.isArray(c.sector_ids) ? c.sector_ids : [];
      ids.forEach(function (sid) {
        if (used.indexOf(sid) === -1) used.push(sid);
      });
    });
    return used;
  }

  function populateUnitFormOptions(includeManagerUnitId) {
    var tables = getTables();
    if (el.unitCollectiveSelect) {
      el.unitCollectiveSelect.innerHTML =
        '<option value="">Select collective</option>';
      tables.collectives
        .slice()
        .sort(function (a, b) {
          return String(a.collective_name).localeCompare(
            String(b.collective_name),
          );
        })
        .forEach(function (collective) {
          var option = document.createElement("option");
          option.value = collective.collective_id;
          option.textContent =
            collective.collective_name + " (" + collective.collective_id + ")";
          el.unitCollectiveSelect.appendChild(option);
        });

      if (state.selectedCollectiveId) {
        el.unitCollectiveSelect.value = state.selectedCollectiveId;
      }
    }

    if (el.unitManagerSelect) {
      el.unitManagerSelect.innerHTML = '<option value="">Unassigned</option>';
      tables.unitManagers
        .filter(function (manager) {
          return !manager.unit_id || manager.unit_id === includeManagerUnitId;
        })
        .sort(function (a, b) {
          return String(a.name).localeCompare(String(b.name));
        })
        .forEach(function (manager) {
          var option = document.createElement("option");
          option.value = manager.um_id;
          option.textContent = manager.name + " (" + manager.um_id + ")";
          el.unitManagerSelect.appendChild(option);
        });
    }
  }

  function openCreateCollectiveModal() {
    populateCollectiveFormOptions();
    resetCollectiveForm();
    openModal(el.collectiveModal);
    if (el.collectiveNameInput) el.collectiveNameInput.focus();
  }

  function openCreateUnitModal() {
    populateUnitFormOptions(null);
    resetUnitForm();
    openModal(el.unitModal);
    if (el.unitNameInput) el.unitNameInput.focus();
  }

  function openEditUnitModal(unitId) {
    var tables = getTables();
    var unit = tables.units.find(function (row) {
      return row.unit_id === unitId;
    });
    if (!unit) {
      notify("Unit not found.");
      return;
    }

    state.editingUnitId = unit.unit_id;
    populateUnitFormOptions(unit.unit_id);
    if (el.unitModalTitle) el.unitModalTitle.textContent = "Edit Unit";
    if (el.unitSubmitBtn) el.unitSubmitBtn.textContent = "Save Changes";

    if (el.unitNameInput) el.unitNameInput.value = unit.unit_name || "";
    if (el.unitCollectiveSelect)
      el.unitCollectiveSelect.value = unit.collective_id;
    if (el.unitStatusSelect)
      el.unitStatusSelect.value = unit.is_active ? "true" : "false";

    var currentManager = tables.unitManagers.find(function (m) {
      return m.unit_id === unit.unit_id;
    });
    if (el.unitManagerSelect) {
      el.unitManagerSelect.value = currentManager ? currentManager.um_id : "";
    }

    setFieldError(el.unitNameInput, el.unitNameError, "");
    setFieldError(el.unitCollectiveSelect, el.unitCollectiveError, "");
    setFieldError(el.unitManagerSelect, el.unitManagerError, "");

    openModal(el.unitModal);
    if (el.unitNameInput) el.unitNameInput.focus();
  }

  function openConfirmModal(message, onConfirm) {
    if (!el.confirmModal || !el.confirmMessage) return;
    el.confirmMessage.textContent = message;
    confirmHandler = typeof onConfirm === "function" ? onConfirm : null;
    openModal(el.confirmModal);
  }

  function closeConfirmModal() {
    confirmHandler = null;
    closeModal(el.confirmModal);
  }

  function resetReassignForm() {
    state.reassignProviderId = null;
    if (el.reassignForm) el.reassignForm.reset();
    if (el.reassignUnitSelect) {
      el.reassignUnitSelect.innerHTML =
        '<option value="">Select target unit</option>';
    }
    setFieldError(el.reassignUnitSelect, el.reassignUnitError, "");
  }

  function openReassignModal(providerId) {
    var providers = AppStore.getTable("service_providers") || [];
    var units = AppStore.getTable("units") || [];
    var provider = providers.find(function (row) {
      return row.service_provider_id === providerId;
    });
    if (!provider) {
      notify("Provider not found.");
      return;
    }

    resetReassignForm();
    state.reassignProviderId = provider.service_provider_id;

    var options = units
      .filter(function (unit) {
        return unit.unit_id !== provider.unit_id;
      })
      .sort(function (a, b) {
        return String(a.unit_name).localeCompare(String(b.unit_name));
      });

    if (!options.length) {
      notify("No other units available for reassignment.");
      return;
    }

    options.forEach(function (unit) {
      var option = document.createElement("option");
      option.value = unit.unit_id;
      option.textContent = unit.unit_name + " (" + unit.unit_id + ")";
      el.reassignUnitSelect.appendChild(option);
    });

    openModal(el.reassignModal);
  }

  function closeReassignModal() {
    resetReassignForm();
    closeModal(el.reassignModal);
  }

  function submitReassignProvider() {
    var providerId = state.reassignProviderId;
    var targetUnitId = String(el.reassignUnitSelect.value || "").trim();

    if (!providerId) {
      closeReassignModal();
      return;
    }
    if (!targetUnitId) {
      setFieldError(
        el.reassignUnitSelect,
        el.reassignUnitError,
        "Please choose a target unit.",
      );
      return;
    }
    setFieldError(el.reassignUnitSelect, el.reassignUnitError, "");

    var providers = AppStore.getTable("service_providers") || [];
    var units = AppStore.getTable("units") || [];
    var provider = providers.find(function (row) {
      return row.service_provider_id === providerId;
    });

    if (!provider) {
      notify("Provider not found.");
      closeReassignModal();
      return;
    }

    var targetUnit = units.find(function (unit) {
      return unit.unit_id === targetUnitId;
    });
    if (!targetUnit) {
      setFieldError(
        el.reassignUnitSelect,
        el.reassignUnitError,
        "Selected unit is invalid.",
      );
      return;
    }

    provider.unit_id = targetUnitId;
    provider.is_active = true;
    AppStore.save();

    state.selectedUnitId = targetUnitId;
    state.providerPage = 1;
    closeReassignModal();
    renderCollectives();
    notify("Provider reassigned.");
  }

  function getTables() {
    return {
      collectives: AppStore.getTable("collectives") || [],
      units: AppStore.getTable("units") || [],
      sectors: AppStore.getTable("sectors") || [],
      unitManagers: AppStore.getTable("unit_managers") || [],
      collectiveManagers: AppStore.getTable("collective_managers") || [],
      providers: AppStore.getTable("service_providers") || [],
      providerSkills: AppStore.getTable("provider_skills") || [],
      skills: AppStore.getTable("skills") || [],
      assignments: AppStore.getTable("job_assignments") || [],
    };
  }

  function setupCmAutocomplete(inputEl, dropdownEl, errorEl, selectedIdKey, includeCollectiveId) {
    if (!inputEl || !dropdownEl) return;

    function renderDropdown(query) {
      var managers = AppStore.getTable("collective_managers") || [];
      var q = String(query || "").trim().toLowerCase();

      var options = managers.filter(function (m) {
        if (!m.is_active) return false;

        var isUnassigned = !m.collective_id;
        var isCurrentAssigned = includeCollectiveId && m.collective_id === includeCollectiveId;

        if (!isUnassigned && !isCurrentAssigned) return false;
        if (q && m.name.toLowerCase().indexOf(q) === -1 && m.cm_id.toLowerCase().indexOf(q) === -1) {
          return false;
        }
        return true;
      });

      if (!options.length) {
        dropdownEl.innerHTML = '<div style="padding: 8px; color: #6b7280; font-size: 14px;">No available managers found.</div>';
        dropdownEl.style.display = "block";
        return;
      }

      dropdownEl.innerHTML = options.map(function (m) {
        return '<div class="cm-option" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #f3f4f6; font-size: 14px;" data-id="' + escapeHtml(m.cm_id) + '" data-name="' + escapeHtml(m.name) + '">' +
          escapeHtml(m.name) + ' <span style="color:#9ca3af; font-size:12px;">(' + escapeHtml(m.cm_id) + ')</span>' +
          '</div>';
      }).join('');
      dropdownEl.style.display = "block";
    }

    inputEl.addEventListener("input", function (e) {
      state[selectedIdKey] = null;
      renderDropdown(e.target.value);
    });

    inputEl.addEventListener("focus", function (e) {
      renderDropdown(e.target.value);
    });

    // Hide dropdown on blur with slight delay to allow click 
    inputEl.addEventListener("blur", function () {
      setTimeout(function () { dropdownEl.style.display = "none"; }, 150);
    });

    dropdownEl.addEventListener("click", function (e) {
      var opt = e.target.closest(".cm-option");
      if (!opt) return;
      var id = opt.getAttribute("data-id");
      var name = opt.getAttribute("data-name");
      state[selectedIdKey] = id;
      inputEl.value = name;
      dropdownEl.style.display = "none";
      setFieldError(inputEl, errorEl, "");
    });
  }

  function getCollectiveRegions(collective, sectorsById) {
    var ids = Array.isArray(collective.sector_ids) ? collective.sector_ids : [];
    var regions = [];
    ids.forEach(function (sectorId) {
      var s = sectorsById[sectorId];
      if (s && s.region && regions.indexOf(s.region) === -1) {
        regions.push(s.region);
      }
    });
    return regions;
  }

  function getUnitManagerMap(unitManagers) {
    var map = {};
    unitManagers.forEach(function (m) {
      if (m.unit_id) map[m.unit_id] = m;
    });
    return map;
  }

  function getProviderSkillsLookup(providerSkills, skills) {
    var skillsById = {};
    var lookup = {};
    skills.forEach(function (s) {
      skillsById[s.skill_id] = s.skill_name;
    });
    providerSkills.forEach(function (row) {
      if (!row.service_provider_id || !row.skill_id) return;
      if (!lookup[row.service_provider_id]) {
        lookup[row.service_provider_id] = [];
      }
      var skillName = skillsById[row.skill_id];
      if (
        skillName &&
        lookup[row.service_provider_id].indexOf(skillName) === -1
      ) {
        lookup[row.service_provider_id].push(skillName);
      }
    });
    return lookup;
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return NaN;
    var parts = timeStr.split(":");
    if (parts.length < 2) return NaN;
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    if (isNaN(h) || isNaN(m)) return NaN;
    return h * 60 + m;
  }

  function isNowInRange(dateStr, hourStart, hourEnd) {
    if (!dateStr || !hourStart || !hourEnd) return false;
    var now = new Date();
    var localDate =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    if (dateStr !== localDate) return false;

    var nowMin = now.getHours() * 60 + now.getMinutes();
    var startMin = parseTimeToMinutes(hourStart);
    var endMin = parseTimeToMinutes(hourEnd);
    if (isNaN(startMin) || isNaN(endMin)) return false;

    if (startMin <= endMin) {
      return nowMin >= startMin && nowMin < endMin;
    }
    // allow crossing midnight
    return nowMin >= startMin || nowMin < endMin;
  }

  function getProviderStatus(provider, assignments, unavailability) {
    if (!provider.is_active) {
      return { css: "offline", label: "OFFLINE" };
    }

    var hasUnavailabilityNow = (unavailability || []).some(function (u) {
      return (
        u.service_provider_id === provider.service_provider_id &&
        isNowInRange(u.date, u.hour_start, u.hour_end)
      );
    });
    if (hasUnavailabilityNow) {
      return { css: "unavailable", label: "UNAVAILABLE" };
    }

    var hasOnJobNow = (assignments || []).some(function (a) {
      return (
        a.service_provider_id === provider.service_provider_id &&
        (a.status === "ASSIGNED" || a.status === "IN_PROGRESS") &&
        isNowInRange(a.scheduled_date, a.hour_start, a.hour_end)
      );
    });
    if (hasOnJobNow) {
      return { css: "onjob", label: "ON JOB" };
    }

    return { css: "available", label: "AVAILABLE" };
  }

  function populateFilters() {
    var tables = getTables();
    var sectorsById = {};
    tables.sectors.forEach(function (s) {
      sectorsById[s.sector_id] = s;
    });

    // Get all unique sector names from the sectors table
    var sectorValues = tables.sectors
      .map(function (s) {
        return s.sector_name;
      })
      .filter(Boolean)
      .filter(function (name, index, arr) {
        return arr.indexOf(name) === index;
      })
      .sort();

    var unitManagerValues = tables.unitManagers
      .map(function (m) {
        return m.name;
      })
      .filter(Boolean)
      .filter(function (name, index, arr) {
        return arr.indexOf(name) === index;
      })
      .sort();

    var collectiveManagerValues = (tables.collectiveManagers || [])
      .map(function (m) {
        return m.name;
      })
      .filter(Boolean)
      .filter(function (name, index, arr) {
        return arr.indexOf(name) === index;
      })
      .sort();

    el.sectorFilter.innerHTML = "<option>All Sectors</option>";
    sectorValues.forEach(function (name) {
      var option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      el.sectorFilter.appendChild(option);
    });

    el.managerFilter.innerHTML = "<option>All Managers</option><option>No Unit Manager</option>";
    unitManagerValues.forEach(function (name) {
      if (name === "Unassigned") return;
      var option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      el.managerFilter.appendChild(option);
    });

    el.collectiveManagerFilter.innerHTML = "<option>All Managers</option><option>No Collective Manager</option>";
    collectiveManagerValues.forEach(function (name) {
      if (name === "Unassigned") return;
      var option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      el.collectiveManagerFilter.appendChild(option);
    });

    el.collectiveManagerFilter.value = state.collectiveManager;
    el.sectorFilter.value = state.sector;
  }

  function getFilteredCollectivesData() {
    var tables = getTables();
    var sectorsById = {};
    tables.sectors.forEach(function (s) {
      sectorsById[s.sector_id] = s;
    });
    var managerByUnit = getUnitManagerMap(tables.unitManagers);
    var providersByUnit = {};
    tables.providers.forEach(function (p) {
      if (!p.unit_id) return;
      if (!providersByUnit[p.unit_id]) providersByUnit[p.unit_id] = 0;
      providersByUnit[p.unit_id] += 1;
    });

    var q = state.quickSearch.toLowerCase();

    var collectiveManagerMap = {};
    (tables.collectiveManagers || []).forEach(function (m) {
      if (m.collective_id) collectiveManagerMap[m.collective_id] = m;
    });

    return tables.collectives
      .map(function (collective, idx) {
        var units = tables.units.filter(function (u) {
          return u.collective_id === collective.collective_id;
        });

        var collectiveSectors = (collective.sector_ids || []).map(function (id) {
          return sectorsById[id] ? sectorsById[id].sector_name : "";
        });

        var sectorMatches =
          state.sector === "All Sectors" ||
          collectiveSectors.indexOf(state.sector) !== -1;

        units = units.filter(function (unit) {
          var manager = managerByUnit[unit.unit_id];
          var managerName =
            manager && manager.name ? manager.name : "Unassigned";

          var managerMatches =
            state.manager === "All Managers" ||
            (state.manager === "No Unit Manager" &&
              managerName === "Unassigned") ||
            managerName === state.manager;

          var unitSearchBlob = (
            unit.unit_id +
            " " +
            unit.unit_name +
            " " +
            managerName
          ).toLowerCase();
          var unitMatchesSearch = !q || unitSearchBlob.indexOf(q) !== -1;

          return managerMatches && unitMatchesSearch;
        });

        var collectiveCm = collectiveManagerMap[collective.collective_id];
        var collectiveCmName = collectiveCm ? collectiveCm.name : "Unassigned";

        var collectiveCmMatches =
          state.collectiveManager === "All Managers" ||
          (state.collectiveManager === "No Collective Manager" &&
            collectiveCmName === "Unassigned") ||
          collectiveCmName === state.collectiveManager;

        var collectiveSearchBlob = (
          collective.collective_id +
          " " +
          collective.collective_name +
          " " +
          collectiveCmName
        ).toLowerCase();
        var collectiveMatchesSearch =
          !q || collectiveSearchBlob.indexOf(q) !== -1;

        var visible = sectorMatches && collectiveCmMatches;

        if (state.manager !== "All Managers") {
          // If a Unit Manager filter is applied, we must have units
          if (units.length === 0) visible = false;
        } else {
          // Default: show if name/ID matches or at least one unit matches
          visible = visible && (collectiveMatchesSearch || units.length > 0);
        }

        if (!visible) return null;

        var providerCount = units.reduce(function (sum, u) {
          return sum + (providersByUnit[u.unit_id] || 0);
        }, 0);

        var collectiveCm = collectiveManagerMap[collective.collective_id];

        return {
          idx: idx,
          collective: collective,
          sectorNames: collectiveSectors,
          units: units,
          providerCount: providerCount,
          managerByUnit: managerByUnit,
          providersByUnit: providersByUnit,
          collectiveManager: collectiveCm,
        };
      })
      .filter(Boolean);
  }

  function ensureSelectedUnitExists(filteredData) {
    var unitIds = [];
    filteredData.forEach(function (entry) {
      entry.units.forEach(function (u) {
        unitIds.push(u.unit_id);
      });
    });

    if (!unitIds.length) {
      state.selectedUnitId = null;
      state.selectedCollectiveId = null;
      return;
    }

    if (unitIds.indexOf(state.selectedUnitId) === -1) {
      state.selectedUnitId = unitIds[0];
    }

    var selectedOwner = filteredData.find(function (entry) {
      return entry.units.some(function (u) {
        return u.unit_id === state.selectedUnitId;
      });
    });

    if (selectedOwner) {
      state.selectedCollectiveId = selectedOwner.collective.collective_id;
    }
  }

  function renderCollectives() {
    var filteredData = getFilteredCollectivesData();
    ensureSelectedUnitExists(filteredData);

    var total = filteredData.length;
    var maxPage = Math.max(1, Math.ceil(total / state.COLLECTIVE_PAGE_SIZE));
    if (state.collectivePage > maxPage) state.collectivePage = maxPage;

    var start = (state.collectivePage - 1) * state.COLLECTIVE_PAGE_SIZE;
    var pageData = filteredData.slice(
      start,
      start + state.COLLECTIVE_PAGE_SIZE,
    );

    if (!total) {
      el.collectivesGrid.innerHTML =
        '<div class="collective-card"><div class="collective-header"><div class="collective-info"><div class="collective-name">No collectives found</div><div class="collective-meta">Try changing filters or create a new collective.</div></div></div></div>';
      el.collectivesTableInfo.textContent = "Showing 0-0 of 0 collectives";
      el.collectivesPrevPageBtn.disabled = true;
      el.collectivesNextPageBtn.disabled = true;
      el.collectivesPages.innerHTML = "";
      renderProviders();
      return;
    }

    el.collectivesGrid.innerHTML = pageData
      .map(function (entry) {
        var collective = entry.collective;
        var iconClass =
          entry.idx % 2 === 0
            ? "collective-icon--teal"
            : "collective-icon--orange";
        var statusText = collective.is_active ? "Active" : "Inactive";
        var activeSince = collective.created_at
          ? new Date(collective.created_at).getFullYear()
          : "-";
        var sectorText =
          entry.sectorNames && entry.sectorNames.length
            ? entry.sectorNames.join(", ")
            : "Unmapped";

        var unitsHtml = entry.units.length
          ? entry.units
            .map(function (unit) {
              var manager = entry.managerByUnit[unit.unit_id];
              var managerName =
                manager && manager.name ? manager.name : "Unassigned";
              var providersCount = entry.providersByUnit[unit.unit_id] || 0;
              var selectedClass =
                state.selectedUnitId === unit.unit_id ? " selected-unit" : "";

              return (
                '<div class="unit-row' +
                selectedClass +
                '">' +
                '<span class="unit-arrow">›</span>' +
                '<span class="unit-name">' +
                escapeHtml(unit.unit_name) +
                " (" +
                escapeHtml(unit.unit_id) +
                ")</span>" +
                '<span class="unit-providers">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path></svg>' +
                providersCount +
                " Providers</span>" +
                '<span class="unit-mgr">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 3H8"></path></svg>' +
                "Mgr: " +
                escapeHtml(managerName) +
                "</span>" +
                '<a href="#" class="view-providers-link" data-action="view-providers" data-unit-id="' +
                escapeHtml(unit.unit_id) +
                '" data-collective-id="' +
                escapeHtml(collective.collective_id) +
                '">View<br>Providers</a>' +
                '<button class="edit-btn" type="button" data-action="edit-unit" data-unit-id="' +
                escapeHtml(unit.unit_id) +
                '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
                "</button>" +
                "</div>"
              );
            })
            .join("")
          : '<div class="unit-row"><span class="unit-name">No units in this collective.</span></div>';

        var cmName = entry.collectiveManager
          ? entry.collectiveManager.name
          : "Unassigned";

        return (
          '<div class="collective-card">' +
          '<div class="collective-header">' +
          '<div class="collective-icon ' +
          iconClass +
          '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 3H8"></path><path d="M12 3v4"></path></svg>' +
          "</div>" +
          '<div class="collective-info">' +
          '<div class="collective-name">' +
          escapeHtml(collective.collective_name) +
          " (" +
          escapeHtml(collective.collective_id) +
          ")</div>" +
          '<div class="collective-meta">' +
          escapeHtml(sectorText) +
          " • " +
          escapeHtml(statusText) +
          " since " +
          escapeHtml(activeSince) +
          "<br>CM: <strong>" +
          escapeHtml(cmName) +
          "</strong> " +
          '<button type="button" class="btn-secondary" style="margin-left:8px; padding: 2px 8px; font-size: 11px; height: auto; min-height: 20px;" data-action="edit-collective" data-collective-id="' +
          escapeHtml(collective.collective_id) +
          '">Edit</button>' +
          "</div>" +
          "</div>" +
          '<div class="collective-stats">' +
          '<div class="cstat"><span class="cstat-num cstat-num--blue">' +
          entry.units.length +
          '</span><span class="cstat-label">TOTAL<br>UNITS</span></div>' +
          '<div class="cstat"><span class="cstat-num cstat-num--orange">' +
          entry.providerCount +
          '</span><span class="cstat-label">PROVIDERS</span></div>' +
          "</div>" +
          "</div>" +
          '<div class="unit-list">' +
          unitsHtml +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    var shownStart = total ? start + 1 : 0;
    var shownEnd = Math.min(start + state.COLLECTIVE_PAGE_SIZE, total);
    el.collectivesTableInfo.textContent =
      "Showing " +
      shownStart +
      "-" +
      shownEnd +
      " of " +
      total +
      " collectives";

    el.collectivesPrevPageBtn.disabled = state.collectivePage <= 1;
    el.collectivesNextPageBtn.disabled = state.collectivePage >= maxPage;

    // Render page numbers
    var pagesHtml = "";
    if (maxPage > 1) {
      for (var p = 1; p <= maxPage; p++) {
        var activeClass = p === state.collectivePage ? " active" : "";
        pagesHtml +=
          '<button class="page-num' +
          activeClass +
          '" data-page="' +
          p +
          '">' +
          p +
          "</button>";
      }
    }
    el.collectivesPages.innerHTML = pagesHtml;

    renderProviders();
  }

  function starHTML(rating) {
    var numeric = Number(rating);
    if (isNaN(numeric) || numeric <= 0) {
      return '<span class="rating-num">N/A</span>';
    }
    var full = Math.round(numeric);
    var stars = "";
    for (var i = 0; i < 5; i += 1) {
      stars +=
        '<span class="star" style="color:' +
        (i < full ? "#f59e0b" : "#d1d5db") +
        '">★</span>';
    }
    return stars + '<span class="rating-num">' + numeric.toFixed(1) + "</span>";
  }

  function getSelectedUnit() {
    var units = AppStore.getTable("units") || [];
    for (var i = 0; i < units.length; i += 1) {
      if (units[i].unit_id === state.selectedUnitId) return units[i];
    }
    return null;
  }

  function getUnitProviderRows() {
    var tables = getTables();
    var selectedUnit = getSelectedUnit();
    if (!selectedUnit) return [];

    var providerSkillsLookup = getProviderSkillsLookup(
      tables.providerSkills,
      tables.skills,
    );

    var rows = tables.providers
      .filter(function (p) {
        return p.unit_id === selectedUnit.unit_id;
      })
      .map(function (p, idx) {
        var providerSkill = providerSkillsLookup[p.service_provider_id];
        var skill =
          providerSkill && providerSkill.length
            ? providerSkill[0]
            : deriveSkillFromUnitName(selectedUnit.unit_name);
        var status = getProviderStatus(
          p,
          tables.assignments,
          AppStore.getTable("provider_unavailability") || [],
        );

        return {
          index: idx,
          provider: p,
          skill: skill,
          status: status,
          actionType: p.is_active ? "reassign" : "assign",
        };
      });

    return rows;
  }

  function renderProviders() {
    var selectedUnit = getSelectedUnit();
    if (!selectedUnit) {
      el.providerTitle.textContent = "Provider Management";
      el.providerSubtitle.textContent =
        "Select a unit to manage provider assignments.";
      el.providersTbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#6b7280;">No unit selected.</td></tr>';
      el.tableInfo.textContent = "Showing 0 of 0 providers";
      return;
    }

    var rows = getUnitProviderRows();
    var total = rows.length;
    var maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.providerPage > maxPage) state.providerPage = maxPage;

    var start = (state.providerPage - 1) * PAGE_SIZE;
    var pageRows = rows.slice(start, start + PAGE_SIZE);

    el.providerTitle.textContent =
      "Provider Management: " +
      selectedUnit.unit_name +
      " (" +
      selectedUnit.unit_id +
      ")";
    el.providerSubtitle.textContent =
      "Manage individual provider assignments for this unit.";

    if (!pageRows.length) {
      el.providersTbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#6b7280;">No providers assigned to this unit.</td></tr>';
    } else {
      el.providersTbody.innerHTML = pageRows
        .map(function (row) {
          var p = row.provider;
          var initials = getInitials(p.name);
          var avatarBg = row.index % 2 === 0 ? "#eff6ff" : "#f0fdf4";
          var avatarColor = row.index % 2 === 0 ? "#2563eb" : "#15803d";
          var buttonHtml =
            row.actionType === "reassign"
              ? '<button class="reassign-btn" type="button" data-action="reassign-provider" data-provider-id="' +
              escapeHtml(p.service_provider_id) +
              '">Reassign</button>'
              : '<button class="assign-btn" type="button" data-action="assign-provider" data-provider-id="' +
              escapeHtml(p.service_provider_id) +
              '">Assign Provider</button>';

          return (
            "<tr>" +
            "<td>" +
            '<div class="prov-cell">' +
            '<div class="prov-avatar" style="background:' +
            avatarBg +
            ";color:" +
            avatarColor +
            '">' +
            escapeHtml(initials) +
            "</div>" +
            "<div>" +
            '<div class="prov-name">' +
            escapeHtml(p.name) +
            "</div>" +
            '<div class="prov-id">ID: ' +
            escapeHtml(p.service_provider_id) +
            "</div>" +
            "</div>" +
            "</div>" +
            "</td>" +
            "<td>" +
            escapeHtml(row.skill) +
            "</td>" +
            '<td><div class="rating-cell">' +
            starHTML(p.rating) +
            "</div></td>" +
            '<td><span class="prov-status prov-status--' +
            escapeHtml(row.status.css) +
            '">' +
            escapeHtml(row.status.label) +
            "</span></td>" +
            "<td>" +
            '<div class="action-row">' +
            '<button class="remove-link" type="button" data-action="remove-provider" data-provider-id="' +
            escapeHtml(p.service_provider_id) +
            '">Remove Provider</button>' +
            buttonHtml +
            "</div>" +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    var shownStart = total ? start + 1 : 0;
    var shownEnd = Math.min(start + PAGE_SIZE, total);
    el.tableInfo.textContent =
      "Showing " +
      shownStart +
      "-" +
      shownEnd +
      " of " +
      total +
      " providers in this unit";

    el.prevPageBtn.disabled = state.providerPage <= 1;
    el.nextPageBtn.disabled = state.providerPage >= maxPage;
  }

  function validateCollectiveForm() {
    var tables = getTables();
    var name = String(el.collectiveNameInput.value || "").trim();
    var isActive = el.collectiveStatusSelect.value === "true";
    var sectorIds = Array.from(el.collectiveSectorSelect.selectedOptions).map(
      function (option) {
        return option.value;
      },
    );

    var valid = true;
    if (!name) {
      setFieldError(
        el.collectiveNameInput,
        el.collectiveNameError,
        "Collective name is required.",
      );
      valid = false;
    } else if (name.length < 3) {
      setFieldError(
        el.collectiveNameInput,
        el.collectiveNameError,
        "Name must be at least 3 characters.",
      );
      valid = false;
    } else {
      var duplicate = tables.collectives.some(function (collective) {
        return (
          normalizeName(collective.collective_name) === normalizeName(name)
        );
      });
      if (duplicate) {
        setFieldError(
          el.collectiveNameInput,
          el.collectiveNameError,
          "A collective with this name already exists.",
        );
        valid = false;
      } else {
        setFieldError(el.collectiveNameInput, el.collectiveNameError, "");
      }
    }

    if (!sectorIds.length) {
      setFieldError(
        el.collectiveSectorSelect,
        el.collectiveSectorError,
        "Select at least one sector.",
      );
      valid = false;
    } else {
      var usedSectorIds = getUsedSectorIds(null);
      var conflicts = sectorIds.filter(function (sid) {
        return usedSectorIds.indexOf(sid) !== -1;
      });
      if (conflicts.length) {
        setFieldError(
          el.collectiveSectorSelect,
          el.collectiveSectorError,
          "These sectors are already assigned to another collective: " + conflicts.join(", "),
        );
        valid = false;
      } else {
        setFieldError(el.collectiveSectorSelect, el.collectiveSectorError, "");
      }
    }

    if (!state.selectedCmId) {
      setFieldError(el.collectiveManagerInput, el.collectiveManagerError, "A valid unassigned collective manager must be selected.");
      valid = false;
    } else {
      var managerRef = tables.collectiveManagers.find(function (m) { return m.cm_id === state.selectedCmId; });
      if (!managerRef || managerRef.collective_id) {
        setFieldError(el.collectiveManagerInput, el.collectiveManagerError, "The selected manager is not available.");
        valid = false;
      } else {
        setFieldError(el.collectiveManagerInput, el.collectiveManagerError, "");
      }
    }

    if (!valid) return null;
    return {
      name: name,
      isActive: isActive,
      sectorIds: sectorIds,
      cmId: state.selectedCmId
    };
  }

  function submitCreateCollective() {
    var result = validateCollectiveForm();
    if (!result) return;

    var newCollective = {
      collective_id: AppStore.nextId("COL"),
      collective_name: result.name,
      is_active: result.isActive,
      created_at: new Date().toISOString(),
      sector_ids: result.sectorIds,
    };

    AppStore.getTable("collectives").push(newCollective);

    // Assign CM
    var managers = AppStore.getTable("collective_managers");
    managers.forEach(function (m) {
      if (m.cm_id === result.cmId) {
        m.collective_id = newCollective.collective_id;
        m.updated_at = new Date().toISOString();
      }
    });

    AppStore.save();

    state.selectedCollectiveId = newCollective.collective_id;
    state.selectedUnitId = null;
    state.providerPage = 1;

    closeModal(el.collectiveModal);
    populateFilters();
    renderCollectives();
    notify("Collective created successfully: " + newCollective.collective_id);
  }

  function openReassignCmModal(collectiveId) {
    state.reassignCollectiveId = collectiveId;
    state.reassignCmId = null;
    if (el.reassignCmForm) el.reassignCmForm.reset();
    if (el.reassignCmInput) el.reassignCmInput.value = "";
    if (el.reassignCmDropdown) el.reassignCmDropdown.innerHTML = "";
    setFieldError(el.reassignCmInput, el.reassignCmError, "");

    // Attempt to pre-fill the current manager
    var tables = getTables();
    var currentMgr = tables.collectiveManagers.find(function (m) { return m.collective_id === collectiveId; });
    if (currentMgr && el.reassignCmInput) {
      el.reassignCmInput.value = currentMgr.name;
      state.reassignCmId = currentMgr.cm_id;
    }

    openModal(el.reassignCmModal);
    // Explicitly setup the autocomplete with the collective ID context so they can pick the current guy too
    setupCmAutocomplete(el.reassignCmInput, el.reassignCmDropdown, el.reassignCmError, "reassignCmId", collectiveId);
  }

  function submitReassignCm() {
    if (!state.reassignCollectiveId) {
      closeModal(el.reassignCmModal);
      return;
    }

    if (!state.reassignCmId) {
      setFieldError(el.reassignCmInput, el.reassignCmError, "Please select a valid manager from the list.");
      return;
    }

    var managers = AppStore.getTable("collective_managers");
    var collectiveId = state.reassignCollectiveId;
    var chosenId = state.reassignCmId;

    var chosenManager = managers.find(function (m) { return m.cm_id === chosenId; });
    if (!chosenManager || (chosenManager.collective_id && chosenManager.collective_id !== collectiveId)) {
      setFieldError(el.reassignCmInput, el.reassignCmError, "This manager is not available.");
      return;
    }

    // Remove existing
    managers.forEach(function (m) {
      if (m.collective_id === collectiveId) {
        m.collective_id = null;
      }
    });

    // Assign new
    chosenManager.collective_id = collectiveId;
    chosenManager.updated_at = new Date().toISOString();

    AppStore.save();
    closeModal(el.reassignCmModal);
    renderCollectives();
    notify("Collective Manager updated.");
  }

  function openEditCollectiveModal(collectiveId) {
    state.editingCollectiveId = collectiveId;
    state.editCmId = null;

    var tables = getTables();
    var collective = tables.collectives.find(function (c) {
      return c.collective_id === collectiveId;
    });
    if (!collective) {
      notify("Collective not found.");
      return;
    }

    // Reset form
    if (el.editCollectiveForm) el.editCollectiveForm.reset();
    if (el.editCollectiveCmInput) el.editCollectiveCmInput.value = "";
    if (el.editCollectiveCmDropdown) el.editCollectiveCmDropdown.innerHTML = "";
    setFieldError(el.editCollectiveCmInput, el.editCollectiveCmError, "");
    setFieldError(el.editCollectiveSectorSelect, el.editCollectiveSectorError, "");

    // Pre-fill current CM
    var currentMgr = tables.collectiveManagers.find(function (m) {
      return m.collective_id === collectiveId;
    });
    if (currentMgr && el.editCollectiveCmInput) {
      el.editCollectiveCmInput.value = currentMgr.name;
      state.editCmId = currentMgr.cm_id;
    }

    // Populate sector multi-select (mark taken sectors from OTHER collectives as disabled)
    var usedSectorIds = getUsedSectorIds(collectiveId);
    var currentSectorIds = Array.isArray(collective.sector_ids)
      ? collective.sector_ids
      : [];

    if (el.editCollectiveSectorSelect) {
      el.editCollectiveSectorSelect.innerHTML = "";
      tables.sectors
        .slice()
        .sort(function (a, b) {
          return String(a.sector_name).localeCompare(String(b.sector_name));
        })
        .forEach(function (sector) {
          var option = document.createElement("option");
          option.value = sector.sector_id;
          var taken = usedSectorIds.indexOf(sector.sector_id) !== -1;
          option.textContent =
            sector.sector_id +
            " - " +
            sector.sector_name +
            " (" +
            (sector.region || "Unknown") +
            ")" +
            (taken ? " [TAKEN]" : "");
          if (taken) {
            option.disabled = true;
            option.style.color = "#9ca3af";
          }
          // Pre-select sectors belonging to this collective
          if (currentSectorIds.indexOf(sector.sector_id) !== -1) {
            option.selected = true;
          }
          el.editCollectiveSectorSelect.appendChild(option);
        });
    }

    // Setup CM autocomplete (include current collective for re-selection)
    setupCmAutocomplete(
      el.editCollectiveCmInput,
      el.editCollectiveCmDropdown,
      el.editCollectiveCmError,
      "editCmId",
      collectiveId,
    );

    // Update modal title
    var titleEl = document.getElementById("edit-collective-modal-title");
    if (titleEl) {
      titleEl.textContent =
        "Edit: " + collective.collective_name;
    }

    openModal(el.editCollectiveModal);
  }

  function submitEditCollective() {
    var collectiveId = state.editingCollectiveId;
    if (!collectiveId) {
      closeModal(el.editCollectiveModal);
      return;
    }

    var tables = getTables();
    var collective = tables.collectives.find(function (c) {
      return c.collective_id === collectiveId;
    });
    if (!collective) {
      notify("Collective not found.");
      closeModal(el.editCollectiveModal);
      return;
    }

    var valid = true;

    // Validate CM
    if (!state.editCmId) {
      setFieldError(
        el.editCollectiveCmInput,
        el.editCollectiveCmError,
        "Please select a valid manager from the list.",
      );
      valid = false;
    } else {
      var chosenMgr = tables.collectiveManagers.find(function (m) {
        return m.cm_id === state.editCmId;
      });
      if (
        !chosenMgr ||
        (chosenMgr.collective_id &&
          chosenMgr.collective_id !== collectiveId)
      ) {
        setFieldError(
          el.editCollectiveCmInput,
          el.editCollectiveCmError,
          "This manager is not available.",
        );
        valid = false;
      } else {
        setFieldError(el.editCollectiveCmInput, el.editCollectiveCmError, "");
      }
    }

    // Validate sectors
    var sectorIds = Array.from(
      el.editCollectiveSectorSelect.selectedOptions,
    ).map(function (opt) {
      return opt.value;
    });

    if (!sectorIds.length) {
      setFieldError(
        el.editCollectiveSectorSelect,
        el.editCollectiveSectorError,
        "A collective must have at least one sector.",
      );
      valid = false;
    } else {
      var usedSectorIds = getUsedSectorIds(collectiveId);
      var conflicts = sectorIds.filter(function (sid) {
        return usedSectorIds.indexOf(sid) !== -1;
      });
      if (conflicts.length) {
        setFieldError(
          el.editCollectiveSectorSelect,
          el.editCollectiveSectorError,
          "These sectors are already assigned to another collective: " +
          conflicts.join(", "),
        );
        valid = false;
      } else {
        setFieldError(
          el.editCollectiveSectorSelect,
          el.editCollectiveSectorError,
          "",
        );
      }
    }

    if (!valid) return;

    // Apply CM change
    var managers = AppStore.getTable("collective_managers");
    // Unassign old manager from this collective
    managers.forEach(function (m) {
      if (m.collective_id === collectiveId) {
        m.collective_id = null;
      }
    });
    // Assign new manager
    var newMgr = managers.find(function (m) {
      return m.cm_id === state.editCmId;
    });
    if (newMgr) {
      newMgr.collective_id = collectiveId;
      newMgr.updated_at = new Date().toISOString();
    }

    // Apply sector changes
    collective.sector_ids = sectorIds;

    AppStore.save();
    closeModal(el.editCollectiveModal);
    populateFilters();
    renderCollectives();
    notify("Collective updated successfully.");
  }

  function assignUnitManager(unitId, managerRef) {
    if (!managerRef) return true;
    var managers = AppStore.getTable("unit_managers") || [];
    var selected = managers.find(function (m) {
      return (
        m.um_id === managerRef ||
        m.name.toLowerCase() === String(managerRef).toLowerCase()
      );
    });

    if (!selected) {
      notify('Unit manager "' + managerRef + '" does not exist.');
      return false;
    }
    if (selected.unit_id && selected.unit_id !== unitId) {
      notify(selected.name + " already manages another unit.");
      return false;
    }

    managers.forEach(function (m) {
      if (m.unit_id === unitId && m.um_id !== selected.um_id) {
        m.unit_id = null;
      }
    });
    selected.unit_id = unitId;
    return true;
  }

  function validateUnitForm() {
    var tables = getTables();
    var name = String(el.unitNameInput.value || "").trim();
    var collectiveId = String(el.unitCollectiveSelect.value || "").trim();
    var managerRef = String(el.unitManagerSelect.value || "").trim();
    var isActive = el.unitStatusSelect.value === "true";

    var valid = true;
    if (!name) {
      setFieldError(
        el.unitNameInput,
        el.unitNameError,
        "Unit name is required.",
      );
      valid = false;
    } else if (name.length < 3) {
      setFieldError(
        el.unitNameInput,
        el.unitNameError,
        "Name must be at least 3 characters.",
      );
      valid = false;
    } else {
      var duplicate = tables.units.some(function (unit) {
        return (
          unit.unit_id !== state.editingUnitId &&
          unit.collective_id === collectiveId &&
          normalizeName(unit.unit_name) === normalizeName(name)
        );
      });
      if (duplicate) {
        setFieldError(
          el.unitNameInput,
          el.unitNameError,
          "This unit name already exists in the selected collective.",
        );
        valid = false;
      } else {
        setFieldError(el.unitNameInput, el.unitNameError, "");
      }
    }

    var hasCollective = tables.collectives.some(function (collective) {
      return collective.collective_id === collectiveId;
    });
    if (!collectiveId || !hasCollective) {
      setFieldError(
        el.unitCollectiveSelect,
        el.unitCollectiveError,
        "Please choose a valid collective.",
      );
      valid = false;
    } else {
      setFieldError(el.unitCollectiveSelect, el.unitCollectiveError, "");
    }

    if (managerRef) {
      var manager = tables.unitManagers.find(function (m) {
        return (
          m.um_id === managerRef ||
          m.name.toLowerCase() === managerRef.toLowerCase()
        );
      });
      if (!manager || manager.unit_id) {
        setFieldError(
          el.unitManagerSelect,
          el.unitManagerError,
          "Selected manager is not available.",
        );
        valid = false;
      } else {
        setFieldError(el.unitManagerSelect, el.unitManagerError, "");
      }
    } else {
      setFieldError(el.unitManagerSelect, el.unitManagerError, "");
    }

    if (!valid) return null;
    return {
      name: name,
      collectiveId: collectiveId,
      managerRef: managerRef,
      isActive: isActive,
    };
  }

  function submitCreateUnit() {
    var result = validateUnitForm();
    if (!result) return;

    var units = AppStore.getTable("units");
    var managers = AppStore.getTable("unit_managers") || [];
    var unitId = state.editingUnitId || AppStore.nextId("UNT");

    if (!assignUnitManager(unitId, result.managerRef)) {
      return;
    }

    if (!result.managerRef) {
      managers.forEach(function (manager) {
        if (manager.unit_id === unitId) manager.unit_id = null;
      });
    }

    if (state.editingUnitId) {
      var existing = units.find(function (unit) {
        return unit.unit_id === state.editingUnitId;
      });
      if (!existing) {
        notify("Unit not found.");
        return;
      }
      existing.unit_name = result.name;
      existing.collective_id = result.collectiveId;
      existing.is_active = result.isActive;
    } else {
      units.push({
        unit_id: unitId,
        unit_name: result.name,
        rating: null,
        rating_count: 0,
        is_active: result.isActive,
        created_at: new Date().toISOString(),
        collective_id: result.collectiveId,
      });
    }

    AppStore.save();

    state.selectedCollectiveId = result.collectiveId;
    state.selectedUnitId = unitId;
    state.providerPage = 1;

    closeModal(el.unitModal);
    populateFilters();
    renderCollectives();
    notify(
      state.editingUnitId
        ? "Unit updated: " + unitId
        : "Unit created successfully: " + unitId,
    );
  }

  function removeProvider(providerId) {
    var providers = AppStore.getTable("service_providers") || [];
    var provider = providers.find(function (p) {
      return p.service_provider_id === providerId;
    });
    if (!provider) return;

    openConfirmModal(
      "Remove " + provider.name + " from this unit?",
      function () {
        provider.unit_id = null;
        AppStore.save();
        renderCollectives();
        notify("Provider removed from unit.");
      },
    );
  }

  function reassignProvider(providerId) {
    openReassignModal(providerId);
  }

  function assignProvider(providerId) {
    var providers = AppStore.getTable("service_providers") || [];
    var provider = providers.find(function (p) {
      return p.service_provider_id === providerId;
    });
    if (!provider) return;

    if (!state.selectedUnitId) {
      notify("Select a unit first.");
      return;
    }
    provider.unit_id = state.selectedUnitId;
    provider.is_active = true;
    AppStore.save();
    renderCollectives();
    notify("Provider assigned to selected unit.");
  }

  function exportProviderList() {
    var selectedUnit = getSelectedUnit();
    if (!selectedUnit) {
      notify("Select a unit first.");
      return;
    }

    var rows = getUnitProviderRows();
    if (!rows.length) {
      notify("No providers to export for this unit.");
      return;
    }

    var csv = ["provider_id,provider_name,email,phone,skill,status"];
    rows.forEach(function (row) {
      var p = row.provider;
      csv.push(
        [
          p.service_provider_id,
          p.name,
          p.email,
          p.phone,
          row.skill,
          row.status.label,
        ]
          .map(function (val) {
            return (
              '"' + String(val == null ? "" : val).replace(/\"/g, '""') + '"'
            );
          })
          .join(","),
      );
    });

    var blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = selectedUnit.unit_id + "_providers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    if (el.logoutBtn) {
      el.logoutBtn.addEventListener("click", function (event) {
        event.preventDefault();
        openConfirmModal("Are you sure you want to logout?", function () {
          window.location.href = el.logoutBtn.getAttribute("href");
        });
      });
    }

    if (el.createCollectiveBtn) {
      el.createCollectiveBtn.addEventListener(
        "click",
        openCreateCollectiveModal,
      );
    }
    if (el.createUnitBtn) {
      el.createUnitBtn.addEventListener("click", function () {
        if (!(AppStore.getTable("collectives") || []).length) {
          notify("Create a collective first.");
          return;
        }
        openCreateUnitModal();
      });
    }

    if (el.collectiveModalClose) {
      el.collectiveModalClose.addEventListener("click", function () {
        closeModal(el.collectiveModal);
      });
    }
    if (el.collectiveCancelBtn) {
      el.collectiveCancelBtn.addEventListener("click", function () {
        closeModal(el.collectiveModal);
      });
    }
    if (el.collectiveModal) {
      el.collectiveModal.addEventListener("click", function (event) {
        if (event.target === el.collectiveModal) closeModal(el.collectiveModal);
      });
    }
    if (el.collectiveForm) {
      el.collectiveForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitCreateCollective();
      });
    }

    if (el.unitModalClose) {
      el.unitModalClose.addEventListener("click", function () {
        closeModal(el.unitModal);
      });
    }
    if (el.unitCancelBtn) {
      el.unitCancelBtn.addEventListener("click", function () {
        closeModal(el.unitModal);
      });
    }
    if (el.unitModal) {
      el.unitModal.addEventListener("click", function (event) {
        if (event.target === el.unitModal) closeModal(el.unitModal);
      });
    }
    if (el.unitForm) {
      el.unitForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitCreateUnit();
      });
    }

    el.searchInput.addEventListener("input", function (event) {
      state.quickSearch = (event.target.value || "").trim();
      state.providerPage = 1;
      renderCollectives();
    });

    el.sectorFilter.addEventListener("change", function (event) {
      state.sector = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderCollectives();
    });

    el.managerFilter.addEventListener("change", function (event) {
      state.manager = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderCollectives();
    });

    el.collectiveManagerFilter.addEventListener("change", function (event) {
      state.collectiveManager = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderCollectives();
    });

    el.collectivesGrid.addEventListener("click", function (event) {
      var target = event.target;
      var actionEl = target.closest("[data-action]");
      if (!actionEl) return;

      var action = actionEl.getAttribute("data-action");
      if (action === "view-providers") {
        event.preventDefault();
        state.selectedUnitId = actionEl.getAttribute("data-unit-id");
        state.selectedCollectiveId =
          actionEl.getAttribute("data-collective-id");
        state.providerPage = 1;
        renderCollectives();
      }
      if (action === "edit-unit") {
        event.preventDefault();
        openEditUnitModal(actionEl.getAttribute("data-unit-id"));
      }
      if (action === "edit-collective") {
        event.preventDefault();
        openEditCollectiveModal(actionEl.getAttribute("data-collective-id"));
      }
    });

    if (el.confirmModalClose) {
      el.confirmModalClose.addEventListener("click", closeConfirmModal);
    }
    if (el.confirmCancelBtn) {
      el.confirmCancelBtn.addEventListener("click", closeConfirmModal);
    }
    if (el.confirmOkBtn) {
      el.confirmOkBtn.addEventListener("click", function () {
        var fn = confirmHandler;
        closeConfirmModal();
        if (fn) fn();
      });
    }
    if (el.confirmModal) {
      el.confirmModal.addEventListener("click", function (event) {
        if (event.target === el.confirmModal) closeConfirmModal();
      });
    }

    if (el.reassignModalClose) {
      el.reassignModalClose.addEventListener("click", closeReassignModal);
    }
    if (el.reassignCancelBtn) {
      el.reassignCancelBtn.addEventListener("click", closeReassignModal);
    }
    if (el.reassignModal) {
      el.reassignModal.addEventListener("click", function (event) {
        if (event.target === el.reassignModal) closeReassignModal();
      });
    }
    if (el.reassignForm) {
      el.reassignForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitReassignProvider();
      });
    }

    if (el.reassignCmModalClose) {
      el.reassignCmModalClose.addEventListener("click", function () { closeModal(el.reassignCmModal); });
    }
    if (el.reassignCmCancelBtn) {
      el.reassignCmCancelBtn.addEventListener("click", function () { closeModal(el.reassignCmModal); });
    }
    if (el.reassignCmModal) {
      el.reassignCmModal.addEventListener("click", function (event) {
        if (event.target === el.reassignCmModal) closeModal(el.reassignCmModal);
      });
    }
    if (el.reassignCmForm) {
      el.reassignCmForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitReassignCm();
      });
    }

    if (el.editCollectiveModalClose) {
      el.editCollectiveModalClose.addEventListener("click", function () { closeModal(el.editCollectiveModal); });
    }
    if (el.editCollectiveCancelBtn) {
      el.editCollectiveCancelBtn.addEventListener("click", function () { closeModal(el.editCollectiveModal); });
    }
    if (el.editCollectiveModal) {
      el.editCollectiveModal.addEventListener("click", function (event) {
        if (event.target === el.editCollectiveModal) closeModal(el.editCollectiveModal);
      });
    }
    if (el.editCollectiveForm) {
      el.editCollectiveForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitEditCollective();
      });
    }

    el.providersTbody.addEventListener("click", function (event) {
      var actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;
      var action = actionEl.getAttribute("data-action");
      var providerId = actionEl.getAttribute("data-provider-id");

      if (action === "remove-provider") removeProvider(providerId);
      if (action === "reassign-provider") reassignProvider(providerId);
      if (action === "assign-provider") assignProvider(providerId);
    });

    el.prevPageBtn.addEventListener("click", function () {
      if (state.providerPage <= 1) return;
      state.providerPage -= 1;
      renderProviders();
    });

    el.nextPageBtn.addEventListener("click", function () {
      var total = getUnitProviderRows().length;
      var maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (state.providerPage >= maxPage) return;
      state.providerPage += 1;
      renderProviders();
    });

    el.collectivesPrevPageBtn.addEventListener("click", function () {
      if (state.collectivePage <= 1) return;
      state.collectivePage -= 1;
      renderCollectives();
    });

    el.collectivesNextPageBtn.addEventListener("click", function () {
      var total = getFilteredCollectivesData().length;
      var maxPage = Math.max(1, Math.ceil(total / state.COLLECTIVE_PAGE_SIZE));
      if (state.collectivePage >= maxPage) return;
      state.collectivePage += 1;
      renderCollectives();
    });

    el.collectivesPages.addEventListener("click", function (event) {
      var target = event.target;
      if (target.classList.contains("page-num")) {
        var page = parseInt(target.getAttribute("data-page"), 10);
        if (!isNaN(page) && page !== state.collectivePage) {
          state.collectivePage = page;
          renderCollectives();
        }
      }
    });

    if (el.exportBtn) {
      el.exportBtn.addEventListener("click", exportProviderList);
    }
  }

  function initSelection() {
    var units = AppStore.getTable("units") || [];
    if (units.length) {
      state.selectedUnitId = units[0].unit_id;
      state.selectedCollectiveId = units[0].collective_id;
    }
  }

  function init() {
    updateNotificationBadges();
    initSelection();
    populateFilters();
    bindEvents();
    renderCollectives();
    setupCmAutocomplete(el.collectiveManagerInput, el.collectiveManagerDropdown, el.collectiveManagerError, "selectedCmId", null);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
});
