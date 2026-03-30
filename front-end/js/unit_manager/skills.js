/*
 * skills.js — Unit Manager: Manage Skills
 * Uses shared AppStore persistence (same strategy as collective manager).
 */

(function () {
  "use strict";

  var THRESHOLD = 2;
  var currentSearch = "";
  var session = null;

  function skToast(msg, type) {
    var old = document.getElementById("sk-toast");
    if (old) old.remove();
    var bg = {
      success: "#16a34a",
      error: "#dc2626",
      info: "#2563eb",
      warning: "#d97706",
    };
    var el = document.createElement("div");
    el.id = "sk-toast";
    el.style.cssText =
      "position:fixed;bottom:22px;right:22px;z-index:2000;padding:11px 18px;border-radius:10px;" +
      "color:#fff;font-size:.86rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.3);transition:opacity .3s;max-width:300px;" +
      "font-family:Inter,sans-serif";
    el.style.background = bg[type] || bg.info;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () {
        if (el.parentNode) el.remove();
      }, 320);
    }, 2800);
  }

  function getUnitProviders() {
    var allProviders = AppStore.getTable("service_providers") || [];
    return allProviders.filter(function (p) {
      return p.unit_id === session.unitId;
    });
  }

  function getSkillMap() {
    var out = {};
    (AppStore.getTable("skills") || []).forEach(function (s) {
      out[s.skill_id] = s.skill_name;
    });
    return out;
  }

  function buildSkills() {
    var skillsTable = AppStore.getTable("skills") || [];
    var providerSkills = AppStore.getTable("provider_skills") || [];
    var unitProviders = getUnitProviders();
    var unitProviderIds = new Set(
      unitProviders.map(function (p) {
        return p.service_provider_id;
      }),
    );

    return skillsTable.map(function (s) {
      var linkedProviderIds = new Set();
      providerSkills.forEach(function (rel) {
        if (
          rel.skill_id === s.skill_id &&
          unitProviderIds.has(rel.service_provider_id)
        ) {
          linkedProviderIds.add(rel.service_provider_id);
        }
      });

      var matchedProviders = unitProviders.filter(function (p) {
        return linkedProviderIds.has(p.service_provider_id);
      });

      var rated = matchedProviders
        .map(function (p) {
          return p.rating;
        })
        .filter(function (r) {
          return typeof r === "number";
        });

      var proficiency = 0;
      if (rated.length) {
        var sum = rated.reduce(function (a, b) {
          return a + b;
        }, 0);
        proficiency = sum / rated.length;
      }

      return {
        id: s.skill_id,
        name: s.skill_name,
        category: "Technical",
        providers: linkedProviderIds.size,
        proficiency: proficiency,
      };
    });
  }

  function buildAllocProviders() {
    var unitProviders = getUnitProviders();
    var providerSkills = AppStore.getTable("provider_skills") || [];
    var skillMap = getSkillMap();

    return unitProviders.map(function (p, i) {
      var tags = providerSkills
        .filter(function (rel) {
          return rel.service_provider_id === p.service_provider_id;
        })
        .map(function (rel) {
          return skillMap[rel.skill_id];
        })
        .filter(Boolean);

      return {
        id: p.service_provider_id,
        initials: initials(p.name),
        name: p.name,
        tags: tags,
        color: ["#3b82f6", "#0d9488", "#7c3aed", "#d97706", "#16a34a"][i % 5],
      };
    });
  }

  function initials(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return "UM";
  }

  function buildStars(score) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += i <= Math.floor(score) ? "★" : "☆";
    return out;
  }

  function catClass(cat) {
    return (
      {
        Technical: "technical",
        Leadership: "leadership",
        "Soft Skills": "soft",
      }[cat] || "technical"
    );
  }

  function updateCoverage(skills) {
    var pctEl = document.getElementById("coveragePct");
    var barEl = document.getElementById("coverageBar");
    var noteEl = document.getElementById("coverageNote");
    if (!pctEl || !barEl || !noteEl) return;

    if (!skills.length) {
      pctEl.textContent = "0%";
      barEl.style.width = "0%";
      noteEl.textContent = "No skills in library yet.";
      return;
    }

    var covered = skills.filter(function (s) {
      return s.providers >= THRESHOLD;
    }).length;
    var pct = Math.round((covered / skills.length) * 100);
    var under = skills.filter(function (s) {
      return s.providers < THRESHOLD;
    });

    pctEl.textContent = pct + "%";
    barEl.style.width = pct + "%";

    if (!under.length) {
      noteEl.textContent = "All skills are well-allocated. Great coverage!";
      return;
    }

    var names = under
      .map(function (s) {
        return '"' + s.name + '"';
      })
      .join(", ");
    var plural = under.length === 1 ? "skill is" : "skills are";
    noteEl.textContent =
      under.length +
      " " +
      plural +
      " under-allocated (fewer than " +
      THRESHOLD +
      " providers): " +
      names +
      ". Consider assigning more providers.";
  }

  function renderSkills() {
    var skills = buildSkills();
    var tbody = document.getElementById("skillBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    var query = currentSearch.toLowerCase().trim();
    var visible = query
      ? skills.filter(function (s) {
          return (
            s.name.toLowerCase().indexOf(query) !== -1 ||
            String(s.category || "")
              .toLowerCase()
              .indexOf(query) !== -1
          );
        })
      : skills;

    if (!visible.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-secondary,#94a3b8)">' +
        (query
          ? 'No skills match "' + currentSearch + '".'
          : "No skills yet. Add one using the button above.") +
        "</td></tr>";
      updateCoverage(skills);
      return;
    }

    var frag = document.createDocumentFragment();

    visible.forEach(function (skill) {
      var tr = document.createElement("tr");
      var catBadge =
        '<span class="cat-badge ' +
        catClass(skill.category) +
        '">' +
        skill.category +
        "</span>";

      var profDisplay =
        skill.proficiency > 0
          ? '<span class="stars">' +
            buildStars(skill.proficiency) +
            "</span> <strong>" +
            skill.proficiency.toFixed(1) +
            "</strong>"
          : '<span style="color:var(--text-secondary,#94a3b8);font-size:.8rem">No data yet</span>';

      tr.innerHTML =
        "<td><strong>" +
        skill.name +
        "</strong> " +
        catBadge +
        "</td>" +
        "<td>" +
        skill.providers +
        "</td>" +
        "<td>" +
        profDisplay +
        "</td>" +
        '<td><button class="action-link" data-delete="' +
        skill.id +
        '">Delete</button></td>';

      tr.querySelector("[data-delete]").addEventListener("click", function () {
        deleteSkill(skill.id, skill.name);
      });

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
    updateCoverage(skills);
  }

  function renderAlloc(filterQuery) {
    var list = document.getElementById("allocList");
    if (!list) return;
    list.innerHTML = "";

    var allocProviders = buildAllocProviders();
    var q = String(filterQuery || "")
      .toLowerCase()
      .trim();
    var visible = q
      ? allocProviders.filter(function (p) {
          return p.name.toLowerCase().indexOf(q) !== -1;
        })
      : allocProviders;

    var frag = document.createDocumentFragment();

    visible.forEach(function (p) {
      var div = document.createElement("div");
      div.className = "alloc-item";

      var tagsEl = document.createElement("div");
      tagsEl.className = "alloc-tags";
      p.tags.forEach(function (t) {
        var span = document.createElement("span");
        span.className = "skill-tag";
        span.textContent = t;
        tagsEl.appendChild(span);
      });

      var addBtn = document.createElement("button");
      addBtn.className = "add-tag-btn";
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", function () {
        showInlinePicker(addBtn, p.id);
      });
      tagsEl.appendChild(addBtn);

      div.innerHTML =
        '<div class="alloc-avatar" style="background:' +
        p.color +
        '">' +
        p.initials +
        "</div>" +
        "<div>" +
        '  <div class="alloc-name">' +
        p.name +
        "</div>" +
        '  <div class="alloc-role">' +
        (p.tags.join(" · ") || "No skills assigned") +
        "</div>" +
        "</div>";

      div.appendChild(tagsEl);
      frag.appendChild(div);
    });

    list.appendChild(frag);
  }

  function showInlinePicker(addBtn, providerId) {
    var provider = buildAllocProviders().find(function (p) {
      return p.id === providerId;
    });
    if (!provider) return;

    var available = buildSkills().filter(function (s) {
      return provider.tags.indexOf(s.name) === -1;
    });

    if (!available.length) {
      addBtn.textContent = "All assigned";
      addBtn.disabled = true;
      setTimeout(function () {
        addBtn.textContent = "+ Add";
        addBtn.disabled = false;
      }, 1800);
      return;
    }

    addBtn.style.display = "none";

    var wrapper = document.createElement("span");
    wrapper.style.cssText = "display:inline-flex;align-items:center;gap:4px";

    var sel = document.createElement("select");
    sel.style.cssText =
      "font-size:.75rem;padding:3px 6px;border-radius:6px;border:1px solid var(--border,#334);" +
      "background:var(--surface2,#1e293b);color:var(--text-primary,#f1f5f9);cursor:pointer";
    available.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });

    var ok = document.createElement("button");
    ok.textContent = "✓";
    ok.style.cssText =
      "font-size:.75rem;padding:3px 7px;border-radius:6px;border:none;background:#16a34a;color:#fff;cursor:pointer";

    var cancel = document.createElement("button");
    cancel.textContent = "✕";
    cancel.style.cssText =
      "font-size:.75rem;padding:3px 7px;border-radius:6px;border:none;background:#dc2626;color:#fff;cursor:pointer";

    function collapse() {
      wrapper.remove();
      addBtn.style.display = "";
    }

    ok.addEventListener("click", function () {
      var chosenSkillId = sel.value;
      if (!chosenSkillId) {
        collapse();
        return;
      }

      var providerSkills = AppStore.getTable("provider_skills") || [];
      var exists = providerSkills.some(function (r) {
        return (
          r.service_provider_id === providerId && r.skill_id === chosenSkillId
        );
      });

      if (!exists) {
        providerSkills.push({
          service_provider_id: providerId,
          skill_id: chosenSkillId,
          verification_status: "Verified",
          verified_at: new Date().toISOString(),
        });
        AppStore.save();
      }

      collapse();
      renderSkills();
      renderAlloc();

      var skillName = (AppStore.getTable("skills") || []).find(function (s) {
        return s.skill_id === chosenSkillId;
      });
      skToast(
        (skillName ? skillName.skill_name : "Skill") +
          " assigned to " +
          provider.name +
          " ✓",
        "success",
      );
    });

    cancel.addEventListener("click", collapse);
    wrapper.appendChild(sel);
    wrapper.appendChild(ok);
    wrapper.appendChild(cancel);
    addBtn.parentElement.appendChild(wrapper);
  }

  window.openSkillModal = function () {
    document.getElementById("skillModalOverlay").classList.add("open");
    var inp = document.getElementById("newSkillName");
    inp.value = "";
    inp.style.borderColor = "";
    inp.focus();
  };

  window.closeSkillModal = function () {
    document.getElementById("skillModalOverlay").classList.remove("open");
  };

  window.addSkill = function () {
    var inp = document.getElementById("newSkillName");
    var name = (inp.value || "").trim();

    if (!name) {
      inp.style.borderColor = "#dc2626";
      inp.focus();
      setTimeout(function () {
        inp.style.borderColor = "";
      }, 1200);
      return;
    }

    var allSkills = AppStore.getTable("skills") || [];
    var exists = allSkills.some(function (s) {
      return String(s.skill_name || "").toLowerCase() === name.toLowerCase();
    });

    if (exists) {
      inp.style.borderColor = "#d97706";
      setTimeout(function () {
        inp.style.borderColor = "";
      }, 1400);
      skToast('Skill "' + name + '" already exists.', "warning");
      return;
    }

    allSkills.unshift({
      skill_id: AppStore.nextId("SKL"),
      skill_name: name,
      description: "Created from Unit Manager skills page",
    });

    AppStore.save();
    closeSkillModal();
    renderSkills();
    renderAlloc();
    skToast('"' + name + '" added to skill library ✓', "success");
  };

  function deleteSkill(id, name) {
    if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;

    var allSkills = AppStore.getTable("skills") || [];
    var idx = allSkills.findIndex(function (s) {
      return s.skill_id === id;
    });
    if (idx !== -1) allSkills.splice(idx, 1);

    var providerSkills = AppStore.getTable("provider_skills") || [];
    for (var i = providerSkills.length - 1; i >= 0; i--) {
      if (providerSkills[i].skill_id === id) providerSkills.splice(i, 1);
    }

    AppStore.save();
    renderSkills();
    renderAlloc();
    skToast('"' + name + '" removed ✓', "info");
  }

  function wireSearches() {
    var cardHead = document.querySelector(".card .card-head");
    if (cardHead) {
      var searchBtn = cardHead.querySelector(".icon-btn");
      if (searchBtn) {
        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search skills...";
        searchInput.style.cssText =
          "display:none;font-size:.84rem;padding:4px 10px;border-radius:8px;" +
          "border:1px solid var(--border,#334);background:var(--surface2,#0f172a);" +
          "color:var(--text-primary,#f1f5f9);width:160px;outline:none";

        cardHead
          .querySelector(".card-actions")
          .insertBefore(searchInput, searchBtn);

        searchBtn.addEventListener("click", function () {
          var isHidden = searchInput.style.display === "none";
          searchInput.style.display = isHidden ? "inline-block" : "none";
          if (isHidden) {
            searchInput.focus();
          } else {
            searchInput.value = "";
            currentSearch = "";
            renderSkills();
          }
        });

        searchInput.addEventListener("input", function () {
          currentSearch = searchInput.value;
          renderSkills();
        });
      }
    }

    var allocInput = document.querySelector(".alloc-search input");
    if (allocInput) {
      allocInput.addEventListener("input", function () {
        renderAlloc(allocInput.value);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSkillModal();
    });
  }

  AppStore.ready.then(function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;

    wireSearches();
    renderSkills();
    renderAlloc();
  });
})();
