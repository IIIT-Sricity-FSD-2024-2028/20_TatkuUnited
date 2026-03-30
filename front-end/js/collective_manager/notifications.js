// ── Collective Manager Notifications JS ──

const allNotifications = [
  {
    id: 1, category: 'alert', read: false, color: 'red',
    title: 'Unit Capacity Critical',
    desc: 'HVAC Unit Delta is at 40% capacity. Immediate attention required to meet service demand.',
    time: '5 minutes ago',
    icon: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    actions: [{ label: 'Take Action', cls: 'primary' }, { label: 'Dismiss', cls: 'ghost' }],
  },
  {
    id: 2, category: 'provider', read: false, color: 'amber',
    title: 'Provider Admission Request',
    desc: '4 new provider applications are awaiting collective-level approval for the Plumbing Unit Alpha.',
    time: '30 minutes ago',
    icon: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    actions: [{ label: 'Review Applications', cls: 'primary' }, { label: 'Later', cls: 'ghost' }],
  },
  {
    id: 3, category: 'revenue', read: false, color: 'green',
    title: 'Revenue Milestone Reached',
    desc: 'South Zone Collective crossed ₹4.5 Lakhs in revenue for March 2026 — 3 days ahead of target!',
    time: '2 hours ago',
    icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    actions: [{ label: 'View Report', cls: 'primary' }],
  },
  {
    id: 4, category: 'unit', read: false, color: 'blue',
    title: 'New Unit Created',
    desc: 'Unit Manager Suresh Kumar has created "Carpentry Zeta" under your collective. Awaiting your confirmation.',
    time: '4 hours ago',
    icon: `<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    actions: [{ label: 'Approve', cls: 'primary' }, { label: 'Reject', cls: 'danger' }],
  },
  {
    id: 5, category: 'alert', read: false, color: 'amber',
    title: 'Escalated Customer Complaint',
    desc: 'A Level-2 complaint from Booking #B-9182 has been escalated to collective-level for resolution.',
    time: '6 hours ago',
    icon: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    actions: [{ label: 'Resolve', cls: 'primary' }, { label: 'Assign to Unit', cls: 'ghost' }],
  },
  {
    id: 6, category: 'system', read: true, color: 'teal',
    title: 'Monthly Report Ready',
    desc: 'Your February 2026 collective performance report is now available for download.',
    time: '1 day ago',
    icon: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    actions: [{ label: 'Download', cls: 'primary' }],
  },
  {
    id: 7, category: 'provider', read: true, color: 'green',
    title: 'Top Provider Recognition',
    desc: 'Ramesh Kumar from Plumbing Unit Alpha achieved the highest rating (4.98 ★) for March. Consider a reward.',
    time: '2 days ago',
    icon: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    actions: [{ label: 'View Profile', cls: 'primary' }],
  },
  {
    id: 8, category: 'system', read: true, color: 'blue',
    title: 'System Maintenance Notice',
    desc: 'Scheduled platform maintenance on 30th March 2026, 2:00 AM – 4:00 AM IST. Plan accordingly.',
    time: '3 days ago',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2"/></svg>`,
    actions: [],
  },
];

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'alert', label: 'Alerts' },
  { key: 'unit', label: 'Unit Updates' },
  { key: 'provider', label: 'Providers' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'system', label: 'System' },
];

let activeTab = 'all';
let notifications = allNotifications.map(n => ({ ...n }));

function getFiltered() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  return notifications.filter(n => {
    const matchTab = activeTab === 'all' || n.category === activeTab;
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });
}

function renderTabs() {
  const el = document.getElementById('notif-tabs');
  el.innerHTML = tabs.map(t => {
    const count = notifications.filter(n => (t.key === 'all' || n.category === t.key) && !n.read).length;
    return `<button class="tab ${activeTab === t.key ? 'active' : ''}" onclick="setTab('${t.key}')">
      ${t.label}
      ${count > 0 ? `<span class="tab-count">${count}</span>` : ''}
    </button>`;
  }).join('');
}

function setTab(key) {
  activeTab = key;
  renderTabs();
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  const filtered = getFiltered();
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <p>No notifications</p><span>You're all caught up!</span>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map((n, i) => `
    <div class="notif-item ${n.read ? '' : 'unread'}" id="notif-${n.id}" style="animation-delay:${i * 0.05}s">
      <div class="notif-icon ${n.color}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-top">
          <span class="notif-title">${n.title}</span>
          ${!n.read ? '<span class="unread-dot"></span>' : ''}
        </div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-meta">${n.time} &bull; ${n.category}</div>
        ${n.actions.length ? `<div class="notif-actions">${n.actions.map(a => `<button class="nbtn ${a.cls}" onclick="handleAction(${n.id},'${a.label}')">${a.label}</button>`).join('')}</div>` : ''}
      </div>
      <button class="notif-dismiss" onclick="dismiss(${n.id})" title="Dismiss">×</button>
    </div>
  `).join('');
  updateBadge();
}

function handleAction(id, label) {
  const n = notifications.find(x => x.id === id);
  if (n) n.read = true;
  renderTabs();
  renderNotifications();
}

function dismiss(id) {
  notifications = notifications.filter(n => n.id !== id);
  renderTabs();
  renderNotifications();
}

function markAllRead() {
  notifications.forEach(n => n.read = true);
  renderTabs();
  renderNotifications();
}

function filterNotifications() {
  renderNotifications();
}

function updateBadge() {
  const badge = document.getElementById('notif-badge');
  const count = notifications.filter(n => !n.read).length;
  if (badge) badge.textContent = count > 0 ? count : '';
  if (badge) badge.style.display = count > 0 ? 'flex' : 'none';
}

function loadMore() {
  // Placeholder for pagination
  const btn = document.querySelector('.load-more-btn');
  btn.textContent = 'No more notifications';
  btn.disabled = true;
}



document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderNotifications();
});


