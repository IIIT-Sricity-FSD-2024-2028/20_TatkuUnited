(function () {
  "use strict";

  // ── Valid table names ────────────────────────────────────────────────────────
  const VALID_TABLES = [
    "collectives",
    "units",
    "sectors",
    "collective_managers",
    "unit_managers",
    "service_providers",
    "provider_documents",
    "provider_working_hours",
    "provider_unavailability",
    "skills",
    "provider_skills",
    "customers",
    "categories",
    "services",
    "service_content",
    "service_skills",
    "service_faqs",
    "service_packages",
    "package_services",
    "bookings",
    "booking_services",
    "job_assignments",
    "transactions",
    "revenue_ledger",
    "reviews",
    "super_users",
    "super_user_platform_events",
    "super_user_audit_logs",
    "super_user_notifications",
    "super_user_actions",
    "super_user_system_performance",
  ];

  // ── Prefix → table mapping ───────────────────────────────────────────────────
  const PREFIX_TABLE_MAP = {
    COL: "collectives",
    UNT: "units",
    SEC: "sectors",
    CM: "collective_managers",
    UM: "unit_managers",
    SP: "service_providers",
    DOC: "provider_documents",
    WH: "provider_working_hours",
    UV: "provider_unavailability",
    SKL: "skills",
    CUS: "customers",
    CAT: "categories",
    SVC: "services",
    FAQ: "service_faqs",
    PKG: "service_packages",
    BKG: "bookings",
    JA: "job_assignments",
    TXN: "transactions",
    LDG: "revenue_ledger",
    REV: "reviews",
    SU: "super_users",
  };

  // ── Empty data scaffold (used on fetch failure) ──────────────────────────────
  const EMPTY_DATA = {
    collectives: [],
    units: [],
    sectors: [],
    collective_managers: [],
    unit_managers: [],
    service_providers: [],
    provider_documents: [],
    provider_working_hours: [],
    provider_unavailability: [],
    skills: [],
    provider_skills: [],
    customers: [],
    categories: [],
    services: [],
    service_content: [],
    service_skills: [],
    service_faqs: [],
    service_packages: [],
    package_services: [],
    bookings: [],
    booking_services: [],
    job_assignments: [],
    transactions: [],
    revenue_ledger: [],
    reviews: [],
    super_users: [],
    super_user_platform_events: [],
    super_user_audit_logs: [],
    super_user_notifications: [],
    super_user_actions: [],
    super_user_system_performance: [],
  };

  const PLATFORM_SETTINGS_KEY = "fsd_platform_settings";
  const DEFAULT_PLATFORM_SETTINGS = {
    maintenanceMode: false,
    accountSuspension: false,
    ratingThreshold: "2.5 Stars",
    instantBooking: true,
    maxAdvance: "30 days",
    minNotice: "1 hour",
    cancelWindow: "2 hours",
    updatedAt: null,
    updatedBy: null,
  };

  function normalizePlatformSettings(settings) {
    return {
      maintenanceMode:
        typeof settings?.maintenanceMode === "boolean"
          ? settings.maintenanceMode
          : DEFAULT_PLATFORM_SETTINGS.maintenanceMode,
      accountSuspension:
        typeof settings?.accountSuspension === "boolean"
          ? settings.accountSuspension
          : DEFAULT_PLATFORM_SETTINGS.accountSuspension,
      ratingThreshold:
        typeof settings?.ratingThreshold === "string" &&
        settings.ratingThreshold.trim()
          ? settings.ratingThreshold
          : DEFAULT_PLATFORM_SETTINGS.ratingThreshold,
      instantBooking:
        typeof settings?.instantBooking === "boolean"
          ? settings.instantBooking
          : DEFAULT_PLATFORM_SETTINGS.instantBooking,
      maxAdvance:
        typeof settings?.maxAdvance === "string" && settings.maxAdvance.trim()
          ? settings.maxAdvance
          : DEFAULT_PLATFORM_SETTINGS.maxAdvance,
      minNotice:
        typeof settings?.minNotice === "string" && settings.minNotice.trim()
          ? settings.minNotice
          : DEFAULT_PLATFORM_SETTINGS.minNotice,
      cancelWindow:
        typeof settings?.cancelWindow === "string" &&
        settings.cancelWindow.trim()
          ? settings.cancelWindow
          : DEFAULT_PLATFORM_SETTINGS.cancelWindow,
      updatedAt:
        typeof settings?.updatedAt === "string" && settings.updatedAt.trim()
          ? settings.updatedAt
          : DEFAULT_PLATFORM_SETTINGS.updatedAt,
      updatedBy:
        typeof settings?.updatedBy === "string" && settings.updatedBy.trim()
          ? settings.updatedBy
          : DEFAULT_PLATFORM_SETTINGS.updatedBy,
    };
  }

  function getPlatformSettingsFromStorage() {
    try {
      var raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
      if (!raw) return null;
      return normalizePlatformSettings(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  // ── Bootstrap AppStore on window ─────────────────────────────────────────────
  var AppStore = {};
  window.AppStore = AppStore;

  // ── AppStore.data ─────────────────────────────────────────────────────────────
  AppStore.data = null;

  // ── AppStore.save ─────────────────────────────────────────────────────────────
  AppStore.save = function () {
    try {
      localStorage.setItem("fsd_store", JSON.stringify(AppStore.data));
      localStorage.setItem("fsd_store_saved_at", new Date().toISOString());
      // Remove legacy session copy to avoid cross-tab confusion.
      sessionStorage.removeItem("fsd_store");
      sessionStorage.removeItem("fsd_store_saved_at");
    } catch (err) {
      console.error("[AppStore] save() failed:", err);
    }
  };

  // ── AppStore.restore ──────────────────────────────────────────────────────────
  AppStore.restore = function () {
    // Primary source: localStorage (shared across tabs).
    // Fallback source: legacy sessionStorage copy from older builds.
    try {
      var raw = localStorage.getItem("fsd_store");
      if (!raw) {
        raw = sessionStorage.getItem("fsd_store");
      }
      if (raw) {
        AppStore.data = JSON.parse(raw);
        // Ensure future reads come from localStorage.
        localStorage.setItem("fsd_store", JSON.stringify(AppStore.data));
        return true;
      }
    } catch (err) {
      console.error("[AppStore] restore() failed to parse localStorage:", err);
    }
    // Nothing in localStorage — signal that a fresh fetch is needed.
    return false;
  };

  // ── AppStore.getTable ─────────────────────────────────────────────────────────
  AppStore.getTable = function (name) {
    if (VALID_TABLES.indexOf(name) === -1) {
      console.error(
        '[AppStore] getTable(): "' +
          name +
          '" is not a valid table name. ' +
          "Valid tables: " +
          VALID_TABLES.join(", "),
      );
      return undefined;
    }
    return AppStore.data[name];
  };

  AppStore.getPlatformSettings = function () {
    if (AppStore.data && AppStore.data.platform_settings) {
      return normalizePlatformSettings(AppStore.data.platform_settings);
    }

    var fromStorage = getPlatformSettingsFromStorage();
    if (fromStorage) return fromStorage;

    return normalizePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
  };

  AppStore.savePlatformSettings = function (settings) {
    var normalized = normalizePlatformSettings(settings || {});

    if (AppStore.data) {
      AppStore.data.platform_settings = normalized;
      AppStore.save();
    }

    try {
      localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(normalized));
    } catch (err) {
      console.error("[AppStore] savePlatformSettings() failed:", err);
    }

    return normalized;
  };

  function parseRuleToMinutes(rawValue, fallbackMinutes) {
    var text = String(rawValue || "")
      .trim()
      .toLowerCase();
    if (!text) return fallbackMinutes;

    var match = text.match(
      /(\d+(?:\.\d+)?)\s*(day|days|hour|hours|minute|minutes)/,
    );
    if (!match) return fallbackMinutes;

    var amount = parseFloat(match[1]);
    var unit = match[2];
    if (isNaN(amount) || amount <= 0) return fallbackMinutes;

    if (unit.indexOf("day") === 0) return Math.round(amount * 24 * 60);
    if (unit.indexOf("hour") === 0) return Math.round(amount * 60);
    return Math.round(amount);
  }

  AppStore.getBookingRules = function () {
    var settings = AppStore.getPlatformSettings();

    var maxAdvanceMinutes = parseRuleToMinutes(
      settings.maxAdvance,
      30 * 24 * 60,
    );
    var minNoticeMinutes = parseRuleToMinutes(settings.minNotice, 60);
    var cancelWindowMinutes = parseRuleToMinutes(settings.cancelWindow, 120);

    return {
      instantBooking: !!settings.instantBooking,
      maxAdvanceLabel: settings.maxAdvance,
      minNoticeLabel: settings.minNotice,
      cancelWindowLabel: settings.cancelWindow,
      maxAdvanceMinutes: maxAdvanceMinutes,
      maxAdvanceDays: Math.max(1, Math.floor(maxAdvanceMinutes / (24 * 60))),
      minNoticeMinutes: minNoticeMinutes,
      cancelWindowMinutes: cancelWindowMinutes,
    };
  };

  AppStore.recomputeRatingsFromReviews = function () {
    if (!AppStore || !AppStore.data) return;

    var reviews = AppStore.getTable("reviews") || [];
    var services = AppStore.getTable("services") || [];
    var categories = AppStore.getTable("categories") || [];
    var providers = AppStore.getTable("service_providers") || [];
    var bookings = AppStore.getTable("bookings") || [];
    var assignments = AppStore.getTable("job_assignments") || [];

    var serviceById = new Map();
    services.forEach(function (svc) {
      serviceById.set(svc.service_id, svc);
    });

    var bookingById = new Map();
    bookings.forEach(function (booking) {
      bookingById.set(booking.booking_id, booking);
    });

    var latestAssignmentByBooking = new Map();
    assignments.forEach(function (assignment) {
      var existing = latestAssignmentByBooking.get(assignment.booking_id);
      if (!existing) {
        latestAssignmentByBooking.set(assignment.booking_id, assignment);
        return;
      }

      var existingTs = new Date(
        existing.updated_at || existing.assigned_at || existing.created_at || 0,
      ).getTime();
      var currentTs = new Date(
        assignment.updated_at ||
          assignment.assigned_at ||
          assignment.created_at ||
          0,
      ).getTime();

      if (currentTs >= existingTs) {
        latestAssignmentByBooking.set(assignment.booking_id, assignment);
      }
    });

    var serviceStats = new Map();
    var providerStats = new Map();

    function getOrCreateStats(bucket, id) {
      var stats = bucket.get(id);
      if (!stats) {
        stats = { sum: 0, count: 0 };
        bucket.set(id, stats);
      }
      return stats;
    }

    reviews.forEach(function (review) {
      var rating = Number(review && review.rating);
      if (!Number.isFinite(rating)) return;
      rating = Math.max(1, Math.min(5, rating));

      var booking = review.booking_id
        ? bookingById.get(review.booking_id)
        : null;
      var assignment = review.booking_id
        ? latestAssignmentByBooking.get(review.booking_id)
        : null;

      var serviceId = review.service_id;
      if (!serviceId && booking && booking.service_name) {
        for (var i = 0; i < services.length; i++) {
          if (services[i].service_name === booking.service_name) {
            serviceId = services[i].service_id;
            break;
          }
        }
      }

      var providerId =
        review.provider_id ||
        (booking && booking.provider_id) ||
        (assignment && assignment.service_provider_id) ||
        null;

      if (serviceId) {
        var serviceStat = getOrCreateStats(serviceStats, serviceId);
        serviceStat.sum += rating;
        serviceStat.count += 1;
      }

      if (providerId) {
        var providerStat = getOrCreateStats(providerStats, providerId);
        providerStat.sum += rating;
        providerStat.count += 1;
      }
    });

    services.forEach(function (service) {
      var stats = serviceStats.get(service.service_id);
      if (!stats || stats.count === 0) {
        service.average_rating = null;
        service.rating = null;
        service.rating_count = 0;
        return;
      }

      var avg = Math.round((stats.sum / stats.count) * 100) / 100;
      service.average_rating = avg;
      service.rating = avg;
      service.rating_count = stats.count;
    });

    var categoryTotals = new Map();
    services.forEach(function (service) {
      var categoryId = service.category_id;
      if (!categoryId) return;

      var total = categoryTotals.get(categoryId);
      if (!total) {
        total = { weightedSum: 0, count: 0 };
        categoryTotals.set(categoryId, total);
      }

      var count = Number(service.rating_count) || 0;
      var avg = Number(service.average_rating);
      if (count > 0 && Number.isFinite(avg)) {
        total.weightedSum += avg * count;
        total.count += count;
      }
    });

    categories.forEach(function (category) {
      var total = categoryTotals.get(category.category_id);
      if (!total || total.count === 0) {
        category.average_rating = null;
        category.rating_count = 0;
        return;
      }

      category.average_rating =
        Math.round((total.weightedSum / total.count) * 100) / 100;
      category.rating_count = total.count;
    });

    providers.forEach(function (provider) {
      var stats = providerStats.get(provider.service_provider_id);
      if (!stats || stats.count === 0) {
        provider.rating = null;
        provider.rating_count = 0;
        provider.average_rating = null;
        return;
      }

      var avg = Math.round((stats.sum / stats.count) * 100) / 100;
      provider.rating = avg;
      provider.rating_count = stats.count;
      provider.average_rating = avg;
    });

    AppStore.save();
  };

  AppStore.validateScheduledSlot = function (dateValue, timeValue) {
    if (!dateValue) {
      return { valid: false, error: "Please select a date." };
    }
    if (!timeValue) {
      return { valid: false, error: "Please select a time." };
    }

    var scheduledAt = new Date(dateValue + "T" + timeValue + ":00");
    if (isNaN(scheduledAt.getTime())) {
      return { valid: false, error: "Invalid scheduled date/time." };
    }

    var rules = AppStore.getBookingRules();
    var now = new Date();
    var minAllowed = new Date(now.getTime() + rules.minNoticeMinutes * 60000);
    var maxAllowed = new Date(now.getTime() + rules.maxAdvanceMinutes * 60000);

    if (scheduledAt < minAllowed) {
      return {
        valid: false,
        error:
          "Scheduled time must be at least " +
          rules.minNoticeLabel +
          " from now.",
      };
    }

    if (scheduledAt > maxAllowed) {
      return {
        valid: false,
        error:
          "Scheduled time must be within " +
          rules.maxAdvanceLabel +
          " from now.",
      };
    }

    return { valid: true, scheduledAt: scheduledAt.toISOString() };
  };

  AppStore.canCancelScheduledBooking = function (scheduledAt) {
    var target = new Date(scheduledAt);
    if (isNaN(target.getTime())) {
      return { valid: false, error: "Invalid booking schedule." };
    }

    var rules = AppStore.getBookingRules();
    var now = new Date();
    var diffMins = (target.getTime() - now.getTime()) / 60000;

    if (diffMins < rules.cancelWindowMinutes) {
      return {
        valid: false,
        error:
          "Cancellation is allowed only up to " +
          rules.cancelWindowLabel +
          " before service time.",
      };
    }

    return { valid: true };
  };

  // ── AppStore.nextId ───────────────────────────────────────────────────────────
  AppStore.nextId = function (prefix) {
    var tableName = PREFIX_TABLE_MAP[prefix];
    if (!tableName) {
      console.error(
        '[AppStore] nextId(): "' +
          prefix +
          '" is not a recognised prefix. ' +
          "Valid prefixes: " +
          Object.keys(PREFIX_TABLE_MAP).join(", "),
      );
      return null;
    }

    var table = AppStore.data[tableName];
    var maxNum = 0;

    for (var i = 0; i < table.length; i++) {
      var row = table[i];
      // Find the id field — check common key names
      var idKeys = Object.keys(row).filter(function (k) {
        return (
          k === "id" ||
          k.endsWith("_id") ||
          k === tableName.replace(/_/g, "_") + "_id"
        );
      });

      // Prefer a key literally named "id", fall back to the first *_id key
      var idVal = null;
      if (row.hasOwnProperty("id")) {
        idVal = row["id"];
      } else {
        for (var k = 0; k < idKeys.length; k++) {
          if (row[idKeys[k]] !== undefined) {
            idVal = row[idKeys[k]];
            break;
          }
        }
      }

      if (idVal === null || idVal === undefined) continue;
      idVal = String(idVal);

      if (idVal.indexOf(prefix) === 0) {
        var suffix = idVal.slice(prefix.length);
        var num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    var next = maxNum + 1;
    var padded = String(next);
    while (padded.length < 3) {
      padded = "0" + padded;
    }
    return prefix + padded;
  };

  // ── AppStore.ready + startup sequence ────────────────────────────────────────
  var _resolve;
  AppStore.ready = new Promise(function (resolve) {
    _resolve = resolve;
  });

  function _normalizePreExistingProgressStates() {
    if (!AppStore.data) return false;

    var bookings = AppStore.getTable("bookings") || [];
    var assignments = AppStore.getTable("job_assignments") || [];
    var bookingById = new Map(
      bookings.map(function (b) {
        return [b.booking_id, b];
      }),
    );

    var changed = false;

    assignments.forEach(function (ja) {
      var status = String(ja.status || "").toUpperCase();
      if (status !== "IN_PROGRESS") return;

      var relatedBooking = bookingById.get(ja.booking_id);
      var bookingStatus = String(
        (relatedBooking && relatedBooking.status) || "",
      ).toUpperCase();

      var nextAssignmentStatus =
        bookingStatus === "COMPLETED" ? "COMPLETED" : "ASSIGNED";
      if (ja.status !== nextAssignmentStatus) {
        ja.status = nextAssignmentStatus;
        changed = true;
      }
    });

    bookings.forEach(function (b) {
      var status = String(b.status || "").toUpperCase();
      if (status !== "IN_PROGRESS") return;

      var relatedAssignment = assignments.find(function (ja) {
        return ja.booking_id === b.booking_id;
      });
      var assignmentStatus = String(
        (relatedAssignment && relatedAssignment.status) || "",
      ).toUpperCase();

      var nextBookingStatus =
        assignmentStatus === "COMPLETED" ? "COMPLETED" : "CONFIRMED";
      if (b.status !== nextBookingStatus) {
        b.status = nextBookingStatus;
        changed = true;
      }
    });

    return changed;
  }

  function _upsertLedgerForExistingProviderAssignments() {
    if (!AppStore.data) return false;

    var ledger = AppStore.getTable("revenue_ledger") || [];
    var assignments = AppStore.getTable("job_assignments") || [];
    var bookings = AppStore.getTable("bookings") || [];
    var transactions = AppStore.getTable("transactions") || [];
    var providers = AppStore.getTable("service_providers") || [];
    var units = AppStore.getTable("units") || [];
    var collectives = AppStore.getTable("collectives") || [];
    var superUsers = AppStore.getTable("super_users") || [];

    var superUser = superUsers[0];
    if (!superUser) return false;

    var bookingById = new Map(
      bookings.map(function (b) {
        return [b.booking_id, b];
      }),
    );
    var txnByBookingId = new Map();
    transactions.forEach(function (t) {
      if (String(t.payment_status || "").toUpperCase() === "SUCCESS") {
        txnByBookingId.set(t.booking_id, t);
      }
    });

    var changed = false;

    function upsertEntry(entry) {
      var idx = ledger.findIndex(function (l) {
        return l.transaction_id === entry.transaction_id && l.role === entry.role;
      });

      if (idx >= 0) {
        var existing = ledger[idx];
        var existingStatus = String(existing.payout_status || "").toUpperCase();
        var nextStatus = String(entry.payout_status || "").toUpperCase();
        if (existingStatus !== "PAID" && nextStatus === "PAID") {
          existing.payout_status = "PAID";
          existing.payout_at = entry.payout_at;
          changed = true;
        }
        return;
      }

      ledger.push(entry);
      changed = true;
    }

    assignments.forEach(function (ja) {
      var assignmentStatus = String(ja.status || "").toUpperCase();
      if (assignmentStatus !== "ASSIGNED" && assignmentStatus !== "COMPLETED") {
        return;
      }

      if (!ja.service_provider_id || !ja.booking_id) return;

      var booking = bookingById.get(ja.booking_id);
      if (!booking) return;

      var txn = txnByBookingId.get(ja.booking_id);
      if (!txn) return;

      var provider = providers.find(function (sp) {
        return sp.service_provider_id === ja.service_provider_id;
      });
      if (!provider) return;

      var unit = units.find(function (u) {
        return u.unit_id === provider.unit_id;
      });
      if (!unit) return;

      var collective = collectives.find(function (c) {
        return c.collective_id === unit.collective_id;
      });
      if (!collective) return;

      var bookingSuffix = String(ja.booking_id).replace("BKG", "");
      var totalAmount = Number(txn.amount || 0);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) return;

      var payoutStatus = assignmentStatus === "COMPLETED" ? "PAID" : "PENDING";
      var createdAt =
        txn.verified_at ||
        ja.updated_at ||
        ja.assigned_at ||
        booking.updated_at ||
        booking.created_at ||
        new Date().toISOString();
      var payoutAt =
        payoutStatus === "PAID"
          ? ja.updated_at || txn.verified_at || new Date().toISOString()
          : null;

      upsertEntry({
        ledger_id: "LDG" + bookingSuffix + "_PROVIDER",
        transaction_id: txn.transaction_id,
        booking_id: ja.booking_id,
        role: "provider",
        service_provider_id: provider.service_provider_id,
        amount: Math.round(totalAmount * 0.78 * 100) / 100,
        percentage: 78,
        payout_status: payoutStatus,
        created_at: createdAt,
        payout_at: payoutAt,
      });

      upsertEntry({
        ledger_id: "LDG" + bookingSuffix + "_UNIT_MANAGER",
        transaction_id: txn.transaction_id,
        booking_id: ja.booking_id,
        role: "unit_manager",
        unit_id: unit.unit_id,
        amount: Math.round(totalAmount * 0.07 * 100) / 100,
        percentage: 7,
        payout_status: payoutStatus,
        created_at: createdAt,
        payout_at: payoutAt,
      });

      upsertEntry({
        ledger_id: "LDG" + bookingSuffix + "_COLLECTIVE_MANAGER",
        transaction_id: txn.transaction_id,
        booking_id: ja.booking_id,
        role: "collective_manager",
        collective_id: collective.collective_id,
        amount: Math.round(totalAmount * 0.04 * 100) / 100,
        percentage: 4,
        payout_status: payoutStatus,
        created_at: createdAt,
        payout_at: payoutAt,
      });

      upsertEntry({
        ledger_id: "LDG" + bookingSuffix + "_SUPER_USER",
        transaction_id: txn.transaction_id,
        booking_id: ja.booking_id,
        role: "super_user",
        super_user_id: superUser.super_user_id,
        amount: Math.round(totalAmount * 0.11 * 100) / 100,
        percentage: 11,
        payout_status: payoutStatus,
        created_at: createdAt,
        payout_at: payoutAt,
      });
    });

    AppStore.data.revenue_ledger = ledger;
    return changed;
  }

  function _postReadyAudit() {
    var normalized = _normalizePreExistingProgressStates();
    var ledgerUpdated = _upsertLedgerForExistingProviderAssignments();
    if (normalized || ledgerUpdated) {
      AppStore.save();
    }

    // Run service availability audit after data is loaded
    if (
      window.AssignmentEngine &&
      typeof AssignmentEngine.auditServiceAvailability === "function"
    ) {
      try {
        AssignmentEngine.auditServiceAvailability();
      } catch (e) {
        console.warn("[AppStore] Service availability audit failed:", e);
      }
    }
  }

  if (AppStore.restore()) {
    // Same session — data already loaded from sessionStorage
    _postReadyAudit();
    _resolve();
  } else {
    // First startup or missing local data — fetch from mockData.json
    fetch("../../js/data/mockData.json")
      .then(function (r) {
        if (!r.ok) {
          throw new Error("HTTP " + r.status + " " + r.statusText);
        }
        return r.json();
      })
      .then(function (raw) {
        AppStore.data = JSON.parse(JSON.stringify(raw));
        // Session logic is handled entirely by Auth.login() and requires no action here.
        // Persist the fresh state immediately
        AppStore.save();
        _postReadyAudit();
        _resolve();
      })
      .catch(function (err) {
        console.error("[AppStore] Failed to load mockData.json:", err);
        AppStore.data = JSON.parse(JSON.stringify(EMPTY_DATA));
        _resolve();
      });
  }

  // ── Unified Session State (added for provider UI persistence) ──────────────
  function getProviderSessionId() {
    try {
      var sess =
        sessionStorage.getItem("fsd_session") ||
        localStorage.getItem("fsd_session");
      if (!sess) return null;
      var parsed = JSON.parse(sess);
      if (parsed && parsed.role === "provider" && parsed.id) return parsed.id;
    } catch (e) {}
    return null;
  }

  function mapUiStatusToAssignmentStatus(status) {
    var map = {
      assigned: "ASSIGNED",
      inprogress: "IN_PROGRESS",
      completed: "COMPLETED",
      pending: "PENDING",
      cancelled: "CANCELLED",
    };
    return map[status] || "ASSIGNED";
  }

  function ensureSkillIdByName(skills, skillName) {
    if (!skillName) return null;
    var target = String(skillName).trim().toLowerCase();
    if (!target) return null;

    var existing = skills.find(function (s) {
      return (
        String(s.skill_name || "")
          .trim()
          .toLowerCase() === target
      );
    });

    if (existing) return existing.skill_id;

    var newSkillId = AppStore.nextId("SKL");
    skills.push({
      skill_id: newSkillId,
      skill_name: String(skillName).trim(),
      description: "Added by provider profile update",
    });
    return newSkillId;
  }

  function syncProviderStateToAppStore(state) {
    if (!state || !AppStore || !AppStore.data) return;

    var providerId = getProviderSessionId();
    if (!providerId) return;

    var nowIso = new Date().toISOString();

    var providers = AppStore.getTable("service_providers") || [];
    var provider = providers.find(function (sp) {
      return sp.service_provider_id === providerId;
    });
    if (provider && state.provider) {
      provider.name = state.provider.name || provider.name;
      provider.email = state.provider.email || provider.email;
      provider.phone = state.provider.phone || provider.phone;
      provider.address = state.provider.address || provider.address;
      provider.dob = state.provider.dob || provider.dob;
      provider.gender = state.provider.gender || provider.gender;
      provider.pfp_url = state.provider.pfp_url || provider.pfp_url;
      provider.account_status =
        state.provider.account_status || provider.account_status || "active";
      provider.deactivation_requested =
        state.provider.deactivation_requested !== undefined
          ? state.provider.deactivation_requested
          : provider.deactivation_requested || false;
      provider.is_active =
        state.provider.is_active !== undefined
          ? state.provider.is_active
          : provider.is_active !== undefined
            ? provider.is_active
            : true;
      provider.updated_at = nowIso;
    }

    if (state.provider && Array.isArray(state.provider.skills)) {
      var skills = AppStore.getTable("skills") || [];
      var providerSkills = AppStore.getTable("provider_skills") || [];

      var existingMetaBySkill = {};
      providerSkills.forEach(function (ps) {
        if (ps.service_provider_id === providerId) {
          existingMetaBySkill[ps.skill_id] = {
            verification_status: ps.verification_status,
            verified_at: ps.verified_at,
          };
        }
      });

      for (var i = providerSkills.length - 1; i >= 0; i--) {
        if (providerSkills[i].service_provider_id === providerId) {
          providerSkills.splice(i, 1);
        }
      }

      state.provider.skills.forEach(function (skillName) {
        var skillId = ensureSkillIdByName(skills, skillName);
        if (!skillId) return;
        var meta = existingMetaBySkill[skillId] || {};
        providerSkills.push({
          service_provider_id: providerId,
          skill_id: skillId,
          verification_status: meta.verification_status || "Pending",
          verified_at: meta.verified_at || null,
        });
      });
    }

    if (state.workingHours) {
      var allWH = AppStore.getTable("provider_working_hours") || [];
      var anyUpdated = false;
      allWH.forEach(function (wh) {
        if (wh.service_provider_id === providerId && wh.is_working) {
          wh.hour_start = state.workingHours.start || wh.hour_start;
          wh.hour_end = state.workingHours.end || wh.hour_end;
          anyUpdated = true;
        }
      });

      if (!anyUpdated) {
        allWH.push({
          working_hours_id: AppStore.nextId("WH"),
          day_of_week: "MONDAY",
          hour_start: state.workingHours.start || "08:00",
          hour_end: state.workingHours.end || "18:00",
          is_working: true,
          service_provider_id: providerId,
        });
      }
    }

    if (state.unavailability && typeof state.unavailability === "object") {
      var allUV = AppStore.getTable("provider_unavailability") || [];

      for (var u = allUV.length - 1; u >= 0; u--) {
        if (allUV[u].service_provider_id === providerId) {
          allUV.splice(u, 1);
        }
      }

      Object.keys(state.unavailability).forEach(function (dateKey) {
        var ranges = state.unavailability[dateKey] || [];
        ranges.forEach(function (r) {
          allUV.push({
            unavailability_id: AppStore.nextId("UV"),
            date: dateKey,
            hour_start: r.from,
            hour_end: r.to,
            reason: "Provider blocked time",
            is_recurring: false,
            recurrence_rule: null,
            recurrence_end_date: null,
            created_at: nowIso,
            service_provider_id: providerId,
          });
        });
      });
    }

    if (Array.isArray(state.jobs)) {
      var allJA = AppStore.getTable("job_assignments") || [];
      state.jobs.forEach(function (job) {
        var row = allJA.find(function (ja) {
          return ja.assignment_id === job.id;
        });
        if (!row) return;
        row.status = mapUiStatusToAssignmentStatus(job.status);
        row.updated_at = nowIso;
      });
    }

    var hasResumeFiles =
      state.provider && Array.isArray(state.provider.resumeFiles);
    var hasCertFiles =
      state.provider && Array.isArray(state.provider.certFiles);
    if (hasResumeFiles || hasCertFiles) {
      var allDocs = AppStore.getTable("provider_documents") || [];

      for (var d = allDocs.length - 1; d >= 0; d--) {
        if (allDocs[d].service_provider_id === providerId) {
          allDocs.splice(d, 1);
        }
      }

      var pushDoc = function (file, docType) {
        if (!file || !file.name) return;
        allDocs.push({
          doc_id: AppStore.nextId("DOC"),
          service_provider_id: providerId,
          doc_type: docType,
          file_url: "mock://uploads/" + encodeURIComponent(file.name),
          file_name: file.name,
          uploaded_at: nowIso,
        });
      };

      (state.provider.resumeFiles || []).forEach(function (f) {
        pushDoc(f, "RESUME");
      });
      (state.provider.certFiles || []).forEach(function (f) {
        pushDoc(f, "CERTIFICATE");
      });
    }
  }

  window.initData = function () {
    return new Promise(function (resolve) {
      var expectedId = null;
      var shouldBlockForMaintenance = false;
      var shouldBlockProvider = false;
      var hasProviderSession = false;
      try {
        var platformSettings = AppStore.getPlatformSettings
          ? AppStore.getPlatformSettings()
          : getPlatformSettingsFromStorage();
        shouldBlockForMaintenance = !!(
          platformSettings && platformSettings.maintenanceMode
        );

        var sess =
          sessionStorage.getItem("fsd_session") ||
          localStorage.getItem("fsd_session");
        if (sess) {
          var p = JSON.parse(sess);
          if (p.role === "provider" && p.id) {
            hasProviderSession = true;
            expectedId = p.id;
            shouldBlockProvider = !!(
              platformSettings && platformSettings.accountSuspension
            );
          }
        }
      } catch (e) {}

      if (!hasProviderSession) {
        window.location.replace("/front-end/html/auth_pages/login.html");
        resolve();
        return;
      }

      if (shouldBlockForMaintenance) {
        sessionStorage.removeItem("fsd_session");
        localStorage.removeItem("fsd_session");
        window.location.replace(
          "/front-end/html/landing_page.html?maintenance=1",
        );
        resolve();
        return;
      }

      if (shouldBlockProvider) {
        sessionStorage.removeItem("fsd_session");
        localStorage.removeItem("fsd_session");
        window.location.replace(
          "/front-end/html/auth_pages/login.html?error=provider_suspended",
        );
        resolve();
        return;
      }

      var existing =
        localStorage.getItem("fsd_ui_state") ||
        sessionStorage.getItem("fsd_ui_state");
      if (existing) {
        var parsedExisting = JSON.parse(existing);
        if (
          parsedExisting.provider &&
          parsedExisting.provider.service_provider_id === expectedId
        ) {
          resolve();
          return;
        }
      }
      AppStore.ready.then(function () {
        var providerId = expectedId;

        var jobs = [];
        var allJA = AppStore.getTable("job_assignments") || [];
        var allBK = AppStore.getTable("bookings") || [];
        var allCUS = AppStore.getTable("customers") || [];
        var allSVC = AppStore.getTable("services") || [];
        var allCAT = AppStore.getTable("categories") || [];
        var allBS = AppStore.getTable("booking_services") || [];

        var allSP = AppStore.getTable("service_providers") || [];
        var allWH = AppStore.getTable("provider_working_hours") || [];
        var allUV = AppStore.getTable("provider_unavailability") || [];

        var allSkills = AppStore.getTable("skills") || [];
        var allProviderSkills = AppStore.getTable("provider_skills") || [];

        var providerProfile =
          allSP.find(function (sp) {
            return sp.service_provider_id === providerId;
          }) || {};

        providerProfile.skills = [];
        providerProfile.account_status =
          providerProfile.account_status ||
          (providerProfile.is_active ? "active" : "inactive");
        providerProfile.deactivation_requested =
          providerProfile.deactivation_requested || false;
        var mySkills = allProviderSkills.filter(function (ps) {
          return ps.service_provider_id === providerId;
        });
        mySkills.forEach(function (ps) {
          var skillObj = allSkills.find((s) => s.skill_id === ps.skill_id);
          if (skillObj) {
            providerProfile.skills.push(skillObj.skill_name);
          }
        });

        var providerWH = allWH.filter(function (wh) {
          return wh.service_provider_id === providerId && wh.is_working;
        });
        var workStart =
          providerWH.length > 0 ? providerWH[0].hour_start : "08:00";
        var workEnd = providerWH.length > 0 ? providerWH[0].hour_end : "18:00";

        var unavailMap = {};
        allUV.forEach(function (uv) {
          if (uv.service_provider_id === providerId) {
            if (!unavailMap[uv.date]) unavailMap[uv.date] = [];
            unavailMap[uv.date].push({ from: uv.hour_start, to: uv.hour_end });
          }
        });

        allJA.forEach(function (ja) {
          if (ja.service_provider_id === providerId) {
            var bkg = allBK.find((b) => b.booking_id === ja.booking_id) || {};
            var cus =
              allCUS.find((c) => c.customer_id === bkg.customer_id) || {};

            var bsList = allBS.filter((bs) => bs.booking_id === bkg.booking_id);
            var serviceName = "General Service";
            var catName = "General";
            if (bsList.length > 0) {
              var svc = allSVC.find(
                (s) => s.service_id === bsList[0].service_id,
              );
              if (svc) {
                serviceName = svc.service_name;
                var cat = allCAT.find((c) => c.category_id === svc.category_id);
                if (cat) catName = cat.category_name;
              }
            }

            var statusMap = {
              ASSIGNED: "assigned",
              IN_PROGRESS: "inprogress",
              COMPLETED: "completed",
              CANCELLED: "cancelled",
              PENDING: "pending",
            };
            var uiStatus = statusMap[ja.status] || "assigned";
            var labelMap = {
              assigned: "Assigned",
              inprogress: "In Progress",
              completed: "Completed",
              pending: "Pending Confirmation",
              cancelled: "Cancelled",
            };

            var totalPrice = 0;
            if (bsList && bsList.length > 0) {
              totalPrice = bsList.reduce(function (acc, bs) {
                return acc + (bs.price_at_booking || 0);
              }, 0);
            }

            jobs.push({
              id: ja.assignment_id,
              booking_id: ja.booking_id,
              service: serviceName,
              category: catName,
              customer: cus.full_name || cus.name || "Unknown User",
              address: bkg.service_address || "Unknown Address",
              phone: cus.phone || "9876543210",
              date: ja.scheduled_date,
              time: ja.hour_start + " - " + ja.hour_end,
              startTime: ja.hour_start,
              endTime: ja.hour_end,
              status: uiStatus,
              statusLabel: labelMap[uiStatus],
              description:
                ja.notes || "Complete service according to standards.",
              price: totalPrice,
            });
          }
        });

        jobs.sort(function (a, b) {
          if (a.date !== b.date) return a.date > b.date ? 1 : -1;
          return a.startTime > b.startTime ? 1 : -1;
        });

        var totalCompletedCount = jobs.filter(function (j) {
          return j.status === "completed";
        }).length;
        var totalCompletedSum = jobs
          .filter(function (j) {
            return j.status === "completed";
          })
          .reduce(function (acc, j) {
            return acc + (j.price || 0);
          }, 0);
        var totalPendingSum = jobs
          .filter(function (j) {
            return (
              j.status === "inprogress" ||
              j.status === "assigned" ||
              j.status === "pending"
            );
          })
          .reduce(function (acc, j) {
            return acc + (j.price || 0);
          }, 0);
        var avgTicket =
          totalCompletedCount > 0
            ? Math.round(totalCompletedSum / totalCompletedCount)
            : 0;

        var state = {
          provider: providerProfile,
          workingHours: { start: workStart, end: workEnd },
          jobs: jobs,
          unavailability: unavailMap,
          stats: [
            { label: "Completed Jobs", value: totalCompletedCount },
            {
              label: "Avg. Ticket",
              value: "₹" + avgTicket.toLocaleString("en-IN"),
            },
            {
              label: "Pending Payout",
              value: "₹" + totalPendingSum.toLocaleString("en-IN"),
            },
            {
              label: "Cancelled",
              value: jobs.filter(function (j) {
                return j.status === "cancelled";
              }).length,
            },
          ],
          notifications: [
            {
              id: 101,
              type: "job",
              category: "Jobs",
              unread: true,
              title: "New Job Assigned",
              time: "2 hours ago",
              desc: "You have been assigned a new service request. Please check your schedule.",
              actions: [
                {
                  label: "View Job Details",
                  cls: "btn-primary-action",
                  href: "assigned-jobs.html",
                },
                { label: "Dismiss", cls: "btn-dismiss", action: "dismiss" },
              ],
            },
            {
              id: 102,
              type: "payment",
              category: "Payments",
              unread: true,
              title: "Payment Processing",
              time: "5 hours ago",
              desc: "Your latest payout has been initiated and will reflect shortly.",
              actions: [
                {
                  label: "View Earnings",
                  cls: "btn-outline-action",
                  href: "earnings.html",
                },
              ],
            },
            {
              id: 103,
              type: "account",
              category: "Account",
              unread: false,
              title: "Identity Verification Required",
              time: "Yesterday",
              desc: "Please upload the renewed document to avoid service interruption.",
              actions: [
                {
                  label: "Update Profile",
                  cls: "btn-orange-action",
                  href: "profile.html",
                },
              ],
            },
          ],
        };

        // Inject dynamic provider notifications from AssignmentEngine
        if (
          window.AssignmentEngine &&
          typeof AssignmentEngine.getProviderNotifications === "function"
        ) {
          var dynamicNotifs =
            AssignmentEngine.getProviderNotifications(providerId);
          if (dynamicNotifs && dynamicNotifs.length > 0) {
            dynamicNotifs.forEach(function (dn) {
              // Only inject if not already present by id
              var exists = state.notifications.some(function (n) {
                return n.id === dn.id;
              });
              if (!exists) {
                state.notifications.unshift(dn);
              }
            });
          }
        }

        localStorage.setItem("fsd_ui_state", JSON.stringify(state));
        // Remove legacy session copy to avoid stale reads in current tab.
        sessionStorage.removeItem("fsd_ui_state");
        resolve();
      });
    });
  };

  window.getData = function () {
    var raw =
      localStorage.getItem("fsd_ui_state") ||
      sessionStorage.getItem("fsd_ui_state");
    return raw ? JSON.parse(raw) : null;
  };

  window.setData = function (data) {
    localStorage.setItem("fsd_ui_state", JSON.stringify(data));
    // Remove legacy session copy to keep a single source of truth.
    sessionStorage.removeItem("fsd_ui_state");

    var syncAndSave = function () {
      try {
        syncProviderStateToAppStore(data);
        AppStore.save();
      } catch (err) {
        console.error("[AppStore] Provider sync failed:", err);
      }
    };

    if (AppStore && AppStore.data) {
      syncAndSave();
    } else if (
      AppStore &&
      AppStore.ready &&
      typeof AppStore.ready.then === "function"
    ) {
      AppStore.ready.then(syncAndSave);
    }
  };

  function resolveCustomerId(customerId) {
    if (customerId) return customerId;
    try {
      var raw = sessionStorage.getItem("fsd_session");
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (!session || session.role !== "customer") return null;
      return session.id || null;
    } catch (e) {
      return null;
    }
  }

  function ensureCustomerState() {
    if (!AppStore || !AppStore.data) return null;
    if (!AppStore.data.customer_state) {
      AppStore.data.customer_state = {
        carts: {},
        checkout_meta: {},
      };
    }
    if (!AppStore.data.customer_state.carts) {
      AppStore.data.customer_state.carts = {};
    }
    if (!AppStore.data.customer_state.checkout_meta) {
      AppStore.data.customer_state.checkout_meta = {};
    }
    return AppStore.data.customer_state;
  }

  function readLegacyCart() {
    try {
      return JSON.parse(localStorage.getItem("tu_cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  function readLegacyCheckoutMeta() {
    var bookingId = localStorage.getItem("tu_last_booking_id");
    var paymentMethod = localStorage.getItem("tu_last_payment_method");
    var total = localStorage.getItem("tu_last_total");
    if (!bookingId && !paymentMethod && !total) return null;
    return {
      last_booking_id: bookingId || null,
      last_payment_method: paymentMethod || null,
      last_total: total || null,
    };
  }

  function clearLegacyCheckoutMeta() {
    localStorage.removeItem("tu_last_booking_id");
    localStorage.removeItem("tu_last_payment_method");
    localStorage.removeItem("tu_last_total");
  }

  window.CustomerState = {
    getCart: function (customerId) {
      var resolvedId = resolveCustomerId(customerId);
      if (!resolvedId) return [];

      if (!AppStore || !AppStore.data) {
        return readLegacyCart();
      }

      var state = ensureCustomerState();
      var existing = state.carts[resolvedId];
      if (Array.isArray(existing)) {
        return existing;
      }

      var legacyCart = readLegacyCart();
      if (legacyCart.length > 0) {
        state.carts[resolvedId] = legacyCart;
        AppStore.save();
        localStorage.removeItem("tu_cart");
        return legacyCart;
      }

      return [];
    },

    setCart: function (customerId, cart) {
      var resolvedId = resolveCustomerId(customerId);
      if (!resolvedId || !AppStore || !AppStore.data) return false;
      var state = ensureCustomerState();
      state.carts[resolvedId] = Array.isArray(cart) ? cart : [];
      AppStore.save();
      localStorage.removeItem("tu_cart");
      return true;
    },

    clearCart: function (customerId) {
      return this.setCart(customerId, []);
    },

    getCheckoutMeta: function (customerId) {
      var resolvedId = resolveCustomerId(customerId);
      if (!resolvedId) return null;

      if (!AppStore || !AppStore.data) {
        return readLegacyCheckoutMeta();
      }

      var state = ensureCustomerState();
      var existing = state.checkout_meta[resolvedId] || null;
      if (existing) {
        return existing;
      }

      var legacyMeta = readLegacyCheckoutMeta();
      if (legacyMeta) {
        state.checkout_meta[resolvedId] = legacyMeta;
        AppStore.save();
        clearLegacyCheckoutMeta();
        return legacyMeta;
      }

      return null;
    },

    setCheckoutMeta: function (customerId, meta) {
      var resolvedId = resolveCustomerId(customerId);
      if (!resolvedId || !AppStore || !AppStore.data) return false;
      var state = ensureCustomerState();
      state.checkout_meta[resolvedId] = Object.assign({}, meta || {});
      AppStore.save();
      clearLegacyCheckoutMeta();
      return true;
    },
  };
})();
