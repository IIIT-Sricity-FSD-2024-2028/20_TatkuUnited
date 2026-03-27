const skills = [
  { name: 'Cloud Architecture', category: 'Technical', providers: 24, proficiency: 4.2 },
  { name: 'Strategic Planning',  category: 'Leadership', providers: 12, proficiency: 4.9 },
  { name: 'Data Analysis',       category: 'Technical',  providers: 45, proficiency: 3.5 },
  { name: 'Crisis Management',   category: 'Soft Skills', providers: 8, proficiency: 4.0 },
  { name: 'Cybersecurity',       category: 'Technical',  providers: 6,  proficiency: 3.8 },
];

const catClass = { 'Technical': 'technical', 'Leadership': 'leadership', 'Soft Skills': 'soft' };

function stars(r) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : '☆';
  return s;
}

function renderSkills() {
  const tbody = document.getElementById('skillBody');
  tbody.innerHTML = '';
  skills.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td><span class="cat-pill ${catClass[s.category]}">${s.category}</span></td>
      <td>${s.providers}</td>
      <td><span class="stars">${stars(s.proficiency)}</span> <strong>${s.proficiency.toFixed(1)}</strong></td>
      <td><button class="action-link">Edit Library</button></td>
    `;
    tbody.appendChild(tr);
  });
}

const allocProviders = [
  { initials: 'JD', name: 'Jordan Miller', role: 'Senior Systems Analyst', tags: ['AWS', 'Python'], color: '#2563eb' },
  { initials: 'SC', name: 'Sarah Chen',    role: 'Solutions Architect',    tags: ['Strategic Planning', 'Go'], color: '#0d9488' },
  { initials: 'MT', name: 'Marcus Taylor', role: 'Data Scientist',         tags: ['SQL', 'PyTorch'], color: '#7c3aed' },
];

function renderAlloc() {
  const list = document.getElementById('allocList');
  list.innerHTML = '';
  allocProviders.forEach(p => {
    const div = document.createElement('div');
    div.className = 'alloc-item';
    div.innerHTML = `
      <div class="alloc-avatar" style="background:${p.color}">${p.initials}</div>
      <div>
        <div class="alloc-name">${p.name}</div>
        <div class="alloc-role">${p.role}</div>
      </div>
      <div class="alloc-tags">
        ${p.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
        <button class="add-tag-btn">+ Add</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function openSkillModal() { document.getElementById('skillModalOverlay').classList.add('open'); }
function closeSkillModal() { document.getElementById('skillModalOverlay').classList.remove('open'); }

function addSkill() {
  const name = document.getElementById('newSkillName').value.trim();
  if (!name) { alert('Please enter a skill name.'); return; }
  const category = document.getElementById('newSkillCat').value;
  skills.unshift({ name, category, providers: 0, proficiency: 0 });
  closeSkillModal();
  document.getElementById('newSkillName').value = '';
  renderSkills();
}

renderSkills();
renderAlloc();
