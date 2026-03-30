/**
 * profile.js — Unit Manager: My Profile
 *
 * Everything persists to localStorage:
 *   - Personal info (name, email, phone, dob)
 *   - Unit details (unit name, service category, zone)
 *   - All 4 toggle states (emailNotif, smsAlerts, weeklySummary, twoFA)
 *   - Avatar image (base64)
 *
 * No browser confirm() used — custom modals instead.
 */

/* ─────────────────────────────────────────────
   1. DEFAULTS + LOCALSTORAGE
   ───────────────────────────────────────────── */

var PROFILE_KEY = 'um_profile_v2';

var DEFAULTS = {
  /* Personal */
  fullName: 'Arun Kumar',
  email: 'arun.kumar@tatku.com',
  phone: '9876543210',
  dob: '1990-03-22',
  /* Unit */
  unitName: 'Plumbing Unit Alpha',
  serviceCat: 'Plumbing',
  zone: 'North Bangalore',
  /* Toggles */
  emailNotif: true,
  smsAlerts: true,
  weeklySummary: false,
  twoFA: true,
  /* Avatar */
  avatar: null
};

function loadProfile() {
  try {
    var raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        /* Merge: start from defaults, overlay saved values */
        var out = {};
        var keys = Object.keys(DEFAULTS);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          out[k] = parsed[k] !== undefined ? parsed[k] : DEFAULTS[k];
        }
        return out;
      }
    }
  } catch (e) { }
  return cloneDefaults();
}

function cloneDefaults() {
  var out = {};
  var keys = Object.keys(DEFAULTS);
  for (var i = 0; i < keys.length; i++) out[keys[i]] = DEFAULTS[keys[i]];
  return out;
}

function persistProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { }
}

/* Live in-memory profile — loaded once, mutated on save, written to LS */
var profile = loadProfile();

/* ─────────────────────────────────────────────
   2. POPULATE ALL FIELDS FROM SAVED PROFILE
   ───────────────────────────────────────────── */

function populateFields() {
  /* Text inputs */
  setInput('full-name', profile.fullName);
  setInput('email', profile.email);
  setInput('phone', profile.phone);
  setInput('dob', profile.dob);
  setInput('unit-name', profile.unitName);
  setInput('zone', profile.zone);

  /* Service category <select> */
  var cat = document.getElementById('service-cat');
  if (cat) {
    for (var i = 0; i < cat.options.length; i++) {
      if (cat.options[i].text === profile.serviceCat) {
        cat.selectedIndex = i;
        break;
      }
    }
  }

  /* Toggles */
  setToggle('toggle-email', profile.emailNotif);
  setToggle('toggle-sms', profile.smsAlerts);
  setToggle('toggle-weekly', profile.weeklySummary);
  setToggle('toggle-2fa', profile.twoFA);

  /* Hero section */
  document.getElementById('hero-name').textContent = profile.fullName;
  document.getElementById('hero-email').textContent = profile.email;

  /* Avatar */
  renderAvatar(profile.avatar, profile.fullName);
}

function setInput(id, val) {
  var el = document.getElementById(id);
  if (el && val !== null && val !== undefined) el.value = val;
}

function setToggle(id, checked) {
  var el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

/* ─────────────────────────────────────────────
   3. LIVE SYNC — updates hero while typing
   ───────────────────────────────────────────── */

window.syncName = function () {
  var v = (document.getElementById('full-name').value || '').trim();
  document.getElementById('hero-name').textContent = v || profile.fullName;
  renderAvatar(profile.avatar, v || profile.fullName);
};

window.syncEmail = function () {
  var v = (document.getElementById('email').value || '').trim();
  document.getElementById('hero-email').textContent = v || profile.email;
};

/* ─────────────────────────────────────────────
   4. SAVE SECTIONS
   ───────────────────────────────────────────── */

window.saveSection = function (section) {

  if (section === 'personal') {
    var name = (document.getElementById('full-name').value || '').trim();
    var email = (document.getElementById('email').value || '').trim();
    var phone = (document.getElementById('phone').value || '').trim();
    var dob = (document.getElementById('dob').value || '').trim();

    /* Validation */
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    if (!email || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      showToast('Enter a valid email address.', 'error'); return;
    }
    if (phone && (!/^\d{10}$/.test(phone))) {
      showToast('Phone must be exactly 10 digits.', 'error'); return;
    }

    /* Update profile + persist */
    profile.fullName = name;
    profile.email = email;
    profile.phone = phone;
    profile.dob = dob;
    persistProfile();

    /* Update hero */
    document.getElementById('hero-name').textContent = name;
    document.getElementById('hero-email').textContent = email;
    renderAvatar(profile.avatar, name);

    showToast('Personal information saved \u2713', 'success');
  }

  if (section === 'unit') {
    var unitName = (document.getElementById('unit-name').value || '').trim();
    var sel = document.getElementById('service-cat');
    var svcCat = sel ? sel.options[sel.selectedIndex].text : profile.serviceCat;
    var zone = (document.getElementById('zone').value || '').trim();

    if (!unitName) { showToast('Unit name cannot be empty.', 'error'); return; }

    profile.unitName = unitName;
    profile.serviceCat = svcCat;
    profile.zone = zone;
    persistProfile();

    showToast('Unit details saved \u2713', 'success');
  }
};

/* ─────────────────────────────────────────────
   5. TOGGLE SAVE  (called from all 4 checkboxes)
   ───────────────────────────────────────────── */

window.saveToggle = function (key, value) {
  if (profile.hasOwnProperty(key)) {
    profile[key] = value;
    persistProfile();
  }
};

/* ─────────────────────────────────────────────
   6. AVATAR
   ───────────────────────────────────────────── */

function initials(name) {
  var parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'UM';
}

function renderAvatar(src, name) {
  var av = document.getElementById('profile-avatar');
  if (!av) return;
  if (src) {
    av.innerHTML = '<img src="' + src + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  } else {
    av.innerHTML = '';
    av.textContent = initials(name);
  }
}

window.updateAvatar = function (input) {
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    showToast('Image must be under 2 MB.', 'error');
    return;
  }
  var reader = new FileReader();
  reader.onload = function (e) {
    profile.avatar = e.target.result;
    persistProfile();
    renderAvatar(profile.avatar, profile.fullName);
    showToast('Profile photo updated \u2713', 'success');
  };
  reader.readAsDataURL(file);
};

/* ─────────────────────────────────────────────
   7. PASSWORD MODAL
   ───────────────────────────────────────────── */

window.openPwdModal = function () {
  var modal = document.getElementById('pwd-modal');
  if (!modal) return;
  modal.querySelectorAll('input[type="password"]').forEach(function (i) {
    i.value = '';
    i.style.borderColor = '';
  });
  removePwdError();
  modal.classList.add('open');
};

window.closePwdModal = function (e) {
  if (e.target === document.getElementById('pwd-modal')) window.closePwdModalBtn();
};

window.closePwdModalBtn = function () {
  var modal = document.getElementById('pwd-modal');
  if (modal) { modal.classList.remove('open'); removePwdError(); }
};

function removePwdError() {
  var e = document.getElementById('pwdErrMsg');
  if (e) e.remove();
}

function showPwdError(msg) {
  removePwdError();
  var modal = document.getElementById('pwd-modal');
  var fields = modal.querySelector('.modal-fields');
  if (!fields) return;
  var p = document.createElement('p');
  p.id = 'pwdErrMsg';
  p.style.cssText = 'color:#f87171;font-size:.82rem;margin:6px 0;font-family:Inter,sans-serif';
  p.textContent = msg;
  fields.appendChild(p);
}

/* Wire "Update Password" with validation — called once on init */
function wirePasswordBtn() {
  var modal = document.getElementById('pwd-modal');
  if (!modal) return;
  var btn = modal.querySelector('.modal-btn-save');
  if (!btn) return;
  btn.removeAttribute('onclick');
  btn.addEventListener('click', function () {
    var inputs = modal.querySelectorAll('input[type="password"]');
    var current = inputs[0] ? inputs[0].value : '';
    var newPwd = inputs[1] ? inputs[1].value : '';
    var confirm = inputs[2] ? inputs[2].value : '';

    if (!current) { showPwdError('Enter your current password.'); return; }
    if (current !== 'password123') {
      showPwdError('Current password is incorrect. (Hint: password123)');
      if (inputs[0]) inputs[0].style.borderColor = '#f87171';
      return;
    }
    if (newPwd.length < 8) { showPwdError('New password must be at least 8 characters.'); if (inputs[1]) inputs[1].style.borderColor = '#f87171'; return; }
    if (newPwd === current) { showPwdError('New password must differ from the current one.'); if (inputs[1]) inputs[1].style.borderColor = '#f87171'; return; }
    if (newPwd !== confirm) { showPwdError('Passwords do not match.'); if (inputs[2]) inputs[2].style.borderColor = '#f87171'; return; }

    window.closePwdModalBtn();
    showToast('Password updated successfully \u2713', 'success');
  });
}

/* ─────────────────────────────────────────────
   8. RECENT ACTIVITY
   ───────────────────────────────────────────── */

var ACTIVITIES = [
  { title: 'Provider reassigned', desc: 'ID #1042 moved to Emergency Unit for the day', time: '2 hours ago', color: 'amber' },
  { title: 'New provider onboarded', desc: 'Ramesh Kumar joined Plumbing Unit Alpha', time: '1 day ago', color: 'green' },
  { title: 'Rating flagged', desc: 'Provider #2281 received a 1-star review \u2014 under review', time: '2 days ago', color: 'amber' },
  { title: 'Revenue milestone', desc: 'Unit exceeded \u20b950,000 monthly target', time: '3 days ago', color: 'teal' },
  { title: 'Profile updated', desc: 'Operating zone updated to North Bangalore', time: '5 days ago', color: '' }
];

function renderActivities() {
  var list = document.getElementById('activity-list');
  if (!list) return;
  var html = '';
  for (var i = 0; i < ACTIVITIES.length; i++) {
    var a = ACTIVITIES[i];
    html +=
      '<div class="act-item">' +
      '<div class="act-dot ' + a.color + '"></div>' +
      '<div class="act-body">' +
      '<div class="act-title">' + a.title + '</div>' +
      '<div class="act-desc">' + a.desc + '</div>' +
      '<div class="act-time">' + a.time + '</div>' +
      '</div>' +
      '</div>';
  }
  list.innerHTML = html;
}

/* ─────────────────────────────────────────────
   9. DANGER ZONE — in-page modal, no confirm()
   ───────────────────────────────────────────── */

window.confirmDelete = function () {
  var overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:3000;' +
    'display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif';

  var box = document.createElement('div');
  box.style.cssText =
    'background:#1e293b;border:1px solid #991b1b;border-radius:14px;' +
    'padding:28px 24px;width:min(380px,88vw);box-shadow:0 20px 60px rgba(0,0,0,.5)';
  box.innerHTML =
    '<h3 style="margin:0 0 10px;color:#f87171;font-size:1rem">\u26A0\uFE0F Deactivate Account</h3>' +
    '<p style="color:#94a3b8;font-size:.88rem;margin:0 0 20px;line-height:1.6">' +
    'This will permanently remove all data and unit assignments. ' +
    '<strong style="color:#f1f5f9">This cannot be undone.</strong></p>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end">' +
    '<button id="_delCancel" style="padding:8px 18px;border-radius:8px;border:1px solid #334155;' +
    'background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit">Cancel</button>' +
    '<button id="_delConfirm" style="padding:8px 18px;border-radius:8px;border:none;' +
    'background:#dc2626;color:#fff;cursor:pointer;font-weight:500;font-family:inherit">Deactivate</button>' +
    '</div>';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById('_delCancel').addEventListener('click', function () { overlay.remove(); });
  document.getElementById('_delConfirm').addEventListener('click', function () {
    overlay.remove();
    showToast('Account deactivation requested. You will be contacted shortly.', 'warning');
  });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
};

/* ─────────────────────────────────────────────
   10. TOAST  (global — called from HTML onchange too)
   ───────────────────────────────────────────── */

var _toastTimer;

window.showToast = function (msg, type) {
  var el = document.getElementById('toast');
  if (!el) return;
  var palette = { success: '#16a34a', error: '#ef4444', warning: '#d97706', info: '#2563eb' };
  el.textContent = msg;
  el.style.background = palette[type] || palette.success;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
};

/* ─────────────────────────────────────────────
   11. INIT
   Run inside window.onload so our localStorage values overwrite AFTER
   the browser's own form-restoration (autocomplete/session restore)
   has already fired — otherwise the browser wins and our data is lost.
   ───────────────────────────────────────────── */

window.onload = function () {
  populateFields();
  renderActivities();
  wirePasswordBtn();
};
