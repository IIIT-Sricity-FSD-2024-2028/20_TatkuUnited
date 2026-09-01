/* collective_unit.js — API-backed */

var _cache = {
  regions: [], units: [], sectors: [], regionManagers: [], regionManagers: [],
  providers: [], providerSkills: [], skills: [], assignments: []
};

async function _loadCache() {
  const endpoints = [
    ["/regions", "regions"], ["/regions", "units"], ["/regions", "sectors"],
    ["/unit-managers", "regionManagers"], ["/collective-managers", "regionManagers"],
    ["/service-providers", "providers"], ["/provider-skills", "providerSkills"],
    ["/skills", "skills"], ["/job-assignments", "assignments"]
  ];
  await Promise.all(endpoints.map(async ([url, key]) => {
    try {
      _cache[key]  = await Api.get(url);
    } catch (err) {
      console.warn("Failed to load " + url + ":", err);
      _cache[key] = [];
    }
  }));
}

(async function () {
  var session = Auth.requireSession(["super_user"]);
  if (!session) return;

  await _loadCache();

  function updateNotificationBadges() {
    document.querySelectorAll(".notif-badge").forEach(function (badge) {
      badge.textContent = "";
      badge.style.display = "none";
    });
  }

  var PAGE_SIZE = 5;
  var state = {
    selectedRegionId: null,
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
    reassignRegionId: null,
    editingRegionId: null,
    editCmId: null,
    collectivePage: 1,
    COLLECTIVE_PAGE_SIZE: 6,
    regionManager: "All Managers",
    expandedUnitIds: [], // Track which units are expanded
  };

  var el = {
    logoutBtn: document.getElementById("logout-btn"),
    createUnitBtn: document.getElementById("btn-create-unit"),
    createRegionBtn: document.getElementById("btn-create-collective"),
    searchInput: document.getElementById("quick-search"),
    sectorFilter: document.getElementById("city-filter"),
    managerFilter: document.getElementById("manager-filter"),
    regionManagerFilter: document.getElementById("collective-manager-filter"),
    regionsGrid: document.getElementById("regions-grid"),
    regionsPrevPageBtn: document.getElementById("regions-prev-page"),
    regionsNextPageBtn: document.getElementById("regions-next-page"),
    regionsTableInfo: document.getElementById("regions-table-info"),
    regionsPages: document.getElementById("regions-pages"),
    collectiveModal: document.getElementById("collective-modal"),
    collectiveModalClose: document.getElementById("collective-modal-close"),
    collectiveCancelBtn: document.getElementById("collective-cancel-btn"),
    collectiveForm: document.getElementById("collective-form"),
    collectiveNameInput: document.getElementById("collective-name-input"),
    collectiveStatusSelect: document.getElementById("collective-status-select"),
    collectiveSectorSelect: document.getElementById("collective-sector-select"),
    collectiveNameError: document.getElementById("collective-name-error"),
    collectiveSectorError: document.getElementById("collective-sector-error"),
    regionManagerInput: document.getElementById("collective-manager-input"),
    regionManagerDropdown: document.getElementById("collective-manager-dropdown"),
    regionManagerError: document.getElementById("collective-manager-error"),
    unitModal: document.getElementById("unit-modal"),
    unitModalClose: document.getElementById("unit-modal-close"),
    unitCancelBtn: document.getElementById("unit-cancel-btn"),
    unitForm: document.getElementById("unit-form"),
    unitNameInput: document.getElementById("unit-name-input"),
    unitRegionSelect: document.getElementById("unit-collective-select"),
    regionManagerSelect: document.getElementById("unit-manager-select"),
    unitStatusSelect: document.getElementById("unit-status-select"),
    unitSubmitBtn: document.getElementById("unit-submit-btn"),
    unitNameError: document.getElementById("unit-name-error"),
    unitRegionError: document.getElementById("unit-collective-error"),
    regionManagerError: document.getElementById("unit-manager-error"),
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
    editRegionModal: document.getElementById("edit-collective-modal"),
    editRegionModalClose: document.getElementById("edit-collective-modal-close"),
    editRegionForm: document.getElementById("edit-collective-form"),
    editRegionCmInput: document.getElementById("edit-collective-cm-input"),
    editRegionCmDropdown: document.getElementById("edit-collective-cm-dropdown"),
    editRegionCmError: document.getElementById("edit-collective-cm-error"),
    editRegionSectorSelect: document.getElementById("edit-collective-sector-select"),
    editRegionSectorError: document.getElementById("edit-collective-sector-error"),
    editRegionCancelBtn: document.getElementById("edit-collective-cancel-btn"),
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

  function resetRegionForm() {
    if (el.collectiveForm) el.collectiveForm.reset();
    if (el.collectiveStatusSelect) el.collectiveStatusSelect.value = "true";
    state.selectedCmId = null;
    if (el.regionManagerInput) el.regionManagerInput.value = "";
    if (el.regionManagerDropdown) el.regionManagerDropdown.innerHTML = "";
    if (el.regionManagerDropdown) el.regionManagerDropdown.style.display = "none";
    setFieldError(el.collectiveNameInput, el.collectiveNameError, "");
    setFieldError(el.collectiveSectorSelect, el.collectiveSectorError, "");
    setFieldError(el.regionManagerInput, el.regionManagerError, "");
  }

  function resetUnitForm() {
    if (el.unitForm) el.unitForm.reset();
    if (el.unitStatusSelect) el.unitStatusSelect.value = "true";
    setFieldError(el.unitNameInput, el.unitNameError, "");
    setFieldError(el.unitRegionSelect, el.unitRegionError, "");
    setFieldError(el.regionManagerSelect, el.regionManagerError, "");
    state.editingUnitId = null;
    if (el.unitModalTitle) el.unitModalTitle.textContent = "Create New Region";
    if (el.unitSubmitBtn) el.unitSubmitBtn.textContent = "Create Unit";
  }

  function populateRegionFormOptions() {
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
        option.value = sector.region_id;
        var taken = usedSectorIds.indexOf(sector.region_id) !== -1;
        option.textContent =
          sector.region_id +
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

  function getUsedSectorIds(excludeRegionId) {
    var regions = _cache.regions;
    var used = [];
    regions.forEach(function (c) {
      if (c.region_id === excludeRegionId) return;
      var ids = Array.isArray(c.region_ids) ? c.region_ids : [];
      ids.forEach(function (sid) {
        if (used.indexOf(sid) === -1) used.push(sid);
      });
    });
    return used;
  }

  function populateUnitFormOptions(includeManagerUnitId) {
    var tables = getTables();
    if (el.unitRegionSelect) {
      el.unitRegionSelect.innerHTML =
        '<option value="">Select collective</option>';
      tables.regions
        .slice()
        .sort(function (a, b) {
          return String(a.region_name).localeCompare(
            String(b.region_name),
          );
        })
        .forEach(function (collective) {
          var option = document.createElement("option");
          option.value = collective.region_id;
          option.textContent =
            collective.region_name + " (" + collective.region_id + ")";
          el.unitRegionSelect.appendChild(option);
        });

      if (state.selectedRegionId) {
        el.unitRegionSelect.value = state.selectedRegionId;
      }
    }

    if (el.regionManagerSelect) {
      el.regionManagerSelect.innerHTML = '<option value="">Unassigned</option>';
      tables.regionManagers
        .filter(function (manager) {
          return !manager.region_id || manager.region_id === includeManagerUnitId;
        })
        .sort(function (a, b) {
          return String(a.name).localeCompare(String(b.name));
        })
        .forEach(function (manager) {
          var option = document.createElement("option");
          option.value = manager.um_id;
          option.textContent = manager.name + " (" + manager.um_id + ")";
          el.regionManagerSelect.appendChild(option);
        });
    }
  }

  function openCreateRegionModal() {
    populateRegionFormOptions();
    resetRegionForm();
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
      return row.region_id === unitId;
    });
    if (!unit) {
      notify("Unit not found.");
      return;
    }

    state.editingUnitId = unit.region_id;
    populateUnitFormOptions(unit.region_id);
    if (el.unitModalTitle) el.unitModalTitle.textContent = "Edit Unit";
    if (el.unitSubmitBtn) el.unitSubmitBtn.textContent = "Save Changes";

    if (el.unitNameInput) el.unitNameInput.value = unit.unit_name || "";
    if (el.unitRegionSelect)
      el.unitRegionSelect.value = unit.region_id;
    if (el.unitStatusSelect)
      el.unitStatusSelect.value = unit.is_active ? "true" : "false";

    var currentManager = tables.regionManagers.find(function (m) {
      return m.region_id === unit.region_id;
    });
    if (el.regionManagerSelect) {
      el.regionManagerSelect.value = currentManager ? currentManager.um_id : "";
    }

    setFieldError(el.unitNameInput, el.unitNameError, "");
    setFieldError(el.unitRegionSelect, el.unitRegionError, "");
    setFieldError(el.regionManagerSelect, el.regionManagerError, "");

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
    var providers = _cache.providers;
    var units = _cache.units;
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
        return unit.region_id !== provider.region_id;
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
      option.value = unit.region_id;
      option.textContent = unit.unit_name + " (" + unit.region_id + ")";
      el.reassignUnitSelect.appendChild(option);
    });

    openModal(el.reassignModal);
  }

  function closeReassignModal() {
    resetReassignForm();
    closeModal(el.reassignModal);
  }

  async function submitReassignProvider() {
    var providerId = state.reassignProviderId;
    var targetUnitId = String(el.reassignUnitSelect.value || "").trim();

    if (!providerId) { closeReassignModal(); return; }
    if (!targetUnitId) {
      setFieldError(el.reassignUnitSelect, el.reassignUnitError, "Please choose a target unit.");
      return;
    }
    setFieldError(el.reassignUnitSelect, el.reassignUnitError, "");

    var provider = _cache.providers.find(function (row) { return row.service_provider_id === providerId; });
    if (!provider) { notify("Provider not found."); closeReassignModal(); return; }

    var targetUnit = _cache.units.find(function (unit) { return unit.region_id === targetUnitId; });
    if (!targetUnit) { setFieldError(el.reassignUnitSelect, el.reassignUnitError, "Selected unit is invalid."); return; }

    try {
      await Api.patch("/service-providers/" + providerId, { region_id: targetUnitId, is_active: true });
      provider.region_id = targetUnitId;
      provider.is_active = true;
    } catch (_) {}

    state.selectedUnitId = targetUnitId;
    state.providerPage = 1;
    closeReassignModal();
    renderRegions();
    notify("Provider reassigned.");
  }

  function getTables() {
    return _cache;
  }

  function setupCmAutocomplete(inputEl, dropdownEl, errorEl, selectedIdKey, includeRegionId) {
    if (!inputEl || !dropdownEl) return;

    function renderDropdown(query) {
      var managers = _cache.regionManagers;
      var q = String(query || "").trim().toLowerCase();

      var options = managers.filter(function (m) {
        if (!m.is_active) return false;

        var isUnassigned = !m.region_id;
        var isCurrentAssigned = includeRegionId && m.region_id === includeRegionId;

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

    dropdownEl.addEventListener("mousedown", function (e) {
      e.preventDefault(); // Prevent input blur
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

  function getRegionRegions(collective, sectorsById) {
    var ids = Array.isArray(collective.region_ids) ? collective.region_ids : [];
    var regions = [];
    ids.forEach(function (sectorId) {
      var s = sectorsById[sectorId];
      if (s && s.region && regions.indexOf(s.region) === -1) {
        regions.push(s.region);
      }
    });
    return regions;
  }

  function getUnitManagerMap(regionManagers) {
    var map = {};
    regionManagers.forEach(function (m) {
      if (m.region_id) map[m.region_id] = m;
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
      sectorsById[s.region_id] = s;
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

    var regionManagerValues = tables.regionManagers
      .map(function (m) {
        return m.name;
      })
      .filter(Boolean)
      .filter(function (name, index, arr) {
        return arr.indexOf(name) === index;
      })
      .sort();

    var regionManagerValues = (tables.regionManagers || [])
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

    el.managerFilter.innerHTML = "<option>All Managers</option><option>No Region Manager</option>";
    regionManagerValues.forEach(function (name) {
      if (name === "Unassigned") return;
      var option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      el.managerFilter.appendChild(option);
    });

    el.regionManagerFilter.innerHTML = "<option>All Managers</option><option>No Region Manager</option>";
    regionManagerValues.forEach(function (name) {
      if (name === "Unassigned") return;
      var option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      el.regionManagerFilter.appendChild(option);
    });

    el.regionManagerFilter.value = state.regionManager;
    el.sectorFilter.value = state.sector;
  }

  function getFilteredRegionsData() {
    var tables = getTables();
    var sectorsById = {};
    tables.sectors.forEach(function (s) {
      sectorsById[s.region_id] = s;
    });
    var managerByUnit = getUnitManagerMap(tables.regionManagers);
    var providersByUnit = {};
    tables.providers.forEach(function (p) {
      if (!p.region_id) return;
      if (!providersByUnit[p.region_id]) providersByUnit[p.region_id] = 0;
      providersByUnit[p.region_id] += 1;
    });

    var q = state.quickSearch.toLowerCase();

    var regionManagerMap = {};
    (tables.regionManagers || []).forEach(function (m) {
      if (m.region_id) regionManagerMap[m.region_id] = m;
    });

    return tables.regions
      .map(function (collective, idx) {
        var units = tables.units.filter(function (u) {
          return u.region_id === collective.region_id;
        });

        var collectiveSectors = (collective.region_ids || []).map(function (id) {
          return sectorsById[id] ? sectorsById[id].sector_name : "";
        });

        var sectorMatches =
          state.sector === "All Sectors" ||
          collectiveSectors.indexOf(state.sector) !== -1;

        units = units.filter(function (unit) {
          var manager = managerByUnit[unit.region_id];
          var managerName =
            manager && manager.name ? manager.name : "Unassigned";

          var managerMatches =
            state.manager === "All Managers" ||
            (state.manager === "No Region Manager" &&
              managerName === "Unassigned") ||
            managerName === state.manager;

          var unitSearchBlob = (
            unit.region_id +
            " " +
            unit.unit_name +
            " " +
            managerName
          ).toLowerCase();
          var unitMatchesSearch = !q || unitSearchBlob.indexOf(q) !== -1;

          return managerMatches && unitMatchesSearch;
        });

        var collectiveCm = regionManagerMap[collective.region_id];
        var collectiveCmName = collectiveCm ? collectiveCm.name : "Unassigned";

        var collectiveCmMatches =
          state.regionManager === "All Managers" ||
          (state.regionManager === "No Region Manager" &&
            collectiveCmName === "Unassigned") ||
          collectiveCmName === state.regionManager;

        var collectiveSearchBlob = (
          collective.region_id +
          " " +
          collective.region_name +
          " " +
          collectiveCmName
        ).toLowerCase();
        var collectiveMatchesSearch =
          !q || collectiveSearchBlob.indexOf(q) !== -1;

        var visible = sectorMatches && collectiveCmMatches;

        if (state.manager !== "All Managers") {
          // If a Region Manager filter is applied, we must have units
          if (units.length === 0) visible = false;
        } else {
          // Default: show if name/ID matches or at least one unit matches
          visible = visible && (collectiveMatchesSearch || units.length > 0);
        }

        if (!visible) return null;

        var providerCount = units.reduce(function (sum, u) {
          return sum + (providersByUnit[u.region_id] || 0);
        }, 0);

        var collectiveCm = regionManagerMap[collective.region_id];

        return {
          idx: idx,
          collective: collective,
          sectorNames: collectiveSectors,
          units: units,
          providerCount: providerCount,
          managerByUnit: managerByUnit,
          providersByUnit: providersByUnit,
          regionManager: collectiveCm,
        };
      })
      .filter(Boolean);
  }

  function ensureSelectedUnitExists(filteredData) {
    var unitIds = [];
    filteredData.forEach(function (entry) {
      entry.units.forEach(function (u) {
        unitIds.push(u.region_id);
      });
    });

    if (!unitIds.length) {
      state.selectedUnitId = null;
      state.selectedRegionId = null;
      return;
    }

    if (unitIds.indexOf(state.selectedUnitId) === -1) {
      state.selectedUnitId = unitIds[0];
    }

    var selectedOwner = filteredData.find(function (entry) {
      return entry.units.some(function (u) {
        return u.region_id === state.selectedUnitId;
      });
    });

    if (selectedOwner) {
      state.selectedRegionId = selectedOwner.collective.region_id;
    }
  }

  function toggleUnitExpansion(unitId) {
    var idx = state.expandedUnitIds.indexOf(unitId);
    if (idx === -1) {
      state.expandedUnitIds.push(unitId);
    } else {
      state.expandedUnitIds.splice(idx, 1);
    }
    renderRegions();
  }

  function renderRegions() {
    var filteredData = getFilteredRegionsData();
    
    var total = filteredData.length;
    var maxPage = Math.max(1, Math.ceil(total / state.COLLECTIVE_PAGE_SIZE));
    if (state.collectivePage > maxPage) state.collectivePage = maxPage;

    var start = (state.collectivePage - 1) * state.COLLECTIVE_PAGE_SIZE;
    var pageData = filteredData.slice(start, start + state.COLLECTIVE_PAGE_SIZE);

    if (!total) {
      el.regionsGrid.innerHTML = `
        <div class="collective-card" style="grid-column: 1/-1; padding: 48px; text-align: center;">
          <h2 style="font-family: var(--font-title); font-size: 24px; margin-bottom: 8px;">No regions found</h2>
          <p style="color: var(--p-text-sub);">Try adjusting your filters or search query.</p>
        </div>
      `;
      el.regionsTableInfo.textContent = "Showing 0 of 0 regions";
      el.regionsPrevPageBtn.disabled = true;
      el.regionsNextPageBtn.disabled = true;
      el.regionsPages.innerHTML = "";
      return;
    }

    var providerSkillsLookup = getProviderSkillsLookup(_cache.providerSkills, _cache.skills);

    el.regionsGrid.innerHTML = pageData.map(function (entry) {
      var collective = entry.collective;
      var iconClass = entry.idx % 3 === 0 ? "collective-icon--teal" : (entry.idx % 3 === 1 ? "collective-icon--orange" : "collective-icon--blue");
      var statusClass = collective.is_active ? "status-available" : "status-offline";
      var statusText = collective.is_active ? "Active" : "Inactive";
      
      var unitsHtml = entry.units.length ? entry.units.map(function (unit) {
        var manager = entry.managerByUnit[unit.region_id];
        var managerName = manager && manager.name ? manager.name : "Unassigned";
        var isExpanded = state.expandedUnitIds.indexOf(unit.region_id) !== -1;
        var providers = _cache.providers.filter(p => p.region_id === unit.region_id);
        
        var providersHtml = providers.length ? providers.map(p => {
          var status = getProviderStatus(p, _cache.assignments, []);
          var initials = getInitials(p.name);
          return `
            <tr>
              <td>
                <div class="prov-cell">
                  <div class="prov-avatar">${escapeHtml(initials)}</div>
                  <div>
                    <span class="prov-name">${escapeHtml(p.name)}</span>
                    <span style="font-size: 10px; color: var(--p-text-muted);">ID: ${escapeHtml(p.service_provider_id)}</span>
                  </div>
                </div>
              </td>
              <td>${escapeHtml(providerSkillsLookup[p.service_provider_id]?.[0] || deriveSkillFromUnitName(unit.unit_name))}</td>
              <td><div class="rating-cell" style="gap: 2px;">${starHTML(p.rating)}</div></td>
              <td><span class="prov-status-pill status-${status.css}">${status.label}</span></td>
              <td>
                <div style="display: flex; gap: 4px;">
                  <button class="icon-btn icon-btn--small" title="Reassign" data-action="reassign-provider" data-provider-id="${escapeHtml(p.service_provider_id)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>
                  </button>
                  <button class="icon-btn icon-btn--small" title="Remove" data-action="remove-provider" data-provider-id="${escapeHtml(p.service_provider_id)}" style="color: var(--p-danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('') : '<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--p-text-muted);">No providers in this unit.</td></tr>';

        return `
          <div class="unit-container ${isExpanded ? 'expanded' : ''}" data-unit-id="${escapeHtml(unit.region_id)}">
            <div class="unit-row" data-action="toggle-unit">
              <svg class="unit-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              <span class="unit-name">${escapeHtml(unit.unit_name)} <span style="font-weight: 400; color: var(--p-text-muted); font-size: 12px;">(${escapeHtml(unit.region_id)})</span></span>
              <div class="unit-badges">
                <span class="badge badge-providers">${providers.length} Providers</span>
                <span class="badge badge-manager">${escapeHtml(managerName)}</span>
              </div>
              <div class="unit-actions">
                <button class="icon-btn" data-action="edit-unit" data-unit-id="${escapeHtml(unit.region_id)}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </div>
            </div>
            <div class="embedded-providers">
              <table class="providers-mini-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Skill</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>${providersHtml}</tbody>
              </table>
            </div>
          </div>
        `;
      }).join("") : '<div style="padding: 24px; text-align: center; color: var(--p-text-muted);">No units available.</div>';

      var cmName = entry.regionManager ? entry.regionManager.name : "Unassigned";
      var sectorTags = entry.sectorNames.map(s => `<span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${escapeHtml(s)}</span>`).join(' ');

      return `
        <div class="collective-card">
          <div class="collective-header">
            <div class="collective-icon ${iconClass}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="collective-info">
              <div class="collective-name">${escapeHtml(collective.region_name)}</div>
              <div class="collective-meta">
                <span><svg class="svg-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${sectorTags}</span>
                <span>•</span>
                <span class="prov-status-pill ${statusClass}">${statusText}</span>
              </div>
              <div style="margin-top: 8px; font-size: 13px; font-weight: 500; color: var(--p-text-sub);">
                CM: ${escapeHtml(cmName)}
                <button type="button" class="icon-btn icon-btn--small" data-action="edit-collective" data-collective-id="${escapeHtml(collective.region_id)}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </div>
            </div>
            <div class="collective-stats">
              <div class="cstat">
                <span class="cstat-num" style="color: var(--p-accent);">${entry.units.length}</span>
                <span class="cstat-label">Units</span>
              </div>
              <div class="cstat">
                <span class="cstat-num" style="color: var(--p-warning);">${entry.providerCount}</span>
                <span class="cstat-label">Providers</span>
              </div>
            </div>
          </div>
          <div class="unit-list">
            <div style="padding: 8px 16px; font-size: 11px; font-weight: 700; color: var(--p-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Units & Providers</div>
            ${unitsHtml}
          </div>
        </div>
      `;
    }).join("");

    var shownStart = total ? start + 1 : 0;
    var shownEnd = Math.min(start + state.COLLECTIVE_PAGE_SIZE, total);
    el.regionsTableInfo.textContent = `Showing ${shownStart}-${shownEnd} of ${total} regions`;

    el.regionsPrevPageBtn.disabled = state.collectivePage <= 1;
    el.regionsNextPageBtn.disabled = state.collectivePage >= maxPage;

    // Render page numbers
    var pagesHtml = "";
    if (maxPage > 1) {
      for (var p = 1; p <= maxPage; p++) {
        var activeClass = p === state.collectivePage ? " active" : "";
        pagesHtml += `<button class="page-num ${activeClass}" data-page="${p}">${p}</button>`;
      }
    }
    el.regionsPages.innerHTML = pagesHtml;
  }

  function starHTML(rating) {
    var numeric = Number(rating);
    if (isNaN(numeric) || numeric <= 0) return '<span style="color: var(--p-text-muted);">Unrated</span>';
    var stars = "";
    for (var i = 1; i <= 5; i++) {
      stars += `<span class="rating-star">${i <= Math.round(numeric) ? '★' : '☆'}</span>`;
    }
    return stars;
  }

  function validateRegionForm() {
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
        "Region name is required.",
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
      var duplicate = tables.regions.some(function (collective) {
        return (
          normalizeName(collective.region_name) === normalizeName(name)
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
      setFieldError(el.regionManagerInput, el.regionManagerError, "A valid unassigned collective manager must be selected.");
      valid = false;
    } else {
      var managerRef = tables.regionManagers.find(function (m) { return m.cm_id === state.selectedCmId; });
      if (!managerRef || managerRef.region_id) {
        setFieldError(el.regionManagerInput, el.regionManagerError, "The selected manager is not available.");
        valid = false;
      } else {
        setFieldError(el.regionManagerInput, el.regionManagerError, "");
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

  async function submitCreateRegion() {
    var result = validateRegionForm();
    if (!result) return;

    try {
      var newRegion = await Api.post("/regions", {
        region_name: result.name,
        is_active: result.isActive,
        region_ids: result.sectorIds,
      });
      _cache.regions.push(newRegion);

      // Assign CM
      if (result.cmId) {
        await Api.patch("/collective-managers/" + result.cmId, { region_id: newRegion.region_id });
        _cache.regionManagers.forEach(function (m) {
          if (m.cm_id === result.cmId) {
            m.region_id = newRegion.region_id;
            m.updated_at = new Date().toISOString();
          }
        });
      }

      state.selectedRegionId = newRegion.region_id;
      state.selectedUnitId = null;
      state.providerPage = 1;

      closeModal(el.collectiveModal);
      populateFilters();
      renderRegions();
      notify("Region created successfully: " + newRegion.region_id);
    } catch (err) {
      notify("Failed to create collective.");
    }
  }

  function openReassignCmModal(collectiveId) {
    state.reassignRegionId = collectiveId;
    state.reassignCmId = null;
    if (el.reassignCmForm) el.reassignCmForm.reset();
    if (el.reassignCmInput) el.reassignCmInput.value = "";
    if (el.reassignCmDropdown) el.reassignCmDropdown.innerHTML = "";
    setFieldError(el.reassignCmInput, el.reassignCmError, "");

    // Attempt to pre-fill the current manager
    var tables = getTables();
    var currentMgr = tables.regionManagers.find(function (m) { return m.region_id === collectiveId; });
    if (currentMgr && el.reassignCmInput) {
      el.reassignCmInput.value = currentMgr.name;
      state.reassignCmId = currentMgr.cm_id;
    }

    openModal(el.reassignCmModal);
    // Explicitly setup the autocomplete with the collective ID context so they can pick the current guy too
    setupCmAutocomplete(el.reassignCmInput, el.reassignCmDropdown, el.reassignCmError, "reassignCmId", collectiveId);
  }

  async function submitReassignCm() {
    if (!state.reassignRegionId) { closeModal(el.reassignCmModal); return; }
    if (!state.reassignCmId) {
      setFieldError(el.reassignCmInput, el.reassignCmError, "Please select a valid manager from the list.");
      return;
    }

    var managers = _cache.regionManagers;
    var collectiveId = state.reassignRegionId;
    var chosenId = state.reassignCmId;

    var chosenManager = managers.find(function (m) { return m.cm_id === chosenId; });
    if (!chosenManager || (chosenManager.region_id && chosenManager.region_id !== collectiveId)) {
      setFieldError(el.reassignCmInput, el.reassignCmError, "This manager is not available.");
      return;
    }

    try {
      // Unassign old
      managers.forEach(function (m) { if (m.region_id === collectiveId) m.region_id = null; });
      // Assign new
      await Api.patch("/collective-managers/" + chosenId, { region_id: collectiveId });
      chosenManager.region_id = collectiveId;
      chosenManager.updated_at = new Date().toISOString();
    } catch (_) {}

    closeModal(el.reassignCmModal);
    renderRegions();
    notify("Region Manager updated.");
  }

  function openEditRegionModal(collectiveId) {
    state.editingRegionId = collectiveId;
    state.editCmId = null;

    var tables = getTables();
    var collective = tables.regions.find(function (c) {
      return c.region_id === collectiveId;
    });
    if (!collective) {
      notify("Region not found.");
      return;
    }

    // Reset form
    if (el.editRegionForm) el.editRegionForm.reset();
    if (el.editRegionCmInput) el.editRegionCmInput.value = "";
    if (el.editRegionCmDropdown) el.editRegionCmDropdown.innerHTML = "";
    setFieldError(el.editRegionCmInput, el.editRegionCmError, "");
    setFieldError(el.editRegionSectorSelect, el.editRegionSectorError, "");

    // Pre-fill current CM
    var currentMgr = tables.regionManagers.find(function (m) {
      return m.region_id === collectiveId;
    });
    if (currentMgr && el.editRegionCmInput) {
      el.editRegionCmInput.value = currentMgr.name;
      state.editCmId = currentMgr.cm_id;
    }

    // Populate sector multi-select (mark taken sectors from OTHER regions as disabled)
    var usedSectorIds = getUsedSectorIds(collectiveId);
    var currentSectorIds = Array.isArray(collective.region_ids)
      ? collective.region_ids
      : [];

    if (el.editRegionSectorSelect) {
      el.editRegionSectorSelect.innerHTML = "";
      tables.sectors
        .slice()
        .sort(function (a, b) {
          return String(a.sector_name).localeCompare(String(b.sector_name));
        })
        .forEach(function (sector) {
          var option = document.createElement("option");
          option.value = sector.region_id;
          var taken = usedSectorIds.indexOf(sector.region_id) !== -1;
          option.textContent =
            sector.region_id +
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
          if (currentSectorIds.indexOf(sector.region_id) !== -1) {
            option.selected = true;
          }
          el.editRegionSectorSelect.appendChild(option);
        });
    }

    // Setup CM autocomplete (include current collective for re-selection)
    setupCmAutocomplete(
      el.editRegionCmInput,
      el.editRegionCmDropdown,
      el.editRegionCmError,
      "editCmId",
      collectiveId,
    );

    // Update modal title
    var titleEl = document.getElementById("edit-collective-modal-title");
    if (titleEl) {
      titleEl.textContent =
        "Edit: " + collective.region_name;
    }

    openModal(el.editRegionModal);
  }

  function submitEditRegion() {
    var collectiveId = state.editingRegionId;
    if (!collectiveId) {
      closeModal(el.editRegionModal);
      return;
    }

    var tables = getTables();
    var collective = tables.regions.find(function (c) {
      return c.region_id === collectiveId;
    });
    if (!collective) {
      notify("Region not found.");
      closeModal(el.editRegionModal);
      return;
    }

    var valid = true;

    // Validate CM
    if (!state.editCmId) {
      setFieldError(
        el.editRegionCmInput,
        el.editRegionCmError,
        "Please select a valid manager from the list.",
      );
      valid = false;
    } else {
      var chosenMgr = tables.regionManagers.find(function (m) {
        return m.cm_id === state.editCmId;
      });
      if (
        !chosenMgr ||
        (chosenMgr.region_id &&
          chosenMgr.region_id !== collectiveId)
      ) {
        setFieldError(
          el.editRegionCmInput,
          el.editRegionCmError,
          "This manager is not available.",
        );
        valid = false;
      } else {
        setFieldError(el.editRegionCmInput, el.editRegionCmError, "");
      }
    }

    // Validate sectors
    var sectorIds = Array.from(
      el.editRegionSectorSelect.selectedOptions,
    ).map(function (opt) {
      return opt.value;
    });

    if (!sectorIds.length) {
      setFieldError(
        el.editRegionSectorSelect,
        el.editRegionSectorError,
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
          el.editRegionSectorSelect,
          el.editRegionSectorError,
          "These sectors are already assigned to another collective: " +
          conflicts.join(", "),
        );
        valid = false;
      } else {
        setFieldError(
          el.editRegionSectorSelect,
          el.editRegionSectorError,
          "",
        );
      }
    }

    if (!valid) return;

    // Apply CM change
    var managers = _cache.regionManagers;
    // Unassign old manager from this collective
    managers.forEach(function (m) { if (m.region_id === collectiveId) m.region_id = null; });
    // Assign new manager
    var newMgr = managers.find(function (m) { return m.cm_id === state.editCmId; });
    if (newMgr) {
      newMgr.region_id = collectiveId;
      newMgr.updated_at = new Date().toISOString();
      try { Api.patch("/collective-managers/" + state.editCmId, { region_id: collectiveId }); } catch (_) {}
    }

    // Apply sector changes
    collective.region_ids = sectorIds;
    try { Api.patch("/regions/" + collectiveId, { region_ids: sectorIds }); } catch (_) {}
    closeModal(el.editRegionModal);
    populateFilters();
    renderRegions();
    notify("Region updated successfully.");
  }

  function assignUnitManager(unitId, managerRef) {
    if (!managerRef) return true;
    var managers = _cache.regionManagers;
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
    if (selected.region_id && selected.region_id !== unitId) {
      notify(selected.name + " already manages another unit.");
      return false;
    }

    managers.forEach(function (m) {
      if (m.region_id === unitId && m.um_id !== selected.um_id) {
        m.region_id = null;
      }
    });
    selected.region_id = unitId;
    return true;
  }

  function validateUnitForm() {
    var tables = getTables();
    var name = String(el.unitNameInput.value || "").trim();
    var collectiveId = String(el.unitRegionSelect.value || "").trim();
    var managerRef = String(el.regionManagerSelect.value || "").trim();
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
          unit.region_id !== state.editingUnitId &&
          unit.region_id === collectiveId &&
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

    var hasRegion = tables.regions.some(function (collective) {
      return collective.region_id === collectiveId;
    });
    if (!collectiveId || !hasRegion) {
      setFieldError(
        el.unitRegionSelect,
        el.unitRegionError,
        "Please choose a valid collective.",
      );
      valid = false;
    } else {
      setFieldError(el.unitRegionSelect, el.unitRegionError, "");
    }

    if (managerRef) {
      var manager = tables.regionManagers.find(function (m) {
        return (
          m.um_id === managerRef ||
          m.name.toLowerCase() === managerRef.toLowerCase()
        );
      });
      if (!manager || manager.region_id) {
        setFieldError(
          el.regionManagerSelect,
          el.regionManagerError,
          "Selected manager is not available.",
        );
        valid = false;
      } else {
        setFieldError(el.regionManagerSelect, el.regionManagerError, "");
      }
    } else {
      setFieldError(el.regionManagerSelect, el.regionManagerError, "");
    }

    if (!valid) return null;
    return {
      name: name,
      collectiveId: collectiveId,
      managerRef: managerRef,
      isActive: isActive,
    };
  }

  async function submitCreateUnit() {
    var result = validateUnitForm();
    if (!result) return;

    var units = _cache.units;
    var managers = _cache.regionManagers;
    var unitId = state.editingUnitId || ("UNT-" + Date.now());

    if (!assignUnitManager(unitId, result.managerRef)) return;

    if (!result.managerRef) {
      managers.forEach(function (manager) {
        if (manager.region_id === unitId) manager.region_id = null;
      });
    }

    try {
      if (state.editingUnitId) {
        var existing = units.find(function (unit) { return unit.region_id === state.editingUnitId; });
        if (!existing) { notify("Unit not found."); return; }
        await Api.patch("/regions/" + state.editingUnitId, {
          unit_name: result.name, region_id: result.collectiveId, is_active: result.isActive
        });
        existing.unit_name = result.name;
        existing.region_id = result.collectiveId;
        existing.is_active = result.isActive;
      } else {
        var created = await Api.post("/regions", {
          unit_name: result.name, region_id: result.collectiveId, is_active: result.isActive
        });
        unitId = created.region_id || unitId;
        units.push(created);
      }
    } catch (err) { notify("Failed to save unit."); return; }

    state.selectedRegionId = result.collectiveId;
    state.selectedUnitId = unitId;
    state.providerPage = 1;

    closeModal(el.unitModal);
    populateFilters();
    renderRegions();
    notify(
      state.editingUnitId
        ? "Unit updated: " + unitId
        : "Unit created successfully: " + unitId,
    );
  }

  function removeProvider(providerId) {
    var provider = _cache.providers.find(function (p) { return p.service_provider_id === providerId; });
    if (!provider) return;

    openConfirmModal(
      "Remove " + provider.name + " from this unit?",
      async function () {
        try {
          await Api.patch("/service-providers/" + providerId, { region_id: null });
          provider.region_id = null;
        } catch (_) {}
        renderRegions();
        notify("Provider removed from unit.");
      },
    );
  }

  function reassignProvider(providerId) {
    openReassignModal(providerId);
  }

  async function assignProvider(providerId) {
    var provider = _cache.providers.find(function (p) { return p.service_provider_id === providerId; });
    if (!provider) return;

    if (!state.selectedUnitId) { notify("Select a unit first."); return; }
    try {
      await Api.patch("/service-providers/" + providerId, { region_id: state.selectedUnitId, is_active: true });
      provider.region_id = state.selectedUnitId;
      provider.is_active = true;
    } catch (_) {}
    renderRegions();
    notify("Provider assigned to selected unit.");
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

    if (el.createRegionBtn) {
      el.createRegionBtn.addEventListener(
        "click",
        openCreateRegionModal,
      );
    }
    if (el.createUnitBtn) {
      el.createUnitBtn.addEventListener("click", function () {
        if (!_cache.regions.length) {
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
        submitCreateRegion();
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
      renderRegions();
    });

    el.sectorFilter.addEventListener("change", function (event) {
      state.sector = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderRegions();
    });

    el.managerFilter.addEventListener("change", function (event) {
      state.manager = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderRegions();
    });

    el.regionManagerFilter.addEventListener("change", function (event) {
      state.regionManager = event.target.value;
      state.collectivePage = 1;
      state.providerPage = 1;
      renderRegions();
    });

    el.regionsGrid.addEventListener("click", function (event) {
      var target = event.target;
      var actionEl = target.closest("[data-action]");
      if (!actionEl) return;

      var action = actionEl.getAttribute("data-action");
      if (action === "toggle-unit") {
        var container = target.closest(".unit-container");
        if (container) toggleUnitExpansion(container.getAttribute("data-unit-id"));
      }
      if (action === "edit-unit") {
        event.preventDefault();
        event.stopPropagation();
        openEditUnitModal(actionEl.getAttribute("data-unit-id"));
      }
      if (action === "edit-collective") {
        event.preventDefault();
        event.stopPropagation();
        openEditRegionModal(actionEl.getAttribute("data-collective-id"));
      }
      
      var providerId = actionEl.getAttribute("data-provider-id");
      if (action === "remove-provider") {
        event.stopPropagation();
        removeProvider(providerId);
      }
      if (action === "reassign-provider") {
        event.stopPropagation();
        reassignProvider(providerId);
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

    if (el.editRegionModalClose) {
      el.editRegionModalClose.addEventListener("click", function () { closeModal(el.editRegionModal); });
    }
    if (el.editRegionCancelBtn) {
      el.editRegionCancelBtn.addEventListener("click", function () { closeModal(el.editRegionModal); });
    }
    if (el.editRegionModal) {
      el.editRegionModal.addEventListener("click", function (event) {
        if (event.target === el.editRegionModal) closeModal(el.editRegionModal);
      });
    }
    if (el.editRegionForm) {
      el.editRegionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitEditRegion();
      });
    }

    if (el.regionsPrevPageBtn) {
      el.regionsPrevPageBtn.addEventListener("click", function () {
        if (state.collectivePage <= 1) return;
        state.collectivePage -= 1;
        renderRegions();
      });
    }

    if (el.regionsNextPageBtn) {
      el.regionsNextPageBtn.addEventListener("click", function () {
        var total = getFilteredRegionsData().length;
        var maxPage = Math.max(1, Math.ceil(total / state.COLLECTIVE_PAGE_SIZE));
        if (state.collectivePage >= maxPage) return;
        state.collectivePage += 1;
        renderRegions();
      });
    }

    if (el.regionsPages) {
      el.regionsPages.addEventListener("click", function (event) {
        var target = event.target;
        if (target.classList.contains("page-num")) {
          var page = parseInt(target.getAttribute("data-page"), 10);
          if (!isNaN(page) && page !== state.collectivePage) {
            state.collectivePage = page;
            renderRegions();
          }
        }
      });
    }

    if (el.exportBtn) {
      // export functionality for embedded lists is TBD or removed for now
    }
  }

  function initSelection() {
    var units = _cache.units;
    if (units.length) {
      state.selectedUnitId = units[0].region_id;
      state.selectedRegionId = units[0].region_id;
    }
  }

  updateNotificationBadges();
  initSelection();
  populateFilters();
  bindEvents();
  renderRegions();
  setupCmAutocomplete(el.regionManagerInput, el.regionManagerDropdown, el.regionManagerError, "selectedCmId", null);
})();
