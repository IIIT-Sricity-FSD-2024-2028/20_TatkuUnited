/*
 * profile.js — Unit Manager: My Profile
 * Uses shared AppStore persistence (same strategy as collective manager).
 */

(function () {
  "use strict";

  var session = null;
  var um = null;
  var unit = null;
  var prefs = null;
  var _toastTimer;

  var DEFAULT_PREFS = {
    emailNotif: true,
    smsAlerts: true,
    weeklySummary: false,
    twoFA: true,
  };

  function ensurePrefs() {
    if (
      !AppStore.data.um_preferences ||
      typeof AppStore.data.um_preferences !== "object"
    ) {
      AppStore.data.um_preferences = {};
    }

    if (!AppStore.data.um_preferences[session.id]) {
      AppStore.data.um_preferences[session.id] = {
        emailNotif: DEFAULT_PREFS.emailNotif,
        smsAlerts: DEFAULT_PREFS.smsAlerts,
        weeklySummary: DEFAULT_PREFS.weeklySummary,
        twoFA: DEFAULT_PREFS.twoFA,
      };
      AppStore.save();
    }

    prefs = AppStore.data.um_preferences[session.id];
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

  function setInput(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val == null ? "" : val;
  }

  function setToggle(id, checked) {
    var el = document.getElementById(id);
    if (el) el.checked = !!checked;
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
    setInput("phone", um ? String(um.phone || "").replace(/^\+91/, "") : "");
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

    setToggle("toggle-email", prefs.emailNotif);
    setToggle("toggle-sms", prefs.smsAlerts);
    setToggle("toggle-weekly", prefs.weeklySummary);
    setToggle("toggle-2fa", prefs.twoFA);

    document.getElementById("hero-name").textContent = um
      ? um.name
      : "Unit Manager";
    document.getElementById("hero-email").textContent = um ? um.email : "";

    renderAvatar(um ? um.pfp_url : null, um ? um.name : "Unit Manager");
  }

  window.syncName = function () {
    var v = (document.getElementById("full-name").value || "").trim();
    document.getElementById("hero-name").textContent =
      v || (um ? um.name : "Unit Manager");
    renderAvatar(um ? um.pfp_url : null, v || (um ? um.name : "Unit Manager"));
  };

  window.syncEmail = function () {
    var v = (document.getElementById("email").value || "").trim();
    document.getElementById("hero-email").textContent =
      v || (um ? um.email : "");
  };

  window.saveSection = function (section) {
    if (section === "personal") {
      var name = (document.getElementById("full-name").value || "").trim();
      var email = (document.getElementById("email").value || "").trim();
      var phone = (document.getElementById("phone").value || "").trim();
      var dob = (document.getElementById("dob").value || "").trim();

      if (!name) {
        showToast("Name cannot be empty.", "error");
        return;
      }
      if (!email || email.indexOf("@") === -1 || email.indexOf(".") === -1) {
        showToast("Enter a valid email address.", "error");
        return;
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        showToast("Phone must be exactly 10 digits.", "error");
        return;
      }

      um.name = name;
      um.email = email.toLowerCase();
      um.phone = phone ? "+91" + phone : "";
      um.dob = dob || null; // custom UI field, persisted in shared store
      um.updated_at = new Date().toISOString();

      AppStore.save();
      document.getElementById("hero-name").textContent = name;
      document.getElementById("hero-email").textContent = email;
      renderAvatar(um.pfp_url, name);
      showToast("Personal information saved ✓", "success");
      return;
    }

    if (section === "unit") {
      var unitName = (document.getElementById("unit-name").value || "").trim();
      var sel = document.getElementById("service-cat");
      var svcCat = sel
        ? sel.options[sel.selectedIndex].text
        : unit && unit.category
          ? unit.category
          : "";
      var zone = (document.getElementById("zone").value || "").trim();

      if (!unitName) {
        showToast("Unit name cannot be empty.", "error");
        return;
      }
      if (!unit) {
        showToast("Unit record not found.", "error");
        return;
      }

      unit.unit_name = unitName;
      unit.category = svcCat;
      unit.zone = zone;
      unit.updated_at = new Date().toISOString();

      AppStore.save();
      showToast("Unit details saved ✓", "success");
    }
  };

  window.saveToggle = function (key, value) {
    if (!prefs || !Object.prototype.hasOwnProperty.call(prefs, key)) return;
    prefs[key] = !!value;
    AppStore.save();
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
      um.pfp_url = e.target.result;
      um.updated_at = new Date().toISOString();
      AppStore.save();
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

  function wirePasswordBtn() {
    var modal = document.getElementById("pwd-modal");
    if (!modal) return;

    var btn = modal.querySelector(".modal-btn-save");
    if (!btn) return;

    btn.removeAttribute("onclick");
    btn.addEventListener("click", function () {
      var inputs = modal.querySelectorAll('input[type="password"]');
      var current = inputs[0] ? inputs[0].value : "";
      var newPwd = inputs[1] ? inputs[1].value : "";
      var confirm = inputs[2] ? inputs[2].value : "";

      if (!current) {
        showPwdError("Enter your current password.");
        return;
      }
      if (um && um.password && current !== um.password) {
        showPwdError("Current password is incorrect.");
        if (inputs[0]) inputs[0].style.borderColor = "#f87171";
        return;
      }
      if (newPwd.length < 8) {
        showPwdError("New password must be at least 8 characters.");
        if (inputs[1]) inputs[1].style.borderColor = "#f87171";
        return;
      }
      if (newPwd === current) {
        showPwdError("New password must differ from the current one.");
        if (inputs[1]) inputs[1].style.borderColor = "#f87171";
        return;
      }
      if (newPwd !== confirm) {
        showPwdError("Passwords do not match.");
        if (inputs[2]) inputs[2].style.borderColor = "#f87171";
        return;
      }

      um.password = newPwd;
      um.updated_at = new Date().toISOString();
      AppStore.save();

      window.closePwdModalBtn();
      showToast("Password updated successfully ✓", "success");
    });
  }

  function renderActivities() {
    var list = document.getElementById("activity-list");
    if (!list) return;

    var assignments = (AppStore.getTable("job_assignments") || []).filter(
      function (a) {
        return (
          a.service_provider_id &&
          unit &&
          (AppStore.getTable("service_providers") || []).some(function (p) {
            return (
              p.service_provider_id === a.service_provider_id &&
              p.unit_id === unit.unit_id
            );
          })
        );
      },
    );

    var bookingIds = new Set(
      assignments.map(function (a) {
        return a.booking_id;
      }),
    );
    var txns = (AppStore.getTable("transactions") || []).filter(function (t) {
      return bookingIds.has(t.booking_id);
    });

    var latestTxn = txns.sort(function (a, b) {
      return new Date(b.transaction_at || 0) - new Date(a.transaction_at || 0);
    })[0];

    var completedCount = assignments.filter(function (a) {
      return a.status === "COMPLETED";
    }).length;
    var inProgressCount = assignments.filter(function (a) {
      return a.status === "IN_PROGRESS" || a.status === "ASSIGNED";
    }).length;

    var activities = [];

    activities.push({
      title: "Unit linked",
      desc: unit
        ? unit.unit_name + " is active under your account"
        : "No unit assigned",
      time:
        unit && unit.updated_at
          ? new Date(unit.updated_at).toLocaleDateString("en-IN")
          : "Session",
      color: "green",
    });

    activities.push({
      title: "Assignments summary",
      desc:
        completedCount +
        " completed, " +
        inProgressCount +
        " active assignment(s) in your unit",
      time: "Live",
      color: "teal",
    });

    if (latestTxn) {
      activities.push({
        title: "Latest transaction",
        desc:
          latestTxn.transaction_id +
          " • " +
          latestTxn.payment_status +
          " • ₹" +
          Number(latestTxn.amount || 0).toLocaleString("en-IN"),
        time: latestTxn.transaction_at
          ? new Date(latestTxn.transaction_at).toLocaleDateString("en-IN")
          : "Recent",
        color: "amber",
      });
    }

    activities.push({
      title: "Profile updated",
      desc: "Last profile update synced to shared store",
      time:
        um && um.updated_at
          ? new Date(um.updated_at).toLocaleDateString("en-IN")
          : "Recent",
      color: "",
    });

    var html = "";
    for (var i = 0; i < activities.length; i++) {
      var a = activities[i];
      html +=
        '<div class="act-item">' +
        '  <div class="act-dot ' +
        a.color +
        '"></div>' +
        '  <div class="act-body">' +
        '    <div class="act-title">' +
        a.title +
        "</div>" +
        '    <div class="act-desc">' +
        a.desc +
        "</div>" +
        '    <div class="act-time">' +
        a.time +
        "</div>" +
        "  </div>" +
        "</div>";
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
          AppStore.save();
        }
        overlay.remove();
        showToast("Account deactivation requested.", "warning");
      });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
  };

  window.showToast = showToast;

  AppStore.ready.then(function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;

    var allUM = AppStore.getTable("unit_managers") || [];
    var allUnits = AppStore.getTable("units") || [];

    um =
      allUM.find(function (r) {
        return r.um_id === session.id;
      }) || null;
    if (!um) return;

    unit =
      allUnits.find(function (u) {
        return u.unit_id === session.unitId;
      }) || null;

    ensurePrefs();
    populateFields();
    renderActivities();
    wirePasswordBtn();
  });
})();
