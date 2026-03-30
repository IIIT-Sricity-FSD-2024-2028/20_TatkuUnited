// ── Admit Providers JS ──
// Depends on: store.js → auth.js (loaded before this script)

const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#6366f1'];

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== CARD REMOVAL =====
function removeCard(cardEl, isSkillCard) {
  cardEl.classList.add('fade-out');
  setTimeout(() => {
    cardEl.remove();
    const sum = document.querySelectorAll('.applicant-card').length;
    document.getElementById('pendingCount').textContent =
      sum + ' application' + (sum !== 1 ? 's' : '') + ' pending review';
  }, 300);
}

// ===== VIEW DETAILS MODAL =====
function openDetailsModal(req, color) {
  document.getElementById('detailsAvatar').textContent = req.initials;
  document.getElementById('detailsAvatar').style.background = color;
  document.getElementById('detailsName').textContent = req.name;
  document.getElementById('detailsSkillBadge').textContent = req.skill;
  document.getElementById('detailsPhone').textContent = req.phone;
  document.getElementById('detailsEmail').textContent = req.email;
  document.getElementById('detailsLocation').textContent = req.location;

  const docsEl = document.getElementById('detailsDocs');
  if (!req.documents || (!req.documents.resume && !req.documents.cert)) {
    docsEl.innerHTML = `<span class="details-no-docs">No documents uploaded</span>`;
  } else {
    const docItems = [];
    if (req.documents.cert)   docItems.push(`<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Certificate</span></div>`);
    if (req.documents.resume) docItems.push(`<div class="details-doc-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Resume</span></div>`);
    docsEl.innerHTML = docItems.join('');
  }

  document.getElementById('detailsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailsModalBtn() {
  document.getElementById('detailsOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeDetailsModal(e) {
  if (e.target === document.getElementById('detailsOverlay')) closeDetailsModalBtn();
}

AppStore.ready.then(() => {
  /* ── 1. Auth gate ── */
  const session = Auth.requireSession(['collective_manager']);
  if (!session) return;

  const collectiveId = session.collectiveId;

  /* ── 2. Pull tables ── */
  const allUnits = AppStore.getTable('units') || [];
  const allProviders = AppStore.getTable('service_providers') || [];
  const allSkills = AppStore.getTable('skills') || [];
  const allProviderSkills = AppStore.getTable('provider_skills') || [];
  const allProviderDocuments = AppStore.getTable('provider_documents') || [];

  /* ── 3. Scope data to this collective ── */
  const myUnits = allUnits.filter(u => u.collective_id === collectiveId);
  const myUnitIds = new Set(myUnits.map(u => u.unit_id));
  const myProviders = allProviders.filter(p => myUnitIds.has(p.unit_id));

  /* ── 3.5. Init custom tracking for persistence ── */
  if (!AppStore.data.dismissed_providers) {
      AppStore.data.dismissed_providers = [];
  }

  // Inject a dummy unassigned provider if none exist for demonstration
  let unassignedProviders = allProviders.filter(p => !p.unit_id);
  if (unassignedProviders.length === 0) {
      const dummyId = "SP_DUMMY_NEW";
      const dummy = {
          service_provider_id: dummyId,
          name: "Ramesh Dummy",
          phone: "9123456780",
          email: "ramesh.new@mail.com",
          unit_id: null,
          is_active: false,
          address: "Chennai City",
          pfp_url: ""
      };
      AppStore.data.service_providers.push(dummy);
      unassignedProviders.push(dummy);
  }
  /* ── 4. Generate skill requests ── */
  const skillRequests = [];

  // Inject a dummy skill request
  skillRequests.push({
    id: 999,
    initials: "JD",
    name: "John Dummy",
    skill: "Advanced Plumbing",
    phone: "+919876543210",
    email: "john.dummy@mail.com",
    location: "Chennai City",
    documents: { resume: true, cert: true },
    provider_id: "SP_DUMMY_SKILL",
    skill_id: "SKL999"
  });

  // Limit to 4
  const paginatedSkillRequests = skillRequests.slice(0, 4);

  // ===== BUILD SKILL REQUEST CARD =====
  function buildSkillCard(req, idx) {
    const card = document.createElement('div');
    card.className = 'applicant-card';
    card.style.animationDelay = (idx * 0.07) + 's';

    const color = colors[idx % colors.length];

    card.innerHTML = `
      <div class="applicant-avatar" style="background:${color}">${req.initials}</div>
      <div class="applicant-main">
        <div class="applicant-name">${req.name}</div>
        <div class="skill-tags"><span class="skill-tag">${req.skill}</span></div>
        <div class="applicant-meta">
          <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>${req.phone}</div>
          <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${req.email}</div>
          <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${req.location}</div>
        </div>
      </div>
      <div class="applicant-actions">
        <button class="btn-verify" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verify
        </button>
        <button class="btn-reject" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject
        </button>
        <button class="btn-view" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View Details
        </button>
      </div>
    `;

    card.querySelector('.btn-verify').addEventListener('click', () => {
      const providerSkill = {
        service_provider_id: req.provider_id,
        skill_id: req.skill_id,
        verification_status: "Verified",
        verified_at: new Date().toISOString()
      };
      AppStore.data.provider_skills.push(providerSkill);
      AppStore.data.dismissed_providers.push(req.provider_id);
      AppStore.save();
      showToast(`✓ ${req.name}'s ${req.skill} skill verified`);
      removeCard(card, true);
    });

    card.querySelector('.btn-reject').addEventListener('click', () => {
      AppStore.data.dismissed_providers.push(req.provider_id);
      AppStore.save();
      showToast(`✗ ${req.name}'s ${req.skill} request rejected`);
      removeCard(card, true);
    });

    card.querySelector('.btn-view').addEventListener('click', () => {
      openDetailsModal(req, color);
    });

    return card;
  }

  // ===== BUILD UNIT ASSIGN CARD =====
  function buildUnitAssignCard(provider, idx) {
    const card = document.createElement('div');
    card.className = 'applicant-card unit-assign-card';
    card.style.animationDelay = (idx * 0.07) + 's';

    const color = colors[(idx + 2) % colors.length];
    const initials = provider.name.split(' ').map(n => n[0]).join('').toUpperCase();

    // Create options
    const options = myUnits.map(u => `<option value="${u.unit_id}">${u.unit_name}</option>`).join('');

    card.innerHTML = `
      <div class="applicant-avatar" style="background:${color}">${initials}</div>
      <div class="applicant-main">
        <div class="applicant-name">${provider.name}</div>
        <div class="skill-tags"><span class="skill-tag" style="background:#fee2e2;color:#991b1b">Unassigned</span></div>
        <div class="applicant-meta">
          <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>${provider.phone}</div>
          <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${provider.email}</div>
        </div>
      </div>
      <div class="applicant-actions">
        <select class="unit-assign-select">
          <option value="" disabled selected>Select a unit...</option>
          ${options}
        </select>
        <button class="btn-assign" style="background:var(--accent);color:#fff;border:none;padding:9px 12px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:600;font-size:13px;cursor:pointer;">
          <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;"><polyline points="20 6 9 17 4 12"></polyline></svg> Assign Unit
        </button>
      </div>
    `;

    card.querySelector('.btn-assign').addEventListener('click', () => {
      const select = card.querySelector('.unit-assign-select');
      const selectedUnitId = select.value;
      
      if (!selectedUnitId) {
        showToast('Please select a unit first');
        return;
      }

      // Update the provider in AppStore.data
      const storeProvider = AppStore.data.service_providers.find(p => p.service_provider_id === provider.service_provider_id);
      if (storeProvider) {
        storeProvider.unit_id = selectedUnitId;
        storeProvider.is_active = true;
        AppStore.save();
      }
      
      showToast(`✓ Provider assigned to unit successfully!`);
      removeCard(card, false);
    });

    return card;
  }

  // ===== INIT =====
  const skillList = document.getElementById('skillRequestsList');
  paginatedSkillRequests.forEach((req, i) => skillList.appendChild(buildSkillCard(req, i)));

  const unitList = document.getElementById('unitRequestsList');
  const paginatedUnitRequests = unassignedProviders.slice(0, 4);
  paginatedUnitRequests.forEach((p, i) => unitList.appendChild(buildUnitAssignCard(p, i)));

  const sum = document.querySelectorAll('.applicant-card').length;
  document.getElementById('pendingCount').textContent =
    sum + ' application' + (sum !== 1 ? 's' : '') + ' pending review';

});
