/**
 * Revenue Ledger Generator Utility
 * Automatically creates ledger entries when a task is completed
 * Revenue split: Provider 78%, Unit Manager 7%, Collective Manager 4%, Super User 11%
 */

const RevenueManager = {
  // Revenue split percentages
  SPLITS: {
    provider: 0.78,
    unit_manager: 0.07,
    collective_manager: 0.04,
    super_user: 0.11,
  },

  _readUiState: function () {
    if (window.getData && typeof window.getData === "function") {
      try {
        return window.getData() || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  _readAppStoreState: function () {
    if (window.AppStore && AppStore.data) {
      return AppStore.data;
    }
    if (window.AppStore && typeof AppStore.getTable === "function") {
      return {
        bookings: AppStore.getTable("bookings") || [],
        transactions: AppStore.getTable("transactions") || [],
        revenue_ledger: AppStore.getTable("revenue_ledger") || [],
        job_assignments: AppStore.getTable("job_assignments") || [],
        service_providers: AppStore.getTable("service_providers") || [],
        units: AppStore.getTable("units") || [],
        collectives: AppStore.getTable("collectives") || [],
        super_users: AppStore.getTable("super_users") || [],
      };
    }
    return null;
  },

  _readData: function () {
    // AppStore is the source of truth for earnings pages.
    const appState = this._readAppStoreState();
    if (appState) return appState;
    return this._readUiState();
  },

  _writeData: function (data) {
    if (window.AppStore && AppStore.data) {
      if (Array.isArray(data.revenue_ledger)) {
        AppStore.data.revenue_ledger = data.revenue_ledger;
      }
      if (Array.isArray(data.bookings)) {
        AppStore.data.bookings = data.bookings;
      }
      if (Array.isArray(data.transactions)) {
        AppStore.data.transactions = data.transactions;
      }
      if (Array.isArray(data.job_assignments)) {
        AppStore.data.job_assignments = data.job_assignments;
      }
      if (typeof AppStore.save === "function") {
        AppStore.save();
      }
    }

    // Mirror to UI state for pages that still depend on getData().
    if (window.setData && typeof window.setData === "function") {
      const uiState = this._readUiState();
      if (uiState) {
        if (Array.isArray(data.revenue_ledger)) {
          uiState.revenue_ledger = data.revenue_ledger;
        }
        if (Array.isArray(data.bookings)) {
          uiState.bookings = data.bookings;
        }
        if (Array.isArray(data.transactions)) {
          uiState.transactions = data.transactions;
        }
        if (Array.isArray(data.job_assignments)) {
          uiState.job_assignments = data.job_assignments;
        }
        window.setData(uiState);
      }
    }
  },

  /**
   * Create ledger entries for a booking.
   * Default state is PENDING at booking time; later transitioned to PAID on completion.
   */
  ensureLedgerEntriesForBooking: function (bookingId, options) {
    const opts = Object.assign(
      {
        payoutStatus: "PENDING",
      },
      options || {},
    );
    const data = this._readData();
    if (!data) {
      console.warn("[RevenueManager] Data store is not ready yet");
      return false;
    }

    // Find the booking
    const booking = data.bookings?.find((b) => b.booking_id === bookingId);
    if (!booking) {
      console.warn(`[RevenueManager] Booking not found: ${bookingId}`);
      return false;
    }

    // Find the transaction for this booking
    const transaction = data.transactions?.find(
      (t) => t.booking_id === bookingId,
    );
    if (!transaction) {
      console.warn(
        `[RevenueManager] No transaction found for booking: ${bookingId}`,
      );
      return false;
    }

    // Only create ledger entries for successful transactions
    if (transaction.payment_status !== "SUCCESS") {
      console.log(
        `[RevenueManager] Transaction ${transaction.transaction_id} is not SUCCESS (status: ${transaction.payment_status}), skipping ledger creation`,
      );
      return false;
    }

    // Check if ledger entries already exist for this transaction
    const existingEntries = data.revenue_ledger?.filter(
      (l) => l.transaction_id === transaction.transaction_id,
    );
    if (existingEntries && existingEntries.length > 0) {
      return this.updatePayoutStatusForBooking(bookingId, opts.payoutStatus);
    }

    // Find the provider assigned to this booking
    const jobAssignment = data.job_assignments?.find(
      (ja) => ja.booking_id === bookingId,
    );

    const providerId =
      (jobAssignment && jobAssignment.service_provider_id) || opts.providerId;
    if (!providerId) {
      console.warn(
        `[RevenueManager] No provider information found for booking: ${bookingId}`,
      );
      return false;
    }

    const provider = data.service_providers?.find(
      (sp) => sp.service_provider_id === providerId,
    );
    if (!provider) {
      console.warn(
        `[RevenueManager] Provider not found: ${providerId}`,
      );
      return false;
    }

    // Get unit and collective manager info
    const unit = data.units?.find((u) => u.unit_id === provider.unit_id);
    if (!unit) {
      console.warn(
        `[RevenueManager] Unit not found for provider: ${provider.service_provider_id}`,
      );
      return false;
    }

    const collective = data.collectives?.find(
      (c) => c.collective_id === unit.collective_id,
    );
    if (!collective) {
      console.warn(
        `[RevenueManager] Collective not found for unit: ${unit.unit_id}`,
      );
      return false;
    }

    const superUser = data.super_users?.[0];
    if (!superUser) {
      console.warn(`[RevenueManager] No super user found on platform`);
      return false;
    }

    const payoutStatus = String(opts.payoutStatus || "PENDING").toUpperCase();
    const payoutAtValue =
      payoutStatus === "PAID"
        ? transaction.verified_at || new Date().toISOString()
        : null;

    // Calculate amounts
    const totalAmount = transaction.amount;
    const entries = [
      {
        ledger_id: `LDG${bookingId.replace("BKG", "")}_PROVIDER`,
        transaction_id: transaction.transaction_id,
        booking_id: bookingId,
        role: "provider",
        service_provider_id: provider.service_provider_id,
        amount: Math.round(totalAmount * this.SPLITS.provider * 100) / 100,
        percentage: 78,
        payout_status: payoutStatus,
        created_at: transaction.verified_at || new Date().toISOString(),
        payout_at: payoutAtValue,
      },
      {
        ledger_id: `LDG${bookingId.replace("BKG", "")}_UNIT_MANAGER`,
        transaction_id: transaction.transaction_id,
        booking_id: bookingId,
        role: "unit_manager",
        unit_id: unit.unit_id,
        amount: Math.round(totalAmount * this.SPLITS.unit_manager * 100) / 100,
        percentage: 7,
        payout_status: payoutStatus,
        created_at: transaction.verified_at || new Date().toISOString(),
        payout_at: payoutAtValue,
      },
      {
        ledger_id: `LDG${bookingId.replace("BKG", "")}_COLLECTIVE_MANAGER`,
        transaction_id: transaction.transaction_id,
        booking_id: bookingId,
        role: "collective_manager",
        collective_id: collective.collective_id,
        amount:
          Math.round(totalAmount * this.SPLITS.collective_manager * 100) / 100,
        percentage: 4,
        payout_status: payoutStatus,
        created_at: transaction.verified_at || new Date().toISOString(),
        payout_at: payoutAtValue,
      },
      {
        ledger_id: `LDG${bookingId.replace("BKG", "")}_SUPER_USER`,
        transaction_id: transaction.transaction_id,
        booking_id: bookingId,
        role: "super_user",
        super_user_id: superUser.super_user_id,
        amount: Math.round(totalAmount * this.SPLITS.super_user * 100) / 100,
        percentage: 11,
        payout_status: payoutStatus,
        created_at: transaction.verified_at || new Date().toISOString(),
        payout_at: payoutAtValue,
      },
    ];

    // Add all 4 ledger entries to data
    if (!data.revenue_ledger) {
      data.revenue_ledger = [];
    }

    data.revenue_ledger.push(...entries);
    this._writeData(data);

    console.log(
      `[RevenueManager] ✅ Created 4 ${payoutStatus} ledger entries for booking ${bookingId}:`,
      entries,
    );

    return true;
  },

  updatePayoutStatusForBooking: function (bookingId, payoutStatus) {
    const data = this._readData();
    if (!data || !data.revenue_ledger) return false;

    const normalizedStatus = String(payoutStatus || "PENDING").toUpperCase();
    const related = data.revenue_ledger.filter(
      (l) => l.booking_id === bookingId,
    );
    if (!related.length) return false;

    const paidAt = new Date().toISOString();
    related.forEach((entry) => {
      entry.payout_status = normalizedStatus;
      entry.payout_at = normalizedStatus === "PAID" ? paidAt : null;
    });
    this._writeData(data);
    return true;
  },

  markBookingPayoutPaid: function (bookingId) {
    const updated = this.updatePayoutStatusForBooking(bookingId, "PAID");
    if (updated) return true;
    return this.ensureLedgerEntriesForBooking(bookingId, {
      payoutStatus: "PAID",
    });
  },

  // Backward compatible alias
  generateLedgerEntriesForBooking: function (bookingId) {
    return this.ensureLedgerEntriesForBooking(bookingId, {
      payoutStatus: "PAID",
    });
  },
};

// Expose globally
window.RevenueManager = RevenueManager;
