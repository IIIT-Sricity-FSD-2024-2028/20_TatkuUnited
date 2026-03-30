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
function removeCard(cardEl) {
  cardEl.classList.add('fade-out');
  setTimeout(() => {
    cardEl.remove();
    const remaining = document.querySelectorAll('.applicant-card').length;
    document.getElementById('pendingCount').textContent =
      remaining + ' application' + (remaining !== 1 ? 's' : '') + ' pending review';
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
  if (!AppStore.data.recently_approved) {
      const initialApproved = [];
      const approvedProviders = myProviders.slice(0, 4);
      const dates = ['Mar 8, 2026', 'Mar 7, 2026', 'Mar 6, 2026', 'Mar 5, 2026'];
      approvedProviders.forEach((p, i) => {
        const unit = myUnits.find(u => u.unit_id === p.unit_id);
        const skill = allSkills[Math.floor(Math.random() * allSkills.length)];
        initialApproved.push({
          initials: p.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          name: p.name,
          unit: unit ? unit.unit_name : 'General Unit',
          skill: skill.skill_name,
          date: dates[i]
        });
      });
      AppStore.data.recently_approved = initialApproved;
      AppStore.save();
  }

  /* ── 4. Generate skill requests ── */
  // Find skills they don't have and create a request for one
  const requests = [];
  let requestId = 1;
  myProviders.forEach(provider => {
    // Hide requests we already verified or rejected
    if (AppStore.data.dismissed_providers.includes(provider.service_provider_id)) return;

    const providerSkills = allProviderSkills
      .filter(ps => ps.service_provider_id === provider.service_provider_id)
      .map(ps => ps.skill_id);
    const availableSkills = allSkills.filter(skill => !providerSkills.includes(skill.skill_id));
    if (availableSkills.length > 0) {
      const skill = availableSkills[0]; // Request the first available skill
      const docs = allProviderDocuments.filter(d => d.service_provider_id === provider.service_provider_id);
      const hasResume = docs.some(d => d.doc_type === 'RESUME');
      const hasCert = docs.some(d => d.doc_type === 'CERTIFICATE');
      requests.push({
        id: requestId++,
        initials: provider.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        name: provider.name,
        skill: skill.skill_name,
        phone: provider.phone,
        email: provider.email,
        location: provider.address,
        documents: hasResume || hasCert ? { resume: hasResume, cert: hasCert } : null,
        provider_id: provider.service_provider_id,
        skill_id: skill.skill_id
      });
    }
  });

  // ===== BUILD REQUEST CARD =====
  function buildRequestCard(req, idx) {
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
          <div class="meta-row">
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
            ${req.phone}
          </div>
          <div class="meta-row">
            <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${req.email}
          </div>
          <div class="meta-row">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${req.location}
          </div>
        </div>
      </div>
      <div class="applicant-actions">
        <button class="btn-verify" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Verify
        </button>
        <button class="btn-reject" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Reject
        </button>
        <button class="btn-view" data-id="${req.id}">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View Details
        </button>
      </div>
    `;

    card.querySelector('.btn-verify').addEventListener('click', () => {
      // Add the skill to provider_skills
      const providerSkill = {
        service_provider_id: req.provider_id,
        skill_id: req.skill_id
      };
      AppStore.data.provider_skills.push(providerSkill);
      // Mark as dismissed so it doesn't regenerate a new fake request
      AppStore.data.dismissed_providers.push(req.provider_id);
      
      // Inject into recently approved
      const realProvider = allProviders.find(p => p.service_provider_id === req.provider_id);
      const unit = realProvider ? myUnits.find(u => u.unit_id === realProvider.unit_id) : null;
      AppStore.data.recently_approved.unshift({
        initials: req.initials,
        name: req.name,
        unit: unit ? unit.unit_name : 'General Unit',
        skill: req.skill,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      AppStore.save();
      showToast(`✓ ${req.name}'s ${req.skill} skill verified`);
      removeCard(card);

      document.getElementById('approvedGrid').innerHTML = '';
      buildApprovedCards();
    });

    card.querySelector('.btn-reject').addEventListener('click', () => {
      AppStore.data.dismissed_providers.push(req.provider_id);
      AppStore.save();
      showToast(`✗ ${req.name}'s ${req.skill} request rejected`);
      removeCard(card);
    });

    card.querySelector('.btn-view').addEventListener('click', () => {
      openDetailsModal(req, color);
    });

    return card;
  }

  // ===== BUILD APPROVED CARDS =====
  function buildApprovedCards() {
    const grid = document.getElementById('approvedGrid');
    AppStore.data.recently_approved.forEach((p, i) => {
      const color = colors[(i + 2) % colors.length];
      const card = document.createElement('div');
      card.className = 'approved-card';
      card.innerHTML = `
        <div class="approved-avatar" style="background:${color}">${p.initials}</div>
        <div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span class="approved-name">${p.name}</span>
            <svg class="check-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="approved-unit">${p.unit}</div>
        </div>
        <div class="approved-right">
          <div class="approved-skill">${p.skill}</div>
          <div class="approved-date">${p.date}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ===== INIT =====
  const list = document.getElementById('applicantsList');
  requests.forEach((req, i) => list.appendChild(buildRequestCard(req, i)));
  document.getElementById('pendingCount').textContent =
    requests.length + ' application' + (requests.length !== 1 ? 's' : '') + ' pending review';
  buildApprovedCards();

});
