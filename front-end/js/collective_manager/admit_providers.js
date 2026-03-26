const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#6366f1'];

const applicants = [
  {
    id: 1, initials: 'JM', name: 'James Mwangi', skills: ['Plumbing','HVAC'],
    phone: '+254 712 345 678', email: 'james.mwangi@email.com',
    location: 'Nairobi, Kenya', exp: '8 years exp.',
    bio: 'Commercial & residential plumbing specialist',
    cert: true, resume: true,
  },
  {
    id: 2, initials: 'AO', name: 'Amina Osei', skills: ['Electrical'],
    phone: '+233 501 234 567', email: 'amina.osei@email.com',
    location: 'Accra, Ghana', exp: '5 years exp.',
    bio: 'Licensed electrician, solar installation expert',
    cert: true, resume: false,
  },
  {
    id: 3, initials: 'DK', name: 'David Kimani', skills: ['Carpentry','Painting'],
    phone: '+254 798 765 432', email: 'david.k@email.com',
    location: 'Mombasa, Kenya', exp: '12 years exp.',
    bio: 'Furniture crafting and interior finishing',
    cert: false, resume: true,
  },
  {
    id: 4, initials: 'FB', name: 'Fatima Bello', skills: ['Cleaning'],
    phone: '+234 803 456 789', email: 'fatima.bello@email.com',
    location: 'Lagos, Nigeria', exp: '3 years exp.',
    bio: 'Commercial cleaning services manager',
    cert: true, resume: true,
  },
];

const units = ['Unit A - Downtown','Unit B - Westside','Unit C - Eastside','Unit D - Northgate'];
const skillOptions = ['Plumbing','Electrical','Carpentry','Cleaning','Painting','HVAC','Landscaping'];

const recentlyApproved = [
  { initials:'SN', name:'Sarah Njoroge', unit:'Unit A - Downtown', skill:'Landscaping', date:'Mar 8, 2026' },
  { initials:'KA', name:'Kwame Asante',  unit:'Unit B - Westside',  skill:'Electrical',  date:'Mar 7, 2026' },
  { initials:'GW', name:'Grace Wambui',  unit:'Unit C - Eastside',  skill:'Cleaning',    date:'Mar 6, 2026' },
  { initials:'ID', name:'Ibrahim Diallo', unit:'Unit D - Northgate', skill:'Plumbing',   date:'Mar 5, 2026' },
];

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function removeCard(cardEl) {
  cardEl.classList.add('fade-out');
  setTimeout(() => {
    cardEl.remove();
    const remaining = document.querySelectorAll('.applicant-card').length;
    document.getElementById('pendingCount').textContent =
      remaining + ' application' + (remaining !== 1 ? 's' : '') + ' pending review';
  }, 300);
}

function buildApplicantCard(ap, idx) {
  const card = document.createElement('div');
  card.className = 'applicant-card';
  card.style.animationDelay = (idx * 0.08) + 's';

  const color = colors[idx % colors.length];

  const docsHtml = [
    ap.cert   ? `<a class="doc-link" href="#"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Certification uploaded</a>` : '',
    ap.resume ? `<a class="doc-link" href="#"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Resume uploaded</a>` : '',
  ].filter(Boolean).join('');

  const skillTagsHtml = ap.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');

  const unitOptions = units.map(u => `<option>${u}</option>`).join('');
  const skillSelectOptions = skillOptions.map(s => `<option>${s}</option>`).join('');

  card.innerHTML = `
    <div class="applicant-avatar" style="background:${color}">${ap.initials}</div>
    <div class="applicant-main">
      <div class="applicant-name">${ap.name}</div>
      <div class="skill-tags">${skillTagsHtml}</div>
      <div class="applicant-meta">
        <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>${ap.phone}</div>
        <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${ap.email}</div>
        <div class="meta-row"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${ap.location}</div>
        <div class="meta-row"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${ap.exp}</div>
      </div>
      <div class="applicant-footer">
        <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:#6b7280;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        ${ap.bio}
        ${docsHtml}
      </div>
    </div>
    <div class="applicant-actions">
      <select class="action-select"><option value="">Assign to Unit</option>${unitOptions}</select>
      <select class="action-select"><option value="">Verify Skill</option>${skillSelectOptions}</select>
      <div class="action-btns">
        <button class="btn-approve" data-id="${ap.id}">Approve</button>
        <button class="btn-reject" data-id="${ap.id}">Reject</button>
      </div>
      <button class="btn-view">View Details</button>
    </div>
  `;

  card.querySelector('.btn-approve').addEventListener('click', () => {
    showToast(`✓ ${ap.name} approved successfully`);
    removeCard(card);
  });

  card.querySelector('.btn-reject').addEventListener('click', () => {
    showToast(`✗ ${ap.name} application rejected`);
    removeCard(card);
  });

  return card;
}

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

// Init
const list = document.getElementById('applicantsList');
applicants.forEach((ap, i) => list.appendChild(buildApplicantCard(ap, i)));
buildApprovedCards();
