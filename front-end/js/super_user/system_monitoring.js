/* system_monitoring.js */
// Depends on: store.js -> auth.js (loaded before this script)

AppStore.ready.then(() => {
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  const platformEvents = AppStore.getTable("super_user_platform_events") || [];
  const auditLogs = AppStore.getTable("super_user_audit_logs") || [];
  const notifications = AppStore.getTable("super_user_notifications") || [];
  const performanceSnapshots =
    AppStore.getTable("super_user_system_performance") || [];
  const assignments = AppStore.getTable("job_assignments") || [];
  const customers = AppStore.getTable("customers") || [];
  const providers = AppStore.getTable("service_providers") || [];
  const unitManagers = AppStore.getTable("unit_managers") || [];
  const collectiveManagers = AppStore.getTable("collective_managers") || [];
  const superUsers = AppStore.getTable("super_users") || [];

  const state = {
    query: "",
    showAllLogs: false,
    filteredEvents: [],
    filteredLogs: [],
    performanceVisible: false,
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(ts) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateTime(ts) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function severityClass(severity) {
    const norm = String(severity || "").toLowerCase();
    if (norm === "critical") return "red";
    if (norm === "high") return "orange";
    if (norm === "medium") return "yellow";
    return "green";
  }

  function eventLabel(eventType) {
    const norm = String(eventType || "").toLowerCase();
    if (norm === "security") return "Security";
    if (norm === "system") return "System";
    if (norm === "user") return "User";
    if (norm === "action") return "Action";
    return "General";
  }

  function logStatusClass(status) {
    const norm = String(status || "").toLowerCase();
    if (norm === "success" || norm === "200 ok" || norm === "delivered") {
      return "ok";
    }
    if (norm.includes("pending") || norm.includes("progress")) {
      return "delivered";
    }
    return "error";
  }

  function computeKpiModel() {
    const hasEventData = platformEvents.length > 0;

    const unresolvedCritical = platformEvents.filter(
      (e) =>
        String(e.severity).toLowerCase() === "critical" &&
        String(e.status).toLowerCase() !== "completed",
    ).length;
    const unresolvedHigh = platformEvents.filter(
      (e) =>
        String(e.severity).toLowerCase() === "high" &&
        String(e.status).toLowerCase() !== "completed",
    ).length;

    let statusText = "--";
    let statusTone = "neutral";
    if (hasEventData) {
      statusText = "Operational";
      statusTone = "green";
      if (unresolvedCritical > 0) {
        statusText = "Critical";
        statusTone = "red";
      } else if (unresolvedHigh > 0) {
        statusText = "Degraded";
        statusTone = "orange";
      }
    }

    const activeUsers = [
      ...customers,
      ...providers,
      ...unitManagers,
      ...collectiveManagers,
      ...superUsers,
    ].filter((u) => !!u.is_active).length;

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const systemErrors24h = platformEvents.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      if (Number.isNaN(ts)) return false;
      const isError = ["critical", "high"].includes(
        String(e.severity).toLowerCase(),
      );
      return isError && now - ts <= twentyFourHours;
    }).length;

    const failedAssignments = assignments.filter((a) => {
      const s = String(a.status || "").toUpperCase();
      return s === "CANCELLED" || s === "FAILED";
    }).length;

    const logsOk = auditLogs.filter(
      (l) => String(l.status).toLowerCase() === "success",
    ).length;
    const uptime = auditLogs.length
      ? ((logsOk / auditLogs.length) * 100).toFixed(2)
      : null;

    return {
      statusText,
      statusTone,
      uptime,
      activeUsers,
      systemErrors24h,
      failedAssignments,
    };
  }

  function getPerformanceModelFromMock() {
    if (!performanceSnapshots.length) return null;

    const sorted = performanceSnapshots
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const latest = sorted[sorted.length - 1] || null;
    if (!latest) return null;

    const apiResponseMs = Number(latest.api_response_ms);
    const serverLoad = Number(latest.server_load_cpu_percent);
    const memoryUsage = Number(latest.memory_usage_percent);

    if (
      !Number.isFinite(apiResponseMs) ||
      !Number.isFinite(serverLoad) ||
      !Number.isFinite(memoryUsage)
    ) {
      return null;
    }

    const bars = sorted
      .slice(-12)
      .map((row) => Number(row.api_response_ms))
      .filter((v) => Number.isFinite(v));

    return {
      apiResponseMs,
      serverLoad,
      memoryUsage,
      apiBars: bars,
    };
  }

  function setPerformanceVisibility(visible) {
    state.performanceVisible = visible;
    const perfCard = document.querySelector(".perf-card");
    const midRow = document.querySelector(".mid-row");
    if (perfCard) {
      perfCard.style.display = visible ? "flex" : "none";
    }
    if (midRow) {
      midRow.classList.toggle("mid-row--single", !visible);
    }
  }

  function transformEvents() {
    return platformEvents
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .map((e) => ({
        time: formatTime(e.timestamp),
        type: eventLabel(e.event_type),
        typeClass: severityClass(e.severity),
        desc: e.title || e.description || "-",
        module: e.component || "System",
        timestamp: e.timestamp,
      }));
  }

  function transformLogs() {
    return auditLogs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .map((l) => ({
        timestamp: formatDateTime(l.timestamp),
        service: l.resource_type || l.action_type || "service",
        event: l.action_description || "-",
        status: l.status_code || String(l.status || "").toUpperCase(),
        statusClass: logStatusClass(l.status_code || l.status),
        raw: l,
      }));
  }

  function computeAlerts(events, logs) {
    return events
      .filter((e) => ["red", "orange"].includes(e.typeClass))
      .slice(0, 3)
      .map((e) => ({
        tone: e.typeClass,
        title: e.desc,
        desc: `${e.type} event in ${e.module}`,
      }));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setKpiSub(id, text, tone) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("kpi-sub--green", "kpi-sub--red");
    if (tone === "green") el.classList.add("kpi-sub--green");
    if (tone === "red") el.classList.add("kpi-sub--red");
  }

  function renderKpis(model) {
    setText("kpi-system-status", model.statusText);
    if (model.uptime == null) {
      setKpiSub("kpi-system-uptime", "Uptime: --", "red");
    } else {
      setKpiSub(
        "kpi-system-uptime",
        `Uptime: ${model.uptime}%`,
        model.statusTone === "red" ? "red" : "green",
      );
    }

    setText("kpi-active-sessions", String(model.activeUsers));
    const unreadNotifications = notifications.filter((n) => !n.is_read).length;
    setKpiSub(
      "kpi-active-sessions-sub",
      `${unreadNotifications} unread notifications`,
      "green",
    );

    setText("kpi-system-errors", String(model.systemErrors24h));
    setKpiSub(
      "kpi-system-errors-sub",
      model.systemErrors24h > 0 ? "Requires monitoring" : "0 in last 24 hours",
      model.systemErrors24h > 0 ? "red" : "green",
    );

    setText("kpi-failed-assignments", String(model.failedAssignments));
    setKpiSub(
      "kpi-failed-assignments-sub",
      model.failedAssignments > 0
        ? `${model.failedAssignments} cancelled assignments`
        : "0 cancelled assignments",
      model.failedAssignments > 0 ? "red" : "green",
    );
  }

  function renderPerformance(model) {
    if (!model) {
      setPerformanceVisibility(false);
      return;
    }

    setPerformanceVisibility(true);

    setText("api-response-time", `${model.apiResponseMs} ms`);
    setText("server-load-value", `${model.serverLoad}%`);
    setText("memory-usage-value", `${model.memoryUsage}%`);

    const loadFill = document.getElementById("server-load-fill");
    if (loadFill) loadFill.style.width = `${model.serverLoad}%`;

    const memFill = document.getElementById("memory-usage-fill");
    if (memFill) memFill.style.width = `${model.memoryUsage}%`;

    const bars = model.apiBars || [];
    if (!bars.length) {
      setPerformanceVisibility(false);
      return;
    }
    const max = Math.max(...bars, 1);
    const container = document.getElementById("api-bars");
    if (!container) return;

    container.innerHTML = bars
      .map((value, index) => {
        const height = Math.max(8, Math.round((value / max) * 100));
        const active = index === bars.length - 1 ? "api-bar--active" : "";
        return `<div class="api-bar ${active}" style="height:${height}%" title="${value} ms"></div>`;
      })
      .join("");
  }

  function renderAlerts(alerts) {
    const container = document.getElementById("critical-alerts-list");
    if (!container) return;

    if (!alerts.length) {
      container.innerHTML =
        '<div class="table-empty">No critical alerts found.</div>';
      return;
    }

    container.innerHTML = alerts
      .map(
        (a) => `
      <div class="crit-alert crit-alert--${a.tone}">
        <div class="crit-alert-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div>
          <div class="crit-alert-title">${escapeHtml(a.title)}</div>
          <div class="crit-alert-desc">${escapeHtml(a.desc)}</div>
        </div>
      </div>`,
      )
      .join("");
  }

  function applySearch(events, logs) {
    const q = state.query.trim().toLowerCase();
    if (!q) {
      state.filteredEvents = events;
      state.filteredLogs = logs;
      return;
    }

    state.filteredEvents = events.filter((e) => {
      return [e.type, e.desc, e.module].some((v) =>
        String(v).toLowerCase().includes(q),
      );
    });

    state.filteredLogs = logs.filter((l) => {
      return [l.timestamp, l.service, l.event, l.status].some((v) =>
        String(v).toLowerCase().includes(q),
      );
    });
  }

  function renderEventsTable() {
    const tbody = document.getElementById("events-tbody");
    if (!tbody) return;

    if (!state.filteredEvents.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="table-empty">No events match your search.</td></tr>';
      return;
    }

    tbody.innerHTML = state.filteredEvents
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(e.time)}</td>
        <td><span class="ev-type-badge ev-type-badge--${e.typeClass}">${escapeHtml(e.type)}</span></td>
        <td>${escapeHtml(e.desc)}</td>
        <td>${escapeHtml(e.module)}</td>
      </tr>`,
      )
      .join("");
  }

  function renderLogsTable() {
    const tbody = document.getElementById("logs-tbody");
    if (!tbody) return;

    const logsToShow = state.showAllLogs
      ? state.filteredLogs
      : state.filteredLogs.slice(0, 5);

    if (!logsToShow.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="table-empty">No logs match your search.</td></tr>';
      return;
    }

    tbody.innerHTML = logsToShow
      .map(
        (l) => `
      <tr>
        <td>${escapeHtml(l.timestamp)}</td>
        <td>${escapeHtml(l.service)}</td>
        <td>${escapeHtml(l.event)}</td>
        <td class="log-status--${l.statusClass}">${escapeHtml(l.status)}</td>
      </tr>`,
      )
      .join("");

    const fullBtn = document.getElementById("view-full-logs-btn");
    if (fullBtn) {
      fullBtn.textContent = state.showAllLogs
        ? "Show Preview Logs"
        : `View Full Logs (${state.filteredLogs.length})`;
      fullBtn.disabled = state.filteredLogs.length <= 5;
    }
  }

  function buildCsv(rows) {
    const header = ["Time", "Event Type", "Description", "Module"];
    const data = rows.map((e) => [e.time, e.type, e.desc, e.module]);
    const lines = [header, ...data].map((line) =>
      line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    );
    return lines.join("\n");
  }

  function downloadEventsCsv() {
    const rows = state.filteredEvents;
    if (!rows.length) return;
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "system-events.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function renderHeader() {
    setText("topbar-user-name", session.name || "--");
    const unread = notifications.filter((n) => !n.is_read).length;
    const badge = document.getElementById("notif-badge");
    if (badge) {
      badge.textContent = unread > 0 ? String(unread) : "";
      badge.style.display = unread > 0 ? "flex" : "none";
    }
  }

  function bindInteractions(events, logs) {
    const searchInput = document.getElementById("monitor-search");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        state.query = event.target.value || "";
        applySearch(events, logs);
        renderEventsTable();
        renderLogsTable();
      });
    }

    const fullLogsBtn = document.getElementById("view-full-logs-btn");
    if (fullLogsBtn) {
      fullLogsBtn.addEventListener("click", () => {
        state.showAllLogs = !state.showAllLogs;
        renderLogsTable();
      });
    }

    const csvBtn = document.getElementById("download-events-csv");
    if (csvBtn) {
      csvBtn.addEventListener("click", downloadEventsCsv);
    }
  }

  function initialize() {
    const events = transformEvents();
    const logs = transformLogs();
    const kpis = computeKpiModel();
    const alerts = computeAlerts(events, logs);
    const performanceModel = getPerformanceModelFromMock();

    renderHeader();
    renderKpis(kpis);
    renderPerformance(performanceModel);
    renderAlerts(alerts);

    applySearch(events, logs);
    renderEventsTable();
    renderLogsTable();
    bindInteractions(events, logs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialize();
    });
  } else {
    initialize();
  }
});
