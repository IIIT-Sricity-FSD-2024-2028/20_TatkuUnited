// ── Admin Notifications JS ──

const allNotifications = [
  {
    id: 1, category: 'security', read: false, urgent: true, color: 'red',
    priority: 'critical',
    title: 'Multiple Failed Login Attempts',
    desc: 'Account ID #5821 has failed login 8 times in the last 10 minutes. Potential brute-force attack. Consider auto-lock.',
    time: '3 minutes ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    actions: [{ label: 'Lock Account', cls: 'danger' }, { label: 'Investigate', cls: 'warning' }, { label: 'Dismiss', cls: 'ghost' }],
  },
  {
    id: 2, category: 'system', read: false, urgent: true, color: 'red',
    priority: 'critical',
    title: 'Service Assignment Failure',
    desc: 'Booking #A-9421 has failed auto-assignment 3 times. No available providers in Plumbing Unit Alpha. Manual intervention needed.',
    time: '15 minutes ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    actions: [{ label: 'Troubleshoot', cls: 'danger' }, { label: 'Reassign Manually', cls: 'ghost' }],
  },
  {
    id: 3, category: 'user', read: false, urgent: false, color: 'yellow',
    priority: 'high',
    title: 'Provider Verification Queue Overflow',
    desc: '8 new provider applications have been waiting for more than 24 hours. Platform SLA requires 12-hour review. Urgent action needed.',
    time: '1 hour ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    actions: [{ label: 'Open Queue', cls: 'primary' }, { label: 'Delegate', cls: 'ghost' }],
  },
  {
    id: 4, category: 'user', read: false, urgent: false, color: 'orange',
    priority: 'high',
    title: 'Flagged Account Requires Review',
    desc: 'Customer Account #C-8812 was flagged by 3 separate providers for abusive behavior during service sessions.',
    time: '2 hours ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    actions: [{ label: 'Review Account', cls: 'primary' }, { label: 'Suspend', cls: 'danger' }, { label: 'Dismiss', cls: 'ghost' }],
  },
  {
    id: 5, category: 'revenue', read: false, urgent: false, color: 'green',
    priority: 'info',
    title: 'Platform Revenue Milestone',
    desc: 'Tatku United has crossed ₹50 Lakhs in total platform revenue for March 2026. Monthly record!',
    time: '4 hours ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    actions: [{ label: 'View Report', cls: 'primary' }],
  },
  {
    id: 6, category: 'system', read: true, urgent: false, color: 'blue',
    priority: 'info',
    title: 'Scheduled Maintenance Reminder',
    desc: 'Platform maintenance window is scheduled for 30 March 2026, 2:00 AM – 4:00 AM IST. All active sessions will be terminated.',
    time: '8 hours ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg>`,
    actions: [{ label: 'Configure', cls: 'primary' }, { label: 'Notify Users', cls: 'ghost' }],
  },
  {
    id: 7, category: 'user', read: true, urgent: false, color: 'teal',
    priority: 'info',
    title: 'New Collective Manager Onboarded',
    desc: 'West Zone Collective Manager "Divya Menon" has completed onboarding and is now active on the platform.',
    time: '1 day ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    actions: [{ label: 'View Profile', cls: 'primary' }],
  },
  {
    id: 8, category: 'revenue', read: true, urgent: false, color: 'blue',
    priority: 'info',
    title: 'Monthly Financial Report Ready',
    desc: 'The February 2026 platform financial report is ready for review and download.',
    time: '2 days ago',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    actions: [{ label: 'Download', cls: 'primary' }],
  },
];

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'security', label: 'Security' },
  { key: 'system', label: 'System' },
  { key: 'user', label: 'Users' },
  { key: 'revenue', label: 'Revenue' },
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
    const isUrgent = notifications.filter(n => (t.key === 'all' || n.category === t.key) && n.urgent && !n.read).length > 0;
    return `<button class="tab ${activeTab === t.key ? 'active' : ''}" onclick="setTab('${t.key}')">
      ${t.label}
      ${count > 0 ? `<span class="tab-count ${isUrgent ? 'urgent' : ''}">${count}</span>` : ''}
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <p>No notifications</p><span>You're all caught up!</span>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map((n, i) => `
    <div class="notif-item ${n.read ? '' : 'unread'} ${n.urgent ? 'urgent' : ''}" id="notif-${n.id}" style="animation-delay:${i * 0.04}s">
      <div class="notif-icon ${n.color}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-top">
          <span class="notif-title">${n.title}</span>
          ${!n.read ? '<span class="unread-dot"></span>' : ''}
          <span class="priority-badge ${n.priority}">${n.priority.toUpperCase()}</span>
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
  if (badge) {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function loadMore() {
  const btn = document.querySelector('.load-more-btn');
  btn.textContent = 'No more notifications';
  btn.disabled = true;
}



document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderNotifications();
});


