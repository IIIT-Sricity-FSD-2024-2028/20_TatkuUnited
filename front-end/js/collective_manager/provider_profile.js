// ── Provider Profile Manager View JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;

  function getParam(name) {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(name)) return searchParams.get(name);
    const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashStr);
    return hashParams.get(name);
  }
  const providerId = getParam('id');

  const loader = document.getElementById('loader');
  const content = document.getElementById('providerDetails');
  const errorState = document.getElementById('errorState');

  if (!providerId) { showError(); return; }

  // 1. Fetch Data from API
  let provider = null;
  provider  = await Api.get("/service-providers/" + providerId);
  if (!provider) { showError(); return; }

  let allUnits = [], allCollectives = [], allSectors = [], allProviderSkills = [], allSkills = [], allJobs = [];
  allUnits  = await Api.get("/units");
  allCollectives  = await Api.get("/collectives");
  allSectors  = await Api.get("/sectors");
  allProviderSkills  = await Api.get("/provider-skills/provider/" + providerId);
  if (!Array.isArray(allProviderSkills)) allProviderSkills = [];
  allSkills  = await Api.get("/skills");
  allJobs  = await Api.get("/job-assignments/provider/" + providerId);

  const unit = allUnits.find(u => u.unit_id === provider.unit_id);
  const collective = unit ? allCollectives.find(c => c.collective_id === unit.collective_id) : null;
  const sector = allSectors.find(s => s.sector_id === provider.home_sector_id);

  const myUnfinishedJobs = allJobs.filter(j =>
    ["assigned","inprogress","in_progress","pending"].includes((j.status||'').toLowerCase())
  );

  // 3. Populate UI
  document.getElementById('profileName').textContent = provider.name;
  document.getElementById('profileId').textContent = provider.service_provider_id;
  
  const initials = provider.name.split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('profilePfp').textContent = initials;
  if (provider.pfp_url) {
     document.getElementById('profilePfp').innerHTML = `<img src="${provider.pfp_url}" style="width:100%;height:100%;object-fit:cover;">`;
  }

  const badge = document.getElementById('profileStatusBadge');
  const status = (provider.account_status || (provider.is_active ? 'active' : 'inactive')).toLowerCase();
  badge.textContent = status.replace('_', ' ');
  badge.className = 'status-badge ' + (status === 'active' ? '' : (status === 'inactive' ? 'inactive' : 'pending'));

  document.getElementById('infoName').textContent = provider.name;
  document.getElementById('infoEmail').textContent = provider.email;
  document.getElementById('infoPhone').textContent = provider.phone;
  document.getElementById('infoRating').textContent = (provider.rating || 'N/A') + ' ★';
  document.getElementById('infoUnit').textContent = unit ? unit.unit_name : 'Not Assigned';
  document.getElementById('infoSector').textContent = sector ? sector.sector_name : 'N/A';
  document.getElementById('infoDate').textContent = new Date(provider.created_at).toLocaleDateString();
  document.getElementById('infoStatus').textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

  // Skills
  const skillsList = document.getElementById('skillsList');
  const mySkills = Array.isArray(allProviderSkills) ? allProviderSkills : [];
  if (mySkills.length === 0) {
     skillsList.innerHTML = '<p style="color:var(--text-2); font-size:14px;">No skills registered yet.</p>';
  } else {
     skillsList.innerHTML = mySkills.map(ps => {
        const s = allSkills.find(sk => sk.skill_id === ps.skill_id);
        return `<div class="skill-card"><span class="skill-name">${s ? s.skill_name : ps.skill_id}</span><span class="skill-status">${ps.verification_status}</span></div>`;
     }).join('');
  }

  // Deactivation Context
  const deactivationReason = document.getElementById('deactivationReason');
  const jobsSummary = document.getElementById('activeJobsCount');
  
  if (provider.deactivation_requested) {
     deactivationReason.innerHTML = `<span style="color:var(--accent-red); font-weight:600;">Status: DEACTIVATION REQUESTED</span><br>Requested status: ${status.replace('_', ' ')}`;
  } else {
     deactivationReason.textContent = 'No ongoing deactivation requests from this provider.';
  }

  if (myUnfinishedJobs.length > 0) {
     jobsSummary.innerHTML = `<strong>Current Assignments:</strong> <span>${myUnfinishedJobs.length} active job(s)</span>`;
     jobsSummary.style.background = '#fff7ed'; jobsSummary.style.color = '#9a3412';
  } else {
     jobsSummary.innerHTML = `<strong>Current Assignments:</strong> <span>None</span>`;
     jobsSummary.style.background = '#f0fdf4'; jobsSummary.style.color = '#166534'; jobsSummary.style.borderColor = '#dcfce7';
  }

  // Final Reveal
  loader.classList.add('hidden');
  content.classList.remove('hidden');

  function showError() {
     loader.classList.add('hidden');
     errorState.classList.remove('hidden');
  }
})();
