const tabs = ['All', 'Jobs', 'Payments', 'Account'];
let activeTab = 'All';

const notifications = [
  {
    id: 1, type: 'job', category: 'Jobs', unread: true,
    title: 'New Job Assigned', time: '2 hours ago',
    desc: 'You have been assigned a new plumbing repair job at Sector 45. Scheduled for tomorrow, 10:00 AM.',
    actions: [
      { label: 'View Job Details', cls: 'btn-primary-action', href: 'assigned-jobs.html' },
      { label: 'Dismiss', cls: 'btn-dismiss', action: 'dismiss' },
    ]
  },
  {
    id: 2, type: 'payment', category: 'Payments', unread: false,
    title: 'Payment Received', time: '5 hours ago',
    desc: 'Your payment of ₹4,500 for the "Electrical Maintenance - Villa 12" job has been successfully processed.',
    actions: [
      { label: 'View Earnings', cls: 'btn-outline-action', href: 'earnings.html' },
    ]
  },
  {
    id: 3, type: 'account', category: 'Account', unread: false,
    title: 'Identity Verification Required', time: 'Yesterday',
    desc: 'Your professional license is expiring in 5 days. Please upload the renewed document to avoid service interruption.',
    actions: [
      { label: 'Update Profile', cls: 'btn-orange-action', href: 'profile.html' },
    ]
  },
  {
    id: 4, type: 'completed', category: 'Jobs', unread: false,
    title: 'Job Completed Successfully', time: '2 days ago',
    desc: 'Job #ORD-9921 has been marked as completed. Customer feedback: "Excellent and fast service!".',
    actions: [
      { label: 'View Feedback', cls: 'btn-link-action', href: '#' },
    ]
  },
];

const iconMap = {
  job: `<div class="notif-icon job"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>`,
  payment: `<div class="notif-icon payment"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>`,
  account: `<div class="notif-icon account"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>`,
  completed: `<div class="notif-icon completed"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>`,
};

function renderTabs() {
  document.getElementById('notif-tabs').innerHTML = tabs.map(t => `
    <button class="notif-tab ${t === activeTab ? 'active' : ''}" onclick="setTab('${t}')">${t}</button>
  `).join('');
}
function setTab(t) { activeTab = t; renderTabs(); renderNotifs(); }

function renderNotifs() {
  const filtered = activeTab === 'All' ? notifications : notifications.filter(n => n.category === activeTab);
  document.getElementById('notif-list').innerHTML = filtered.map((n, i) => `
    <div class="notif-item ${n.unread ? 'unread' : ''} type-${n.type}" style="animation-delay:${i*0.07}s" id="notif-${n.id}">
      ${iconMap[n.type]}
      <div class="notif-body">
        <div class="notif-row">
          <span class="notif-title-text">${n.title}</span>
          <span class="notif-time">${n.time} ${n.unread ? '<span class="unread-dot"></span>' : ''}</span>
        </div>
        <p class="notif-desc">${n.desc}</p>
        <div class="notif-actions">
          ${n.actions.map(a => `
            <button class="notif-action-btn ${a.cls}" onclick="${a.action === 'dismiss' ? `dismissNotif(${n.id})` : `window.location='${a.href}'`}">${a.label}</button>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function dismissNotif(id) {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx > -1) notifications.splice(idx, 1);
  renderNotifs();
}

function markAllRead() {
  notifications.forEach(n => n.unread = false);
  renderNotifs();
}

function loadMore() {
  // No-op for demo
}

renderTabs();
renderNotifs();
