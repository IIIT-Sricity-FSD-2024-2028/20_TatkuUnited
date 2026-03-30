/**
 * skills.js — Unit Manager: Manage Skills
 *
 * Fixes in this version:
 *  1. Delete now uses in-page modal (no browser confirm() that gets blocked)
 *  2. Deleted base skills stay gone after refresh — stored in LS_DELETED
 *  3. Deleted added skills removed from LS_ADDED
 *  4. Search/filter on Skill Library table
 *  5. Provider Allocation search wired
 *  6. Add skill persists and deduplicates correctly
 *  7. Inline skill picker assigns to provider and persists
 *  8. Skill coverage computed from live data
 */

/* ─────────────────────────────────────────────
   1. BASE MOCK DATA
   ───────────────────────────────────────────── */

var BASE_SKILLS = [
  { id: 'SKL001', name: 'Plumbing',          category: 'Technical',   providers: 3, proficiency: 4.2 },
  { id: 'SKL002', name: 'Electrical Wiring', category: 'Technical',   providers: 4, proficiency: 4.5 },
  { id: 'SKL003', name: 'Deep Cleaning',     category: 'Soft Skills', providers: 4, proficiency: 4.0 },
  { id: 'SKL004', name: 'Carpentry',         category: 'Technical',   providers: 2, proficiency: 4.1 },
  { id: 'SKL005', name: 'AC Servicing',      category: 'Technical',   providers: 2, proficiency: 4.6 },
  { id: 'SKL006', name: 'Pest Control',      category: 'Technical',   providers: 1, proficiency: 3.8 },
];

var BASE_ALLOC = [
  { id: 'SP001', initials: 'RK', name: 'Ravi Kumar',     tags: ['Electrical Wiring', 'AC Servicing'],  color: '#3b82f6' },
  { id: 'SP002', initials: 'PS', name: 'Priya Sharma',   tags: ['Plumbing', 'Deep Cleaning'],           color: '#0d9488' },
  { id: 'SP004', initials: 'MK', name: 'Meera Krishnan', tags: ['Carpentry', 'Plumbing'],               color: '#7c3aed' },
  { id: 'SP005', initials: 'SB', name: 'Sunil Babu',     tags: ['AC Servicing', 'Electrical Wiring'],   color: '#d97706' },
  { id: 'SP008', initials: 'NL', name: 'Nithya Lakshmi', tags: ['Deep Cleaning', 'Pest Control'],       color: '#16a34a' },
];

/* ─────────────────────────────────────────────
   2. LOCALSTORAGE
   ───────────────────────────────────────────── */

var LS_ADDED   = 'um_skills_added_v2';
var LS_DELETED = 'um_skills_deleted_v2';
var LS_ALLOC   = 'um_skills_alloc_v2';

function lsGet(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* ─────────────────────────────────────────────
   3. STATE
   ───────────────────────────────────────────── */

var addedSkills  = lsGet(LS_ADDED,   []);
var deletedIds   = lsGet(LS_DELETED, []);   // plain array — no Set issues
var allocProviders = lsGet(LS_ALLOC, null) || BASE_ALLOC.map(function(p) {
  return { id: p.id, initials: p.initials, name: p.name, tags: p.tags.slice(), color: p.color };
});

var nextId = 100 + addedSkills.length;
function genId() { return 'SKL-NEW-' + (++nextId); }

/** Build the live skills list: user-added first, then base minus deletions */
function buildSkills() {
  var base = BASE_SKILLS.filter(function(s) {
    return deletedIds.indexOf(s.id) === -1;
  });
  /* Clone base so in-memory mutations (providers++) don't corrupt BASE_SKILLS */
  var clonedBase = base.map(function(s) {
    return { id: s.id, name: s.name, category: s.category, providers: s.providers, proficiency: s.proficiency };
  });
  return addedSkills.concat(clonedBase);
}

var skills = buildSkills();
var currentSearch = '';

/* ─────────────────────────────────────────────
   4. IN-PAGE MODAL  (replaces confirm() / alert())
   ───────────────────────────────────────────── */

(function injectModalStyles() {
  var s = document.createElement('style');
  s.textContent =
    '#skBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:none;align-items:center;justify-content:center}' +
    '#skBackdrop.open{display:flex}' +
    '#skModal{background:var(--surface,#1e293b);border:1px solid var(--border,#334155);border-radius:14px;' +
      'padding:24px;width:min(380px,88vw);font-family:Inter,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
    '#skModal h3{margin:0 0 10px;color:var(--text-primary,#f1f5f9);font-size:.95rem}' +
    '#skModal p{margin:0 0 18px;color:var(--text-secondary,#94a3b8);font-size:.86rem;line-height:1.55}' +
    '#skModal .mbrow{display:flex;gap:10px;justify-content:flex-end}' +
    '#skModal .mbrow button{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;' +
      'font-size:.84rem;font-weight:500;font-family:inherit}' +
    '#skModal .mbrow .mcancel{background:transparent;border:1px solid var(--border,#334155);color:var(--text-secondary,#94a3b8)}' +
    '#skModal .mbrow .mdanger{background:#dc2626;color:#fff}' +
    '#sk-toast{position:fixed;bottom:22px;right:22px;z-index:2000;padding:11px 18px;' +
      'border-radius:10px;color:#fff;font-size:.86rem;font-weight:500;font-family:Inter,sans-serif;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.3);transition:opacity .3s;max-width:300px}';
  document.head.appendChild(s);

  var bd = document.createElement('div');
  bd.id = 'skBackdrop';
  bd.innerHTML = '<div id="skModal"></div>';
  bd.addEventListener('click', function(e) { if (e.target === bd) closeSkModal(); });
  document.body.appendChild(bd);
})();

function openSkModal(title, body, buttons) {
  var bd  = document.getElementById('skBackdrop');
  var mod = document.getElementById('skModal');
  var btns = buttons.map(function(b) {
    return '<button class="' + b.cls + '" id="skMBtn_' + b.id + '">' + b.label + '</button>';
  }).join('');
  mod.innerHTML = '<h3>' + title + '</h3><p>' + body + '</p><div class="mbrow">' + btns + '</div>';
  bd.classList.add('open');
  buttons.forEach(function(b) {
    var el = document.getElementById('skMBtn_' + b.id);
    if (el) el.addEventListener('click', function() {
      bd.classList.remove('open');
      if (b.onClick) b.onClick();
    });
  });
}

function closeSkModal() {
  document.getElementById('skBackdrop').classList.remove('open');
}

function skToast(msg, type) {
  var old = document.getElementById('sk-toast');
  if (old) old.remove();
  var bg = { success: '#16a34a', error: '#dc2626', info: '#2563eb', warning: '#d97706' };
  var el = document.createElement('div');
  el.id = 'sk-toast';
  el.style.background = bg[type] || bg.info;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 310);
  }, 2800);
}

/* ─────────────────────────────────────────────
   5. HELPERS
   ───────────────────────────────────────────── */

function buildStars(score) {
  var out = '';
  for (var i = 1; i <= 5; i++) out += i <= Math.floor(score) ? '\u2605' : '\u2606';
  return out;
}

function catClass(cat) {
  return ({ 'Technical': 'technical', 'Leadership': 'leadership', 'Soft Skills': 'soft' })[cat] || 'technical';
}

/* ─────────────────────────────────────────────
   6. SKILL TABLE RENDER  (with search filter)
   ───────────────────────────────────────────── */

function renderSkills() {
  var tbody = document.getElementById('skillBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var query = currentSearch.toLowerCase().trim();
  var visible = query
    ? skills.filter(function(s) { return s.name.toLowerCase().indexOf(query) !== -1 || (s.category || '').toLowerCase().indexOf(query) !== -1; })
    : skills;

  if (visible.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-secondary,#94a3b8)">' +
      (query ? 'No skills match "' + currentSearch + '".' : 'No skills yet. Add one using the button above.') +
      '</td></tr>';
    updateCoverage();
    return;
  }

  var frag = document.createDocumentFragment();
  visible.forEach(function(skill) {
    var tr = document.createElement('tr');
    var catBadge = skill.category
      ? '<span class="cat-badge ' + catClass(skill.category) + '">' + skill.category + '</span>'
      : '';
    var profDisplay = skill.proficiency > 0
      ? '<span class="stars">' + buildStars(skill.proficiency) + '</span> <strong>' + skill.proficiency.toFixed(1) + '</strong>'
      : '<span style="color:var(--text-secondary,#94a3b8);font-size:.8rem">No data yet</span>';

    tr.innerHTML =
      '<td><strong>' + skill.name + '</strong> ' + catBadge + '</td>' +
      '<td>' + skill.providers + '</td>' +
      '<td>' + profDisplay + '</td>' +
      '<td><button class="action-link" data-delete="' + skill.id + '">Delete</button></td>';

    /* Wire delete button with event listener — no inline onclick */
    tr.querySelector('[data-delete]').addEventListener('click', function() {
      deleteSkill(skill.id, skill.name);
    });

    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
  updateCoverage();
}

/* ─────────────────────────────────────────────
   7. SKILL COVERAGE
   ───────────────────────────────────────────── */

var THRESHOLD = 2;

function updateCoverage() {
  var pctEl  = document.getElementById('coveragePct');
  var barEl  = document.getElementById('coverageBar');
  var noteEl = document.getElementById('coverageNote');
  if (!pctEl || !barEl || !noteEl) return;

  if (skills.length === 0) {
    pctEl.textContent = '0%';
    barEl.style.width = '0%';
    noteEl.textContent = 'No skills in library yet.';
    return;
  }

  var covered = skills.filter(function(s) { return s.providers >= THRESHOLD; }).length;
  var pct     = Math.round((covered / skills.length) * 100);
  var under   = skills.filter(function(s) { return s.providers < THRESHOLD; });

  pctEl.textContent = pct + '%';
  barEl.style.width = pct + '%';

  if (under.length === 0) {
    noteEl.textContent = 'All skills are well-allocated. Great coverage!';
  } else {
    var names  = under.map(function(s) { return '"' + s.name + '"'; }).join(', ');
    var plural = under.length === 1 ? 'skill is' : 'skills are';
    noteEl.textContent = under.length + ' ' + plural + ' under-allocated (fewer than ' + THRESHOLD + ' providers): ' + names + '. Consider assigning more providers.';
  }
}

/* ─────────────────────────────────────────────
   8. PROVIDER ALLOCATION
   ───────────────────────────────────────────── */

function renderAlloc(filterQuery) {
  var list = document.getElementById('allocList');
  if (!list) return;
  list.innerHTML = '';

  var q = (filterQuery || '').toLowerCase().trim();
  var visible = q
    ? allocProviders.filter(function(p) { return p.name.toLowerCase().indexOf(q) !== -1; })
    : allocProviders;

  var frag = document.createDocumentFragment();
  visible.forEach(function(p) {
    var div = document.createElement('div');
    div.className = 'alloc-item';

    var tagsEl = document.createElement('div');
    tagsEl.className = 'alloc-tags';
    p.tags.forEach(function(t) {
      var span = document.createElement('span');
      span.className = 'skill-tag';
      span.textContent = t;
      tagsEl.appendChild(span);
    });

    var addBtn = document.createElement('button');
    addBtn.className = 'add-tag-btn';
    addBtn.textContent = '+ Add';
    (function(provider, btn) {
      btn.addEventListener('click', function() { showInlinePicker(btn, provider.id); });
    })(p, addBtn);
    tagsEl.appendChild(addBtn);

    div.innerHTML =
      '<div class="alloc-avatar" style="background:' + p.color + '">' + p.initials + '</div>' +
      '<div>' +
        '<div class="alloc-name">' + p.name + '</div>' +
        '<div class="alloc-role">' + (p.tags.join(' \u00b7 ') || 'No skills assigned') + '</div>' +
      '</div>';
    div.appendChild(tagsEl);
    frag.appendChild(div);
  });
  list.appendChild(frag);
}

/* Inline skill picker inside the alloc panel */
function showInlinePicker(addBtn, pid) {
  var provider = allocProviders.find(function(p) { return p.id === pid; });
  if (!provider) return;

  var available = skills.filter(function(s) { return provider.tags.indexOf(s.name) === -1; });

  if (available.length === 0) {
    addBtn.textContent = 'All assigned';
    addBtn.disabled = true;
    setTimeout(function() { addBtn.textContent = '+ Add'; addBtn.disabled = false; }, 2000);
    return;
  }

  addBtn.style.display = 'none';

  var wrapper = document.createElement('span');
  wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:4px';

  var sel = document.createElement('select');
  sel.style.cssText = 'font-size:.75rem;padding:3px 6px;border-radius:6px;border:1px solid var(--border,#334);' +
    'background:var(--surface2,#1e293b);color:var(--text-primary,#f1f5f9);cursor:pointer';
  available.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.name; opt.textContent = s.name;
    sel.appendChild(opt);
  });

  var ok = document.createElement('button');
  ok.textContent = '\u2713';
  ok.style.cssText = 'font-size:.75rem;padding:3px 7px;border-radius:6px;border:none;background:#16a34a;color:#fff;cursor:pointer';

  var cancel = document.createElement('button');
  cancel.textContent = '\u2715';
  cancel.style.cssText = 'font-size:.75rem;padding:3px 7px;border-radius:6px;border:none;background:#dc2626;color:#fff;cursor:pointer';

  function collapse() { wrapper.remove(); addBtn.style.display = ''; }

  ok.addEventListener('click', function() {
    var chosen = sel.value;
    if (!chosen) { collapse(); return; }

    /* Add tag to provider */
    if (provider.tags.indexOf(chosen) === -1) provider.tags.push(chosen);
    lsSet(LS_ALLOC, allocProviders);

    /* Increment provider count on the matching skill */
    var sk = skills.find(function(s) { return s.name === chosen; });
    if (sk) {
      sk.providers++;
      /* Persist if it's a user-added skill */
      var ae = addedSkills.find(function(s) { return s.id === sk.id; });
      if (ae) { ae.providers = sk.providers; lsSet(LS_ADDED, addedSkills); }
    }

    collapse();
    renderSkills();
    renderAlloc();
    skToast(chosen + ' assigned to ' + provider.name + ' \u2713', 'success');
  });

  cancel.addEventListener('click', collapse);
  wrapper.appendChild(sel); wrapper.appendChild(ok); wrapper.appendChild(cancel);
  addBtn.parentElement.appendChild(wrapper);
}

/* ─────────────────────────────────────────────
   9. ADD SKILL  (called from modal button)
   ───────────────────────────────────────────── */

window.openSkillModal = function() {
  document.getElementById('skillModalOverlay').classList.add('open');
  var inp = document.getElementById('newSkillName');
  inp.value = '';
  inp.style.borderColor = '';
  inp.focus();
};

window.closeSkillModal = function() {
  document.getElementById('skillModalOverlay').classList.remove('open');
};

window.addSkill = function() {
  var inp  = document.getElementById('newSkillName');
  var name = (inp.value || '').trim();

  if (!name) {
    inp.style.borderColor = '#dc2626';
    inp.focus();
    setTimeout(function() { inp.style.borderColor = ''; }, 1500);
    return;
  }

  var lower = name.toLowerCase();
  if (skills.some(function(s) { return s.name.toLowerCase() === lower; })) {
    inp.style.borderColor = '#d97706';
    setTimeout(function() { inp.style.borderColor = ''; }, 2000);
    skToast('Skill "' + name + '" already exists.', 'warning');
    return;
  }

  var newSkill = { id: genId(), name: name, category: 'Technical', providers: 0, proficiency: 0 };
  addedSkills.unshift(newSkill);
  lsSet(LS_ADDED, addedSkills);

  skills = buildSkills();
  window.closeSkillModal();
  renderSkills();
  skToast('"' + name + '" added to skill library \u2713', 'success');
};

/* ─────────────────────────────────────────────
   10. DELETE SKILL  — in-page modal, no confirm()
   ───────────────────────────────────────────── */

function deleteSkill(id, name) {
  openSkModal(
    'Delete Skill',
    'Delete <strong style="color:var(--text-primary,#f1f5f9)">"' + name + '"</strong>? This cannot be undone.',
    [
      { id: 'cancel', label: 'Cancel', cls: 'mcancel', onClick: null },
      { id: 'del',    label: 'Delete', cls: 'mdanger', onClick: function() {
          /* Remove from addedSkills if it's a user-added skill */
          var added = addedSkills.findIndex(function(s) { return s.id === id; });
          if (added !== -1) {
            addedSkills.splice(added, 1);
            lsSet(LS_ADDED, addedSkills);
          } else {
            /* It's a base skill — add to deleted list */
            if (deletedIds.indexOf(id) === -1) {
              deletedIds.push(id);
              lsSet(LS_DELETED, deletedIds);
            }
          }
          skills = buildSkills();
          renderSkills();
          renderAlloc();
          skToast('"' + name + '" removed \u2713', 'info');
      }}
    ]
  );
}

/* ─────────────────────────────────────────────
   11. SEARCH BARS
   ───────────────────────────────────────────── */

/* Skill Library search (icon-btn area) */
window.addEventListener('DOMContentLoaded', function() {
  /* Wire the search icon button to toggle a search input */
  var cardHead = document.querySelector('.card .card-head');
  if (cardHead) {
    var searchBtn = cardHead.querySelector('.icon-btn');
    if (searchBtn) {
      var searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search skills...';
      searchInput.style.cssText =
        'display:none;font-size:.84rem;padding:4px 10px;border-radius:8px;' +
        'border:1px solid var(--border,#334);background:var(--surface2,#0f172a);' +
        'color:var(--text-primary,#f1f5f9);width:160px;outline:none';
      cardHead.querySelector('.card-actions').insertBefore(searchInput, searchBtn);

      searchBtn.addEventListener('click', function() {
        var isHidden = searchInput.style.display === 'none';
        searchInput.style.display = isHidden ? 'inline-block' : 'none';
        if (isHidden) { searchInput.focus(); }
        else { searchInput.value = ''; currentSearch = ''; renderSkills(); }
      });

      searchInput.addEventListener('input', function() {
        currentSearch = searchInput.value;
        renderSkills();
      });
    }
  }

  /* Provider allocation search */
  var allocInput = document.querySelector('.alloc-search input');
  if (allocInput) {
    allocInput.addEventListener('input', function() {
      renderAlloc(allocInput.value);
    });
  }

  /* Escape closes skill modal */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeSkillModal();
  });

  /* Initial render */
  renderSkills();
  renderAlloc();
});
