// ── Region Manager: Revenue Reports JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  let ledgerRows = [];
  try {
    const res = await Api.get('/revenue-ledger/my', { silent: true });
    ledgerRows = Array.isArray(res) ? res : (res && res.rows ? res.rows : []);
  } catch (_) {}

  // If ledger is empty, fetch all ledger rows or fallback to transactions
  if (!ledgerRows || ledgerRows.length === 0) {
    try {
      const allLedger = await Api.get('/revenue-ledger', { silent: true }) || [];
      const myProviders = await Api.get('/service-providers', { silent: true }) || [];
      const regionProviders = myProviders.filter(p => p.region_id === session.region_id);
      const providerIds = new Set(regionProviders.map(p => p.sp_id));
      ledgerRows = allLedger.filter(r => providerIds.has(r.sp_id) || r.rm_id === session.id);
    } catch (_) {}
  }

  const totalGMV = ledgerRows.reduce((sum, r) => sum + (r.provider_amount || 0) + (r.platform_amount || 0), 0);
  const providerEarnings = ledgerRows.reduce((sum, r) => sum + (r.provider_amount || 0), 0);
  const platformRevenue = ledgerRows.reduce((sum, r) => sum + (r.platform_amount || 0), 0);

  // Set values for both card layouts
  setText('statTotalRevenue', '₹' + Math.round(totalGMV).toLocaleString('en-IN'));
  setText('statProviderPayout', '₹' + Math.round(providerEarnings).toLocaleString('en-IN'));
  setText('statPlatformRevenue', '₹' + Math.round(platformRevenue).toLocaleString('en-IN'));

  setText('stat-revenue', '₹' + Math.round(totalGMV).toLocaleString('en-IN'));
  setText('stat-bookings', ledgerRows.length.toString());
  const aov = ledgerRows.length > 0 ? Math.round(totalGMV / ledgerRows.length) : 0;
  setText('stat-aov', '₹' + aov.toLocaleString('en-IN'));

  renderLedgerTable(ledgerRows);
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderLedgerTable(rows) {
  const tbody = document.getElementById('ledger-tbody') || document.querySelector('tbody');
  if (!tbody) return;
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No revenue transactions found for this region.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="padding:12px;">${(r.ledger_id || r.id || '').substring(0, 10)}</td>
      <td style="padding:12px;">${r.booking_id || 'BKG-101'}</td>
      <td style="padding:12px;font-weight:600;color:#16a34a;">₹${r.provider_amount || 0} (85%)</td>
      <td style="padding:12px;font-weight:600;color:#2563eb;">₹${r.platform_amount || 0} (15%)</td>
      <td style="padding:12px;"><span style="background:rgba(34,197,94,0.15);color:#16a34a;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;">${r.payout_status || 'DISBURSED'}</span></td>
    </tr>
  `).join('');
}
