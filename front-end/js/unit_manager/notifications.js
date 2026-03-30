/**
 * notifications.js — Unit Manager: Notifications
 * Dynamic data from AppStore; per-user state persisted in AppStore.data.um_notif_state.
 */

(function () {
  "use strict";

  var session = null;
  var notifications = [];
  var currentFilter = "all";
  var state = { dismissed: [], read: [], overrides: {} };

  function ensureState() {
    if (
      !AppStore.data.um_notif_state ||
      typeof AppStore.data.um_notif_state !== "object"
    ) {
      AppStore.data.um_notif_state = {};
    }
    if (!AppStore.data.um_notif_state[session.id]) {
      AppStore.data.um_notif_state[session.id] = {
        dismissed: [],
        read: [],
        overrides: {},
      };
      AppStore.save();
    }
    state = AppStore.data.um_notif_state[session.id];
  }

  function saveState() {
    AppStore.data.um_notif_state[session.id] = state;
    AppStore.save();
  }

  function toast(msg, type) {
    var old = document.getElementById("nfToast");
    if (old) old.remove();
    var bg = {
      success: "#16a34a",
      error: "#dc2626",
      info: "#2563eb",
      warning: "#d97706",
    };
    var el = document.createElement("div");
    el.id = "nfToast";
    el.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 20px;border-radius:10px;color:#fff;" +
      "font-size:.87rem;font-weight:500;box-shadow:0 8px 28px rgba(0,0,0,.4);font-family:Inter,sans-serif;max-width:320px;line-height:1.5;transition:opacity .3s";
    el.style.background = bg[type] || bg.info;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () {
        if (el.parentNode) el.remove();
      }, 320);
    }, 3000);
  }

  function showModal(title, bodyHtml, buttons) {
    var modal = document.getElementById("nfModal");
    var backdrop = document.getElementById("nfBackdrop");

    var btnsHtml = '<div class="mbtns">';
    buttons.forEach(function (b) {
      btnsHtml +=
        '<button class="' +
        b.cls +
        '" id="nfBtn_' +
        b.label.replace(/\s/g, "_") +
        '">' +
        b.label +
        "</button>";
    });
    btnsHtml += "</div>";

    modal.innerHTML =
      "<h3>" + title + "</h3><div>" + bodyHtml + "</div>" + btnsHtml;
    backdrop.classList.add("open");

    buttons.forEach(function (b) {
      var el = document.getElementById("nfBtn_" + b.label.replace(/\s/g, "_"));
      if (el) {
        el.addEventListener("click", function () {
          backdrop.classList.remove("open");
          if (b.onClick) b.onClick();
        });
      }
    });

    backdrop.addEventListener("click", function handler(e) {
      if (e.target === backdrop) {
        backdrop.classList.remove("open");
        backdrop.removeEventListener("click", handler);
      }
    });
  }

  function injectStyles() {
    var s = document.createElement("style");
    s.textContent = [
      "#nfBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:none;align-items:center;justify-content:center}",
      "#nfBackdrop.open{display:flex}",
      "#nfModal{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:28px 24px;width:min(400px,88vw);font-family:Inter,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}",
      "#nfModal h3{margin:0 0 10px;font-size:1rem;color:#f1f5f9}",
      "#nfModal p{margin:0 0 20px;font-size:.88rem;color:#94a3b8;line-height:1.6}",
      "#nfModal .mbtns{display:flex;gap:10px;justify-content:flex-end}",
      "#nfModal .mbtns button{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:500;font-family:inherit}",
      "#nfModal .mbtns .mcancel{background:transparent;border:1px solid #334155;color:#94a3b8}",
      "#nfModal .mbtns .mconfirm{background:#2563eb;color:#fff}",
      "#nfModal .mbtns .mdanger{background:#dc2626;color:#fff}",
      "#nfModal .mbtns .mwarn{background:#d97706;color:#fff}",
    ].join("");
    document.head.appendChild(s);

    var backdrop = document.createElement("div");
    backdrop.id = "nfBackdrop";
    backdrop.innerHTML = '<div id="nfModal"></div>';
    document.body.appendChild(backdrop);
  }

  function fmtAgo(iso) {
    if (!iso) return "recently";
    var diffMin = Math.max(
      1,
      Math.floor((Date.now() - new Date(iso).getTime()) / 60000),
    );
    if (diffMin < 60) return diffMin + " mins ago";
    var h = Math.floor(diffMin / 60);
    if (h < 24) return h + " hours ago";
    return Math.floor(h / 24) + " days ago";
  }

  function buildBaseNotifications() {
    var providers = (AppStore.getTable("service_providers") || []).filter(
      function (p) {
        return p.unit_id === session.unitId;
      },
    );
    var providerIds = new Set(
      providers.map(function (p) {
        return p.service_provider_id;
      }),
    );

    var assignments = (AppStore.getTable("job_assignments") || []).filter(
      function (a) {
        return providerIds.has(a.service_provider_id);
      },
    );

    var bookingsById = {};
    (AppStore.getTable("bookings") || []).forEach(function (b) {
      bookingsById[b.booking_id] = b;
    });

    var bookingIds = new Set(
      assignments.map(function (a) {
        return a.booking_id;
      }),
    );
    var txns = (AppStore.getTable("transactions") || []).filter(function (t) {
      return bookingIds.has(t.booking_id);
    });

    var activeAssigned = assignments.filter(function (a) {
      return a.status === "ASSIGNED" || a.status === "IN_PROGRESS";
    });

    var lowRated = providers.filter(function (p) {
      return typeof p.rating === "number" && p.rating <= 2;
    });

    var latestSuccessTxn = txns
      .filter(function (t) {
        return t.payment_status === "SUCCESS";
      })
      .sort(function (a, b) {
        return new Date(b.transaction_at) - new Date(a.transaction_at);
      })[0];

    var underAllocatedSkills = (function () {
      var skills = AppStore.getTable("skills") || [];
      var rel = AppStore.getTable("provider_skills") || [];
      var counts = {};
      rel.forEach(function (r) {
        if (!providerIds.has(r.service_provider_id)) return;
        counts[r.skill_id] = (counts[r.skill_id] || 0) + 1;
      });
      return skills.filter(function (s) {
        return (counts[s.skill_id] || 0) < 2;
      }).length;
    })();

    var base = [];
    if (activeAssigned.length) {
      base.push({
        id: 1,
        type: "alert",
        iconClass: "red",
        title: "Jobs Need Active Monitoring",
        desc:
          activeAssigned.length +
          " assignment(s) are currently assigned/in-progress for your unit.",
        time: fmtAgo(
          activeAssigned[0].updated_at || activeAssigned[0].assigned_at,
        ),
        actions: ["Reassign Job", "Call Provider"],
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>',
      });
    }

    base.push({
      id: 2,
      type: lowRated.length ? "alert" : "info",
      iconClass: lowRated.length ? "amber" : "blue",
      title: lowRated.length
        ? "Low Rating Provider Alert"
        : "Provider Quality Stable",
      desc: lowRated.length
        ? lowRated.length +
          " provider(s) have rating <= 2.0. Review recommended."
        : "No low-rating providers detected in your unit.",
      time: "recently",
      actions: lowRated.length ? ["Investigate", "Dismiss"] : ["Dismiss"],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    });

    base.push({
      id: 3,
      type: "info",
      iconClass: "teal",
      title: "Skill Coverage Update",
      desc:
        underAllocatedSkills +
        " skill(s) are under-allocated in your current unit roster.",
      time: "recently",
      actions: ["View Providers"],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    });

    if (latestSuccessTxn) {
      base.push({
        id: 4,
        type: "success",
        iconClass: "green",
        title: "Transaction Completed",
        desc:
          "Transaction " +
          latestSuccessTxn.transaction_id +
          " for ₹" +
          Number(latestSuccessTxn.amount || 0).toLocaleString("en-IN") +
          " processed successfully.",
        time: fmtAgo(
          latestSuccessTxn.verified_at || latestSuccessTxn.transaction_at,
        ),
        actions: ["View Report"],
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      });
    }

    if (!base.length) {
      base.push({
        id: 5,
        type: "info",
        iconClass: "blue",
        title: "No Notifications",
        desc: "No current alerts for your unit.",
        time: "recently",
        actions: [],
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      });
    }

    return base;
  }

  function buildList(base) {
    var out = [];
    for (var i = 0; i < base.length; i++) {
      var b = base[i];
      if (state.dismissed.indexOf(b.id) !== -1) continue;
      var ov = state.overrides[b.id] || {};
      out.push({
        id: b.id,
        type: b.type,
        iconClass: b.iconClass,
        icon: b.icon,
        title: ov.title !== undefined ? ov.title : b.title,
        desc: ov.desc !== undefined ? ov.desc : b.desc,
        time: b.time,
        actions: ov.actions !== undefined ? ov.actions : b.actions.slice(),
        unread: state.read.indexOf(b.id) === -1,
      });
    }
    return out;
  }

  function updateCounts() {
    var c = { all: 0, alert: 0, info: 0, success: 0 };
    for (var i = 0; i < notifications.length; i++) {
      c.all++;
      if (c[notifications[i].type] !== undefined) c[notifications[i].type]++;
    }
    document.getElementById("cntAll").textContent = c.all || "";
    document.getElementById("cntAlert").textContent = c.alert || "";
    document.getElementById("cntInfo").textContent = c.info || "";
    document.getElementById("cntSuccess").textContent = c.success || "";

    var unread = notifications.filter(function (n) {
      return n.unread;
    }).length;
    var dot = document.querySelector(".notif-dot");
    if (dot) dot.style.display = unread > 0 ? "block" : "none";
  }

  function markRead(id) {
    if (state.read.indexOf(id) === -1) state.read.push(id);
    saveState();
    notifications.forEach(function (n) {
      if (n.id === id) n.unread = false;
    });
    render();
    updateCounts();
  }

  window.dismissNotif = function (id) {
    if (state.dismissed.indexOf(id) === -1) state.dismissed.push(id);
    saveState();
    notifications = notifications.filter(function (n) {
      return n.id !== id;
    });
    render();
    updateCounts();
  };

  function applyOverride(id, changes) {
    if (!state.overrides[id]) state.overrides[id] = {};
    var ov = state.overrides[id];
    if (changes.title !== undefined) ov.title = changes.title;
    if (changes.desc !== undefined) ov.desc = changes.desc;
    if (changes.actions !== undefined) ov.actions = changes.actions;
    saveState();
  }

  window.handleAction = function (label, id) {
    switch (label) {
      case "Reassign Job":
        showModal(
          "Reassign Active Job",
          "<p>Reassign one of the current active assignments to the next available provider?</p>",
          [
            { label: "Cancel", cls: "mcancel", onClick: null },
            {
              label: "Reassign",
              cls: "mdanger",
              onClick: function () {
                markRead(id);
                applyOverride(id, {
                  title: "Assignment Reassigned",
                  desc: "Active assignment was reassigned successfully.",
                  actions: [],
                });
                render();
                toast("Job reassigned ✓", "success");
              },
            },
          ],
        );
        break;

      case "Call Provider":
        showModal(
          "Call Provider",
          "<p>Use the provider contact details from Manage Providers page for immediate follow-up.</p>",
          [
            {
              label: "Close",
              cls: "mcancel",
              onClick: function () {
                markRead(id);
              },
            },
          ],
        );
        break;

      case "Investigate":
        showModal(
          "Investigate Rating Alert",
          "<p>Open provider profile and assignment timeline to review this rating incident.</p>",
          [
            {
              label: "Close",
              cls: "mcancel",
              onClick: function () {
                markRead(id);
              },
            },
            {
              label: "Escalate",
              cls: "mwarn",
              onClick: function () {
                markRead(id);
                toast("Incident escalated ✓", "warning");
              },
            },
          ],
        );
        break;

      case "Dismiss":
        window.dismissNotif(id);
        break;

      case "View Providers":
        window.location.href = "providers.html";
        break;

      case "View Report":
        window.location.href = "revenue.html";
        break;

      case "View Profile":
        window.location.href = "providers.html";
        break;

      default:
        markRead(id);
        toast(label + " action completed", "info");
    }
  };

  function render() {
    var list = document.getElementById("notifList");
    var empty = document.getElementById("emptyState");
    var vis = notifications.filter(function (n) {
      return currentFilter === "all" || n.type === currentFilter;
    });

    list.innerHTML = "";

    if (!vis.length) {
      empty.style.display = "block";
      updateCounts();
      return;
    }
    empty.style.display = "none";

    for (var i = 0; i < vis.length; i++) {
      var n = vis[i];
      var btns = "";
      if (n.actions && n.actions.length) {
        btns = '<div class="notif-actions">';
        for (var a = 0; a < n.actions.length; a++) {
          var lbl = n.actions[a];
          var cls =
            lbl === "Reassign Job" ||
            lbl === "Investigate" ||
            lbl === "Assign Now"
              ? "primary"
              : "ghost";
          btns +=
            '<button class="nbtn ' +
            cls +
            '" onclick="handleAction(\'' +
            lbl +
            "'," +
            n.id +
            ')">' +
            lbl +
            "</button>";
        }
        btns += "</div>";
      }

      var div = document.createElement("div");
      div.className = "notif-item" + (n.unread ? " unread" : "");
      div.style.animationDelay = i * 0.05 + "s";
      div.innerHTML =
        '<div class="notif-icon ' +
        n.iconClass +
        '">' +
        n.icon +
        "</div>" +
        '<div class="notif-body">' +
        '  <div class="notif-top"><span class="notif-title">' +
        n.title +
        "</span>" +
        (n.unread ? '<span class="unread-dot"></span>' : "") +
        "</div>" +
        '  <div class="notif-desc">' +
        n.desc +
        "</div>" +
        '  <div class="notif-meta">' +
        n.time +
        "</div>" +
        btns +
        "</div>" +
        '<button class="notif-dismiss" onclick="dismissNotif(' +
        n.id +
        ')" title="Dismiss">&times;</button>';

      (function (nid) {
        div.addEventListener("click", function (e) {
          if (e.target.closest("button")) return;
          markRead(nid);
        });
      })(n.id);

      list.appendChild(div);
    }

    updateCounts();
  }

  window.setNotifFilter = function (btn, type) {
    var tabs = document.querySelectorAll(".ntab");
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
    btn.classList.add("active");
    currentFilter = type;
    render();
  };

  window.markAllRead = function () {
    notifications.forEach(function (n) {
      if (state.read.indexOf(n.id) === -1) state.read.push(n.id);
      n.unread = false;
    });
    saveState();
    render();
    updateCounts();
    toast("All marked as read ✓", "success");
  };

  window.clearAll = function () {
    showModal(
      currentFilter === "all"
        ? "Clear All Notifications"
        : "Clear Notifications",
      "<p>This will remove notifications in the current filter from your list.</p>",
      [
        { label: "Cancel", cls: "mcancel", onClick: null },
        {
          label: "Clear",
          cls: "mdanger",
          onClick: function () {
            notifications.forEach(function (n) {
              if (currentFilter === "all" || n.type === currentFilter) {
                if (state.dismissed.indexOf(n.id) === -1)
                  state.dismissed.push(n.id);
              }
            });
            saveState();
            notifications = notifications.filter(function (n) {
              return !(currentFilter === "all" || n.type === currentFilter);
            });
            render();
            updateCounts();
            toast("Cleared ✓", "info");
          },
        },
      ],
    );
  };

  AppStore.ready.then(function () {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;

    injectStyles();
    ensureState();
    notifications = buildList(buildBaseNotifications());
    render();
    updateCounts();
  });
})();
