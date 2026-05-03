/* super_user_dashboard.js — Simplified for Revenue Breakdown Only */

(async () => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(["super_user"]);
  if (!session) return;

  /* ── 2. Pull from API ── */
  let allTransactions = [];
  let allLedger = [];

  allTransactions = await Api.get("/transactions");
  allLedger = await Api.get("/revenue-ledger");

  /* ── 3. Render Revenue ── */
  function renderRevenue() {
    const roleOrder = [
      { role: "provider", label: "Providers (78%)" },
      { role: "unit_manager", label: "Unit Managers (8%)" },
      { role: "collective_manager", label: "Collective Managers (4%)" },
      { role: "super_user", label: "Platform / Super User (10%)" },
    ];

    const revenueByRole = {
      provider: { amount: 0 },
      unit_manager: { amount: 0 },
      collective_manager: { amount: 0 },
      super_user: { amount: 0 },
    };

    allLedger.forEach((entry) => {
      if (entry.payout_status === "DISBURSED") {
        revenueByRole.provider.amount += Number(entry.provider_amount || 0);
        revenueByRole.unit_manager.amount += Number(entry.um_amount || 0);
        revenueByRole.collective_manager.amount += Number(entry.cm_amount || 0);
        revenueByRole.super_user.amount += Number(entry.platform_amount || 0);
      }
    });

    let totalGMV = 0;
    allTransactions.forEach((tx) => {
      if (tx.payment_status === "SUCCESS" || tx.payment_status === "COMPLETED") {
        totalGMV += Number(tx.amount || 0) - Number(tx.refund_amount || 0);
      }
    });

    const formatInr = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

    const gmvEl = document.getElementById("revenueGmvValue");
    if (gmvEl) gmvEl.textContent = formatInr(totalGMV);

    const barsEl = document.getElementById("revenue-breakdown-bars");
    if (barsEl) {
      const peakAmount = Math.max(
        ...roleOrder.map((roleMeta) => revenueByRole[roleMeta.role].amount), 0,
      );

      barsEl.innerHTML = roleOrder
        .map((roleMeta) => {
          const amount = revenueByRole[roleMeta.role].amount;
          const widthPct = peakAmount > 0 ? (amount / peakAmount) * 100 : 0;
          return `
            <div class="revenue-role-item">
              <div class="revenue-role-head">
                <span class="revenue-role-name">${roleMeta.label}</span>
                <span class="revenue-role-value">${formatInr(amount)}</span>
              </div>
              <div class="revenue-role-track">
                <div class="revenue-role-fill revenue-role-fill--${roleMeta.role}" style="width: ${widthPct.toFixed(1)}%;"></div>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  /* ── 4. Initialize ── */
  renderRevenue();
})();
