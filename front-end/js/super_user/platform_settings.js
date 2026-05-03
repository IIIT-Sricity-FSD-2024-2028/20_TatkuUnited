/* =============================================================================
   PLATFORM SETTINGS — platform_settings.js (API-backed)
   ============================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  const settingFieldMap = {
    maintenance_mode: "maintenance-mode",
    account_suspension: "account-suspension",
    rating_threshold: "rating-threshold",
    instant_booking: "instant-booking",
    max_booking_window_days: "max-advance",
    min_notice_hours: "min-notice",
    cancellation_window_hours: "cancel-window",
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
      
      let val = settings[key];

      if (el.type === "checkbox") {
        // Handle boolean strings from backend
        el.checked = val === true || val === "true";
      } else if (el.tagName === "SELECT") {
        // Find option by value or text
        const options = Array.from(el.options);
        const match = options.find(o => o.value === val || o.textContent.trim() === val);
        if (match) {
          el.value = match.value;
        } else {
          el.value = val;
        }
      } else {
        el.value = val;
      }
    });
  };

  const saveBtn = document.getElementById("save-btn");
  const lastUpdatedEl = document.getElementById("settings-last-updated");
  if (!saveBtn) return;

  const renderLastUpdated = (settings) => {
    if (!lastUpdatedEl) return;

    // Check if settings is the array or a single object
    const lastRow = Array.isArray(settings) ? settings[settings.length - 1] : settings;

    if (!lastRow?.updated_at && !lastRow?.updatedAt) {
      lastUpdatedEl.textContent = "Last updated: Never";
      return;
    }

    const dt = new Date(lastRow.updated_at || lastRow.updatedAt);
    const when = Number.isNaN(dt.getTime())
      ? lastRow.updated_at || lastRow.updatedAt
      : dt.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    const by = lastRow.updated_by || lastRow.updatedBy || "Super User";
    lastUpdatedEl.textContent = `Last updated: ${when} by ${by}`;
  };

  // Load settings from API
  let initialSettings = defaultsFromUI();
  try {
    const apiSettings = await Api.get("/platform-settings");
    if (Array.isArray(apiSettings)) {
      // Transform array of {key, value} to object {key: value}
      const settingsObj = {};
      apiSettings.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      // Also preserve update info from the most recent setting
      const latest = [...apiSettings].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      if (latest) {
        settingsObj.updated_at = latest.updated_at;
        settingsObj.updated_by = latest.updated_by;
      }
      initialSettings = { ...initialSettings, ...settingsObj };
    }
  } catch (_) {
    // Use defaults from UI
  }
  applySettingsToUI(initialSettings);
  renderLastUpdated(initialSettings);

  saveBtn.addEventListener("click", async () => {
    const updatedBy = session?.id || "00000000-0000-0000-0000-000000000000";

    const uiSettings = defaultsFromUI();
    const settingsToSave = Object.entries(uiSettings);

    try {
      let lastSaved = null;
      for (const [key, value] of settingsToSave) {
        lastSaved = await Api.put("/platform-settings/" + key, {
          value: String(value),
          description: `Platform setting: ${key}`,
          updated_by: updatedBy,
        });
      }
      renderLastUpdated(lastSaved || settings);

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
