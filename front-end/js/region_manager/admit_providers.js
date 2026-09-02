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

let displayedProviders = [];
let displayedRegion = null;
let selectedProvider = null;

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
  displayedProviders = regionProviders;
  displayedRegion = region;
  renderProviders(regionProviders);
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
  const list = document.getElementById('admissionRequestsList');
  if (!list) return;
  if (pendingList.length === 0) {
    list.innerHTML = '<div class="admissions-empty">No pending providers awaiting approval for this region.</div>';
    return;
  }

  list.innerHTML = pendingList.map(p => `
    <div class="applicant-card">
      <div class="applicant-avatar" style="background:#2563eb;">${(p.name || 'P').slice(0, 1).toUpperCase()}</div>
      <div class="applicant-main">
        <div class="applicant-name">${p.name || p.full_name || 'Provider'}</div>
        <div class="applicant-meta">${p.email || ''} · ${p.phone || 'No phone'} · ${p.city || p.address || region.region_name}</div>
        <div class="skill-tags"><span class="skill-tag">Pending admission</span></div>
      </div>
      <div class="applicant-actions">
        <button class="btn-verify" onclick="approveProvider('${p.sp_id || p.service_provider_id}', '${region.region_id}')">
          Admit to ${region.region_name || 'Region'}
        </button>
      </div>
    </div>
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

function renderProviders(providers) {
  const list = document.getElementById('rankedProvidersList');
  const search = document.getElementById('rankedProviderSearch');
  if (!list) return;

  const render = () => {
    const query = (search?.value || '').trim().toLowerCase();
    const filtered = providers
      .filter(p => [p.name, p.email, p.phone, p.city].some(value =>
        String(value || '').toLowerCase().includes(query)
      ));

    list.innerHTML = filtered.length ? filtered.map(p => `
      <div class="ranked-provider-item" data-provider-id="${p.sp_id || p.service_provider_id}">
        <strong>${p.name || 'Provider'}</strong>
        <span>${p.email || ''}</span>
        <span class="ranked-provider-status ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Active' : 'Deactivated'}</span>
      </div>
    `).join('') : '<div class="empty-notif">No providers found.</div>';

    list.querySelectorAll('[data-provider-id]').forEach(card => {
      card.addEventListener('click', () => openProviderDetails(
        providers.find(p => (p.sp_id || p.service_provider_id) === card.dataset.providerId)
      ));
    });
  };

  if (search && !search.dataset.filterBound) {
    search.addEventListener('input', render);
    search.dataset.filterBound = 'true';
  }
  render();
}

function openProviderDetails(provider) {
  if (!provider) return;
  selectedProvider = provider;
  setText('detailsAvatar', (provider.name || 'P').slice(0, 1).toUpperCase());
  setText('detailsName', provider.name || 'Provider');
  setText('detailsSkillBadge', provider.is_active ? 'Active account' : 'Deactivated account');
  setText('detailsPhone', provider.phone || 'No phone number');
  setText('detailsEmail', provider.email || 'No email address');
  setText('detailsLocation', provider.address || provider.city || 'No location provided');
  setText('detailsDocs', provider.account_status === 'pending' ? 'Pending admission' : 'No documents available');
  const action = document.getElementById('detailsStatusAction');
  if (action) {
    action.textContent = provider.is_active ? 'Deactivate Account' : 'Reactivate Account';
    action.className = 'btn-verify ' + (provider.is_active ? 'deactivate' : 'reactivate');
    action.disabled = false;
    action.onclick = toggleProviderStatus;
  }
  document.getElementById('detailsOverlay')?.classList.add('open');
}

function closeDetailsModalBtn() {
  document.getElementById('detailsOverlay')?.classList.remove('open');
  selectedProvider = null;
}

function closeDetailsModal(event) {
  if (event.target === event.currentTarget) closeDetailsModalBtn();
}

async function toggleProviderStatus() {
  if (!selectedProvider) return;
  const providerId = selectedProvider.sp_id || selectedProvider.service_provider_id;
  const nextIsActive = !selectedProvider.is_active;
  const action = document.getElementById('detailsStatusAction');
  if (action) action.disabled = true;
  try {
    await Api.patch('/service-providers/' + encodeURIComponent(providerId), { is_active: nextIsActive });
    selectedProvider.is_active = nextIsActive;
    selectedProvider.account_status = nextIsActive ? 'active' : 'inactive';
    closeDetailsModalBtn();
    await loadProviders(displayedRegion);
  } catch (err) {
    if (action) action.disabled = false;
    alert('Could not update account status: ' + (err.message || 'Error updating provider'));
  }
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
