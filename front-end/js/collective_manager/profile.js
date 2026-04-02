// ── Collective Manager Profile JS ──
// Loaded after store.js + auth.js

let _session = null;
let _cm = null; // collective_manager row
let _collective = null; // collective row
let _myUnits = []; // units belonging to this collective

/* ─────────────────────────────────────────────
   BOOT — wait for AppStore then hydrate page
───────────────────────────────────────────── */
AppStore.ready.then(() => {
  // 1. Require a valid collective_manager session
  _session = Auth.requireSession(["collective_manager"]);
  if (!_session) return; // redirected by Auth

  const cmId = _session.id;
  const collectiveId = _session.collectiveId;

  // 2. Fetch rows from AppStore
  const allCMs = AppStore.getTable("collective_managers") || [];
  const allCollectives = AppStore.getTable("collectives") || [];
  const allUnits = AppStore.getTable("units") || [];
  const allProviders = AppStore.getTable("service_providers") || [];
  const allSectors = AppStore.getTable("sectors") || [];

  _cm = allCMs.find((c) => c.cm_id === cmId) || null;
  _collective =
    allCollectives.find((c) => c.collective_id === collectiveId) || null;
  _myUnits = allUnits.filter((u) => u.collective_id === collectiveId);

  // 3. Hydrate all UI sections
  hydrateHero(_cm, _collective, _myUnits, allProviders);
  hydratePersonalCard(_cm);
  hydrateCollectiveCard(_collective, allSectors);
  renderUnits(_myUnits, (allUnit) =>
    getUnitProviderCount(allUnit, allProviders),
  );
  renderActivities(_collective, _myUnits);
});

/* ─────────────────────────────────────────────
   HYDRATION HELPERS
───────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return "CM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function setVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val || '';
}

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getUnitProviderCount(unit, allProviders) {
  return allProviders.filter(function (p) { return p.unit_id === unit.unit_id; }).length;
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) { return isoStr; }
}

/* ══════════════════════════════════════════════
   VALIDATION HELPERS
══════════════════════════════════════════════ */

function isValidEmail(email) {
  // RFC-style: must have chars @ chars . chars
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  // Strip spaces/dashes, must be 7–15 digits
  var digits = phone.replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(digits);
}

function showFieldError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#ef4444';
  el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.15)';
  // Insert/update inline error below field
  var errId = id + '-err';
  var existing = document.getElementById(errId);
  if (!existing) {
    existing = document.createElement('span');
    existing.id = errId;
    existing.style.cssText = 'display:block;font-size:.75rem;color:#ef4444;margin-top:4px;';
    el.parentNode.insertBefore(existing, el.nextSibling);
  }
  existing.textContent = msg;
}

function clearFieldError(id) {
  var el = document.getElementById(id);
  if (el) { el.style.borderColor = ''; el.style.boxShadow = ''; }
  var err = document.getElementById(id + '-err');
  if (err) err.textContent = '';
}

/* ══════════════════════════════════════════════
   HYDRATION
══════════════════════════════════════════════ */

function hydrateHero(cm, collective, units, allProviders) {
  var name      = cm ? cm.name  : 'Collective Manager';
  var email     = cm ? cm.email : '';
  var pfp       = cm ? cm.pfp_url : null;
  var initials  = getInitials(name);
  var unitIds   = units.map(function (u) { return u.unit_id; });
  var provCount = allProviders.filter(function (p) { return unitIds.indexOf(p.unit_id) !== -1; }).length;

  var heroName  = document.getElementById('hero-name');
  var heroEmail = document.getElementById('hero-email');
  var statUnits = document.getElementById('stat-units');
  var statProv  = document.getElementById('stat-providers');

  if (heroName)  heroName.textContent  = name;
  if (heroEmail) heroEmail.textContent = email;
  if (statUnits) statUnits.textContent = units.length;
  if (statProv)  statProv.textContent  = provCount;

  var av = document.getElementById('profile-avatar');
  if (av) {
    if (pfp) {
      av.innerHTML = '<img src="' + pfp + '" alt="' + name + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    } else {
      av.textContent = initials;
    }
  }

  var topbarAv = document.getElementById('topbar-avatar');
  if (topbarAv && !topbarAv.querySelector('img')) topbarAv.textContent = initials;
}

function hydratePersonalCard(cm) {
  if (!cm) return;
  setVal('full-name', cm.name);
  setVal('email',     cm.email);
  setVal('phone',     cm.phone);
  setVal('dob',       cm.dob || '');

  var heroName  = document.getElementById('hero-name');
  var heroEmail = document.getElementById('hero-email');
  if (heroName)  heroName.textContent  = cm.name;
  if (heroEmail) heroEmail.textContent = cm.email;
}

function hydrateCollectiveCard(collective, allSectors) {
  if (!collective) return;
  setVal('collective-name', collective.collective_name);
  setVal('collective-id',   collective.collective_id);
  setVal('region',          collective.region || '');

  // Try to set domain select
  var domEl = document.getElementById('domain');
  if (domEl && collective.primary_domain) {
    for (var i = 0; i < domEl.options.length; i++) {
      if (domEl.options[i].value === collective.primary_domain ||
          domEl.options[i].text  === collective.primary_domain) {
        domEl.selectedIndex = i;
        break;
      }
    }
  }

  // Sector → region fallback
  if (!collective.region) {
    var sectorIds   = collective.sector_ids || [];
    var firstSector = allSectors.find(function (s) { return sectorIds.indexOf(s.sector_id) !== -1; });
    if (firstSector) setVal('region', firstSector.region);
  }
}

/* ══════════════════════════════════════════════
   UNITS LIST
══════════════════════════════════════════════ */

function renderUnits(units, countFn) {
  var el = document.getElementById('unit-list');
  if (!el) return;
  if (!units.length) {
    el.innerHTML = '<p style="color:var(--muted,#94a3b8);font-size:.875rem;padding:.5rem 0">No units assigned to this collective.</p>';
    return;
  }
  el.innerHTML = units.map(function (u) {
    var active    = u.is_active;
    var dotCls    = active ? 'green' : 'amber';
    var badgeCls  = active ? '' : 'amber';
    var badgeText = active ? 'Active' : 'Inactive';
    var count     = countFn(u);
    return '<div class="unit-item">' +
      '<div class="unit-item-left">' +
        '<div class="unit-dot ' + dotCls + '"></div>' +
        '<div>' +
          '<div class="unit-name">' + u.unit_name + '</div>' +
          '<div class="unit-sub">' + count + ' provider' + (count !== 1 ? 's' : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="unit-badge ' + badgeCls + '">' + badgeText + '</span>' +
    '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════
   RECENT ACTIVITY
══════════════════════════════════════════════ */

function renderActivities(collective, units) {
  var el = document.getElementById('activity-list');
  if (!el) return;
  var events = [];
  if (collective) {
    events.push({ title: 'Collective created', desc: collective.collective_name + ' was registered on the platform', time: formatDate(collective.created_at), color: 'green' });
  }
  units.slice(0, 4).forEach(function (u) {
    events.push({ title: 'Unit assigned', desc: u.unit_name + ' is part of your collective', time: formatDate(u.created_at), color: u.is_active ? '' : 'amber' });
  });
  if (!events.length) {
    el.innerHTML = '<p style="color:var(--muted,#94a3b8);font-size:.875rem;padding:.5rem 0">No recent activity.</p>';
    return;
  }
  el.innerHTML = events.map(function (a) {
    return '<div class="act-item"><div class="act-dot ' + a.color + '"></div><div class="act-body"><div class="act-title">' + a.title + '</div><div class="act-desc">' + a.desc + '</div><div class="act-time">' + a.time + '</div></div></div>';
  }).join('');
}

/* ══════════════════════════════════════════════
   LIVE SYNC (while typing)
══════════════════════════════════════════════ */

function syncName() {
  var v        = getVal('full-name');
  var fallback = (_cm && _cm.name) ? _cm.name : 'Collective Manager';
  var display  = v || fallback;
  var heroName = document.getElementById('hero-name');
  if (heroName) heroName.textContent = display;
  var av = document.getElementById('profile-avatar');
  if (av && !av.querySelector('img')) av.textContent = getInitials(display);
  var topbarAv = document.getElementById('topbar-avatar');
  if (topbarAv && !topbarAv.querySelector('img')) topbarAv.textContent = getInitials(display);
  clearFieldError('full-name');
}

function syncEmail() {
  var v        = getVal('email');
  var fallback = (_cm && _cm.email) ? _cm.email : '';
  var heroEmail = document.getElementById('hero-email');
  if (heroEmail) heroEmail.textContent = v || fallback;
  clearFieldError('email');
}

/* ══════════════════════════════════════════════
   SAVE — PERSONAL INFO
══════════════════════════════════════════════ */

function saveSection(section) {
  if (section === 'personal') savePersonal();
  else if (section === 'collective') saveCollective();
  else showToast('Changes saved!');
}

function savePersonal() {
  var name  = getVal('full-name');
  var email = getVal('email');
  var phone = getVal('phone');
  var dob   = getVal('dob');

  var valid = true;

  // Name
  clearFieldError('full-name');
  if (!name) {
    showFieldError('full-name', 'Full name is required.');
    valid = false;
  }

  // Email
  clearFieldError('email');
  if (!email) {
    showFieldError('email', 'Email address is required.');
    valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('email', 'Please enter a valid email address (e.g. name@domain.com).');
    valid = false;
  }

  // Phone — only validate if something is entered
  clearFieldError('phone');
  if (phone && !isValidPhone(phone)) {
    showFieldError('phone', 'Phone must be 7–15 digits (spaces and dashes allowed).');
    valid = false;
  }

  if (!valid) {
    showToast('Please fix the errors before saving.', 'error');
    return;
  }

  // ── Write to AppStore ──
  if (_cm) {
    _cm.name  = name;
    _cm.email = email;
    if (phone) _cm.phone = phone;
    if (dob)   _cm.dob   = dob;
    AppStore.save();
  }

  // ── Update session name in sessionStorage so topbar stays correct ──
  try {
    var raw = sessionStorage.getItem('fsd_session');
    if (raw) {
      var sess = JSON.parse(raw);
      sess.name  = name;
      sess.email = email;
      sessionStorage.setItem('fsd_session', JSON.stringify(sess));
    }
  } catch (_) {}

  // ── Refresh hero ──
  var heroName  = document.getElementById('hero-name');
  var heroEmail = document.getElementById('hero-email');
  if (heroName)  heroName.textContent  = name;
  if (heroEmail) heroEmail.textContent = email;

  showToast('✓ Personal information saved successfully!');
}

/* ══════════════════════════════════════════════
   SAVE — COLLECTIVE DETAILS
══════════════════════════════════════════════ */

function saveCollective() {
  var collectiveName = getVal('collective-name');
  var region         = getVal('region');
  var domEl          = document.getElementById('domain');
  var domain         = domEl ? domEl.value : '';

  var valid = true;

  clearFieldError('collective-name');
  if (!collectiveName) {
    showFieldError('collective-name', 'Collective name is required.');
    valid = false;
  }

  if (!valid) {
    showToast('Please fix the errors before saving.', 'error');
    return;
  }

  // ── Write to AppStore ──
  if (_collective) {
    _collective.collective_name = collectiveName;
    _collective.region          = region;
    _collective.primary_domain  = domain;
    AppStore.save();
  }

  showToast('✓ Collective details saved successfully!');
}

/* ══════════════════════════════════════════════
   AVATAR UPLOAD
══════════════════════════════════════════════ */

function updateAvatar(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var dataUrl = e.target.result;
    var av = document.getElementById('profile-avatar');
    if (av) av.innerHTML = '<img src="' + dataUrl + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    // Persist avatar in AppStore
    if (_cm) {
      _cm.pfp_url = dataUrl;
      AppStore.save();
    }
    showToast('✓ Avatar updated.');
  };
  reader.readAsDataURL(input.files[0]);
}

/* ══════════════════════════════════════════════
   PASSWORD MODAL
══════════════════════════════════════════════ */

function openPwdModal()    { document.getElementById('pwd-modal').classList.add('open'); }
function closePwdModal(e)  { if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn(); }
function closePwdModalBtn() {
  document.getElementById('pwd-modal').classList.remove('open');
  ['pwd-current', 'pwd-new', 'pwd-confirm'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function handlePasswordChange() {
  const currentPwd = document.getElementById("pwd-current")?.value;
  const newPwd = document.getElementById("pwd-new")?.value;
  const confirmPwd = document.getElementById("pwd-confirm")?.value;

  if (!currentPwd || !newPwd || !confirmPwd) {
    showToast('Please fill in all password fields.', 'error'); return;
  }
  if (newPwd.length < 8) {
    showToast('New password must be at least 8 characters.', 'error'); return;
  }
  if (newPwd !== confirmPwd) {
    showToast('New passwords do not match.', 'error'); return;
  }

  var res = Auth.changePassword(currentPwd, newPwd);
  if (res.success) {
    showToast('✓ Password updated successfully!');
    closePwdModalBtn();
  } else {
    var errorMap = {
      invalid_current_password: 'Current password is incorrect.',
      not_logged_in: 'Session expired. Please log in again.',
    };
    showToast(errorMap[res.error] || 'Failed to update password.', 'error');
  }
}

/* ══════════════════════════════════════════════
   DANGER ZONE — in-page confirm (no browser dialog)
══════════════════════════════════════════════ */

function confirmDelete() {
  // Build a one-off modal inline
  var existingBd = document.getElementById('_dangerBackdrop');
  if (existingBd) existingBd.remove();

  var style = document.createElement('style');
  style.textContent =
    '#_dangerBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:900;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)}' +
    '#_dangerCard{background:var(--surface,#1e293b);border:1px solid #3f1f1f;border-radius:14px;padding:28px 28px 24px;width:min(380px,90vw);font-family:Inter,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
    '#_dangerCard h3{margin:0 0 10px;color:#f87171;font-size:1rem}' +
    '#_dangerCard p{margin:0 0 22px;color:var(--muted,#94a3b8);font-size:.875rem;line-height:1.6}' +
    '#_dangerCard .dz-row{display:flex;gap:10px;justify-content:flex-end}' +
    '#_dangerCard .dz-cancel{padding:9px 18px;border-radius:8px;border:1px solid var(--border,#334155);background:transparent;color:var(--muted,#94a3b8);cursor:pointer;font-size:.84rem}' +
    '#_dangerCard .dz-confirm{padding:9px 18px;border-radius:8px;border:none;background:#dc2626;color:#fff;cursor:pointer;font-size:.84rem;font-weight:600}';
  document.head.appendChild(style);

  var bd = document.createElement('div');
  bd.id  = '_dangerBackdrop';
  bd.innerHTML =
    '<div id="_dangerCard">' +
      '<h3>&#9888; Deactivate Account</h3>' +
      '<p>Are you sure you want to deactivate your Collective Manager account? This will remove all your collective assignments and cannot be undone.</p>' +
      '<div class="dz-row">' +
        '<button class="dz-cancel" id="_dangerCancel">Cancel</button>' +
        '<button class="dz-confirm" id="_dangerConfirm">Yes, Deactivate</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(bd);

  document.getElementById('_dangerCancel').onclick = function () { bd.remove(); };
  document.getElementById('_dangerConfirm').onclick = function () {
    bd.remove();
    showToast('Account deactivation requested. You will be contacted shortly.');
  };
  bd.addEventListener('click', function (e) { if (e.target === bd) bd.remove(); });
}

/* ══════════════════════════════════════════════
   BOOT — wait for AppStore then hydrate
══════════════════════════════════════════════ */

AppStore.ready.then(function () {
  _session = Auth.requireSession(['collective_manager']);
  if (!_session) return;

  var cmId         = _session.id;
  var collectiveId = _session.collectiveId;

  var allCMs         = AppStore.getTable('collective_managers') || [];
  var allCollectives = AppStore.getTable('collectives')         || [];
  var allUnits       = AppStore.getTable('units')               || [];
  var allProviders   = AppStore.getTable('service_providers')   || [];
  var allSectors     = AppStore.getTable('sectors')             || [];

  // Get LIVE references so mutations via save() are reflected immediately
  _cm         = allCMs.find(function (c) { return c.cm_id === cmId; })          || null;
  _collective = allCollectives.find(function (c) { return c.collective_id === collectiveId; }) || null;
  _myUnits    = allUnits.filter(function (u) { return u.collective_id === collectiveId; });

  // Populate fields AFTER window.onload to beat browser form-restoration
  window.onload = function () {
    hydrateHero(_cm, _collective, _myUnits, allProviders);
    hydratePersonalCard(_cm);
    hydrateCollectiveCard(_collective, allSectors);
    renderUnits(_myUnits, function (u) { return getUnitProviderCount(u, allProviders); });
    renderActivities(_collective, _myUnits);
  };

  // If onload already fired, hydrate immediately too
  if (document.readyState === 'complete') {
    hydrateHero(_cm, _collective, _myUnits, allProviders);
    hydratePersonalCard(_cm);
    hydrateCollectiveCard(_collective, allSectors);
    renderUnits(_myUnits, function (u) { return getUnitProviderCount(u, allProviders); });
    renderActivities(_collective, _myUnits);
  }
});
