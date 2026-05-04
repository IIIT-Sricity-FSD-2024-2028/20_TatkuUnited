// ── Service Providers Management JS — API-backed ──
const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#6366f1'];
function switchOnboardingTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('hidden', pane.id !== `tab-${tabId}`));
}
window.switchOnboardingTab = switchOnboardingTab;
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
function getInitials(name) { if (!name) return 'SP'; return name.split(' ').map(n => n[0]).join('').toUpperCase(); }

function openDetailsModal(req, color) {
  document.getElementById('detailsAvatar').textContent = req.initials;
  document.getElementById('detailsAvatar').style.background = color;
  document.getElementById('detailsName').textContent = req.name;
  document.getElementById('detailsSkillBadge').textContent = req.skill;
  document.getElementById('detailsPhone').textContent = req.phone;
  document.getElementById('detailsEmail').textContent = req.email;
  document.getElementById('detailsLocation').textContent = req.location;
  const docsEl = document.getElementById('detailsDocs');
  docsEl.innerHTML = (!req.documents || (!req.documents.resume && !req.documents.cert))
    ? '<span class="details-no-docs">No documents uploaded</span>'
    : ((req.documents.cert ? '<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Certificate</span></div>' : '') +
       (req.documents.resume ? '<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Resume</span></div>' : ''));
  document.getElementById('detailsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetailsModalBtn() { document.getElementById('detailsOverlay').classList.remove('open'); document.body.style.overflow = ''; }
window.closeDetailsModalBtn = closeDetailsModalBtn;
window.closeDetailsModal = (e) => { if (e.target === document.getElementById('detailsOverlay')) closeDetailsModalBtn(); };

let myProviders = [], myUnits = [];

function renderRankedProviders(filter = '') {
  const list = document.getElementById('rankedProvidersList'); list.innerHTML = '';
  const query = filter.toLowerCase();
  const sorted = [...myProviders].sort((a,b) => (b.rating||0) - (a.rating||0));
  
  // Pre-compute unit_name for filtering
  sorted.forEach(p => {
    const unit = myUnits.find(u => u.unit_id === p.unit_id);
    p.unit_name = unit ? unit.unit_name : 'No Unit';
  });

  const filtered = sorted.filter(p => p.name.toLowerCase().includes(query) || (p.unit_name||'').toLowerCase().includes(query));
  if (!filtered.length) { list.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;font-size:13px;">No matching providers found.</div>'; return; }
  filtered.forEach((p, idx) => {
    const card = document.createElement('div'); card.className = 'ranked-card'; card.style.animationDelay = (idx*0.05)+'s';
    const rating = p.rating ? p.rating.toFixed(1) : 'N/A';
    const providerId = p.service_provider_id || p.sp_id;
    card.innerHTML = `<div class="r-provider-info"><div class="r-avatar">${getInitials(p.name)}</div><div><div class="r-name">${p.name}</div><div class="r-meta">${p.unit_name} &bull; ${providerId}</div></div></div><div class="r-stats"><div class="r-rating"><span class="star-icon">★</span> ${rating}</div><div class="r-jobs">${p.is_active?'Active':'Inactive'}</div></div>`;
    card.onclick = () => window.location.href = `provider_profile.html#id=${providerId}`;
    list.appendChild(card);
  });
}

function renderPulse() {
  const activeCount = myProviders.filter(p => !p.deactivation_requested && p.account_status !== 'inactive').length;
  const ratings = myProviders.map(p => p.rating).filter(r => r != null);
  const avgRating = ratings.length ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : '0.0';
  document.getElementById('stat-total-active').textContent = activeCount;
  document.getElementById('stat-avg-rating').textContent = avgRating;
  const alertsList = document.getElementById('providerAlertsList'); alertsList.innerHTML = ''; const alerts = [];
  myProviders.filter(p => p.deactivation_requested).forEach(p => alerts.push({ type:'red', icon:'⚠', text:`<strong>${p.name}</strong> requested deactivation.` }));
  myProviders.filter(p => p.rating && p.rating < 4.0).forEach(p => alerts.push({ type:'amber', icon:'📉', text:`<strong>${p.name}</strong> rating dipped to ${p.rating.toFixed(1)}.` }));
  if (!alerts.length) { alertsList.innerHTML = '<span class="empty-notif">No urgent provider alerts.</span>'; }
  else { alerts.forEach(a => { const el = document.createElement('div'); el.className = `alert-item ${a.type}`; el.innerHTML = `<span class="alert-icon">${a.icon}</span><div>${a.text}</div>`; alertsList.appendChild(el); }); }
}

async function renderAdmissions() {
  const admissionList = document.getElementById('admissionRequestsList');
  const skillList = document.getElementById('skillVerificationList');
  const admissionsMetric = document.getElementById('metric-admissions-count');
  const verificationsMetric = document.getElementById('metric-verifications-count');
  admissionList.innerHTML = ''; skillList.innerHTML = '';
  let allSkills=[], allProviderSkills=[], allProvidersTable=[];
  allSkills  = await Api.get("/skills");
  // No list-all route for provider-skills; fetch per provider
  allProvidersTable  = await Api.get("/service-providers");
  for (const provider of allProvidersTable) {
    const pid = provider.service_provider_id || provider.sp_id;
    if (!pid) continue;
    try {
      const ps = await Api.get("/provider-skills/provider/" + pid, { silent: true }) || [];
      allProviderSkills.push(...ps);
    } catch (_) {}
  }

  const skillRequests = [];
  allProviderSkills.forEach(ps => {
    if (!ps.verification_status || ps.verification_status.toLowerCase() !== 'pending') return;
    const provider = allProvidersTable.find(p => (p.service_provider_id || p.sp_id) === (ps.sp_id || ps.service_provider_id));
    if (!provider || !provider.unit_id || !myUnits.some(u => u.unit_id === provider.unit_id)) return;
    const skill = allSkills.find(s => s.skill_id === ps.skill_id); if (!skill) return;
    const pid = provider.service_provider_id || provider.sp_id;
    skillRequests.push({ initials:getInitials(provider.name), name:provider.name, skill:skill.skill_name, phone:provider.phone, email:provider.email, location:provider.address, documents:{resume:false,cert:false}, provider_id:pid, skill_id:ps.skill_id });
  });
  if (verificationsMetric) verificationsMetric.textContent = String(skillRequests.length);
  if (!skillRequests.length) { skillList.innerHTML = '<div class="admissions-empty">No pending skill verifications.</div>'; }
  else { skillRequests.forEach((req,idx) => {
    const card = buildAdmissionCard(req,idx,'skill', async (card) => {
      try { await Api.patch("/provider-skills/verify/"+req.provider_id,{skill_id:req.skill_id}); showToast(`✓ Verified ${req.skill} for ${req.name}`); card.remove();
        const rem = skillList.querySelectorAll('.applicant-card').length; if (verificationsMetric) verificationsMetric.textContent = String(rem);
        if (!rem) skillList.innerHTML = '<div class="admissions-empty">No pending skill verifications.</div>';
      } catch(e){ showToast("Failed to verify skill."); }
    }, async (card) => {
      try { await Api.patch("/provider-skills/reject/"+req.provider_id,{skill_id:req.skill_id}); showToast(`✗ Rejected ${req.skill} for ${req.name}`); card.remove();
        const rem = skillList.querySelectorAll('.applicant-card').length; if (verificationsMetric) verificationsMetric.textContent = String(rem);
        if (!rem) skillList.innerHTML = '<div class="admissions-empty">No pending skill verifications.</div>';
      } catch(e){ showToast("Failed to reject skill."); }
    }); skillList.appendChild(card);
  }); }

  const unitRequests = allProvidersTable.filter(p => !p.unit_id);
  if (admissionsMetric) admissionsMetric.textContent = String(unitRequests.length);
  if (!unitRequests.length) { admissionList.innerHTML = '<div class="admissions-empty">No new admission requests.</div>'; }
  else { unitRequests.forEach((p,idx) => {
    const initials = getInitials(p.name);
    const options = myUnits.map(u => `<option value="${u.unit_id}">${u.unit_name}</option>`).join('');
    const card = document.createElement('div'); card.className = 'applicant-card';
    const providerId = p.service_provider_id || p.sp_id;
    card.innerHTML = `<div class="applicant-avatar" style="background:${colors[idx%colors.length]}">${initials}</div><div class="applicant-main"><div class="applicant-name">${p.name}</div><div class="applicant-meta" style="color:var(--accent);font-weight:600">Pending Unit Assignment</div></div><div class="applicant-actions"><select class="unit-assign-select" style="padding:6px;border-radius:6px;border:1px solid var(--border);font-size:12px;outline:none;"><option value="" disabled selected>Unit...</option>${options}</select><button class="btn-verify" onclick="assignUnit('${providerId}',this)">Assign</button></div>`;
    admissionList.appendChild(card);
  }); }
}

function buildAdmissionCard(req,idx,type,onVerify,onReject) {
  const card = document.createElement('div'); card.className = 'applicant-card';
  const rejectBtn = onReject ? `<button class="btn-reject" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Reject</button>` : '';
  card.innerHTML = `<div class="applicant-avatar" style="background:${colors[idx%colors.length]}">${req.initials}</div><div class="applicant-main"><div class="applicant-name">${req.name}</div><div class="skill-tags"><span class="skill-tag">${req.skill}</span></div></div><div class="applicant-actions">${rejectBtn}<button class="btn-verify">Verify</button><button class="btn-view">View</button></div>`;
  card.querySelector('.btn-verify').onclick = () => onVerify(card);
  if (onReject && card.querySelector('.btn-reject')) card.querySelector('.btn-reject').onclick = () => onReject(card);
  card.querySelector('.btn-view').onclick = () => openDetailsModal(req, colors[idx%colors.length]);
  return card;
}

window.assignUnit = async (providerId, btn) => {
  const select = btn.previousElementSibling; const unitId = select.value;
  if (!unitId) return showToast('Please select a unit');
  btn.disabled = true;
  try {
    await Api.patch("/service-providers/"+providerId,{unit_id:unitId, is_active:true});
    showToast('✓ Provider approved and assigned successfully');
    btn.closest('.applicant-card').remove();
    const admissionList = document.getElementById('admissionRequestsList');
    const rem = admissionList.querySelectorAll('.applicant-card').length;
    const m = document.getElementById('metric-admissions-count'); if(m) m.textContent = String(rem);
    if(!rem) admissionList.innerHTML = '<div class="admissions-empty">No new admission requests.</div>';
  } catch(err){ showToast(err.message||'Failed to approve provider'); btn.disabled = false; }
};

// ===== INIT =====
(async () => {
  const session = Auth.requireSession(['collective_manager']); if (!session) return;
  const collectiveId = session.collectiveId;
  try { myUnits = (await Api.get("/units",{silent:true})||[]).filter(u => u.collective_id === collectiveId); } catch(_){}
  const myUnitIds = new Set(myUnits.map(u => u.unit_id));
  try { myProviders = (await Api.get("/service-providers",{silent:true})||[]).filter(p => myUnitIds.has(p.unit_id)); } catch(_){}
  renderRankedProviders(); renderPulse(); renderAdmissions();
  const searchInput = document.getElementById('rankedProviderSearch');
  searchInput.oninput = (e) => renderRankedProviders(e.target.value);
})();
