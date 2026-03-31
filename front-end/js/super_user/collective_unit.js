/* collective_unit.js */
// Depends on: store.js → auth.js (loaded before this script)

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull tables ── */
  const allUnits = AppStore.getTable("units") || [];
  const allCollectives = AppStore.getTable("collectives") || [];
  const allProviders = AppStore.getTable("service_providers") || [];

  /* ── 3. Group units by collective ── */
  function groupUnitsByCollective() {
    const grouped = {};
    allCollectives.forEach((col, idx) => {
      const collectiveKey = col.collective_name.split(" ")[0]; // First word
      const unitsForCollective = allUnits
        .filter((u) => u.collective_id === col.collective_id)
        .slice(0, 2);
      grouped[collectiveKey.toUpperCase()] = unitsForCollective.map((u) => ({
        name: u.unit_name,
        providers: allProviders.filter((p) => p.unit_id === u.unit_id).length,
        mgr: `Mgr ${idx + 1}`,
      }));
    });
    return grouped;
  }

  const groupedUnits = groupUnitsByCollective();
  const BANGALORE_UNITS = groupedUnits["NORTH"] || [];
  const CHENNAI_UNITS = groupedUnits["CENTRAL"] || [];

  /* ── 4. Transform providers ── */
  function transformProviders() {
    const statusMap = ["available", "onjob", "offline"];
    const colors = ["#2563eb", "#854d0e", "#15803d"];
    const bgs = ["#eff6ff", "#fef9c3", "#f0fdf4"];

    return allProviders.slice(0, 3).map((p, i) => {
      const initials = p.name
        .split(" ")
        .map((n) => n[0])
        .join("");
      const skills = ["Plumbing", "Electrical", "HVAC Specialist"];
      const status = statusMap[i % statusMap.length];
      const statusLabels = {
        available: "AVAILABLE",
        onjob: "ON JOB",
        offline: "OFFLINE",
      };
      const actionTypes = ["reassign", "reassign", "assign"];

      return {
        initials: initials,
        bg: bgs[i],
        color: colors[i],
        name: p.name,
        id: `ID: ${p.service_provider_id}`,
        skill: skills[i],
        rating: (5 - Math.random() * 0.5).toFixed(1),
        status: status,
        statusLabel: statusLabels[status],
        actionType: actionTypes[i],
      };
    });
  }

  const PROVIDERS = transformProviders();

  /* ── 5. Render functions ── */
  function renderUnits(units, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = units
      .map(
        (u) => `
      <div class="unit-row">
        <span class="unit-arrow">›</span>
        <span class="unit-name">${u.name}</span>
        <span class="unit-providers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
          ${u.providers} Providers
        </span>
        <span class="unit-mgr">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/></svg>
          Mgr: ${u.mgr}
        </span>
        <a href="#" class="view-providers-link">View<br/>Providers</a>
        <button class="edit-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    `,
      )
      .join("");
  }

  function starHTML(rating) {
    const full = Math.round(rating);
    return Array.from(
      { length: 5 },
      (_, i) =>
        `<span class="star" style="color:${i < full ? "#f59e0b" : "#d1d5db"}">★</span>`,
    ).join("");
  }

  function renderProviders() {
    const tbody = document.getElementById("providers-tbody");
    if (!tbody) return;
    tbody.innerHTML = PROVIDERS.map(
      (p) => `
      <tr>
        <td>
          <div class="prov-cell">
            <div class="prov-avatar" style="background:${p.bg};color:${p.color}">${p.initials}</div>
            <div>
              <div class="prov-name">${p.name}</div>
              <div class="prov-id">${p.id}</div>
            </div>
          </div>
        </td>
        <td>${p.skill}</td>
        <td>
          <div class="rating-cell">
            ${starHTML(p.rating)}
            <span class="rating-num">${p.rating}</span>
          </div>
        </td>
        <td><span class="prov-status prov-status--${p.status}">${p.statusLabel}</span></td>
        <td>
          <div class="action-row">
            <button class="remove-link">Remove Provider</button>
            ${
              p.actionType === "reassign"
                ? `<button class="reassign-btn">Reassign</button>`
                : `<button class="assign-btn">Assign Provider</button>`
            }
          </div>
        </td>
      </tr>
    `,
    ).join("");
  }

  /* ── 6. Initialize on DOM ready ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderUnits(BANGALORE_UNITS, "bangalore-units");
      renderUnits(CHENNAI_UNITS, "chennai-units");
      renderProviders();
    });
  } else {
    renderUnits(BANGALORE_UNITS, "bangalore-units");
    renderUnits(CHENNAI_UNITS, "chennai-units");
    renderProviders();
  }
});
