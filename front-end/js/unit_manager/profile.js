/*
 * profile.js — Unit Manager: My Profile
 * Uses shared API persistence.
 */

(function () {
  "use strict";

  var session = null;
  var um = null;
  var unit = null;
  var _toastTimer;

  function initials(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return "UM";
  }

  function setInput(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val == null ? "" : val;
  }

  function renderAvatar(src, name) {
    var av = document.getElementById("profile-avatar");
    if (!av) return;

    if (src) {
      av.innerHTML =
        '<img src="' +
        src +
        '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    } else {
      av.innerHTML = "";
      av.textContent = initials(name);
    }
  }

  function showToast(msg, type) {
    var el = document.getElementById("toast");
    if (!el) return;
    var palette = {
      success: "#16a34a",
      error: "#ef4444",
      warning: "#d97706",
      info: "#2563eb",
    };
    el.textContent = msg;
    el.style.background = palette[type] || palette.success;
    el.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 3200);
  }

  function populateFields() {
    setInput("full-name", um ? um.name : "Unit Manager");
    setInput("email", um ? um.email : "");

    var rawPhone = um && um.phone ? String(um.phone) : "";
    setInput("phone", rawPhone.replace(/\D/g, "").slice(-10));

    setInput("dob", um && um.dob ? um.dob : "");

    setInput("unit-name", unit ? unit.unit_name : "");
    setInput("zone", unit && unit.zone ? unit.zone : "");

    var cat = document.getElementById("service-cat");
    if (cat && unit && unit.category) {
      for (var i = 0; i < cat.options.length; i++) {
        if (
          cat.options[i].text.toLowerCase() ===
          String(unit.category).toLowerCase()
        ) {
          cat.selectedIndex = i;
          break;
        }
      }
    }

    document.getElementById("hero-name").textContent = um
      ? um.name
      : "Unit Manager";
    document.getElementById("hero-email").textContent = um ? um.email : "";

    var roleEl = document.getElementById("hero-role");
    if (roleEl) {
      roleEl.textContent =
        unit && unit.unit_name
          ? "Unit Manager - " + unit.unit_name
          : "Unit Manager";
    }

    renderAvatar(um ? um.pfp_url : null, um ? um.name : "Unit Manager");
  }

  window.syncName = function () {
    var v = (document.getElementById("full-name").value || "").trim();
    var displayName = v || (um ? um.name : "Unit Manager");
    document.getElementById("hero-name").textContent = displayName;
    renderAvatar(um ? um.pfp_url : null, displayName);
    
    // Also sync the top-right avatar live
    const initials = displayName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "UM";
    document.querySelectorAll(".user-avatar").forEach(av => av.textContent = initials);
  };

  window.saveSection = async function (section) {
    if (section === "personal") {
      var name = (document.getElementById("full-name").value || "").trim();
      var phone = (document.getElementById("phone").value || "").trim();
      var dob = (document.getElementById("dob").value || "").trim();

      if (!name) {
        showToast("Name cannot be empty.", "error");
        return;
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        showToast("Phone must be exactly 10 digits.", "error");
        return;
      }

      try {
        await Api.patch("/unit-managers/" + session.id, {
          name: name,
          phone: phone,
          dob: dob || null,
        });
        um.name = name;
        um.phone = phone;
        um.dob = dob || null;
        document.getElementById("hero-name").textContent = name;
        document.getElementById("hero-email").textContent = um.email || "";
        renderAvatar(um.pfp_url, name);
        Auth.syncUserAvatar();
        showToast("Personal information saved ✓", "success");
      } catch (err) {
        showToast("Failed to save personal info.", "error");
      }
      return;
    }

    if (section === "unit") {
      var unitName = (document.getElementById("unit-name").value || "").trim();
      var sel = document.getElementById("service-cat");
      var svcCat = sel ? sel.options[sel.selectedIndex].text : "";
      var zone = (document.getElementById("zone").value || "").trim();

      if (!unitName) {
        showToast("Unit name cannot be empty.", "error");
        return;
      }
      if (!unit) {
        showToast("Unit record not found.", "error");
        return;
      }

      try {
        await Api.patch("/units/" + unit.unit_id, {
          unit_name: unitName,
          category: svcCat,
          zone: zone,
        });
        unit.unit_name = unitName;
        unit.category = svcCat;
        unit.zone = zone;
        var roleEl = document.getElementById("hero-role");
        if (roleEl) roleEl.textContent = "Unit Manager - " + unitName;
        showToast("Unit details saved ✓", "success");
      } catch (err) {
        showToast("Failed to save unit details.", "error");
      }
    }
  };

  window.updateAvatar = function (input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2 MB.", "error");
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var imageData = e.target.result;
      var res = Auth.updateProfilePicture(imageData);
      if (!res.success) {
        showToast("Unable to update profile photo.", "error");
        return;
      }

      um.pfp_url = imageData;
      renderAvatar(um.pfp_url, um.name);
      showToast("Profile photo updated ✓", "success");
    };
    reader.readAsDataURL(file);
  };

  window.openPwdModal = function () {
    var modal = document.getElementById("pwd-modal");
    if (!modal) return;

    modal.querySelectorAll('input[type="password"]').forEach(function (i) {
      i.value = "";
      i.style.borderColor = "";
    });

    removePwdError();
    modal.classList.add("open");
  };

  window.closePwdModal = function (e) {
    if (e.target === document.getElementById("pwd-modal"))
      window.closePwdModalBtn();
  };

  window.closePwdModalBtn = function () {
    var modal = document.getElementById("pwd-modal");
    if (modal) {
      modal.classList.remove("open");
      removePwdError();
      // Clear fields
      var fields = ["pwd-current", "pwd-new", "pwd-confirm"];
      fields.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
      });
    }
  };

  function removePwdError() {
    var e = document.getElementById("pwdErrMsg");
    if (e) e.remove();
  }

  function showPwdError(msg) {
    removePwdError();
    var modal = document.getElementById("pwd-modal");
    var fields = modal.querySelector(".modal-fields");
    if (!fields) return;

    var p = document.createElement("p");
    p.id = "pwdErrMsg";
    p.style.cssText =
      "color:#f87171;font-size:.82rem;margin:6px 0;font-family:Inter,sans-serif";
    p.textContent = msg;
    fields.appendChild(p);
  }

  window.handlePasswordChange = async function () {
    var currentPwd = document.getElementById("pwd-current")
      ? document.getElementById("pwd-current").value
      : "";
    var newPwd = document.getElementById("pwd-new")
      ? document.getElementById("pwd-new").value
      : "";
    var confirmPwd = document.getElementById("pwd-confirm")
      ? document.getElementById("pwd-confirm").value
      : "";

    if (!currentPwd || !newPwd || !confirmPwd) {
      showPwdError("Please fill in all password fields.");
      return;
    }

    if (newPwd !== confirmPwd) {
      showPwdError("New passwords do not match.");
      return;
    }

    if (newPwd.length < 8) {
      showPwdError("New password must be at least 8 characters.");
      return;
    }

    var res = await Auth.changePassword(currentPwd, newPwd);
    if (res.success) {
      showToast("Password updated successfully ✓", "success");
      window.closePwdModalBtn();
    } else {
      var errorMap = {
        invalid_current_password: "Current password is incorrect.",
        not_logged_in: "Session expired. Please log in again.",
      };
      showPwdError(errorMap[res.error] || "Failed to update password.");
    }
  };

  function computeUnitMetrics() {
    // Use cached data from init load
    return _cachedMetrics || {
      totalProviders: 0,
      activeThisMonth: 0,
      avgRating: 0,
      completionRate: 0,
      totalProvidersPct: 0,
      activeThisMonthPct: 0,
      avgRatingPct: 0,
    };
  }

  function renderHeroCardStats() {
    var metrics = computeUnitMetrics();
    var providersEl = document.getElementById("hero-stat-providers");
    var ratingEl = document.getElementById("hero-stat-rating");
    var successEl = document.getElementById("hero-stat-success");

    if (providersEl) providersEl.textContent = String(metrics.totalProviders);
    if (ratingEl) ratingEl.textContent = metrics.avgRating.toFixed(1) + " ★";
    if (successEl)
      successEl.textContent =
        Math.round(metrics.completionRate).toString() + "%";
  }

  function renderPerformanceSummary() {
    function setPerfValue(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function setPerfBar(id, pct) {
      var el = document.getElementById(id);
      if (!el) return;
      var safePct = Number(pct);
      if (!isFinite(safePct) || safePct < 0) safePct = 0;
      if (safePct > 100) safePct = 100;
      el.style.width = safePct.toFixed(1).replace(/\.0$/, "") + "%";
    }

    var metrics = computeUnitMetrics();

    setPerfValue("perf-total-value", String(metrics.totalProviders));
    setPerfBar("perf-total-bar", metrics.totalProvidersPct);

    setPerfValue("perf-active-month-value", String(metrics.activeThisMonth));
    setPerfBar("perf-active-month-bar", metrics.activeThisMonthPct);

    setPerfValue("perf-rating-value", metrics.avgRating.toFixed(1));
    setPerfBar("perf-rating-bar", metrics.avgRatingPct);

    setPerfValue(
      "perf-completion-value",
      Math.round(metrics.completionRate).toString() + "%",
    );
    setPerfBar("perf-completion-bar", metrics.completionRate);
  }

  function renderActivities() {
    var list = document.getElementById("activity-list");
    if (!list) return;

    var activities = [];

    activities.push({
      title: "Unit linked",
      desc: unit ? unit.unit_name + " is active under your account" : "No unit assigned",
      time: unit && unit.updated_at ? new Date(unit.updated_at).toLocaleDateString("en-IN") : "Session",
      color: "green",
    });

    activities.push({
      title: "Profile active",
      desc: "Logged in as Unit Manager",
      time: "Live",
      color: "teal",
    });

    activities.push({
      title: "Profile updated",
      desc: "Last profile update synced",
      time: um && um.updated_at ? new Date(um.updated_at).toLocaleDateString("en-IN") : "Recent",
      color: "",
    });

    var html = "";
    for (var i = 0; i < activities.length; i++) {
      var a = activities[i];
      html +=
        '<div class="act-item">' +
        '  <div class="act-dot ' + a.color + '"></div>' +
        '  <div class="act-body">' +
        '    <div class="act-title">' + a.title + '</div>' +
        '    <div class="act-desc">' + a.desc + '</div>' +
        '    <div class="act-time">' + a.time + '</div>' +
        '  </div>' +
        '</div>';
    }
    list.innerHTML = html;
  }

  window.confirmDelete = function () {
    var overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:3000;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif";

    var box = document.createElement("div");
    box.style.cssText =
      "background:#1e293b;border:1px solid #991b1b;border-radius:14px;padding:28px 24px;width:min(380px,88vw);box-shadow:0 20px 60px rgba(0,0,0,.5)";

    box.innerHTML =
      '<h3 style="margin:0 0 10px;color:#f87171;font-size:1rem">⚠️ Deactivate Account</h3>' +
      '<p style="color:#94a3b8;font-size:.88rem;margin:0 0 20px;line-height:1.6">' +
      'This will deactivate your account in the shared store. <strong style="color:#f1f5f9">This cannot be undone.</strong></p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '  <button id="_delCancel" style="padding:8px 18px;border-radius:8px;border:1px solid #334155;background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit">Cancel</button>' +
      '  <button id="_delConfirm" style="padding:8px 18px;border-radius:8px;border:none;background:#dc2626;color:#fff;cursor:pointer;font-weight:500;font-family:inherit">Deactivate</button>' +
      "</div>";

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document
      .getElementById("_delCancel")
      .addEventListener("click", function () {
        overlay.remove();
      });
    document
      .getElementById("_delConfirm")
      .addEventListener("click", function () {
        if (um) {
          um.is_active = false;
          um.updated_at = new Date().toISOString();
          Api.patch("/unit-managers/" + um.um_id, { is_active: false }).catch(function(){});
        }
        overlay.remove();
        showToast("Account deactivation requested.", "warning");
      });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
  };

  window.showToast = showToast;

  var _cachedMetrics = null;

  (async function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;
    Auth.syncUserAvatar();

    // Load UM profile from API
    um  = await Api.get("/unit-managers/" + session.id);
    if (!um) return;

    // Load unit info
    try {
      if (session.unitId) {
        unit = await Api.get("/units/" + session.unitId, { silent: true });
      }
    } catch (_) { unit = null; }

    // Load metrics from API
    try {
      var providers = await Api.get("/service-providers", { silent: true }) || [];
      var unitProviders = providers.filter(function(p) { return unit && p.unit_id === unit.unit_id; });
      var unitProviderIds = new Set(unitProviders.map(function(p) { return p.sp_id; }));
      var totalProviders = unitProviders.length;
      var avgRating = 0;
      var ratedProviders = unitProviders.filter(function(p) { return typeof p.rating === "number"; });
      if (ratedProviders.length) {
        avgRating = ratedProviders.reduce(function(sum, p) { return sum + p.rating; }, 0) / ratedProviders.length;
      }

      // Load all assignments for the unit to compute completion rate
      var allAssignments = await Api.get("/job-assignments", { silent: true }) || [];
      var unitAssignments = allAssignments.filter(function(a) { return unitProviderIds.has(a.sp_id); });
      var completedJobs = unitAssignments.filter(function(a) { return a.status === "COMPLETED"; }).length;
      var completionRate = unitAssignments.length ? (completedJobs / unitAssignments.length) * 100 : 0;

      _cachedMetrics = {
        totalProviders: totalProviders,
        activeThisMonth: Math.min(totalProviders, unitAssignments.length ? Math.ceil(unitAssignments.length / 4) : 0),
        avgRating: avgRating,
        completionRate: completionRate,
        totalProvidersPct: 100,
        activeThisMonthPct: totalProviders ? (Math.min(totalProviders, 3) / totalProviders) * 100 : 0,
        avgRatingPct: (avgRating / 5) * 100,
      };
    } catch (_) {}

    populateFields();
    renderHeroCardStats();
    renderPerformanceSummary();
    renderActivities();
  })();
})();
