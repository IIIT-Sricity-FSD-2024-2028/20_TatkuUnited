// ── Region Manager: Provider Approvals JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  let regionId = session.region_id;
  let regions = [];
  try {
    regions = await Api.get('/regions', { silent: true }) || [];
  } catch (_) {}

  if (!regionId && Array.isArray(regions) && regions.length > 0) {
    regionId = regions[0].region_id;
  }

  const region = (regions || []).find(r => r.region_id === regionId) || { region_id: 'COL001', region_name: 'Chennai North' };

  await loadProviders(region);
})();

async function loadProviders(region) {
  let providers = [];
  let assignments = [];
  
  try {
    providers = await Api.get('/service-providers', { silent: true }) || [];
  } catch (_) {}

  try {
    assignments = await Api.get('/job-assignments', { silent: true }) || [];
  } catch (_) {}

  const regionProviders = providers.filter(p => p.region_id === region.region_id);
  const pendingList = regionProviders.filter(
    p => p.account_status === 'pending' || !p.region_id
  );
  const activeList = regionProviders.filter(
    p => p.account_status !== 'pending'
  );

  const avgRating = regionProviders.length
    ? regionProviders.reduce((sum, p) => sum + getProviderRating(p), 0) / regionProviders.length
    : 0;
  const verificationQueue = regionProviders.filter(p =>
    p.verification_status === 'pending' ||
    p.skill_verification_status === 'pending' ||
    p.status === 'verification_pending' ||
    p.account_status === 'verification_pending'
  );

  // Calculate region stats
  const regionProviderIds = new Set(regionProviders.map(p => p.sp_id || p.service_provider_id));
  const regionAssignments = assignments.filter(a => regionProviderIds.has(a.sp_id || a.service_provider_id));
  const completedJobs = regionAssignments.filter(a => a.status === 'COMPLETED').length;
  const activeJobs = regionAssignments.filter(a => a.status !== 'COMPLETED').length;

  setText('stat-total-active', activeList.length.toString());
  setText('stat-avg-rating', avgRating.toFixed(1));
  setText('metric-admissions-count', pendingList.length.toString());
  setText('metric-verifications-count', verificationQueue.length.toString());
  
  // Set region stats
  setText('stat-region-total-providers', regionProviders.length.toString());
  setText('stat-region-completed-jobs', completedJobs.toString());
  setText('stat-region-active-jobs', activeJobs.toString());

  renderPendingTable(pendingList, region);
  renderActiveTable(activeList);
}


function getProviderRating(provider) {
  const raw = provider?.rating ?? provider?.avg_rating ?? provider?.overall_rating ?? provider?.review_score ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderPendingTable(pendingList, region) {
  const tbody = document.getElementById('pending-providers-tbody');
  const countEl = document.getElementById('pending-count');
  if (countEl) countEl.textContent = pendingList.length;

  if (!tbody) return;
  if (pendingList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No pending providers awaiting approval for this region.</td></tr>';
    return;
  }

  tbody.innerHTML = pendingList.map(p => `
    <tr>
      <td style="padding:12px;"><strong>${p.name || p.full_name || 'Provider'}</strong><br><span style="font-size:0.8rem;color:#64748b;">${p.email}</span></td>
      <td style="padding:12px;">${p.phone || 'N/A'}</td>
      <td style="padding:12px;">${p.city || p.address || 'Chennai'}</td>
      <td style="padding:12px;"><span style="background:rgba(234,179,8,0.15);color:#ca8a04;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;">Pending</span></td>
      <td style="padding:12px;">
        <button class="btn-primary" onclick="approveProvider('${p.sp_id || p.service_provider_id}', '${region.region_id}')" style="background:#22c55e;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">
          Approve & Add to ${region.region_name || 'Region'}
        </button>
      </td>
    </tr>
  `).join('');
}

function renderActiveTable(activeList) {
  const tbody = document.getElementById('active-providers-tbody');
  const countEl = document.getElementById('active-count');
  if (countEl) countEl.textContent = activeList.length;

  if (!tbody) return;
  if (activeList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#64748b;">No active providers in this region yet.</td></tr>';
    return;
  }

  tbody.innerHTML = activeList.map(p => `
    <tr>
      <td style="padding:12px;"><strong>${p.name}</strong><br><span style="font-size:0.8rem;color:#64748b;">${p.email}</span></td>
      <td style="padding:12px;">${p.phone || 'N/A'}</td>
      <td style="padding:12px;">${p.city || 'Chennai'}</td>
      <td style="padding:12px;"><span style="background:rgba(34,197,94,0.15);color:#16a34a;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;">Active</span></td>
    </tr>
  `).join('');
}

window.approveProvider = async function(spId, regionId) {
  try {
    await Api.patch('/service-providers/' + spId + '/approve', { region_id: regionId });
    alert('Provider approved and added to your region!');
    window.location.reload();
  } catch (err) {
    alert('Approval failed: ' + (err.message || 'Error updating provider'));
  }
};
