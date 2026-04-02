// ── Service Providers Management JS ──
// Overhauled to handle both Existing Ranked Providers and New Admissions

const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#6366f1'];

// ===== TAB SWITCHING LOGIC =====
function switchOnboardingTab(tabId) {
  // Update Buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update Panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('hidden', pane.id !== `tab-${tabId}`);
  });
}
window.switchOnboardingTab = switchOnboardingTab;

// ===== TOAST & UTILS =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function getInitials(name) {
  if (!name) return 'SP';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// ===== DIALOG LOGIC =====
function openDetailsModal(req, color) {
  document.getElementById('detailsAvatar').textContent = req.initials;
  document.getElementById('detailsAvatar').style.background = color;
  document.getElementById('detailsName').textContent = req.name;
  document.getElementById('detailsSkillBadge').textContent = req.skill;
  document.getElementById('detailsPhone').textContent = req.phone;
  document.getElementById('detailsEmail').textContent = req.email;
  document.getElementById('detailsLocation').textContent = req.location;

  const docsEl = document.getElementById('detailsDocs');
  docsEl.innerHTML = '';
  if (!req.documents || (!req.documents.resume && !req.documents.cert)) {
    docsEl.innerHTML = `<span class="details-no-docs">No documents uploaded</span>`;
  } else {
    if (req.documents.cert)   docsEl.innerHTML += `<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Certificate</span></div>`;
    if (req.documents.resume) docsEl.innerHTML += `<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Resume</span></div>`;
  }

  document.getElementById('detailsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailsModalBtn() {
  document.getElementById('detailsOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
window.closeDetailsModalBtn = closeDetailsModalBtn;
window.closeDetailsModal = (e) => { if (e.target === document.getElementById('detailsOverlay')) closeDetailsModalBtn(); };

// ===== DOM CACHE =====
let myProviders = [];
let myUnits = [];

// ===== 1. RANKED PROVIDERS LOGIC =====
function renderRankedProviders(filter = '') {
  const list = document.getElementById('rankedProvidersList');
  list.innerHTML = '';

  const query = filter.toLowerCase();
  const sorted = [...myProviders].sort((a,b) => (b.rating || 0) - (a.rating || 0));

  const filtered = sorted.filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.unit_name || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding: 40px; color: #9ca3af; font-size: 13px;">No matching providers found.</div>`;
    return;
  }

  filtered.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'ranked-card';
    card.style.animationDelay = (idx * 0.05) + 's';
    
    // Find unit name
    const unit = myUnits.find(u => u.unit_id === p.unit_id);
    const unitName = unit ? unit.unit_name : 'No Unit';
    p.unit_name = unitName; // Cache for filter

    const rating = p.rating ? p.rating.toFixed(1) : 'N/A';
    
    card.innerHTML = `
      <div class="r-provider-info">
        <div class="r-avatar">${getInitials(p.name)}</div>
        <div>
          <div class="r-name">${p.name}</div>
          <div class="r-meta">${unitName} &bull; ${p.service_provider_id}</div>
        </div>
      </div>
      <div class="r-stats">
        <div class="r-rating">
           <span class="star-icon">★</span> ${rating}
        </div>
        <div class="r-jobs">${p.is_active ? 'Active' : 'Inactive'}</div>
      </div>
    `;
    
    card.onclick = () => window.location.href = `provider_profile.html?id=${p.service_provider_id}`;
    list.appendChild(card);
  });
}

// ===== 2. PROVIDER PULSE (STATS & ALERTS) =====
function renderPulse() {
  // Stats
  const activeCount = myProviders.filter(p => !p.deactivation_requested && p.account_status !== 'inactive').length;
  const ratings = myProviders.map(p => p.rating).filter(r => r !== null && r !== undefined);
  const avgRating = ratings.length ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : '0.0';

  document.getElementById('stat-total-active').textContent = activeCount;
  document.getElementById('stat-avg-rating').textContent = avgRating;

  // Alerts
  const alertsList = document.getElementById('providerAlertsList');
  alertsList.innerHTML = '';
  const alerts = [];

  // Deactivation requests
  const deactReqs = myProviders.filter(p => p.deactivation_requested);
  deactReqs.forEach(p => {
    alerts.push({
      type: 'red',
      icon: '⚠',
      text: `<strong>${p.name}</strong> requested deactivation. Status: ${p.account_status.replace('_', ' ')}.`
    });
  });

  // Low ratings
  myProviders.filter(p => p.rating && p.rating < 4.0).forEach(p => {
    alerts.push({
      type: 'amber',
      icon: '📉',
      text: `<strong>${p.name}</strong> rating dipped to ${p.rating.toFixed(1)}.`
    });
  });

  if (alerts.length === 0) {
    alertsList.innerHTML = `<span class="empty-notif">No urgent provider alerts.</span>`;
  } else {
    alerts.forEach(a => {
      const el = document.createElement('div');
      el.className = `alert-item ${a.type}`;
      el.innerHTML = `<span class="alert-icon">${a.icon}</span><div>${a.text}</div>`;
      alertsList.appendChild(el);
    });
  }
}

// ===== 3. ADMISSION & SKILL VERIFICATION LOGIC =====
function renderAdmissions() {
  const admissionList = document.getElementById('admissionRequestsList');
  const skillList = document.getElementById('skillVerificationList');
  const admissionsMetric = document.getElementById('metric-admissions-count');
  const verificationsMetric = document.getElementById('metric-verifications-count');
  
  admissionList.innerHTML = '';
  skillList.innerHTML = '';

  const allSkills = AppStore.getTable('skills') || [];
  const allProviderSkills = AppStore.getTable('provider_skills') || [];
  const allProviderDocuments = AppStore.getTable('provider_documents') || [];
  const allProvidersTable = AppStore.getTable('service_providers') || [];

  // --- 3a. Skill Verification Requests (Existing Providers) ---
  const skillRequests = [];
  allProviderSkills.forEach((ps, idx) => {
    if (ps.verification_status.toLowerCase() !== 'pending') return;
    
    // Check if provider is already assigned to a unit in this collective
    const provider = allProvidersTable.find(p => p.service_provider_id === ps.service_provider_id);
    if (!provider || !provider.unit_id) return;
    
    if (!myUnits.some(u => u.unit_id === provider.unit_id)) return;

    const skill = allSkills.find(s => s.skill_id === ps.skill_id);
    if (!skill) return;

    const docs = allProviderDocuments.filter(d => d.service_provider_id === provider.service_provider_id);
    skillRequests.push({
      initials: getInitials(provider.name),
      name: provider.name,
      skill: skill.skill_name,
      phone: provider.phone,
      email: provider.email,
      location: provider.address,
      documents: { 
        resume: docs.some(d => d.doc_type === 'RESUME'), 
        cert: docs.some(d => d.doc_type === 'CERTIFICATE') 
      },
      provider_id: provider.service_provider_id,
      skill_id: ps.skill_id
    });
  });

  // Render Skill Verification Cards
  if (verificationsMetric) verificationsMetric.textContent = String(skillRequests.length);

  if (skillRequests.length === 0) {
    skillList.innerHTML = `<div class="admissions-empty">No pending skill verifications.</div>`;
  } else {
    skillRequests.forEach((req, idx) => {
      const card = buildAdmissionCard(req, idx, 'skill', (card) => {
        const ps = allProviderSkills.find(p => p.service_provider_id === req.provider_id && p.skill_id === req.skill_id);
        if (ps) {
          ps.verification_status = "Verified";
          ps.verified_at = new Date().toISOString();
          AppStore.save();
          showToast(`✓ Verified ${req.skill} for ${req.name}`);
          card.remove();
          const remaining = skillList.querySelectorAll('.applicant-card').length;
          if (verificationsMetric) verificationsMetric.textContent = String(remaining);
          if (remaining === 0) skillList.innerHTML = `<div class="admissions-empty">No pending skill verifications.</div>`;
        }
      });
      skillList.appendChild(card);
    });
  }

  // --- 3b. New Admission Requests (Unassigned Unit) ---
  const unitRequests = allProvidersTable.filter(p => !p.unit_id);
  if (admissionsMetric) admissionsMetric.textContent = String(unitRequests.length);

  if (unitRequests.length === 0) {
    admissionList.innerHTML = `<div class="admissions-empty">No new admission requests.</div>`;
  } else {
    unitRequests.forEach((p, idx) => {
      const initials = getInitials(p.name);
      const options = myUnits.map(u => `<option value="${u.unit_id}">${u.unit_name}</option>`).join('');
      const card = document.createElement('div');
      card.className = 'applicant-card';
      card.innerHTML = `
        <div class="applicant-avatar" style="background:${colors[idx % colors.length]}">${initials}</div>
        <div class="applicant-main">
          <div class="applicant-name">${p.name}</div>
          <div class="applicant-meta" style="color:var(--accent); font-weight:600">Pending Unit Assignment</div>
        </div>
        <div class="applicant-actions">
           <select class="unit-assign-select" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px; outline:none;">
              <option value="" disabled selected>Unit...</option>
              ${options}
           </select>
           <button class="btn-verify" onclick="assignUnit('${p.service_provider_id}', this)">Assign</button>
        </div>
      `;
      admissionList.appendChild(card);
    });
  }
}

function buildAdmissionCard(req, idx, type, onVerify) {
  const card = document.createElement('div');
  card.className = 'applicant-card';
  card.innerHTML = `
    <div class="applicant-avatar" style="background:${colors[idx % colors.length]}">${req.initials}</div>
    <div class="applicant-main">
      <div class="applicant-name">${req.name}</div>
      <div class="skill-tags"><span class="skill-tag">${req.skill}</span></div>
    </div>
    <div class="applicant-actions">
      <button class="btn-verify">Verify</button>
      <button class="btn-view">View</button>
    </div>
  `;
  card.querySelector('.btn-verify').onclick = () => onVerify(card);
  card.querySelector('.btn-view').onclick = () => openDetailsModal(req, colors[idx % colors.length]);
  return card;
}

window.assignUnit = (providerId, btn) => {
   const select = btn.previousElementSibling;
   const unitId = select.value;
   if (!unitId) return showToast('Please select a unit');
   
   const p = AppStore.getTable('service_providers').find(x => x.service_provider_id === providerId);
   if (p) {
      p.unit_id = unitId;
      p.is_active = true;
      AppStore.save();
      showToast('✓ Provider assigned successfully');
      btn.closest('.applicant-card').remove();

      const admissionList = document.getElementById('admissionRequestsList');
      const remainingAdmissions = admissionList.querySelectorAll('.applicant-card').length;
      const admissionsMetric = document.getElementById('metric-admissions-count');
      if (admissionsMetric) admissionsMetric.textContent = String(remainingAdmissions);
      if (remainingAdmissions === 0) {
        admissionList.innerHTML = `<div class="admissions-empty">No new admission requests.</div>`;
      }
   }
};

// ===== INIT =====
AppStore.ready.then(() => {
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;
  const collectiveId = session.collectiveId;

  // 1. Data Scoping
  myUnits = (AppStore.getTable('units') || []).filter(u => u.collective_id === collectiveId);
  const myUnitIds = new Set(myUnits.map(u => u.unit_id));
  myProviders = (AppStore.getTable('service_providers') || []).filter(p => myUnitIds.has(p.unit_id));

  // 2. Initial Render
  renderRankedProviders();
  renderPulse();
  renderAdmissions();

  // 3. Bind Search
  const searchInput = document.getElementById('rankedProviderSearch');
  searchInput.oninput = (e) => renderRankedProviders(e.target.value);
});
