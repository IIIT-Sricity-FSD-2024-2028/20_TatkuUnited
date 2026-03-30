/**
 * notifications.js — Unit Manager: Notifications
 *
 * No browser confirm() or alert() dialogs — all interactions use
 * custom in-page modals and toasts that cannot be blocked.
 */

/* ─────────────────────────────────────────────
   BASE DATA
   ───────────────────────────────────────────── */

var BASE = [
  {
    id: 1, type: 'alert', iconClass: 'red', title: 'No-Show Detected',
    desc: 'Provider ID #1042 failed to arrive at Booking #B-9921 on time. Immediate action required.',
    time: '2 mins ago', actions: ['Reassign Job', 'Call Provider'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>'
  },
  {
    id: 2, type: 'alert', iconClass: 'amber', title: 'Rating Alert',
    desc: 'Provider ID #2281 received a 1.0 star rating. Immediate review recommended.',
    time: '1 hour ago', actions: ['Investigate', 'Dismiss'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  },
  {
    id: 3, type: 'info', iconClass: 'blue', title: 'New Training Available',
    desc: "The 'Customer Communication' training module is now available. Assign to top providers.",
    time: '3 hours ago', actions: ['Assign Now'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
  },
  {
    id: 4, type: 'info', iconClass: 'teal', title: 'Skill Coverage Update',
    desc: 'Skill coverage improved to 84%. 4 key skills remain under-allocated.',
    time: '5 hours ago', actions: ['View Skills'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  },
  {
    id: 5, type: 'success', iconClass: 'green', title: 'Transaction Completed',
    desc: 'Transaction TXN-9024-XP for \u20b91,200.00 has been successfully processed.',
    time: 'Yesterday', actions: ['View Report'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  },
  {
    id: 6, type: 'success', iconClass: 'green', title: 'Provider Performance Report Ready',
    desc: 'Monthly performance summary for all 24 providers in Unit 402 is now available.',
    time: '2 days ago', actions: ['View Report'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>'
  },
  {
    id: 7, type: 'info', iconClass: 'blue', title: 'New Provider Onboarded',
    desc: 'Elena Rodriguez (PRV-89078) completed onboarding and is now active in Unit 402.',
    time: '3 days ago', actions: ['View Profile'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>'
  }
];

var BASE_UNREAD = { 1: true, 2: true, 3: true, 4: false, 5: false, 6: false, 7: false };

/* ─────────────────────────────────────────────
   LOCALSTORAGE STATE
   Stores: { dismissed:[ids], read:[ids], overrides:{id:{...}} }
   Icons are NEVER stored — always read from BASE
   ───────────────────────────────────────────── */

var LS = 'um_notif_v4';

function loadState() {
  try {
    var s = JSON.parse(localStorage.getItem(LS));
    if (s && Array.isArray(s.dismissed)) return s;
  } catch (e) {}
  return { dismissed: [], read: [], overrides: {} };
}
function saveState() {
  try { localStorage.setItem(LS, JSON.stringify(state)); } catch(e) {}
}

var state = loadState();

function buildList() {
  var out = [];
  for (var i = 0; i < BASE.length; i++) {
    var b = BASE[i];
    if (state.dismissed.indexOf(b.id) !== -1) continue;
    var ov = state.overrides[b.id] || {};
    out.push({
      id:        b.id,
      type:      b.type,
      iconClass: b.iconClass,
      icon:      b.icon,
      title:     ov.title   !== undefined ? ov.title   : b.title,
      desc:      ov.desc    !== undefined ? ov.desc    : b.desc,
      time:      b.time,
      actions:   ov.actions !== undefined ? ov.actions : b.actions.slice(),
      unread:    state.read.indexOf(b.id) !== -1 ? false : BASE_UNREAD[b.id]
    });
  }
  return out;
}

var notifications = buildList();
var currentFilter = 'all';

/* ─────────────────────────────────────────────
   INJECT MODAL + TOAST STYLES
   ───────────────────────────────────────────── */

(function injectStyles() {
  var s = document.createElement('style');
  s.textContent = [
    '#nfBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:none;align-items:center;justify-content:center}',
    '#nfBackdrop.open{display:flex}',
    '#nfModal{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:28px 24px;',
      'width:min(400px,88vw);font-family:Inter,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}',
    '#nfModal h3{margin:0 0 10px;font-size:1rem;color:#f1f5f9}',
    '#nfModal p{margin:0 0 20px;font-size:.88rem;color:#94a3b8;line-height:1.6}',
    '#nfModal .mbtns{display:flex;gap:10px;justify-content:flex-end}',
    '#nfModal .mbtns button{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;',
      'font-size:.85rem;font-weight:500;font-family:inherit}',
    '#nfModal .mbtns .mcancel{background:transparent;border:1px solid #334155;color:#94a3b8}',
    '#nfModal .mbtns .mconfirm{background:#2563eb;color:#fff}',
    '#nfModal .mbtns .mdanger{background:#dc2626;color:#fff}',
    '#nfModal .mbtns .mwarn{background:#d97706;color:#fff}',
    '#nfModal .detail-row{display:flex;justify-content:space-between;padding:8px 0;',
      'border-bottom:1px solid #334155;font-size:.84rem}',
    '#nfModal .detail-row span:first-child{color:#94a3b8}',
    '#nfModal .detail-row span:last-child{color:#f1f5f9;font-weight:500}',
    '#nfToast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 20px;',
      'border-radius:10px;color:#fff;font-size:.87rem;font-weight:500;',
      'box-shadow:0 8px 28px rgba(0,0,0,.4);font-family:Inter,sans-serif;',
      'max-width:320px;line-height:1.5;transition:opacity .3s}'
  ].join('');
  document.head.appendChild(s);

  var backdrop = document.createElement('div');
  backdrop.id = 'nfBackdrop';
  backdrop.innerHTML = '<div id="nfModal"></div>';
  document.body.appendChild(backdrop);
})();

/* ─────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────── */

function toast(msg, type) {
  var old = document.getElementById('nfToast');
  if (old) old.remove();
  var bg = {success:'#16a34a', error:'#dc2626', info:'#2563eb', warning:'#d97706'};
  var el = document.createElement('div');
  el.id = 'nfToast';
  el.style.background = bg[type] || bg.info;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 320);
  }, 3000);
}

/* ─────────────────────────────────────────────
   CUSTOM MODAL  (replaces confirm/alert)
   ───────────────────────────────────────────── */

function showModal(title, bodyHtml, buttons) {
  /* buttons = [{label, cls, onClick}] */
  var modal    = document.getElementById('nfModal');
  var backdrop = document.getElementById('nfBackdrop');

  var btnsHtml = '<div class="mbtns">';
  buttons.forEach(function(b) {
    btnsHtml += '<button class="' + b.cls + '" id="nfBtn_' + b.label.replace(/\s/g,'_') + '">' + b.label + '</button>';
  });
  btnsHtml += '</div>';

  modal.innerHTML = '<h3>' + title + '</h3><div>' + bodyHtml + '</div>' + btnsHtml;
  backdrop.classList.add('open');

  buttons.forEach(function(b) {
    var el = document.getElementById('nfBtn_' + b.label.replace(/\s/g,'_'));
    if (el) el.addEventListener('click', function() {
      backdrop.classList.remove('open');
      if (b.onClick) b.onClick();
    });
  });

  backdrop.addEventListener('click', function handler(e) {
    if (e.target === backdrop) {
      backdrop.classList.remove('open');
      backdrop.removeEventListener('click', handler);
    }
  });
}

/* ─────────────────────────────────────────────
   STATE HELPERS
   ───────────────────────────────────────────── */

function markRead(id) {
  if (state.read.indexOf(id) === -1) state.read.push(id);
  saveState();
  notifications = buildList();
  render(); updateCounts();
}

window.dismissNotif = function(id) {
  if (state.dismissed.indexOf(id) === -1) state.dismissed.push(id);
  saveState();
  notifications = buildList();
  render(); updateCounts();
};

function applyOverride(id, changes) {
  if (!state.overrides[id]) state.overrides[id] = {};
  var ov = state.overrides[id];
  if (changes.title   !== undefined) ov.title   = changes.title;
  if (changes.desc    !== undefined) ov.desc    = changes.desc;
  if (changes.actions !== undefined) ov.actions = changes.actions;
  saveState();
  notifications = buildList();
}

/* ─────────────────────────────────────────────
   ACTION HANDLER  (global)
   ───────────────────────────────────────────── */

window.handleAction = function(label, id) {
  switch (label) {

    case 'Reassign Job':
      showModal('Reassign Booking #B-9921',
        '<p>Provider #1042 is a no-show. Reassign to the next available provider?</p>' +
        '<p style="color:#f1f5f9;font-weight:500">\u2192 Priya Sharma (SP002) \u2014 Plumbing \u2605 4.5</p>',
        [
          { label: 'Cancel',  cls: 'mcancel', onClick: null },
          { label: 'Reassign', cls: 'mdanger', onClick: function() {
              markRead(id);
              applyOverride(id, { title: 'No-Show Resolved', desc: 'Booking #B-9921 reassigned to Priya Sharma (SP002).', actions: [] });
              render();
              toast('Job #B-9921 reassigned to Priya Sharma \u2713', 'success');
          }}
        ]
      );
      break;

    case 'Call Provider':
      showModal('\uD83D\uDCDE Call Provider #1042',
        '<div class="detail-row"><span>Name</span><span>Arun Kumar</span></div>' +
        '<div class="detail-row"><span>Phone</span><span>+91 98800 11042</span></div>' +
        '<div class="detail-row"><span>Status</span><span>No-show on #B-9921</span></div>' +
        '<p style="margin-top:14px;font-size:.82rem">If unreachable, use <em>Reassign Job</em> to assign a nearby provider.</p>',
        [{ label: 'Close', cls: 'mcancel', onClick: function() { markRead(id); } }]
      );
      break;

    case 'Assign Now':
      showModal('Assign Training Module',
        '<p>Assign <strong style="color:#f1f5f9">Customer Communication</strong> to top 3 providers?</p>' +
        '<div class="detail-row"><span>Ravi Kumar</span><span>\u2605 4.8</span></div>' +
        '<div class="detail-row"><span>Nithya Lakshmi</span><span>\u2605 4.9</span></div>' +
        '<div class="detail-row"><span>Sunil Babu</span><span>\u2605 4.6</span></div>',
        [
          { label: 'Cancel',  cls: 'mcancel', onClick: null },
          { label: 'Assign',  cls: 'mconfirm', onClick: function() {
              markRead(id);
              applyOverride(id, { title: 'Training Assigned', desc: 'Customer Communication assigned to 3 top providers.', actions: [] });
              render();
              toast('Training assigned to 3 top providers \u2713', 'success');
          }}
        ]
      );
      break;

    case 'Investigate':
      showModal('\u26A0\uFE0F Rating Incident \u2014 Provider #2281',
        '<div class="detail-row"><span>Provider</span><span>Sanjay Menon (SP-2281)</span></div>' +
        '<div class="detail-row"><span>Booking</span><span>BKG-8834 (Deep Cleaning)</span></div>' +
        '<div class="detail-row"><span>Customer</span><span>Kavitha S.</span></div>' +
        '<div class="detail-row"><span>Rating Given</span><span style="color:#dc2626">1.0 \u2605</span></div>' +
        '<div class="detail-row"><span>Previous Avg</span><span>4.2 \u2605 over 38 jobs</span></div>' +
        '<p style="margin-top:14px;color:#fca5a5;background:rgba(220,38,38,.1);padding:10px;border-radius:6px;font-size:.82rem">' +
        'Review job photos, contact the customer, and consider a temporary suspension.</p>',
        [
          { label: 'Close',    cls: 'mcancel', onClick: function() { markRead(id); } },
          { label: 'Escalate', cls: 'mwarn', onClick: function() {
              markRead(id);
              toast('Incident escalated to unit manager \u2713', 'warning');
          }}
        ]
      );
      break;

    case 'Dismiss':
      window.dismissNotif(id);
      break;

    case 'View Skills':
      window.location.href = 'skills.html';
      break;

    case 'View Report':
      window.location.href = 'revenue.html';
      break;

    case 'View Profile':
      window.location.href = 'providers.html';
      break;

    default:
      markRead(id);
      toast(label + ' action completed', 'info');
  }
};

/* ─────────────────────────────────────────────
   COUNTS + BADGE
   ───────────────────────────────────────────── */

function updateCounts() {
  var c = { all: 0, alert: 0, info: 0, success: 0 };
  for (var i = 0; i < notifications.length; i++) {
    c.all++;
    if (c[notifications[i].type] !== undefined) c[notifications[i].type]++;
  }
  document.getElementById('cntAll').textContent     = c.all     || '';
  document.getElementById('cntAlert').textContent   = c.alert   || '';
  document.getElementById('cntInfo').textContent    = c.info    || '';
  document.getElementById('cntSuccess').textContent = c.success || '';

  var unread = 0;
  for (var j = 0; j < notifications.length; j++) if (notifications[j].unread) unread++;
  var dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}

/* ─────────────────────────────────────────────
   RENDER
   ───────────────────────────────────────────── */

var BTN_CLS = {
  'Reassign Job': 'primary', 'Call Provider': 'ghost',
  'Assign Now':   'primary', 'Investigate':   'primary',
  'Dismiss':      'ghost',   'View Skills':   'ghost',
  'View Report':  'ghost',   'View Profile':  'ghost'
};

function render() {
  var list  = document.getElementById('notifList');
  var empty = document.getElementById('emptyState');
  var vis   = notifications.filter(function(n) {
    return currentFilter === 'all' || n.type === currentFilter;
  });

  list.innerHTML = '';

  if (vis.length === 0) {
    empty.style.display = 'block';
    updateCounts();
    return;
  }
  empty.style.display = 'none';

  for (var i = 0; i < vis.length; i++) {
    var n = vis[i];
    var btns = '';
    if (n.actions && n.actions.length) {
      btns = '<div class="notif-actions">';
      for (var a = 0; a < n.actions.length; a++) {
        var lbl = n.actions[a];
        btns += '<button class="nbtn ' + (BTN_CLS[lbl] || 'ghost') + '" onclick="handleAction(\'' + lbl + '\',' + n.id + ')">' + lbl + '</button>';
      }
      btns += '</div>';
    }

    var div = document.createElement('div');
    div.className = 'notif-item' + (n.unread ? ' unread' : '');
    div.style.animationDelay = (i * 0.05) + 's';
    div.innerHTML =
      '<div class="notif-icon ' + n.iconClass + '">' + n.icon + '</div>' +
      '<div class="notif-body">' +
        '<div class="notif-top"><span class="notif-title">' + n.title + '</span>' +
        (n.unread ? '<span class="unread-dot"></span>' : '') + '</div>' +
        '<div class="notif-desc">' + n.desc + '</div>' +
        '<div class="notif-meta">' + n.time + '</div>' +
        btns +
      '</div>' +
      '<button class="notif-dismiss" onclick="dismissNotif(' + n.id + ')" title="Dismiss">&times;</button>';

    (function(nid) {
      div.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        markRead(nid);
      });
    })(n.id);

    list.appendChild(div);
  }
  updateCounts();
}

/* ─────────────────────────────────────────────
   GLOBAL FUNCTIONS  (called from HTML onclick)
   ───────────────────────────────────────────── */

window.setNotifFilter = function(btn, type) {
  var tabs = document.querySelectorAll('.ntab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  btn.classList.add('active');
  currentFilter = type;
  render();
};

window.markAllRead = function() {
  for (var i = 0; i < notifications.length; i++) {
    if (state.read.indexOf(notifications[i].id) === -1) state.read.push(notifications[i].id);
  }
  saveState();
  notifications = buildList();
  render(); updateCounts();
  toast('All marked as read \u2713', 'success');
};

/* Clear all — NO confirm dialog, clears immediately */
window.clearAll = function() {
  showModal(
    currentFilter === 'all' ? 'Clear All Notifications' : 'Clear ' + currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1) + ' Notifications',
    '<p>This will permanently remove ' + (currentFilter === 'all' ? 'all' : 'all ' + currentFilter) + ' notifications. They will not return after a page refresh.</p>',
    [
      { label: 'Cancel', cls: 'mcancel', onClick: null },
      { label: 'Clear',  cls: 'mdanger', onClick: function() {
          for (var i = 0; i < notifications.length; i++) {
            var n = notifications[i];
            if ((currentFilter === 'all' || n.type === currentFilter) &&
                state.dismissed.indexOf(n.id) === -1) {
              state.dismissed.push(n.id);
            }
          }
          saveState();
          notifications = buildList();
          render(); updateCounts();
          toast('Cleared \u2713', 'info');
      }}
    ]
  );
};

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */

render();
updateCounts();
