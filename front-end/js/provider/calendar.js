// ===== DATA =====
const events = {
  '2026-04-02': [
    { service: 'Microwave Cleaning', customer: 'Sam Bhav', time: '09:00 AM' },
    { service: 'Full Kitchen Detail', customer: 'Robby', time: '02:00 PM' },
  ],
  '2026-04-05': [
    { service: 'Residential Cleaning', customer: 'Sam Bhav', time: '10:00 AM' },
    { service: 'Full Kitchen Detail', customer: 'Rob Ber', time: '02:00 PM' },
  ],
  '2026-04-09': [
    { service: 'Deep House Clean', customer: 'Zhang et al.', time: '08:00 AM' },
  ],
  '2026-04-12': [
    { service: 'Window Washing', customer: 'ElHuman', time: '01:00 PM' },
  ],
  '2026-04-16': [
    { service: 'Post-Construction...', customer: 'Empire Build', time: '08:30 AM' },
  ],
};
const blockedDays = ['2026-04-03', '2026-04-07', '2026-04-21'];

const hourlySlots = [
  { time: '08:00 AM - 09:00 AM', type: 'avail', available: true },
  { time: '09:00 AM - 10:00 AM', type: 'unavail', available: false },
  { time: '10:00 AM - 11:30 AM', type: 'assigned', label: 'ASSIGNED', jobName: 'Residential Cleaning: #TK-8821', customer: 'Customer: Sam Bhav' },
  { time: '12:00 PM - 01:00 PM', type: 'avail', available: true },
  { time: '01:00 PM - 03:00 PM', type: 'pending', label: 'PENDING ARRIVAL', jobName: 'Maintenance: #TK-9042', customer: 'Customer: Rob Ber' },
  { time: '03:00 PM - 04:00 PM', type: 'avail', available: true },
  { time: '04:00 PM - 05:00 PM', type: 'avail', available: true },
];

let currentYear = 2026, currentMonth = 3; // April = index 3

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }

function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  let cells = [];
  // Prev month trailing
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: 'prev' });
  // Current month
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: 'current' });
  // Next month leading
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, month: 'next' });

  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'cal-cell';

    let key = null;
    if (cell.month === 'current') {
      key = dateKey(currentYear, currentMonth, cell.day);
      const isToday = isCurrentMonth && cell.day === today.getDate();
      const isBlocked = blockedDays.includes(key);
      if (isToday) div.classList.add('today');
      if (isBlocked) div.classList.add('blocked');

      let html = `<div class="cal-date">${cell.day}</div>`;
      if (isToday) html += `<span class="today-label">TODAY</span>`;

      if (isBlocked) {
        html += `<div class="blocked-label">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          BLOCKED
        </div>`;
      } else if (events[key]) {
        events[key].forEach(ev => {
          html += `<div class="cal-event">
            ${ev.service}
            <span class="ev-customer">${ev.customer} • ${ev.time}</span>
          </div>`;
        });
      }
      div.innerHTML = html;
      div.addEventListener('click', () => openSlotModal(cell.day));
    } else {
      div.classList.add('other-month');
      div.innerHTML = `<div class="cal-date">${cell.day}</div>`;
    }
    grid.appendChild(div);
  });
}

function prevMonth() {
  currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}
function nextMonth() {
  currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}
function goToday() { currentYear = 2026; currentMonth = 3; renderCalendar(); }
function setView(v) {
  document.getElementById('btn-month').classList.toggle('active', v === 'month');
  document.getElementById('btn-week').classList.toggle('active', v === 'week');
}

// ===== SLOT MODAL =====
let slotToggles = {};

function openSlotModal(day) {
  slotToggles = {};
  const key = dateKey(currentYear, currentMonth, day);
  const isBlocked = blockedDays.includes(key);
  const dateStr = new Date(currentYear, currentMonth, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let availCount = 0, assignedCount = 0;
  hourlySlots.forEach(s => {
    if (s.type === 'avail' && s.available) availCount++;
    if (s.type === 'assigned' || s.type === 'pending') assignedCount++;
  });

  let slotsHtml = hourlySlots.map((slot, i) => {
    if (slot.type === 'assigned') {
      return `<div class="slot-item assigned-slot">
        <div class="slot-icon assigned"><svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg></div>
        <div class="slot-meta">
          <div class="slot-time">${slot.time} <span class="slot-badge badge-assigned-sm">${slot.label}</span></div>
          <div class="slot-job-name">${slot.jobName}</div>
          <div class="slot-sub">${slot.customer}</div>
        </div>
        <div class="slot-lock"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
        <span class="slot-assigned-by" style="font-size:10px;color:var(--text-3);white-space:nowrap">SYSTEM ASSIGNED</span>
      </div>`;
    }
    if (slot.type === 'pending') {
      return `<div class="slot-item pending-slot">
        <div class="slot-icon pending"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div>
        <div class="slot-meta">
          <div class="slot-time">${slot.time} <span class="slot-badge badge-pending-sm">${slot.label}</span></div>
          <div class="slot-job-name pending-name">${slot.jobName}</div>
          <div class="slot-sub">${slot.customer}</div>
        </div>
        <div class="slot-lock"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
        <span class="slot-assigned-by" style="font-size:10px;color:var(--text-3);white-space:nowrap">SYSTEM ASSIGNED</span>
      </div>`;
    }
    const on = slot.available;
    slotToggles[i] = on;
    return `<div class="slot-item ${slot.type === 'unavail' ? 'unavail-slot' : ''}">
      <div class="slot-icon ${slot.type}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="slot-meta">
        <div class="slot-time">${slot.time}</div>
        <div class="slot-sub">${on ? 'Mark as available for bookings' : 'Unavailable for bookings'}</div>
      </div>
      <label class="slot-toggle">
        <span class="toggle-track ${on ? 'on' : ''}" id="track-${i}" onclick="toggleSlot(${i})"></span>
      </label>
    </div>`;
  }).join('');

  document.getElementById('slot-modal-content').innerHTML = `
    <div class="slot-modal-title">Hourly Availability</div>
    <div class="slot-modal-date">${dateStr}</div>
    <div class="slot-list">${slotsHtml}</div>
    <div class="slot-summary">
      <div class="slot-summary-chip"><span class="slot-summary-dot" style="background:var(--primary)"></span> ${availCount} Slots Available</div>
      <div class="slot-summary-chip"><span class="slot-summary-dot" style="background:var(--accent-green)"></span> ${assignedCount} Jobs Assigned</div>
    </div>
    <div class="slot-footer-row">
      <button class="btn-cancel" onclick="closeSlotModalBtn()">Cancel Changes</button>
      <button class="btn-save" onclick="saveSchedule()">Save Schedule</button>
    </div>
  `;
  document.getElementById('slot-modal').classList.add('open');
}

function toggleSlot(i) {
  slotToggles[i] = !slotToggles[i];
  const track = document.getElementById(`track-${i}`);
  if (track) track.classList.toggle('on', slotToggles[i]);
}
function closeSlotModalBtn() { document.getElementById('slot-modal').classList.remove('open'); }
function closeSlotModal(e) { if (e.target === document.getElementById('slot-modal')) closeSlotModalBtn(); }
function saveSchedule() { closeSlotModalBtn(); }
function openManageBlocks() { alert('Manage Blocks panel coming soon!'); }

renderCalendar();
