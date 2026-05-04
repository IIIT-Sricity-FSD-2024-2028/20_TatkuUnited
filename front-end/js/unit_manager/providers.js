/*
 * providers.js — Unit Manager: Manage Providers (API-backed)
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
    return statusCycle(sp.sp_id || "SP000");
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

  function rupee(n) {
    return (
      "\u20b9" +
      Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

  async function loadProvidersFromApi() {
    try {
      var allProviders = await Api.get("/service-providers");

      // Filter by unit
      var unitProviders = (allProviders || []).filter(function (sp) {
        return sp.unit_id === session.unitId || sp.unit_id === session.id;
      });

      // Fetch revenue ledger for this unit manager
      var ledgerResp = await Api.get("/revenue-ledger/unit-manager/" + session.id);
      var ledgerRows = ledgerResp.rows || [];

      providers = unitProviders.map(function (sp) {
        var ratingVal = typeof sp.rating === "number" ? sp.rating : 4.0;
        var perf = Math.max(55, Math.min(99, Math.round(ratingVal * 20)));
        var p = perfMeta(perf);

        // Sum GMV for this provider (total of all splits)
        var earnings = ledgerRows
          .filter(function(r) { return r.sp_id === sp.sp_id; })
          .reduce(function(sum, r) { 
            var gross = (r.provider_amount || 0) + 
                        (r.um_amount || 0) + 
                        (r.cm_amount || 0) + 
                        (r.platform_amount || 0);
            return sum + gross; 
          }, 0);

        return {
          id: sp.sp_id,
          name: sp.name,
          specialty: sp.primary_skill || "General",
          status: deriveStatus(sp),
          rating: ratingVal,
          perf: perf,
          perfLabel: p.label,
          perfClass: p.cls,
          earnings: earnings,
        };
      });
    } catch (err) {
      console.error("[providers] Failed to load:", err);
      providers = [];
    }
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
      '<td style="font-weight:600; color:var(--text-primary)">' + rupee(p.earnings) + '</td>' +
      "<td>" +
      '  <div class="actions-cell">' +
      '    <button class="btn-action btn-view" onclick="viewProfile(\'' +
      p.id +
      "')\">" +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
      "      View Profile" +
      "    </button>" +
      '    <button class="btn-action btn-remove" onclick="deleteProvider(\'' +
      p.id +
      "')\">" +
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
        '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-secondary)">No providers match your search or filter.</td></tr>';
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

  window.addProvider = async function () {
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
    var isActive = status !== "Unavailable";

    try {
      await Api.post("/service-providers", {
        name: name,
        email: name.toLowerCase().replace(/\s+/g, ".") + "@mail.com",
        password: "Password@123",
        is_active: isActive,
        unit_id: session.unitId || session.id,
        primary_skill: specialty,
      });

      await loadProvidersFromApi();
      closeModal();
      currentPage = 1;
      renderTable();
      Api.showToast('"' + name + '" added successfully', "success");
    } catch (err) {
      console.error("[providers] Add failed:", err);
    }
  };



  window.deleteProvider = async function (id) {
    var p = providers.find(function (x) {
      return x.id === id;
    });
    if (!p) return;

    if (!confirm('Remove "' + p.name + '" from this unit?')) return;

    try {
      // Remove from unit by setting unit_id to null
      await Api.patch("/service-providers/" + id, {
        unit_id: null,
        is_active: false,
      });

      await loadProvidersFromApi();

      var totalAfter = providers.filter(function (x) {
        return currentFilter === "all" || x.status === currentFilter;
      }).length;
      var maxPage = Math.max(1, Math.ceil(totalAfter / ROWS_PER_PAGE));
      if (currentPage > maxPage) currentPage = maxPage;

      renderTable();
      Api.showToast('"' + p.name + '" removed from unit', "success");
    } catch (err) {
      console.error("[providers] Remove failed:", err);
    }
  };

  window.viewProfile = function (id) {
    window.location.href = "provider_profile.html#id=" + id;
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  // Init
  (async function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;
    Auth.syncUserAvatar();
    await loadProvidersFromApi();
    renderTable();
  })();
})();
