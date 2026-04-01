function getCustomerSessionId() {
  const session = Auth.getSession();
  return session && session.role === "customer" ? session.id : null;
}
function getCart() {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

/* ── These must be in global scope for onclick handlers in HTML ── */
let bookings = [];
let activeFilter = "All";
let sortDesc = true;
let reschedulingBookingId = null;

function getBookingRules() {
  if (!window.AppStore || typeof AppStore.getBookingRules !== "function") {
    return {
      maxAdvanceDays: 7,
      cancelWindowLabel: "2 hours",
      maxAdvanceLabel: "7 days",
    };
  }
  return AppStore.getBookingRules();
}

function toggleSort() {
  sortDesc = !sortDesc;
  document.getElementById("sort-label").textContent = sortDesc
    ? "Sort: Newest"
    : "Sort: Oldest";
  renderBookings();
}

const badgeMap = {
  upcoming: "badge-upcoming",
  inprogress: "badge-inprogress",
  completed: "badge-completed",
  pending: "badge-pending",
  cancelled: "badge-cancelled",
  assigned: "badge-assigned",
};
const filters = [
  "All",
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

function renderFilters() {
  document.getElementById("filter-tabs").innerHTML = filters
    .map(
      (f) =>
        `<button class="filter-tab ${f === activeFilter ? "active" : ""}" onclick="setFilter('${f}')">${f}</button>`,
    )
    .join("");
}
function setFilter(f) {
  activeFilter = f;
  renderFilters();
  renderBookings();
}

function renderBookings() {
  let filtered =
    activeFilter === "All"
      ? bookings
      : bookings.filter(
          (b) =>
            b.statusLabel === activeFilter ||
            b.status === activeFilter.toLowerCase().replace(" ", ""),
        );

  const startVal = document.getElementById("filter-start")?.value;
  const endVal = document.getElementById("filter-end")?.value;

  if (startVal) {
    const sDate = new Date(startVal);
    sDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((b) => new Date(b.rawDateISO) >= sDate);
  }

  if (endVal) {
    const eDate = new Date(endVal);
    eDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((b) => new Date(b.rawDateISO) <= eDate);
  }

  filtered.sort((a, b) => {
    const d1 = new Date(a.rawDateISO).getTime();
    const d2 = new Date(b.rawDateISO).getTime();
    return sortDesc ? d2 - d1 : d1 - d2;
  });
  if (filtered.length === 0) {
    document.getElementById("bookings-list").innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 4rem 1rem; color: var(--text-2);">
        <svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:currentColor;fill:none;stroke-width:1;margin:0 auto 1rem;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <h3 style="margin-bottom:0.5rem;color:var(--text-1)">No bookings found</h3>
        <p>You don't have any bookings matching this filter.</p>
      </div>
    `;
    document.getElementById("pagination").innerHTML = "";
    return;
  }
  document.getElementById("bookings-list").innerHTML = filtered
    .map(
      (b, i) => `
    <div class="booking-row ${b.status === "cancelled" ? "cancelled" : ""}" style="animation-delay:${i * 0.06}s" onclick="openDrawer('${b.id}')">
      <div class="booking-row-icon" style="background:${b.iconBg}">${b.icon}</div>
      <div class="booking-row-body">
        <div class="booking-row-top">
          <span class="booking-row-name">${b.name}</span>
          <span class="booking-badge ${badgeMap[b.status]}">${b.statusLabel}</span>
        </div>
        <div class="booking-row-meta">
          <div class="booking-meta-item">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${b.provider}
          </div>
          ${
            b.liveStatus
              ? `<div class="booking-meta-item live"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${b.liveStatus}</div>`
              : `<div class="booking-meta-item"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${b.date} • ${b.time}</div>`
          }
        </div>
      </div>
      <div class="booking-row-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
    </div>
  `,
    )
    .join("");

  document.getElementById("pagination").innerHTML = `
    <button class="page-btn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
    <button class="page-btn active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <button class="page-btn">…</button>
    <button class="page-btn">6</button>
    <button class="page-btn"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
  `;
}

function openDrawer(id) {
  const b = bookings.find((x) => x.id === id);
  if (!b) return;
  const actionBtns = {
    review: `<button class="drawer-btn drawer-btn-review" onclick="window.location='review.html?bookingId=${b.id}'">⭐ Leave a Review</button>`,
    invoice: `<button class="drawer-btn drawer-btn-outline" onclick="downloadBookingReceipt('${b.id}')">Download Receipt</button>`,
    rebook: `<button class="drawer-btn drawer-btn-orange" onclick="window.location='schedule.html?service=${encodeURIComponent(b.name)}&price=${encodeURIComponent(b.price)}'">Rebook This Service</button>`,
    reschedule: `<button class="drawer-btn drawer-btn-outline" onclick="openRescheduleModal('${b.id}')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Reschedule</button>`,
    cancel: `<button class="drawer-btn drawer-btn-danger" onclick="cancelBooking('${b.id}')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px;stroke:currentColor;fill:none;stroke-width:2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Cancel Service</button>`,
  };

  document.getElementById("drawer-content").innerHTML = `
    <div class="drawer-badge-row"><span class="booking-badge ${badgeMap[b.status]}">${b.statusLabel}</span></div>
    <div class="drawer-title">${b.name}</div>
    <div class="drawer-id">Booking #${b.id}</div>
    <div class="drawer-service-card">
      <div class="drawer-service-icon" style="background:${b.iconBg}">${b.icon}</div>
      <div>
        <div class="drawer-service-name">${b.name}</div>
        <div class="drawer-service-provider">Provider: <strong>${b.provider}</strong></div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">Service Details</div>
      <div class="drawer-grid">
        <div class="drawer-field"><label>Category</label><p>${b.category}</p></div>
        <div class="drawer-field"><label>Duration</label><p>${b.duration}</p></div>
        <div class="drawer-field"><label>Scheduled Date</label><p>${b.date}</p></div>
        <div class="drawer-field"><label>Scheduled Time</label><p>${b.time}</p></div>
        <div class="drawer-field"><label>Amount</label><p>${b.price}</p></div>
        <div class="drawer-field"><label>Location</label><p style="font-size:13px">${b.address}</p></div>
      </div>
    </div>
    <div class="drawer-divider"></div>
    <div class="drawer-section">
      <div class="drawer-section-title">Description</div>
      <p style="font-size:13.5px;color:var(--text-2);line-height:1.6">${b.description}</p>
    </div>
    <div class="drawer-divider"></div>
    <div class="drawer-section">
      <div class="drawer-section-title">Booking Timeline</div>
      <div class="status-timeline">
        ${b.timeline
          .map(
            (step, i) => `
          <div class="status-step">
            <div class="status-step-left">
              <div class="status-dot ${step.done ? "done" : ""}">${step.done ? `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>` : ""}</div>
              ${i < b.timeline.length - 1 ? `<div class="status-line ${step.done ? "done" : ""}"></div>` : ""}
            </div>
            <div class="status-step-body"><div class="status-step-label">${step.label}</div><div class="status-step-sub">${step.sub}</div></div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    <div class="drawer-divider"></div>
    ${b.provider && b.provider !== "Awaiting assignment" ? `
    <div class="drawer-section">
      <div class="drawer-section-title">Service Provider</div>
      <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14.5px;color:#1e293b;">${b.provider}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:#64748b;fill:none;stroke-width:2"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.1 5.18 2 2 0 015.09 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17v-.08z"/></svg>
            <span style="font-size:13px;color:#475569;font-weight:500;">${b.providerPhone || 'Not available'}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="drawer-divider"></div>
    ` : ''}
    <div class="drawer-section">${b.actions.map((a) => actionBtns[a] || "").join("")}</div>
  `;
  document.getElementById("drawer-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function formatReceiptCurrency(value) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value || "").replace(/[^\d.]/g, ""));
  const amount = Number.isFinite(numericValue) ? numericValue : 0;
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatReceiptPaymentMethod(method) {
  if (method === "upi") return "UPI";
  if (method === "cash") return "Cash on Service";
  if (method === "card") return "Credit / Debit Card";
  if (typeof method === "string" && method.trim()) {
    return method
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "Recorded at checkout";
}

function getBookingReceiptContext(bookingId) {
  const allBookings = (window.AppStore && AppStore.getTable("bookings")) || [];
  const booking = allBookings.find((item) => item.booking_id === bookingId);
  if (!booking) return null;

  const allServices = (window.AppStore && AppStore.getTable("services")) || [];
  const bookingServices =
    (window.AppStore && AppStore.getTable("booking_services")) || [];
  const serviceRows = bookingServices.filter(
    (item) => item.booking_id === bookingId,
  );
  const serviceNames = serviceRows
    .map((item) => {
      const service = allServices.find(
        (entry) => entry.service_id === item.service_id,
      );
      return service ? service.service_name : null;
    })
    .filter(Boolean);

  const checkoutMeta =
    window.CustomerState && typeof CustomerState.getCheckoutMeta === "function"
      ? CustomerState.getCheckoutMeta(booking.customer_id)
      : null;
  const paymentMethod =
    checkoutMeta && checkoutMeta.last_booking_id === bookingId
      ? checkoutMeta.last_payment_method
      : null;

  const amountFromBooking =
    typeof booking.price === "number"
      ? booking.price
      : serviceRows.reduce(
          (sum, item) => sum + (Number(item.price_at_booking) || 0),
          0,
        );

  return {
    bookingId,
    serviceName:
      serviceNames.join(", ") ||
      booking.service_name ||
      "Home Services Booking",
    totalAmount: formatReceiptCurrency(amountFromBooking),
    paymentMethod: formatReceiptPaymentMethod(paymentMethod),
    transactionDate: new Date(
      booking.created_at || Date.now(),
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

function downloadBookingReceipt(bookingId) {
  const context = getBookingReceiptContext(bookingId);
  if (!context) {
    showToast("Unable to load receipt details.", "error");
    return;
  }

  const content = [
    "===================================",
    "      TATKU UNITED — RECEIPT",
    "===================================",
    "",
    `Booking ID      : #${context.bookingId}`,
    `Service         : ${context.serviceName}`,
    `Amount Paid     : ${context.totalAmount}`,
    `Payment Method  : ${context.paymentMethod}`,
    `Transaction Date: ${context.transactionDate}`,
    "Status          : PAID ✓",
    "",
    "===================================",
    "  Tatku United Inc. © 2026",
    "  support@tatkuunited.com",
    "===================================",
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${context.bookingId}-receipt.txt`;
  link.click();
  URL.revokeObjectURL(url);

  showToast("Receipt downloaded successfully.", "success");
}
function closeDrawerBtn() {
  document.getElementById("drawer-overlay").classList.remove("open");
  document.body.style.overflow = "";
}
function closeDrawer(e) {
  if (e.target === document.getElementById("drawer-overlay")) closeDrawerBtn();
}

function cancelBooking(id) {
  const b = bookings.find((x) => x.id === id);
  if (!b) return;

  const canCancel =
    window.AppStore && typeof AppStore.canCancelScheduledBooking === "function"
      ? AppStore.canCancelScheduledBooking(b.rawDateISO)
      : { valid: true };

  if (!canCancel.valid) {
    showToast(canCancel.error, "error");
    return;
  }

  // Cascade cancellation to provider (job_assignment + notification)
  if (window.AssignmentEngine && typeof AssignmentEngine.cancelAssignment === "function") {
    AssignmentEngine.cancelAssignment(id);
  }

  CRUD.updateRecord("bookings", "booking_id", id, { status: "CANCELLED" });
  closeDrawerBtn();
  loadBookings();
  showToast("Booking cancelled successfully.", "success");
}

// ===== RESCHEDULE MODAL =====
function getDateConstraints() {
  const rules = getBookingRules();
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + rules.maxAdvanceDays);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { min: fmt(today), max: fmt(maxDate) };
}

function openRescheduleModal(bookingId) {
  reschedulingBookingId = bookingId;
  const b = bookings.find((x) => x.id === bookingId);
  if (!b) return;
  document.getElementById("reschedule-service-name").textContent =
    b.name + " (#" + b.id + ")";
  const dateInput = document.getElementById("reschedule-date");
  const { min, max } = getDateConstraints();
  dateInput.min = min;
  dateInput.max = max;
  dateInput.value = "";
  document.getElementById("reschedule-time").value = "";
  document.getElementById("reschedule-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeRescheduleModalBtn() {
  document.getElementById("reschedule-modal").classList.remove("open");
  document.body.style.overflow = "";
  reschedulingBookingId = null;
}
function closeRescheduleModal(e) {
  if (e.target === document.getElementById("reschedule-modal"))
    closeRescheduleModalBtn();
}

function saveReschedule() {
  if (!reschedulingBookingId) return;
  const newDate = document.getElementById("reschedule-date").value;
  const newTime = document.getElementById("reschedule-time").value;

  const validation =
    window.AppStore && typeof AppStore.validateScheduledSlot === "function"
      ? AppStore.validateScheduledSlot(newDate, newTime)
      : { valid: !!newDate && !!newTime, error: "Please select date/time." };

  if (!validation.valid) {
    showToast(validation.error, "error");
    return;
  }

  const dateTimeISO = validation.scheduledAt;
  CRUD.updateRecord("bookings", "booking_id", reschedulingBookingId, {
    scheduled_at: dateTimeISO,
  });

  closeRescheduleModalBtn();
  closeDrawerBtn();
  loadBookings();
  showToast("Booking rescheduled successfully", "success");
}

let currentSession = null;

function loadBookings() {
  if (!currentSession) return;
  const allBookings = AppStore.getTable("bookings") || [];
  bookings = allBookings
    .filter((b) => b.customer_id === currentSession.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((b) => {
      const dateObj = new Date(b.scheduled_at);
      const rawStatus = (b.status || "PENDING").toUpperCase();

      const statusMap = {
        PENDING: { label: "Pending", css: "pending", badge: "badge-pending" },
        ASSIGNED: {
          label: "Assigned",
          css: "assigned",
          badge: "badge-assigned",
        },
        IN_PROGRESS: {
          label: "In Progress",
          css: "inprogress",
          badge: "badge-inprogress",
        },
        COMPLETED: {
          label: "Completed",
          css: "completed",
          badge: "badge-completed",
        },
        CANCELLED: {
          label: "Cancelled",
          css: "cancelled",
          badge: "badge-cancelled",
        },
      };
      const sObj = statusMap[rawStatus] || statusMap["PENDING"];

      let actions = [];
      if (rawStatus === "PENDING") actions = ["reschedule", "cancel"];
      else if (rawStatus === "ASSIGNED") actions = ["reschedule", "cancel"];
      else if (rawStatus === "IN_PROGRESS") actions = ["cancel"];
      else if (rawStatus === "COMPLETED")
        actions = ["invoice", "review", "rebook"];
      else if (rawStatus === "CANCELLED") actions = ["rebook"];

      const allProviders = AppStore.getTable("service_providers") || [];

      let providerName = "Awaiting assignment";
      let providerPhone = null;
      if (b.provider_id) {
        const found = allProviders.find(
          (p) => p.service_provider_id === b.provider_id,
        );
        providerName = found ? found.name : "Tatku Provider";
        providerPhone = found ? found.phone : null;
      } else if (["COMPLETED", "IN_PROGRESS", "ASSIGNED"].includes(rawStatus)) {
        providerName = "Tatku Professional";
      }

      const providerTimelineSub =
        rawStatus === "CANCELLED"
          ? "by customer"
          : providerName !== "Awaiting assignment"
            ? "Provider Assigned"
            : "Awaiting assignment";
      const providerTimelineDone = rawStatus !== "PENDING";
      const isEnded = ["COMPLETED", "CANCELLED"].includes(rawStatus);

      return {
        id: b.booking_id,
        status: sObj.css,
        statusLabel: sObj.label,
        name: b.service_name || "Home Service",
        category: "Service",
        provider: providerName,
        providerPhone: providerPhone,
        liveStatus:
          rawStatus === "IN_PROGRESS" ? "Job in progress/tracked" : null,
        rawDateISO: b.scheduled_at,
        date: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        address: b.service_address || "Address not provided",
        price: "₹" + (b.price || "0").toLocaleString("en-IN"),
        duration: "2 hours",
        description:
          "Service booked on " + new Date(b.created_at).toLocaleDateString(),
        iconBg: "#eff6ff",
        icon: `<svg viewBox="0 0 24 24" style="stroke:#3b82f6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
        timeline: [
          {
            label: "Booking Placed",
            sub: new Date(b.created_at).toLocaleDateString(),
            done: true,
          },
          {
            label:
              rawStatus === "CANCELLED" ? "Cancelled" : "Provider Assigned",
            sub: providerTimelineSub,
            done: providerTimelineDone,
          },
          {
            label: "Service Completed",
            sub: rawStatus === "COMPLETED" ? "Delivered" : "—",
            done: rawStatus === "COMPLETED",
          },
        ],
        actions: actions,
      };
    });
  renderFilters();
  renderBookings();
  updateCartBadge();
}

AppStore.ready.then(() => {
  currentSession = Auth.requireSession(["customer"]);
  if (!currentSession) return;
  loadBookings();
});
