/**
 * Revenue Ledger Generator Utility — API-backed
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

  /**
   * _fetchData()
   * Fetches all required tables from the API. Returns a data bundle.
   */
  _fetchData: async function () {
    const endpoints = {
      bookings: "/bookings",
      transactions: "/transactions",
      revenue_ledger: "/revenue-ledger",
      job_assignments: "/job-assignments",
      service_providers: "/service-providers",
      units: "/units",
      collectives: "/collectives",
      super_users: "/super-users",
    };
    const data = {};
    await Promise.all(Object.entries(endpoints).map(async ([key, url]) => {
      data[key]  = await Api.get(url);
    }));
    return data;
  },

  /**
   * Create ledger entries for a booking.
   * Default state is PENDING at booking time; later transitioned to PAID on completion.
   */
  ensureLedgerEntriesForBooking: async function (bookingId, options) {
    const opts = Object.assign({ payoutStatus: "PENDING" }, options || {});
    const data = await this._fetchData();

    // Find the booking
    const booking = data.bookings?.find((b) => b.booking_id === bookingId);
    if (!booking) { console.warn(`[RevenueManager] Booking not found: ${bookingId}`); return false; }

    // Find the transaction for this booking
    const transaction = data.transactions?.find((t) => t.booking_id === bookingId);
    if (!transaction) { console.warn(`[RevenueManager] No transaction found for booking: ${bookingId}`); return false; }

    // Only create ledger entries for successful transactions
    if (transaction.payment_status !== "SUCCESS") { return false; }

    // Check if ledger entries already exist for this transaction
    const existingEntries = data.revenue_ledger?.filter((l) => l.transaction_id === transaction.transaction_id);
    if (existingEntries && existingEntries.length > 0) {
      return await this.updatePayoutStatusForBooking(bookingId, opts.payoutStatus);
    }

    // Find the provider assigned to this booking
    const jobAssignment = data.job_assignments?.find((ja) => ja.booking_id === bookingId);
    const providerId = (jobAssignment && jobAssignment.service_provider_id) || opts.providerId;
    if (!providerId) { console.warn(`[RevenueManager] No provider found for booking: ${bookingId}`); return false; }

    const provider = data.service_providers?.find((sp) => sp.service_provider_id === providerId);
    if (!provider) { console.warn(`[RevenueManager] Provider not found: ${providerId}`); return false; }

    // Get unit and collective info
    const unit = data.units?.find((u) => u.unit_id === provider.unit_id);
    if (!unit) { console.warn(`[RevenueManager] Unit not found for provider: ${provider.service_provider_id}`); return false; }

    const collective = data.collectives?.find((c) => c.collective_id === unit.collective_id);
    if (!collective) { console.warn(`[RevenueManager] Collective not found for unit: ${unit.unit_id}`); return false; }

    const superUser = data.super_users?.[0];
    if (!superUser) { console.warn(`[RevenueManager] No super user found`); return false; }

    const payoutStatus = String(opts.payoutStatus || "PENDING").toUpperCase();
    const payoutAtValue = payoutStatus === "PAID" ? (transaction.verified_at || new Date().toISOString()) : null;
    const totalAmount = transaction.amount;

    const entries = [
      { role: "provider", service_provider_id: provider.service_provider_id, amount: Math.round(totalAmount * this.SPLITS.provider * 100) / 100, percentage: 78 },
      { role: "unit_manager", unit_id: unit.unit_id, amount: Math.round(totalAmount * this.SPLITS.unit_manager * 100) / 100, percentage: 7 },
      { role: "collective_manager", collective_id: collective.collective_id, amount: Math.round(totalAmount * this.SPLITS.collective_manager * 100) / 100, percentage: 4 },
      { role: "super_user", super_user_id: superUser.super_user_id, amount: Math.round(totalAmount * this.SPLITS.super_user * 100) / 100, percentage: 11 },
    ];

    // Post ledger entries to API
    for (const entry of entries) {
      try {
        await Api.post("/revenue-ledger", {
          transaction_id: transaction.transaction_id,
          booking_id: bookingId,
          ...entry,
          payout_status: payoutStatus,
          payout_at: payoutAtValue,
        });
      } catch (err) {
        console.warn(`[RevenueManager] Failed to create ledger entry for ${entry.role}:`, err);
      }
    }

    console.log(`[RevenueManager] ✅ Created 4 ${payoutStatus} ledger entries for booking ${bookingId}`);
    return true;
  },

  updatePayoutStatusForBooking: async function (bookingId, payoutStatus) {
    const normalizedStatus = String(payoutStatus || "PENDING").toUpperCase();
    try {
      await Api.patch("/revenue-ledger/booking/" + bookingId + "/payout", { payout_status: normalizedStatus });
      return true;
    } catch (_) {
      return false;
    }
  },

  markBookingPayoutPaid: async function (bookingId) {
    const updated = await this.updatePayoutStatusForBooking(bookingId, "PAID");
    if (updated) return true;
    return await this.ensureLedgerEntriesForBooking(bookingId, { payoutStatus: "PAID" });
  },

  // Backward compatible alias
  generateLedgerEntriesForBooking: function (bookingId) {
    return this.ensureLedgerEntriesForBooking(bookingId, { payoutStatus: "PAID" });
  },
};

// Expose globally
window.RevenueManager = RevenueManager;
