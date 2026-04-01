/* platform_settings.js */
document.addEventListener("DOMContentLoaded", () => {
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

  const readSettings = () => {
    if (window.AppStore && typeof AppStore.getPlatformSettings === "function") {
      return AppStore.getPlatformSettings();
    }
    return defaultsFromUI();
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

  const saveSettings = (settings) => {
    if (
      window.AppStore &&
      typeof AppStore.savePlatformSettings === "function"
    ) {
      return AppStore.savePlatformSettings(settings);
    }
    try {
      localStorage.setItem("fsd_platform_settings", JSON.stringify(settings));
    } catch (_) {}
    return settings;
  };

  const saveBtn = document.getElementById("save-btn");
  const lastUpdatedEl = document.getElementById("settings-last-updated");
  if (!saveBtn) return;

  const renderLastUpdated = (settings) => {
    if (!lastUpdatedEl) return;

    if (!settings?.updatedAt) {
      lastUpdatedEl.textContent = "Last updated: Never";
      return;
    }

    const dt = new Date(settings.updatedAt);
    const when = Number.isNaN(dt.getTime())
      ? settings.updatedAt
      : dt.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    const by = settings.updatedBy || "Super User";
    lastUpdatedEl.textContent = `Last updated: ${when} by ${by}`;
  };

  const initialSettings = readSettings();
  applySettingsToUI(initialSettings);
  renderLastUpdated(initialSettings);

  // Ensure first open seeds the settings key and AppStore copy.
  saveSettings(initialSettings);

  saveBtn.addEventListener("click", () => {
    const session =
      window.Auth && typeof Auth.getSession === "function"
        ? Auth.getSession()
        : null;
    const updatedBy = session?.name || "Super User";

    const settings = {
      ...defaultsFromUI(),
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    const savedSettings = saveSettings(settings);
    renderLastUpdated(savedSettings);

    console.log("Settings saved:", savedSettings);

    // Visual feedback
    saveBtn.textContent = "✓ Saved!";
    saveBtn.style.background = "#16a34a";
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
