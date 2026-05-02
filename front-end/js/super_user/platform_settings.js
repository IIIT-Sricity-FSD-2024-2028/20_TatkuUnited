/* =============================================================================
   PLATFORM SETTINGS — platform_settings.js (API-backed)
   ============================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  const settingFieldMap = {
    maintenanceMode: "maintenance-mode",
    accountSuspension: "account-suspension",
    ratingThreshold: "rating-threshold",
    instantBooking: "instant-booking",
    maxAdvance: "max-advance",
    minNotice: "min-notice",
    cancelWindow: "cancel-window",
  };

  const defaultsFromUI = () => {
    const out = {};
    Object.entries(settingFieldMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      out[key] = el.type === "checkbox" ? !!el.checked : el.value;
    });
    return out;
  };

  const applySettingsToUI = (settings) => {
    Object.entries(settingFieldMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el || settings[key] === undefined || settings[key] === null) return;
      if (el.type === "checkbox") {
        el.checked = !!settings[key];
      } else {
        el.value = settings[key];
      }
    });
  };

  const saveBtn = document.getElementById("save-btn");
  const lastUpdatedEl = document.getElementById("settings-last-updated");
  if (!saveBtn) return;

  const renderLastUpdated = (settings) => {
    if (!lastUpdatedEl) return;

    if (!settings?.updatedAt && !settings?.updated_at) {
      lastUpdatedEl.textContent = "Last updated: Never";
      return;
    }

    const dt = new Date(settings.updatedAt || settings.updated_at);
    const when = Number.isNaN(dt.getTime())
      ? settings.updatedAt || settings.updated_at
      : dt.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    const by = settings.updatedBy || settings.updated_by || "Super User";
    lastUpdatedEl.textContent = `Last updated: ${when} by ${by}`;
  };

  // Load settings from API
  let initialSettings = defaultsFromUI();
  try {
    const apiSettings = await Api.get("/platform-settings");
    if (apiSettings) {
      initialSettings = { ...initialSettings, ...apiSettings };
    }
  } catch (_) {
    // Use defaults from UI
  }
  applySettingsToUI(initialSettings);
  renderLastUpdated(initialSettings);

  saveBtn.addEventListener("click", async () => {
    const updatedBy = session?.name || "Super User";

    const settings = {
      ...defaultsFromUI(),
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    try {
      const savedSettings = await Api.put("/platform-settings", settings);
      renderLastUpdated(savedSettings || settings);

      // Visual feedback
      saveBtn.textContent = "✓ Saved!";
      saveBtn.style.background = "#16a34a";
      Api.showToast("Platform settings updated successfully.", "success");
    } catch (err) {
      console.error("[settings] Save failed:", err);
      saveBtn.textContent = "✕ Failed";
      saveBtn.style.background = "#ef4444";
    }

    setTimeout(() => {
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save Changes`;
      saveBtn.style.background = "";
    }, 2000);
  });
});
