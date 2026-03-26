let skills = [
  { id:1, name:'Plumbing',          category:'Trade',         desc:'Installation and repair of water supply, drainage, and plumbing systems.',  providers:24, services:38, status:'Active'   },
  { id:2, name:'Graphic Design',    category:'Creative',      desc:'Visual communication and creation of visual content for various media.',      providers:18, services:29, status:'Active'   },
  { id:3, name:'Electrical Wiring', category:'Trade',         desc:'Electrical installation and maintenance of wiring systems.',                  providers:15, services:22, status:'Active'   },
  { id:4, name:'Web Development',   category:'Technical',     desc:'Building and maintaining websites and web applications.',                     providers:32, services:45, status:'Active'   },
  { id:5, name:'Project Management',category:'Management',    desc:'Planning and overseeing projects to ensure they are completed efficiently.',  providers:12, services:16, status:'Active'   },
  { id:6, name:'Translation',       category:'Communication', desc:'Language translation services for documents and communication.',              providers:8,  services:11, status:'Inactive' },
  { id:7, name:'Carpentry',         category:'Trade',         desc:'Woodwork and furniture making, installation of wooden fixtures.',             providers:20, services:27, status:'Active'   },
  { id:8, name:'Data Analysis',     category:'Technical',     desc:'Analyzing and interpreting complex data sets to inform decisions.',           providers:10, services:14, status:'Active'   },
];

let editingId = null;

function truncate(str, n=50) { return str.length > n ? str.slice(0,n) + '...' : str; }

function renderTable(data) {
  const tbody = document.getElementById('skillsTableBody');
  tbody.innerHTML = '';
  data.forEach((sk, idx) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.04) + 's';
    tr.innerHTML = `
      <td class="skill-name-col">${sk.name}</td>
      <td><span class="cat-badge cat-${sk.category.replace(' ','')}">${sk.category}</span></td>
      <td class="desc-cell" title="${sk.desc}">${truncate(sk.desc)}</td>
      <td>${sk.providers}</td>
      <td>${sk.services}</td>
      <td><span class="status-${sk.status.toLowerCase()}">${sk.status}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-icon-btn btn-edit" data-id="${sk.id}" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="tbl-icon-btn btn-toggle" data-id="${sk.id}" title="Toggle Status">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>
          <button class="tbl-icon-btn btn-providers" data-id="${sk.id}" title="View Providers">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // footer
  const active = data.filter(s => s.status === 'Active').length;
  document.getElementById('tableFooter').innerHTML =
    `<span>${data.length} skills shown</span> · <span class="active-count">${active} active</span>`;

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const sk = skills.find(s => s.id === parseInt(btn.dataset.id));
      if (sk) openModal(sk);
    });
  });

  document.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const sk = skills.find(s => s.id === parseInt(btn.dataset.id));
      if (sk) {
        sk.status = sk.status === 'Active' ? 'Inactive' : 'Active';
        applyFilters();
        showToast(`${sk.name} marked as ${sk.status}`);
      }
    });
  });

  document.querySelectorAll('.btn-providers').forEach(btn => {
    btn.addEventListener('click', () => {
      const sk = skills.find(s => s.id === parseInt(btn.dataset.id));
      if (sk) showToast(`${sk.name} has ${sk.providers} providers`);
    });
  });
}

function applyFilters() {
  const search = document.getElementById('skillSearch').value.toLowerCase();
  const cat    = document.getElementById('catFilter').value;
  const filtered = skills.filter(sk => {
    const matchSearch = sk.name.toLowerCase().includes(search) || sk.desc.toLowerCase().includes(search);
    const matchCat    = cat === 'All' || sk.category === cat;
    return matchSearch && matchCat;
  });
  renderTable(filtered);
}

document.getElementById('skillSearch').addEventListener('input', applyFilters);
document.getElementById('catFilter').addEventListener('change', applyFilters);

// Modal
function openModal(sk) {
  editingId = sk ? sk.id : null;
  document.getElementById('modalTitle').textContent = sk ? 'Edit Skill' : 'Add New Skill';
  document.getElementById('skillName').value     = sk ? sk.name     : '';
  document.getElementById('skillCategory').value = sk ? sk.category : 'Trade';
  document.getElementById('skillDesc').value     = sk ? sk.desc     : '';
  document.getElementById('skillStatus').value   = sk ? sk.status   : 'Active';
  document.getElementById('btnSave').textContent  = sk ? 'Save Changes' : 'Add Skill';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

document.getElementById('btnAddSkill').addEventListener('click', () => openModal(null));
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

document.getElementById('btnSave').addEventListener('click', () => {
  const name   = document.getElementById('skillName').value.trim();
  const cat    = document.getElementById('skillCategory').value;
  const desc   = document.getElementById('skillDesc').value.trim();
  const status = document.getElementById('skillStatus').value;
  if (!name) { showToast('⚠ Skill name is required'); return; }
  if (editingId) {
    const sk = skills.find(s => s.id === editingId);
    Object.assign(sk, { name, category: cat, desc, status });
    showToast(`✓ "${name}" updated`);
  } else {
    skills.push({ id: Date.now(), name, category: cat, desc, providers: 0, services: 0, status });
    showToast(`✓ "${name}" added to skill catalog`);
  }
  closeModal();
  applyFilters();
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

renderTable(skills);
