// ── Region Manager: Revenue Reports JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  let allProviders = [];
  try {
    allProviders = await Api.get('/service-providers', { silent: true }) || [];
  } catch (_) {}

  const regionProviders = (allProviders || []).filter(p => p.region_id === session.region_id);
  setText('stat-providers', regionProviders.length.toString());

  let ledgerRows = [];
  try {
    const res = await Api.get('/revenue-ledger/my', { silent: true });
    ledgerRows = Array.isArray(res) ? res : (res && res.rows ? res.rows : []);
  } catch (_) {}

  if (!ledgerRows || ledgerRows.length === 0) {
    try {
      const allLedger = await Api.get('/revenue-ledger', { silent: true }) || [];
      const providerIds = new Set(regionProviders.map(p => p.sp_id || p.service_provider_id));
      ledgerRows = allLedger.filter(r => (r.rm_id === session.id) || providerIds.has(r.sp_id || r.service_provider_id));
    } catch (_) {}
  }

  if (ledgerRows && ledgerRows.length > 0 && session.region_id) {
    const providerIds = new Set(regionProviders.map(p => p.sp_id || p.service_provider_id));
    ledgerRows = ledgerRows.filter(r => (r.rm_id === session.id) || providerIds.has(r.sp_id || r.service_provider_id));
  }

  const totalGMV = ledgerRows.reduce((sum, r) => sum + (r.provider_amount || 0) + (r.platform_amount || 0), 0);
  const providerEarnings = ledgerRows.reduce((sum, r) => sum + (r.provider_amount || 0), 0);
  const platformRevenue = ledgerRows.reduce((sum, r) => sum + (r.platform_amount || 0), 0);

  setText('statTotalRevenue', '₹' + Math.round(totalGMV).toLocaleString('en-IN'));
  setText('statProviderPayout', '₹' + Math.round(providerEarnings).toLocaleString('en-IN'));
  setText('statPlatformRevenue', '₹' + Math.round(platformRevenue).toLocaleString('en-IN'));

  setText('stat-revenue', '₹' + Math.round(totalGMV).toLocaleString('en-IN'));
  setText('stat-bookings', ledgerRows.length.toString());
  const aov = ledgerRows.length > 0 ? Math.round(totalGMV / ledgerRows.length) : 0;
  setText('stat-aov', '₹' + aov.toLocaleString('en-IN'));

  renderRevenueTable(ledgerRows);
  renderCharts(ledgerRows);
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderRevenueTable(rows) {
  const tbody = document.getElementById('revTableBody');
  if (!tbody) return;
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#64748b;">No revenue transactions found for this region.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="padding:12px;">${r.customer_name || 'Unknown customer'}</td>
      <td style="padding:12px;">${r.category_name || 'Unknown category'}</td>
      <td style="padding:12px;font-weight:600;color:#16a34a;">₹${Math.round((r.provider_amount || 0) + (r.platform_amount || 0)).toLocaleString('en-IN')}</td>
      <td style="padding:12px;">${r.payout_status || '—'}</td>
    </tr>
  `).join('');
}

function renderCharts(rows) {
  if (typeof Chart === 'undefined') return;
  const bookingLabels = rows.map(r => r.customer_name || 'Unknown customer');
  const bookingRevenue = rows.map(r => (r.provider_amount || 0) + (r.platform_amount || 0));
  const categoryLabels = [...new Set(rows.map(r => r.category_name || 'Unknown category'))];
  const categoryBookings = categoryLabels.map(categoryName => rows.filter(r => (r.category_name || 'Unknown category') === categoryName).length);
  const categoryRevenue = categoryLabels.map(categoryName => rows
    .filter(r => (r.category_name || 'Unknown category') === categoryName)
    .reduce((sum, r) => sum + (r.provider_amount || 0) + (r.platform_amount || 0), 0));
  const configs = [
    ['lineChart', { type: 'line', data: { labels: bookingLabels, datasets: [{ label: 'Revenue by Customer', data: bookingRevenue, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.12)', fill: true, tension: .3 }] }, options: { responsive: true, maintainAspectRatio: false } }],
    ['barChart', { type: 'bar', data: { labels: categoryLabels, datasets: [{ label: 'Bookings by Service Category', data: categoryBookings, backgroundColor: '#22c55e' }] }, options: { responsive: true, maintainAspectRatio: false } }],
    ['donutChart', { type: 'doughnut', data: { labels: categoryLabels, datasets: [{ label: 'Revenue by Service Category', data: categoryRevenue, backgroundColor: ['#22c55e', '#2563eb', '#f59e0b', '#8b5cf6', '#ef4444'] }] }, options: { responsive: true, maintainAspectRatio: false } }],
  ];
  configs.forEach(([id, config]) => {
    const canvas = document.getElementById(id);
    if (canvas) new Chart(canvas, config);
  });
}
