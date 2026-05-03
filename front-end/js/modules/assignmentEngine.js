/* =============================================================================
   TATKU UNITED — ASSIGNMENT ENGINE — API-backed
   front-end/js/modules/assignmentEngine.js
   ============================================================================= */

window.AssignmentEngine = (() => {
  "use strict";

  const CUSTOMER_NOTIFS_PREFIX = null;
  const PROVIDER_NOTIFS_PREFIX = null;
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
      // Backend route: GET /services/:id/skills  (not /service-skills)
      const serviceSkills = await Api.get("/services/" + serviceId + "/skills", { silent: true }) || [];
      return serviceSkills.map(ss => ss.skill_id);
    } catch (_) { return []; }
  }

  async function _getActiveProviderIdsForSkills(requiredSkillIds) {
    if (!requiredSkillIds.length) return [];
    try {
      // Fetch provider-skills per skill (backend has GET /provider-skills/skill/:skill_id)
      const allMatches = [];
      for (const skillId of requiredSkillIds) {
        const ps = await Api.get("/provider-skills/skill/" + skillId, { silent: true }) || [];
        allMatches.push(...ps);
      }
      const providers = await Api.get("/service-providers", { silent: true }) || [];
      const activeProviderIds = new Set(providers.filter(p => p.is_active === true).map(p => p.service_provider_id || p.sp_id));
      const matchedProviderIds = new Set();
      allMatches.forEach(ps => {
        const psId = ps.service_provider_id || ps.sp_id;
        if (activeProviderIds.has(psId)) {
          matchedProviderIds.add(psId);
        }
      });
      return Array.from(matchedProviderIds);
    } catch (_) { return []; }
  }

  async function _rankProviders(providerIds) {
    try {
      const providers = await Api.get("/service-providers", { silent: true }) || [];
      return providerIds
        .map(id => providers.find(p => (p.service_provider_id || p.sp_id) === id))
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

      for (const service of services) {
        // Backend route: GET /services/:id/skills
        const serviceSkills = await Api.get("/services/" + service.service_id + "/skills", { silent: true }) || [];
        const requiredSkillIds = serviceSkills.map(ss => ss.skill_id);
        if (requiredSkillIds.length === 0) continue;

        // Check if any active provider covers at least one required skill
        let hasProvider = false;
        for (const skillId of requiredSkillIds) {
          const ps = await Api.get("/provider-skills/skill/" + skillId, { silent: true }) || [];
          if (ps.length > 0) { hasProvider = true; break; }
        }

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
      // Use the backend's auto-assign endpoint: POST /job-assignments/assign/:bookingId
      const result = await Api.post("/job-assignments/assign/" + bookingId, {});
      if (result && result.assignment_id) {
        const providerId = result.service_provider_id || result.sp_id;
        return { success: true, providerId: providerId, assignmentId: result.assignment_id };
      }
      return { success: true, ...result };
    } catch (err) {
      console.error("[AssignmentEngine] assignProviderForBooking failed:", err);
      return { success: false, reason: err.message || "Assignment failed" };
    }
  }

  /* =========================================================================
     CUSTOMER NOTIFICATIONS
     ========================================================================= */
  function _addCustomerNotification() {}

  function getCustomerNotifications() {
    return [];
  }

  function dismissCustomerNotification() {}

  /* =========================================================================
     PROVIDER NOTIFICATIONS
     ========================================================================= */
  function _addProviderNotification() {}

  function getProviderNotifications() {
    return [];
  }

  function clearProviderNotifications() {}

  function _invalidateProviderState() {}

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
      // Use the backend's cancel endpoint: PATCH /bookings/:id/cancel
      await Api.patch("/bookings/" + bookingId + "/cancel", {});
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
