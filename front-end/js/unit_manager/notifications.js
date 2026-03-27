let notifications = [
  {
    id: 1, type: 'alert', iconClass: 'red', unread: true,
    title: 'No-Show Detected',
    desc: 'Provider ID #1042 failed to arrive at Booking #B-9921 on time. Immediate action required.',
    time: '2 minutes ago',
    actions: [{ label: 'Reassign Job', cls: 'primary' }, { label: 'Call Provider', cls: 'ghost' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>`
  },
  {
    id: 2, type: 'alert', iconClass: 'amber', unread: true,
    title: 'Rating Alert',
    desc: 'Provider ID #2281 received a 1.0 star rating. Immediate review recommended.',
    time: '1 hour ago',
    actions: [{ label: 'Investigate', cls: 'primary' }, { label: 'Dismiss', cls: 'ghost' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  {
    id: 3, type: 'info', iconClass: 'blue', unread: true,
    title: 'New Training Available',
    desc: "'Customer Communication' training module is now available. Assign to your top-performing providers.",
    time: '3 hours ago',
    actions: [{ label: 'Assign Now', cls: 'primary' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
  },
  {
    id: 4, type: 'info', iconClass: 'teal', unread: false,
    title: 'Skill Coverage Update',
    desc: 'Skill coverage has improved to 84%. 4 key skills remain under-allocated — consider assigning providers to Cybersecurity.',
    time: '5 hours ago',
    actions: [{ label: 'View Skills', cls: 'ghost' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  },
  {
    id: 5, type: 'success', iconClass: 'green', unread: false,
    title: 'Transaction Completed',
    desc: 'Transaction TXN-9024-XP for ₹1,200.00 has been successfully processed.',
    time: 'Yesterday',
    actions: [],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
  },
  {
    id: 6, type: 'success', iconClass: 'green', unread: false,
    title: 'Provider Performance Report Ready',
    desc: 'The monthly performance summary for all 24 providers in Unit 402 is now available.',
    time: '2 days ago',
    actions: [{ label: 'View Report', cls: 'ghost' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  },
  {
    id: 7, type: 'info', iconClass: 'blue', unread: false,
    title: 'New Provider Onboarded',
    desc: 'Elena Rodriguez (PRV-89078) has completed onboarding and is now active in your unit.',
    time: '3 days ago',
    actions: [{ label: 'View Profile', cls: 'ghost' }],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`
  },
];

let currentFilter = 'all';

function updateCounts() {
  const counts = { all: notifications.length, alert: 0, info: 0, success: 0 };
  notifications.forEach(n => counts[n.type]++);
  document.getElementById('cntAll').textContent    = counts.all;
  document.getElementById('cntAlert').textContent  = counts.alert;
  document.getElementById('cntInfo').textContent   = counts.info;
  document.getElementById('cntSuccess').textContent = counts.success;
}

function render() {
  const list = document.getElementById('notifList');
  const empty = document.getElementById('emptyState');
  const filtered = notifications.filter(n => currentFilter === 'all' || n.type === currentFilter);
  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach((n, idx) => {
    const div = document.createElement('div');
    div.className = `notif-item${n.unread ? ' unread' : ''}`;
    div.style.animationDelay = `${idx * 0.04}s`;
    div.innerHTML = `
      <div class="notif-icon ${n.iconClass}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-top">
          <span class="notif-title">${n.title}</span>
          ${n.unread ? '<span class="unread-dot"></span>' : ''}
        </div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-meta">${n.time}</div>
        ${n.actions.length ? `<div class="notif-actions">${n.actions.map(a => `<button class="nbtn ${a.cls}">${a.label}</button>`).join('')}</div>` : ''}
      </div>
      <button class="notif-dismiss" onclick="dismissNotif(${n.id})" title="Dismiss">×</button>
    `;
    // Click to mark read
    div.addEventListener('click', () => {
      const item = notifications.find(x => x.id === n.id);
      if (item) { item.unread = false; render(); updateCounts(); }
    });
    list.appendChild(div);
  });

  updateCounts();
}

function setNotifFilter(btn, type) {
  document.querySelectorAll('.ntab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = type;
  render();
}

function markAllRead() {
  notifications.forEach(n => n.unread = false);
  render(); updateCounts();
}

function clearAll() {
  if (currentFilter === 'all') {
    notifications = [];
  } else {
    notifications = notifications.filter(n => n.type !== currentFilter);
  }
  render(); updateCounts();
}

function dismissNotif(id) {
  notifications = notifications.filter(n => n.id !== id);
  render(); updateCounts();
}

render();
updateCounts();
