let units = [
  { id:1, name:'QuickFix Plumbing',     manager:'Alice Mwangi',    category:'Plumbing',    rating:4.7, providers:12, completed:342, active:8,  status:'Active'    },
  { id:2, name:'BrightSpark Electrical', manager:'David Ochieng',   category:'Electrical',  rating:4.5, providers:9,  completed:218, active:5,  status:'Active'    },
  { id:3, name:'SparkleClean Services',  manager:'Faith Njeri',     category:'Cleaning',    rating:4.8, providers:20, completed:567, active:15, status:'Active'    },
  { id:4, name:'GreenThumb Landscaping', manager:'Brian Kipchoge',  category:'Landscaping', rating:4.3, providers:7,  completed:134, active:3,  status:'Active'    },
  { id:5, name:'SafeGuard Security',     manager:'Catherine Amina', category:'Security',    rating:4.1, providers:15, completed:89,  active:0,  status:'Suspended' },
  { id:6, name:'PaintPro Decorators',    manager:'Stephen Wafula',  category:'Painting',    rating:4.6, providers:6,  completed:201, active:4,  status:'Active'    },
];

const catClass = {Plumbing:'cat-plumbing',Electrical:'cat-electrical',Cleaning:'cat-cleaning',Landscaping:'cat-landscaping',Security:'cat-security',Painting:'cat-painting'};

function renderTable(data) {
  const tbody = document.getElementById('unitsTableBody');
  tbody.innerHTML = '';
  data.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="unit-name">${u.name}</div>
        <div class="unit-manager">${u.manager}</div>
      </td>
      <td><span class="cat-badge ${catClass[u.category] || ''}">${u.category}</span></td>
      <td><span class="rating"><span class="star">★</span>${u.rating.toFixed(1)}</span></td>
      <td>${u.providers}</td>
      <td>${u.completed.toLocaleString()}</td>
      <td>${u.active}</td>
      <td><span class="${u.status === 'Active' ? 'status-active' : 'status-suspended'}">${u.status}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-icon-btn" title="View">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="tbl-icon-btn btn-edit" data-id="${u.id}" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="tbl-icon-btn btn-suspend" data-id="${u.id}" title="Suspend">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const unit = units.find(u => u.id === parseInt(btn.dataset.id));
      if (unit) openModal(unit);
    });
  });

  document.querySelectorAll('.btn-suspend').forEach(btn => {
    btn.addEventListener('click', () => {
      const unit = units.find(u => u.id === parseInt(btn.dataset.id));
      if (unit) {
        unit.status = unit.status === 'Active' ? 'Suspended' : 'Active';
        applyFilters();
        showToast(unit.status === 'Active' ? `✓ ${unit.name} reactivated` : `⚠ ${unit.name} suspended`);
      }
    });
  });
}

function applyFilters() {
  const search = document.getElementById('unitSearch').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = units.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search) || u.manager.toLowerCase().includes(search);
    const matchStatus = status === 'All' || u.status === status;
    return matchSearch && matchStatus;
  });
  renderTable(filtered);
}

document.getElementById('unitSearch').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

// Modal
let editingId = null;
function openModal(unit) {
  editingId = unit ? unit.id : null;
  document.getElementById('modalTitle').textContent = unit ? 'Edit Unit' : 'Create New Unit';
  document.getElementById('unitName').value    = unit ? unit.name    : '';
  document.getElementById('unitManager').value = unit ? unit.manager : '';
  document.getElementById('unitCategory').value = unit ? unit.category : 'Plumbing';
  document.getElementById('btnSave').textContent = unit ? 'Save Changes' : 'Create Unit';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

document.getElementById('btnCreateUnit').addEventListener('click', () => openModal(null));
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

document.getElementById('btnSave').addEventListener('click', () => {
  const name = document.getElementById('unitName').value.trim();
  const mgr  = document.getElementById('unitManager').value.trim();
  const cat  = document.getElementById('unitCategory').value;
  if (!name || !mgr) { showToast('⚠ Please fill in all fields'); return; }
  if (editingId) {
    const unit = units.find(u => u.id === editingId);
    unit.name = name; unit.manager = mgr; unit.category = cat;
    showToast(`✓ ${name} updated`);
  } else {
    units.push({ id: Date.now(), name, manager: mgr, category: cat, rating: 0, providers: 0, completed: 0, active: 0, status: 'Active' });
    showToast(`✓ ${name} created`);
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

renderTable(units);
