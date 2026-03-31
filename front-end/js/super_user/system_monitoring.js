/* system_monitoring.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allPlatformEvents = AppStore.getTable("super_user_platform_events") || [];
  const allAuditLogs = AppStore.getTable("super_user_audit_logs") || [];

  /* ── 3. Transform platform events ── */
  function transformEvents(events) {
    return events.slice(0, 3).map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type:
        e.event_type === "security"
          ? "Security Issue"
          : e.event_type === "system"
            ? "Provider Registration"
            : e.event_type === "user"
              ? "Account Suspension"
              : "Assignment Failure",
      typeClass:
        e.severity === "critical"
          ? "red"
          : e.severity === "high"
            ? "orange"
            : e.severity === "medium"
              ? "yellow"
              : "green",
      desc: e.title,
      module: e.component || "System",
    }));
  }

  /* ── 4. Transform audit logs ── */
  function transformLogs(logs) {
    return logs.slice(0, 3).map((l) => ({
      timestamp: new Date(l.timestamp).toLocaleString("en-IN"),
      service: l.component || "Service",
      event: l.action_description,
      status: l.status_code || l.status.toUpperCase(),
      statusClass:
        l.status === "success"
          ? "ok"
          : l.status === "pending"
            ? "delivered"
            : "error",
    }));
  }

  const EVENTS = transformEvents(allPlatformEvents);
  const LOGS = transformLogs(allAuditLogs);
  const API_BAR_HEIGHTS = [30, 40, 28, 45, 38, 52, 35, 42, 55, 60, 70, 100];

  /* ── 5. Render functions ── */
  function renderApiBars() {
    const container = document.getElementById("api-bars");
    if (!container) return;
    container.innerHTML = API_BAR_HEIGHTS.map((h, i) => {
      const isLast = i === API_BAR_HEIGHTS.length - 1;
      return `<div class="api-bar ${isLast ? "api-bar--active" : ""}" style="height:${h}%"></div>`;
    }).join("");
  }

  function renderEvents() {
    const tbody = document.getElementById("events-tbody");
    if (!tbody) return;
    tbody.innerHTML = EVENTS.map(
      (e) => `
      <tr>
        <td>${e.time}</td>
        <td><span class="ev-type-badge ev-type-badge--${e.typeClass}">${e.type}</span></td>
        <td>${e.desc}</td>
        <td>${e.module}</td>
      </tr>
    `,
    ).join("");
  }

  function renderLogs() {
    const tbody = document.getElementById("logs-tbody");
    if (!tbody) return;
    tbody.innerHTML = LOGS.map(
      (l) => `
      <tr>
        <td>${l.timestamp}</td>
        <td>${l.service}</td>
        <td>${l.event}</td>
        <td class="log-status--${l.statusClass}">${l.status}</td>
      </tr>
    `,
    ).join("");
  }

  /* ── 6. Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderApiBars();
      renderEvents();
      renderLogs();
    });
  } else {
    renderApiBars();
    renderEvents();
    renderLogs();
  }
});
