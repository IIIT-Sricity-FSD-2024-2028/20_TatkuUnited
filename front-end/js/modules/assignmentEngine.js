/* =============================================================================
   TATKU UNITED — ASSIGNMENT ENGINE
   front-end/js/modules/assignmentEngine.js
   Depends on: js/data/store.js (AppStore), js/modules/auth.js
   ============================================================================= */

window.AssignmentEngine = (() => {
  "use strict";

  const CUSTOMER_NOTIFS_PREFIX = "fsd_customer_notifs_";
  const PROVIDER_NOTIFS_PREFIX = "fsd_provider_notifs_";
  const FALLBACK_RATING = 4.73;

  /* =========================================================================
     HELPERS
     ========================================================================= */

  function _resolveServiceId(serviceName) {
    if (!serviceName || !AppStore || !AppStore.data) return null;
    const services = AppStore.getTable("services") || [];
    const normalised = String(serviceName).trim().toLowerCase();
    const found = services.find(
      (s) => String(s.service_name || "").trim().toLowerCase() === normalised,
    );
    return found ? found.service_id : null;
  }

  function _getRequiredSkills(serviceId) {
    if (!serviceId) return [];
    const serviceSkills = AppStore.getTable("service_skills") || [];
    return serviceSkills
      .filter((ss) => ss.service_id === serviceId)
      .map((ss) => ss.skill_id);
  }

  function _getActiveProviderIdsForSkills(requiredSkillIds) {
    if (!requiredSkillIds.length) return [];
    const providerSkills = AppStore.getTable("provider_skills") || [];
    const providers = AppStore.getTable("service_providers") || [];

    const activeProviderIds = new Set(
      providers
        .filter((p) => p.is_active === true)
        .map((p) => p.service_provider_id),
    );

    const matchedProviderIds = new Set();
    providerSkills.forEach((ps) => {
      if (
        activeProviderIds.has(ps.service_provider_id) &&
        requiredSkillIds.includes(ps.skill_id)
      ) {
        matchedProviderIds.add(ps.service_provider_id);
      }
    });

    return Array.from(matchedProviderIds);
  }

  function _rankProviders(providerIds) {
    const providers = AppStore.getTable("service_providers") || [];
    return providerIds
      .map((id) => providers.find((p) => p.service_provider_id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const rA =
          typeof a.rating === "number" && a.rating !== null
            ? a.rating
            : FALLBACK_RATING;
        const rB =
          typeof b.rating === "number" && b.rating !== null
            ? b.rating
            : FALLBACK_RATING;
        if (rB !== rA) return rB - rA;
        return new Date(a.created_at) - new Date(b.created_at);
      });
  }

  /* =========================================================================
     0. SERVICE AVAILABILITY AUDIT
     ========================================================================= */

  /**
   * auditServiceAvailability()
   * Cross-references service_skills against provider_skills to mark services
   * as unavailable when no active provider possesses the required skills.
   * Updates AppStore.data only — never modifies mockData.json.
   */
  function auditServiceAvailability() {
    if (!AppStore || !AppStore.data) return;

    const services = AppStore.getTable("services") || [];
    const serviceSkills = AppStore.getTable("service_skills") || [];
    const providerSkills = AppStore.getTable("provider_skills") || [];
    const providers = AppStore.getTable("service_providers") || [];

    const activeProviderIds = new Set(
      providers
        .filter((p) => p.is_active === true)
        .map((p) => p.service_provider_id),
    );

    // Build a set of skill_ids that have at least one active provider
    const coveredSkillIds = new Set();
    providerSkills.forEach((ps) => {
      if (activeProviderIds.has(ps.service_provider_id)) {
        coveredSkillIds.add(ps.skill_id);
      }
    });

    services.forEach((service) => {
      const requiredSkills = serviceSkills
        .filter((ss) => ss.service_id === service.service_id)
        .map((ss) => ss.skill_id);

      if (requiredSkills.length === 0) {
        // No skill requirements defined — keep current availability
        return;
      }

      // A service is available if at least one of its required skills is covered
      const hasProvider = requiredSkills.some((skillId) =>
        coveredSkillIds.has(skillId),
      );

      service.is_available = hasProvider;
    });

    AppStore.save();
  }

  /* =========================================================================
     1. ASSIGN PROVIDER FOR BOOKING
     ========================================================================= */

  /**
   * assignProviderForBooking(bookingId)
   * Matches a booking to the best available provider and creates all
   * necessary records (job_assignment, booking update, notifications).
   * Returns { success, providerId, assignmentId } or { success: false, reason }
   */
  function assignProviderForBooking(bookingId) {
    if (!AppStore || !AppStore.data) {
      return { success: false, reason: "AppStore not ready" };
    }

    const bookings = AppStore.getTable("bookings") || [];
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (!booking) {
      return { success: false, reason: "Booking not found: " + bookingId };
    }

    // Resolve service_id from service_name
    const serviceId = _resolveServiceId(booking.service_name);
    if (!serviceId) {
      return {
        success: false,
        reason:
          "Could not resolve service_id for: " + (booking.service_name || ""),
      };
    }

    // Get required skills
    const requiredSkills = _getRequiredSkills(serviceId);
    if (!requiredSkills.length) {
      return {
        success: false,
        reason: "No skill requirements defined for service: " + serviceId,
      };
    }

    // Find matching active providers
    const matchedProviderIds = _getActiveProviderIdsForSkills(requiredSkills);
    if (!matchedProviderIds.length) {
      return {
        success: false,
        reason: "No active provider found with required skills",
      };
    }

    // Rank and select the best provider
    const ranked = _rankProviders(matchedProviderIds);
    const bestProvider = ranked[0];
    if (!bestProvider) {
      return { success: false, reason: "Provider ranking failed" };
    }

    const nowIso = new Date().toISOString();
    const scheduledDate = booking.scheduled_at
      ? booking.scheduled_at.split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Parse time from scheduled_at
    let hourStart = "10:00";
    let hourEnd = "12:00";
    if (booking.scheduled_at) {
      const d = new Date(booking.scheduled_at);
      if (!isNaN(d.getTime())) {
        hourStart =
          String(d.getHours()).padStart(2, "0") +
          ":" +
          String(d.getMinutes()).padStart(2, "0");
        // Estimate 2 hour duration
        const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
        hourEnd =
          String(endD.getHours()).padStart(2, "0") +
          ":" +
          String(endD.getMinutes()).padStart(2, "0");
      }
    }

    // Create job_assignment record
    const assignmentId = AppStore.nextId("JA");
    const jobAssignment = {
      assignment_id: assignmentId,
      scheduled_date: scheduledDate,
      hour_start: hourStart,
      hour_end: hourEnd,
      status: "ASSIGNED",
      version: 1,
      assignment_score: null,
      notes: null,
      assigned_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      booking_id: bookingId,
      service_provider_id: bestProvider.service_provider_id,
    };

    const jobAssignments = AppStore.getTable("job_assignments") || [];
    jobAssignments.push(jobAssignment);

    // Also create a booking_services record if it doesn't exist
    const bookingServices = AppStore.getTable("booking_services") || [];
    const existingBS = bookingServices.find(
      (bs) => bs.booking_id === bookingId && bs.service_id === serviceId,
    );
    if (!existingBS) {
      const services = AppStore.getTable("services") || [];
      const svc = services.find((s) => s.service_id === serviceId);
      bookingServices.push({
        booking_id: bookingId,
        service_id: serviceId,
        quantity: 1,
        price_at_booking: svc ? svc.base_price : 0,
      });
    }

    // Update booking status and provider_id
    booking.status = "ASSIGNED";
    booking.provider_id = bestProvider.service_provider_id;
    booking.updated_at = nowIso;

    // Persist
    AppStore.save();

    // Create customer notification
    _addCustomerNotification(booking.customer_id, {
      id: Date.now(),
      type: "assignment",
      bookingId: bookingId,
      providerId: bestProvider.service_provider_id,
      serviceName: booking.service_name || "Service",
      title: "A service provider has been assigned to your request.",
      message:
        bestProvider.name +
        " has been assigned to your " +
        (booking.service_name || "service") +
        " booking.",
      createdAt: nowIso,
      dismissed: false,
    });

    // Create provider notification
    _addProviderNotification(bestProvider.service_provider_id, {
      id: Date.now() + 1,
      type: "job",
      category: "Jobs",
      unread: true,
      title: "You have been assigned a new job.",
      time: "Just now",
      desc:
        "You have been assigned to " +
        (booking.service_name || "a service") +
        " booking. Please check your schedule.",
      bookingId: bookingId,
      assignmentId: assignmentId,
      createdAt: nowIso,
      actions: [
        {
          label: "View Job Details",
          cls: "btn-primary-action",
          href: "assigned-jobs.html",
        },
        { label: "Dismiss", cls: "btn-dismiss", action: "dismiss" },
      ],
    });

    // Force provider's fsd_ui_state to rebuild on next load
    _invalidateProviderState(bestProvider.service_provider_id);

    return {
      success: true,
      providerId: bestProvider.service_provider_id,
      assignmentId: assignmentId,
    };
  }

  /* =========================================================================
     CUSTOMER NOTIFICATIONS
     ========================================================================= */

  function _addCustomerNotification(customerId, notification) {
    if (!customerId) return;
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    let notifs = [];
    try {
      notifs = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (_) {
      notifs = [];
    }
    notifs.unshift(notification);
    localStorage.setItem(key, JSON.stringify(notifs));
  }

  function getCustomerNotifications(customerId) {
    if (!customerId) return [];
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    try {
      const notifs = JSON.parse(localStorage.getItem(key) || "[]");
      return notifs.filter((n) => !n.dismissed);
    } catch (_) {
      return [];
    }
  }

  function dismissCustomerNotification(customerId, notifId) {
    if (!customerId) return;
    const key = CUSTOMER_NOTIFS_PREFIX + customerId;
    try {
      let notifs = JSON.parse(localStorage.getItem(key) || "[]");
      notifs = notifs.map((n) => {
        if (n.id === notifId) n.dismissed = true;
        return n;
      });
      localStorage.setItem(key, JSON.stringify(notifs));
    } catch (_) {
      /* ignore */
    }
  }

  /* =========================================================================
     PROVIDER NOTIFICATIONS
     ========================================================================= */

  function _addProviderNotification(providerId, notification) {
    if (!providerId) return;
    const key = PROVIDER_NOTIFS_PREFIX + providerId;
    let notifs = [];
    try {
      notifs = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (_) {
      notifs = [];
    }
    notifs.unshift(notification);
    localStorage.setItem(key, JSON.stringify(notifs));
  }

  function getProviderNotifications(providerId) {
    if (!providerId) return [];
    const key = PROVIDER_NOTIFS_PREFIX + providerId;
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (_) {
      return [];
    }
  }

  function clearProviderNotifications(providerId) {
    if (!providerId) return;
    localStorage.removeItem(PROVIDER_NOTIFS_PREFIX + providerId);
  }

  function _invalidateProviderState(providerId) {
    // Remove the cached fsd_ui_state so initData() rebuilds from AppStore
    // We only invalidate if the current UI state belongs to a different provider
    // or if the provider logs in next time.
    try {
      const existing = localStorage.getItem("fsd_ui_state");
      if (existing) {
        const parsed = JSON.parse(existing);
        if (
          parsed.provider &&
          parsed.provider.service_provider_id === providerId
        ) {
          localStorage.removeItem("fsd_ui_state");
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  /* =========================================================================
     PROVIDER PROFILE FOR POPUP
     ========================================================================= */

  function getAssignedProviderProfile(providerId) {
    if (!providerId || !AppStore || !AppStore.data) return null;
    const providers = AppStore.getTable("service_providers") || [];
    const provider = providers.find(
      (p) => p.service_provider_id === providerId,
    );
    if (!provider) return null;

    return {
      name: provider.name || "Tatku Provider",
      rating:
        typeof provider.rating === "number" ? provider.rating : FALLBACK_RATING,
      ratingCount: provider.rating_count || 0,
      phone: provider.phone || "Not available",
      pfpUrl: provider.pfp_url || "https://i.pravatar.cc/150?img=0",
      email: provider.email || "",
    };
  }

  /* =========================================================================
     CHECK SERVICE AVAILABILITY (for a single service_name)
     ========================================================================= */

  function isServiceAvailable(serviceName) {
    const serviceId = _resolveServiceId(serviceName);
    if (!serviceId) return true; // Can't determine, default to available
    const services = AppStore.getTable("services") || [];
    const svc = services.find((s) => s.service_id === serviceId);
    return svc ? svc.is_available !== false : true;
  }

  /* =========================================================================
     CANCEL ASSIGNMENT (customer-initiated cancellation)
     ========================================================================= */

  /**
   * cancelAssignment(bookingId)
   * Called when a customer cancels a booked service. Updates the matching
   * job_assignment to CANCELLED, sends a notification to the assigned
   * provider, and invalidates their cached UI state so the change is
   * reflected in dashboard / calendar / assigned-jobs pages.
   */
  function cancelAssignment(bookingId) {
    if (!AppStore || !AppStore.data) return;

    const bookings = AppStore.getTable("bookings") || [];
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return;

    const providerId = booking.provider_id;
    if (!providerId) return; // no provider was assigned

    const nowIso = new Date().toISOString();

    // Update matching job_assignments
    const jobAssignments = AppStore.getTable("job_assignments") || [];
    jobAssignments.forEach((ja) => {
      if (
        ja.booking_id === bookingId &&
        ja.service_provider_id === providerId &&
        ja.status !== "CANCELLED"
      ) {
        ja.status = "CANCELLED";
        ja.updated_at = nowIso;
      }
    });

    AppStore.save();

    // Resolve customer name for the notification message
    const customers = AppStore.getTable("customers") || [];
    const customer = customers.find(
      (c) => c.customer_id === booking.customer_id,
    );
    const customerName = customer
      ? customer.full_name || customer.name || "A customer"
      : "A customer";

    // Send provider notification
    _addProviderNotification(providerId, {
      id: Date.now(),
      type: "job",
      category: "Jobs",
      unread: true,
      title: "A job has been cancelled by the customer.",
      time: "Just now",
      desc:
        customerName +
        " has cancelled their " +
        (booking.service_name || "service") +
        " booking (#" +
        bookingId +
        ").",
      bookingId: bookingId,
      createdAt: nowIso,
      actions: [
        {
          label: "View Jobs",
          cls: "btn-primary-action",
          href: "assigned-jobs.html",
        },
        { label: "Dismiss", cls: "btn-dismiss", action: "dismiss" },
      ],
    });

    // Force provider dashboard to rebuild on next load
    _invalidateProviderState(providerId);
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
