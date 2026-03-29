const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#6366f1'];

// Each request is for exactly ONE skill.
// A provider with multiple skills submits separate requests.
const requests = [
  {
    id: 1,
    initials: 'JM', name: 'James Mwangi', skill: 'Plumbing',
    phone: '+254 712 345 678', email: 'james.mwangi@email.com',
    location: 'Nairobi, Kenya',
    documents: { resume: true, cert: true },
  },
  {
    id: 2,
    initials: 'JM', name: 'James Mwangi', skill: 'HVAC',
    phone: '+254 712 345 678', email: 'james.mwangi@email.com',
    location: 'Nairobi, Kenya',
    documents: { resume: true, cert: true },
  },
  {
    id: 3,
    initials: 'AO', name: 'Amina Osei', skill: 'Electrical',
    phone: '+233 501 234 567', email: 'amina.osei@email.com',
    location: 'Accra, Ghana',
    documents: { resume: false, cert: true },
  },
  {
    id: 4,
    initials: 'DK', name: 'David Kimani', skill: 'Carpentry',
    phone: '+254 798 765 432', email: 'david.k@email.com',
    location: 'Mombasa, Kenya',
    documents: { resume: true, cert: false },
  },
  {
    id: 5,
    initials: 'DK', name: 'David Kimani', skill: 'Painting',
    phone: '+254 798 765 432', email: 'david.k@email.com',
    location: 'Mombasa, Kenya',
    documents: { resume: true, cert: false },
  },
  {
    id: 6,
    initials: 'FB', name: 'Fatima Bello', skill: 'Cleaning',
    phone: '+234 803 456 789', email: 'fatima.bello@email.com',
    location: 'Lagos, Nigeria',
    documents: { resume: true, cert: true },
  },
  {
    id: 7,
    initials: 'KM', name: 'Kofi Mensah', skill: 'Landscaping',
    phone: '+233 244 987 654', email: 'kofi.mensah@email.com',
    location: 'Kumasi, Ghana',
    documents: null, // no documents uploaded
  },
];

const recentlyApproved = [
  { initials:'SN', name:'Sarah Njoroge', unit:'Unit A - Downtown', skill:'Landscaping', date:'Mar 8, 2026' },
  { initials:'KA', name:'Kwame Asante',  unit:'Unit B - Westside',  skill:'Electrical',  date:'Mar 7, 2026' },
  { initials:'GW', name:'Grace Wambui',  unit:'Unit C - Eastside',  skill:'Cleaning',    date:'Mar 6, 2026' },
  { initials:'ID', name:'Ibrahim Diallo', unit:'Unit D - Northgate', skill:'Plumbing',   date:'Mar 5, 2026' },
];

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
    showToast(`✓ ${req.name}'s ${req.skill} skill verified`);
    removeCard(card);
  });

  card.querySelector('.btn-reject').addEventListener('click', () => {
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
  recentlyApproved.forEach((p, i) => {
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
