/*
 * providers.js — Unit Manager: Manage Providers
 * Uses shared AppStore persistence (same strategy as collective manager).
 */

(function () {
  "use strict";

  var providers = [];
  var currentFilter = "all";
  var ROWS_PER_PAGE = 5;
  var currentPage = 1;
  var session = null;

  function statusCycle(id) {
    var n = 0;
    for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return ["Active", "On-Job", "Idle"][n % 3];
  }

  function deriveStatus(sp) {
    if (!sp.is_active) return "Unavailable";
    return statusCycle(sp.service_provider_id || "SP000");
  }

  function statusClass(s) {
    return (
      {
        Active: "active",
        "On-Job": "on-job",
        Idle: "idle",
        Unavailable: "unavailable",
      }[s] || "idle"
    );
  }

  function perfMeta(score) {
    if (score >= 95) return { label: "EXCELLENT", cls: "excellent" };
    if (score >= 85) return { label: "OPTIMAL", cls: "optimal" };
    if (score >= 75) return { label: "SOLID", cls: "solid" };
    if (score >= 60) return { label: "WARNING", cls: "warning" };
    return { label: "CRITICAL", cls: "critical" };
  }

  function buildStars(rating) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += i <= Math.floor(rating) ? "★" : "☆";
    return out;
  }

  function getInitials(name) {
    return (
      String(name || "")
        .split(" ")
        .map(function (w) {
          return w[0] || "";
        })
        .join("")
        .slice(0, 2)
        .toUpperCase() || "UM"
    );
  }

  function avatarColor(name) {
    var palette = [
      "#3b82f6",
      "#0d9488",
      "#7c3aed",
      "#d97706",
      "#dc2626",
      "#16a34a",
    ];
    return palette[String(name || "A").charCodeAt(0) % palette.length];
  }

  function getFirstSkillForProvider(spId, skillMap, relations) {
    var rel = relations.find(function (r) {
      return r.service_provider_id === spId;
    });
    if (!rel) return "General";
    return skillMap[rel.skill_id] || "General";
  }

  function loadProvidersFromStore() {
    var allSkills = AppStore.getTable("skills") || [];
    var allProviderSkills = AppStore.getTable("provider_skills") || [];
    var allProviders = AppStore.getTable("service_providers") || [];

    var skillMap = {};
    allSkills.forEach(function (s) {
      skillMap[s.skill_id] = s.skill_name;
    });

    providers = allProviders
      .filter(function (sp) {
        return sp.unit_id === session.unitId;
      })
      .map(function (sp) {
        var ratingVal = typeof sp.rating === "number" ? sp.rating : 4.0;
        var perf = Math.max(55, Math.min(99, Math.round(ratingVal * 20)));
        var p = perfMeta(perf);
        return {
          id: sp.service_provider_id,
          name: sp.name,
          specialty: getFirstSkillForProvider(
            sp.service_provider_id,
            skillMap,
            allProviderSkills,
          ),
          status: deriveStatus(sp),
          rating: ratingVal,
          perf: perf,
          perfLabel: p.label,
          perfClass: p.cls,
        };
      });
  }

  function updateBadges() {
    var activeCount = providers.filter(function (p) {
      return p.status === "Active";
    }).length;
    var onJobCount = providers.filter(function (p) {
      return p.status === "On-Job";
    }).length;
    document.getElementById("countActive").textContent = activeCount;
    document.getElementById("countOnJob").textContent = onJobCount;
  }

  function renderPagination(totalRows) {
    var container = document.getElementById("pagination");
    container.innerHTML = "";

    var totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    function makeBtn(label, page, disabled, active) {
      var btn = document.createElement("button");
      btn.className = "pg-btn" + (active ? " active" : "");
      btn.textContent = label;
      btn.disabled = disabled;
      if (!disabled) {
        btn.addEventListener("click", function () {
          currentPage = page;
          renderTable();
        });
      }
      return btn;
    }

    container.appendChild(
      makeBtn("‹", currentPage - 1, currentPage === 1, false),
    );
    for (var i = 1; i <= totalPages; i++) {
      container.appendChild(makeBtn(String(i), i, false, i === currentPage));
    }
    container.appendChild(
      makeBtn("›", currentPage + 1, currentPage === totalPages, false),
    );
  }

  function createRow(p) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      '  <div class="provider-cell">' +
      '    <div class="provider-avatar" style="background:' +
      avatarColor(p.name) +
      '">' +
      getInitials(p.name) +
      "</div>" +
      "    <div>" +
      '      <div class="provider-name">' +
      p.name +
      "</div>" +
      '      <div class="provider-meta">ID: ' +
      p.id +
      " &bull; " +
      p.specialty +
      "</div>" +
      "    </div>" +
      "  </div>" +
      "</td>" +
      '<td><span class="status-pill ' +
      statusClass(p.status) +
      '">' +
      p.status +
      "</span></td>" +
      '<td><span class="stars">' +
      buildStars(p.rating) +
      '</span> <span class="rating-val">' +
      p.rating.toFixed(1) +
      "</span></td>" +
      "<td>" +
      '  <div class="actions-cell">' +
      '    <button class="btn-action btn-view" onclick="viewProfile(\'' +
      p.id +
      '\')">' +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
      "      View Profile" +
      "    </button>" +
      '    <button class="btn-action btn-remove" onclick="deleteProvider(\'' +
      p.id +
      '\')">' +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
      "      Remove" +
      "    </button>" +
      "  </div>" +
      "</td>";
    return tr;
  }

  function renderTable() {
    var query = (document.getElementById("tableSearch").value || "")
      .toLowerCase()
      .trim();
    var tbody = document.getElementById("providerBody");
    tbody.innerHTML = "";

    var filtered = providers.filter(function (p) {
      var matchFilter = currentFilter === "all" || p.status === currentFilter;
      var matchSearch =
        p.name.toLowerCase().indexOf(query) !== -1 ||
        p.id.toLowerCase().indexOf(query) !== -1 ||
        p.specialty.toLowerCase().indexOf(query) !== -1;
      return matchFilter && matchSearch;
    });

    updateBadges();

    var totalRows = filtered.length;
    var start = (currentPage - 1) * ROWS_PER_PAGE;
    var pageSlice = filtered.slice(start, start + ROWS_PER_PAGE);

    var from = totalRows === 0 ? 0 : start + 1;
    var to = Math.min(start + ROWS_PER_PAGE, totalRows);
    document.getElementById("showingText").textContent =
      "Showing " + from + " – " + to + " of " + totalRows + " providers";

    if (pageSlice.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-secondary)">No providers match your search or filter.</td></tr>';
      renderPagination(totalRows);
      return;
    }

    var fragment = document.createDocumentFragment();
    pageSlice.forEach(function (p) {
      fragment.appendChild(createRow(p));
    });
    tbody.appendChild(fragment);
    renderPagination(totalRows);
  }

  window.filterProviders = function () {
    currentPage = 1;
    renderTable();
  };

  window.setFilter = function (btn, filter) {
    document.querySelectorAll(".filter-tab").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    currentFilter = filter;
    currentPage = 1;
    renderTable();
  };

  window.openModal = function () {
    document.getElementById("modalOverlay").classList.add("open");
    document.getElementById("newName").value = "";
    document.getElementById("newSpecialty").selectedIndex = 0;
    document.getElementById("newStatus").selectedIndex = 0;
    document.getElementById("newName").focus();
  };

  window.closeModal = function () {
    document.getElementById("modalOverlay").classList.remove("open");
  };

  function ensureSkillByName(skillName) {
    var allSkills = AppStore.getTable("skills") || [];
    var existing = allSkills.find(function (s) {
      return (
        String(s.skill_name || "").toLowerCase() ===
        String(skillName || "").toLowerCase()
      );
    });
    if (existing) return existing.skill_id;

    var newSkillId = AppStore.nextId("SKL");
    allSkills.push({
      skill_id: newSkillId,
      skill_name: skillName,
      description: "Created from Unit Manager provider form",
    });
    return newSkillId;
  }

  window.addProvider = function () {
    var nameInput = document.getElementById("newName");
    var name = (nameInput.value || "").trim();
    if (!name) {
      nameInput.focus();
      nameInput.style.borderColor = "#dc2626";
      setTimeout(function () {
        nameInput.style.borderColor = "";
      }, 1500);
      return;
    }

    var specialty = document.getElementById("newSpecialty").value || "General";
    var status = document.getElementById("newStatus").value || "Active";

    var newProviderId = AppStore.nextId("SP");
    var allProviders = AppStore.getTable("service_providers") || [];
    var isActive = status !== "Unavailable";

    allProviders.unshift({
      service_provider_id: newProviderId,
      name: name,
      password: "Password@123",
      phone: "",
      email: name.toLowerCase().replace(/\s+/g, ".") + "@mail.com",
      dob: null,
      address: "",
      pfp_url: "",
      gender: null,
      rating: 4,
      rating_count: 1,
      is_active: isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unit_id: session.unitId,
      home_sector_id: null,
    });

    var skillId = ensureSkillByName(specialty);
    var providerSkills = AppStore.getTable("provider_skills") || [];
    providerSkills.push({
      service_provider_id: newProviderId,
      skill_id: skillId,
      verification_status: "Verified",
      verified_at: new Date().toISOString(),
    });

    AppStore.save();
    loadProvidersFromStore();
    closeModal();
    currentPage = 1;
    renderTable();
  };

  window.deleteProvider = function (id) {
    var p = providers.find(function (x) {
      return x.id === id;
    });
    if (!p) return;

    if (!confirm('Remove "' + p.name + '" from this unit?')) return;

    var allProviders = AppStore.getTable("service_providers") || [];
    var row = allProviders.find(function (sp) {
      return sp.service_provider_id === id;
    });
    if (!row) return;

    row.unit_id = null;
    row.is_active = false;
    row.updated_at = new Date().toISOString();

    AppStore.save();
    loadProvidersFromStore();

    var totalAfter = providers.filter(function (x) {
      return currentFilter === "all" || x.status === currentFilter;
    }).length;
    var maxPage = Math.max(1, Math.ceil(totalAfter / ROWS_PER_PAGE));
    if (currentPage > maxPage) currentPage = maxPage;

    renderTable();
  };

  window.viewProfile = function (id) {
    window.location.href = "provider_profile.html?id=" + id;
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  AppStore.ready.then(function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;
    loadProvidersFromStore();
    renderTable();
  });
})();
