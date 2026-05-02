/* =============================================================================
   TATKU UNITED — ASSIGNMENT ENGINE — API-backed
   front-end/js/modules/assignmentEngine.js
   ============================================================================= */

window.AssignmentEngine = (() => {
  "use strict";

  const CUSTOMER_NOTIFS_PREFIX = "fsd_customer_notifs_";
  const PROVIDER_NOTIFS_PREFIX = "fsd_provider_notifs_";
  const FALLBACK_RATING = 4.73;

  /* =========================================================================
     HELPERS
     ========================================================================= */

  async function _resolveServiceId(serviceName) {
    if (!serviceName) return null;
    try {
      const services = await Api.get("/services", { silent: true }) || [];
      const normalised = String(serviceName).trim().toLowerCase();
      const found = services.find(s => String(s.service_name || "").trim().toLowerCase() === normalised);
      return found ? found.service_id : null;
    } catch (_) { return null; }
  }

  async function _getRequiredSkills(serviceId) {
    if (!serviceId) return [];
    try {
      const serviceSkills = await Api.get("/service-skills", { silent: true }) || [];
      return serviceSkills.filter(ss => ss.service_id === serviceId).map(ss => ss.skill_id);
    } catch (_) { return []; }
  }

  async function _getActiveProviderIdsForSkills(requiredSkillIds) {
    if (!requiredSkillIds.length) return [];
    try {
      const providerSkills = await Api.get("/provider-skills", { silent: true }) || [];
      const providers = await Api.get("/service-providers", { silent: true }) || [];
      const activeProviderIds = new Set(providers.filter(p => p.is_active === true).map(p => p.service_provider_id));
      const matchedProviderIds = new Set();
      providerSkills.forEach(ps => {
        if (activeProviderIds.has(ps.service_provider_id) && requiredSkillIds.includes(ps.skill_id)) {
          matchedProviderIds.add(ps.service_provider_id);
        }
      });
      return Array.from(matchedProviderIds);
    } catch (_) { return []; }
  }

  async function _rankProviders(providerIds) {
    try {
      const providers = await Api.get("/service-providers", { silent: true }) || [];
      return providerIds
        .map(id => providers.find(p => p.service_provider_id === id))
        .filter(Boolean)
        .sort((a, b) => {
          const rA = typeof a.rating === "number" && a.rating !== null ? a.rating : FALLBACK_RATING;
          const rB = typeof b.rating === "number" && b.rating !== null ? b.rating : FALLBACK_RATING;
          if (rB !== rA) return rB - rA;
          return new Date(a.created_at) - new Date(b.created_at);
        });
    } catch (_) { return []; }
  }

  /* =========================================================================
     0. SERVICE AVAILABILITY AUDIT
     ========================================================================= */

  async function auditServiceAvailability() {
    try {
      const services = await Api.get("/services", { silent: true }) || [];
      const serviceSkills = await Api.get("/service-skills", { silent: true }) || [];
      const providerSkills = await Api.get("/provider-skills", { silent: true }) || [];
      const providers = await Api.get("/service-providers", { silent: true }) || [];

      const activeProviderIds = new Set(providers.filter(p => p.is_active === true).map(p => p.service_provider_id));
      const coveredSkillIds = new Set();
      providerSkills.forEach(ps => { if (activeProviderIds.has(ps.service_provider_id)) coveredSkillIds.add(ps.skill_id); });

      for (const service of services) {
        const requiredSkills = serviceSkills.filter(ss => ss.service_id === service.service_id).map(ss => ss.skill_id);
        if (requiredSkills.length === 0) continue;
        const hasProvider = requiredSkills.some(skillId => coveredSkillIds.has(skillId));
        try { await Api.patch("/services/" + service.service_id, { is_available: hasProvider }); } catch (_) {}
      }
    } catch (err) {
      console.warn("[AssignmentEngine] auditServiceAvailability failed:", err);
    }
  }

  /* =========================================================================
     1. ASSIGN PROVIDER FOR BOOKING
     ========================================================================= */

  async function assignProviderForBooking(bookingId) {
    try {
      const bookings = await Api.get("/bookings", { silent: true }) || [];
      const booking = bookings.find(b => b.booking_id === bookingId);
      if (!booking) return { success: false, reason: "Booking not found: " + bookingId };

      const serviceId = await _resolveServiceId(booking.service_name);
      if (!serviceId) return { success: false, reason: "Could not resolve service_id for: " + (booking.service_name || "") };

      const requiredSkills = await _getRequiredSkills(serviceId);
      if (!requiredSkills.length) return { success: false, reason: "No skill requirements defined for service: " + serviceId };

      const matchedProviderIds = await _getActiveProviderIdsForSkills(requiredSkills);
      if (!matchedProviderIds.length) return { success: false, reason: "No active provider found with required skills" };

      const ranked = await _rankProviders(matchedProviderIds);
      const bestProvider = ranked[0];
      if (!bestProvider) return { success: false, reason: "Provider ranking failed" };

      const nowIso = new Date().toISOString();
      const scheduledDate = booking.scheduled_at ? booking.scheduled_at.split("T")[0] : new Date().toISOString().split("T")[0];

      let hourStart = "10:00", hourEnd = "12:00";
      if (booking.scheduled_at) {
        const d = new Date(booking.scheduled_at);
        if (!isNaN(d.getTime())) {
          hourStart = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
          const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
          hourEnd = String(endD.getHours()).padStart(2, "0") + ":" + String(endD.getMinutes()).padStart(2, "0");
        }
      }

      // Create job_assignment via API
      const jobAssignment = await Api.post("/job-assignments", {
        scheduled_date: scheduledDate,
        hour_start: hourStart,
        hour_end: hourEnd,
        status: "ASSIGNED",
        booking_id: bookingId,
        service_provider_id: bestProvider.service_provider_id,
      });
      const assignmentId = jobAssignment.assignment_id;

      // Update booking status
      await Api.patch("/bookings/" + bookingId, {
        status: "ASSIGNED",
        provider_id: bestProvider.service_provider_id,
      });

      // Create customer notification (localStorage-based)
      _addCustomerNotification(booking.customer_id, {
        id: Date.now(),
        type: "assignment",
        bookingId: bookingId,
        providerId: bestProvider.service_provider_id,
        serviceName: booking.service_name || "Service",
        title: "A service provider has been assigned to your request.",
        message: bestProvider.name + " has been assigned to your " + (booking.service_name || "service") + " booking.",
        createdAt: nowIso,
        dismissed: false,
      });

      // Create provider notification (localStorage-based)
      _addProviderNotification(bestProvider.service_provider_id, {
        id: Date.now() + 1, type: "job", category: "Jobs", unread: true,
        title: "You have been assigned a new job.",
        time: "Just now",
        desc: "You have been assigned to " + (booking.service_name || "a service") + " booking. Please check your schedule.",
        bookingId: bookingId, assignmentId: assignmentId, createdAt: nowIso,
        actions: [{ label: "View Job Details", cls: "btn-primary-action", href: "assigned-jobs.html" }, { label: "Dismiss", cls: "btn-dismiss", action: "dismiss" }],
      });

      _invalidateProviderState(bestProvider.service_provider_id);

      return { success: true, providerId: bestProvider.service_provider_id, assignmentId: assignmentId };
    } catch (err) {
      console.error("[AssignmentEngine] assignProviderForBooking failed:", err);
      return { success: false, reason: err.message || "Assignment failed" };
    }
  }

  /* =========================================================================
     CUSTOMER NOTIFICATIONS (localStorage)
     ========================================================================= */
  function _addCustomerNotification(customerId, notification) {
    if (!customerId) return;
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    let notifs = [];
    try { notifs = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { notifs = []; }
    notifs.unshift(notification);
    localStorage.setItem(key, JSON.stringify(notifs));
  }

  function getCustomerNotifications(customerId) {
    if (!customerId) return [];
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    try { return JSON.parse(localStorage.getItem(key) || "[]").filter(n => !n.dismissed); } catch (_) { return []; }
  }

  function dismissCustomerNotification(customerId, notifId) {
    if (!customerId) return;
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    try { let notifs = JSON.parse(localStorage.getItem(key) || "[]"); notifs = notifs.map(n => { if (n.id === notifId) n.dismissed = true; return n; }); localStorage.setItem(key, JSON.stringify(notifs)); } catch (_) {}
  }

  /* =========================================================================
     PROVIDER NOTIFICATIONS (localStorage)
     ========================================================================= */
  function _addProviderNotification(providerId, notification) {
    if (!providerId) return;
    const key = PROVIDER_NOTIFS_PREFIX + providerId;
    let notifs = [];
    try { notifs = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { notifs = []; }
    notifs.unshift(notification);
    localStorage.setItem(key, JSON.stringify(notifs));
  }

  function getProviderNotifications(providerId) {
    if (!providerId) return [];
    const key = PROVIDER_NOTIFS_PREFIX + providerId;
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { return []; }
  }

  function clearProviderNotifications(providerId) {
    if (!providerId) return;
    localStorage.removeItem(PROVIDER_NOTIFS_PREFIX + providerId);
  }

  function _invalidateProviderState(providerId) {
    try {
      const existing = localStorage.getItem("fsd_ui_state");
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.provider && parsed.provider.service_provider_id === providerId) localStorage.removeItem("fsd_ui_state");
      }
    } catch (_) {}
  }

  /* =========================================================================
     PROVIDER PROFILE FOR POPUP
     ========================================================================= */
  async function getAssignedProviderProfile(providerId) {
    if (!providerId) return null;
    try {
      const provider = await Api.get("/service-providers/" + providerId, { silent: true });
      if (!provider) return null;
      return {
        name: provider.name || "Tatku Provider",
        rating: typeof provider.rating === "number" ? provider.rating : FALLBACK_RATING,
        ratingCount: provider.rating_count || 0,
        phone: provider.phone || "Not available",
        pfpUrl: provider.pfp_url || "https://i.pravatar.cc/150?img=0",
        email: provider.email || "",
      };
    } catch (_) { return null; }
  }

  /* =========================================================================
     CHECK SERVICE AVAILABILITY
     ========================================================================= */
  async function isServiceAvailable(serviceName) {
    const serviceId = await _resolveServiceId(serviceName);
    if (!serviceId) return true;
    try {
      const services = await Api.get("/services", { silent: true }) || [];
      const svc = services.find(s => s.service_id === serviceId);
      return svc ? svc.is_available !== false : true;
    } catch (_) { return true; }
  }

  /* =========================================================================
     CANCEL ASSIGNMENT
     ========================================================================= */
  async function cancelAssignment(bookingId) {
    try {
      const bookings = await Api.get("/bookings", { silent: true }) || [];
      const booking = bookings.find(b => b.booking_id === bookingId);
      if (!booking) return;

      const providerId = booking.provider_id;
      if (!providerId) return;

      const nowIso = new Date().toISOString();

      // Update matching job_assignments via API
      const jobAssignments = await Api.get("/job-assignments", { silent: true }) || [];
      for (const ja of jobAssignments) {
        if (ja.booking_id === bookingId && ja.service_provider_id === providerId && ja.status !== "CANCELLED") {
          try { await Api.patch("/job-assignments/" + ja.assignment_id, { status: "CANCELLED" }); } catch (_) {}
        }
      }

      // Resolve customer name
      const customers = await Api.get("/customers", { silent: true }) || [];
      const customer = customers.find(c => c.customer_id === booking.customer_id);
      const customerName = customer ? (customer.full_name || customer.name || "A customer") : "A customer";

      // Send provider notification
      _addProviderNotification(providerId, {
        id: Date.now(), type: "job", category: "Jobs", unread: true,
        title: "A job has been cancelled by the customer.", time: "Just now",
        desc: customerName + " has cancelled their " + (booking.service_name || "service") + " booking (#" + bookingId + ").",
        bookingId: bookingId, createdAt: nowIso,
        actions: [{ label: "View Jobs", cls: "btn-primary-action", href: "assigned-jobs.html" }, { label: "Dismiss", cls: "btn-dismiss", action: "dismiss" }],
      });

      _invalidateProviderState(providerId);
    } catch (err) {
      console.warn("[AssignmentEngine] cancelAssignment failed:", err);
    }
  }

  /* =========================================================================
     PUBLIC API
     ========================================================================= */
  return {
    auditServiceAvailability,
    assignProviderForBooking,
    cancelAssignment,
    getCustomerNotifications,
    dismissCustomerNotification,
    getAssignedProviderProfile,
    getProviderNotifications,
    clearProviderNotifications,
    isServiceAvailable,
  };
})();
