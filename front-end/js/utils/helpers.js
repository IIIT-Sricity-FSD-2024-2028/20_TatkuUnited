/* =============================================================================
   TATKU UNITED — HELPERS UTILITY
   front-end/js/utils/helpers.js
   Depends on: js/data/store.js (AppStore)
   ============================================================================= */

/* ─── Toast Container bootstrap ─── */
function _getToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        Object.assign(container.style, {
            position: "fixed",
            top: "1.25rem",
            right: "1.25rem",
            zIndex: "9999",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            pointerEvents: "none",
        });
        document.body.appendChild(container);
    }
    return container;
}

/* ─── Modal overlay bootstrap ─── */
function _getModalOverlay() {
    let overlay = document.getElementById("modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "modal-overlay";
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.45)",
            zIndex: "10000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = "";
    overlay.style.display = "flex";
    return overlay;
}

function _closeModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.style.display = "none";
}

/* =============================================================================
   formatDate(dateStr)
   "2024-07-01T10:00:00Z" → "Mon, 1 Jul 2024, 10:00 AM"
   ============================================================================= */
function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return "—";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[d.getDay()];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${dayName}, ${date} ${month} ${year}, ${hours}:${mins} ${ampm}`;
}

/* =============================================================================
   formatCurrency(amount)
   1999 → "₹1,999.00"
   ============================================================================= */
function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

/* =============================================================================
   showToast(message, type)
   type: "success" | "error" | "info" | "warning"
   ============================================================================= */
function showToast(message, type = "info") {
    const colors = {
        success: { bg: "#10b981", icon: "✓" },
        error: { bg: "#ef4444", icon: "✕" },
        warning: { bg: "#f59e0b", icon: "⚠" },
        info: { bg: "#0ea5e9", icon: "ℹ" },
    };
    const style = colors[type] || colors.info;
    const container = _getToastContainer();

    const toast = document.createElement("div");
    Object.assign(toast.style, {
        background: style.bg,
        color: "#fff",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        minWidth: "240px",
        maxWidth: "360px",
        fontSize: "0.9rem",
        fontWeight: "500",
        pointerEvents: "auto",
        opacity: "0",
        transform: "translateX(1rem)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
    });

    toast.innerHTML = `<span style="font-size:1rem;flex-shrink:0">${style.icon}</span>
                     <span>${message}</span>`;
    container.appendChild(toast);

    /* Animate in */
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    });

    /* Auto-dismiss after 3 seconds */
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(1rem)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* =============================================================================
   showConfirmDialog(message, onConfirm, onCancel)
   ============================================================================= */
function showConfirmDialog(message, onConfirm, onCancel) {
    /* Support object-style call: showConfirmDialog({ title, message, ... }) */
    let title = "Confirm";
    let confirmLabel = "Confirm";
    let cancelLabel = "Cancel";
    let confirmCb = onConfirm;
    let cancelCb = onCancel;

    if (typeof message === "object" && message !== null) {
        const opts = message;
        title = opts.title || "Confirm";
        message = opts.message || "Are you sure?";
        confirmLabel = opts.confirmLabel || "Confirm";
        cancelLabel = opts.cancelLabel !== undefined ? opts.cancelLabel : "Cancel";
        confirmCb = opts.onConfirm || (() => { });
        cancelCb = opts.onCancel || null;
    }

    const overlay = _getModalOverlay();

    const card = document.createElement("div");
    Object.assign(card.style, {
        background: "#fff",
        borderRadius: "0.75rem",
        padding: "2rem",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontFamily: "inherit",
    });

    const cancelBtn = cancelLabel
        ? `<button id="modal-cancel" style="flex:1;padding:.6rem 1rem;border:1px solid #d1d5db;
         border-radius:.5rem;background:#fff;cursor:pointer;font-size:.9rem;color:#374151;">
         ${cancelLabel}</button>`
        : "";

    card.innerHTML = `
    <h3 style="margin:0 0 .75rem;font-size:1.1rem;color:#111827">${title}</h3>
    <p  style="margin:0 0 1.5rem;font-size:.95rem;color:#374151;line-height:1.5">${message}</p>
    <div style="display:flex;gap:.75rem;justify-content:flex-end">
      ${cancelBtn}
      <button id="modal-confirm" style="flex:1;padding:.6rem 1rem;background:#ef4444;
        color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-size:.9rem;
        font-weight:600">${confirmLabel}</button>
    </div>`;

    overlay.appendChild(card);

    card.querySelector("#modal-confirm").addEventListener("click", () => {
        _closeModal();
        if (typeof confirmCb === "function") confirmCb();
    });

    const cancelEl = card.querySelector("#modal-cancel");
    if (cancelEl) {
        cancelEl.addEventListener("click", () => {
            _closeModal();
            if (typeof cancelCb === "function") cancelCb();
        });
    }
}

/* =============================================================================
   showBlockDialog(message)
   ============================================================================= */
function showBlockDialog(message) {
    const overlay = _getModalOverlay();

    const card = document.createElement("div");
    Object.assign(card.style, {
        background: "#fff",
        borderRadius: "0.75rem",
        padding: "2rem",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontFamily: "inherit",
    });

    card.innerHTML = `
    <h3 style="margin:0 0 .75rem;font-size:1.1rem;color:#b91c1c">⛔ Action Not Allowed</h3>
    <p  style="margin:0 0 1.5rem;font-size:.95rem;color:#374151;line-height:1.5">${message}</p>
    <div style="display:flex;justify-content:flex-end">
      <button id="modal-close" style="padding:.6rem 1.5rem;background:#6b7280;color:#fff;
        border:none;border-radius:.5rem;cursor:pointer;font-size:.9rem;font-weight:600">
        Close</button>
    </div>`;

    overlay.appendChild(card);
    card.querySelector("#modal-close").addEventListener("click", _closeModal);
}

/* =============================================================================
   resolveFk(tableName, idField, idValue, displayField)
   ============================================================================= */
function resolveFk(tableName, idField, idValue, displayField) {
    const table = AppStore.getTable(tableName) || [];
    const record = table.find(r => r[idField] === idValue);
    return record ? (record[displayField] ?? "—") : "—";
}

/* =============================================================================
   renderEmptyState(tbodyId, colSpan, message)
   ============================================================================= */
function renderEmptyState(tbodyId, colSpan, message = "No records found.") {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `
    <tr>
      <td colspan="${colSpan}" style="text-align:center;padding:2.5rem 1rem;
          color:#9ca3af;font-size:.95rem">
        📭 ${message}
      </td>
    </tr>`;
}

/* =============================================================================
   formatScheduledAt(isoStr)
   "Monday, 7 Apr 2026 at 3:00 PM"
   ============================================================================= */
function formatScheduledAt(isoStr) {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    if (isNaN(d)) return "—";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[d.getDay()];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${dayName}, ${date} ${month} ${year} at ${hours}:${mins} ${ampm}`;
}

/* =============================================================================
   getDayName(dateStr)
   "2026-04-07" → "Tuesday"
   ============================================================================= */
function getDayName(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return "—";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d.getDay()];
}

/* =============================================================================
   getTodayDateString()
   Returns "YYYY-MM-DD"
   ============================================================================= */
function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
