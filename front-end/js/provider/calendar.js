// ===== DATA =====
let events = {};
const blockedDays = new Set([]);
// Unavailability slots stored per day: { '2026-04-02': [{from:'09:00',to:'11:00'}], ... }
let unavailability = {};

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function toMin(t) { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; }
function fromMin(m) { return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ── Work hours (read from mockData dynamically) ─────────────
function getWorkHours() {
  const data = window.getData() || {};
  if (data.workingHours) {
    return data.workingHours;
  }
  return {
    start: '08:00',
    end: '18:00',
  };
}

// ── Calendar render ──────────────────────────────────────────────────────────
function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();
  const isCurMon = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  let cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: 'prev' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: 'current' });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, month: 'next' });

  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'cal-cell';

    if (cell.month === 'current') {
      const key = dateKey(currentYear, currentMonth, cell.day);
      const isToday = isCurMon && cell.day === today.getDate();
      if (isToday) div.classList.add('today');

      let html = `<div class="cal-date">${cell.day}</div>`;
      if (isToday) html += `<span class="today-label">TODAY</span>`;

      if (events[key]) {
        events[key].forEach(ev => {
          html += `<div class="cal-event">
            ${ev.service}
            <span class="ev-customer">${ev.customer} • ${fmt12(ev.time)}</span>
          </div>`;
        });
      }

      // show custom unavailability indicator
      if (unavailability[key] && unavailability[key].length) {
        unavailability[key].forEach(u => {
          html += `<div class="cal-unavail-badge">${fmt12(u.from)}–${fmt12(u.to)}</div>`;
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

function prevMonth() { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); }
function nextMonth() { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); }
function setView(v) {
  document.getElementById('btn-month').classList.toggle('active', v === 'month');
  document.getElementById('btn-week').classList.toggle('active', v === 'week');
}
function downloadCalendar() {
  const calendarText = 'Calendar: ' + monthNames[currentMonth] + ' ' + currentYear + '\n\n';
  let content = calendarText;
  content += 'Scheduled Jobs and Unavailability:\n';
  content += '================================\n\n';

  Object.entries(events).forEach(function ([date, jobs]) {
    const parts = date.split('-');
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);
    const dateObj = new Date(y, m - 1, d);
    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    content += dateStr + ':\n';
    jobs.forEach(function (job) {
      content += '  • ' + job.time + '-' + job.endTime + ': ' + job.service + ' (' + job.customer + ')\n';
    });
    content += '\n';
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Tatku_Calendar_' + currentYear + '_' + String(currentMonth + 1).padStart(2, '0') + '.txt';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ── Slot Modal ───────────────────────────────────────────────────────────────
let modalDay = null;

function openSlotModal(day) {
  modalDay = day;
  const key = dateKey(currentYear, currentMonth, day);
  const dateStr = new Date(currentYear, currentMonth, day)
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wh = getWorkHours();
  const dayEvents = events[key] || [];

  // Build job blocks HTML for reference
  const jobBlocksHtml = dayEvents.length
    ? `<div class="modal-jobs-section">
        <div class="modal-jobs-label">
          <svg viewBox="0 0 24 24" width="13" height="13"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>
          Scheduled Jobs (cannot overlap)
        </div>
        ${dayEvents.map(ev => `
          <div class="modal-job-chip">
            <span class="modal-job-dot"></span>
            <strong>${fmt12(ev.time)} – ${fmt12(ev.endTime)}</strong>
            <span>${ev.service} · ${ev.customer}</span>
          </div>`).join('')}
      </div>`
    : '';

  // Existing unavailability for this day
  const existing = unavailability[key] || [];
  const isFullDay = existing.length === 1 && existing[0].from === wh.start && existing[0].to === wh.end;

  document.getElementById('slot-modal-content').innerHTML = `
    <div class="slot-modal-title">Set Unavailability</div>
    <div class="slot-modal-date">${dateStr}</div>

    ${jobBlocksHtml}

    <!-- Full-day toggle -->
    <div class="fullday-row" id="fullday-row">
      <div class="fullday-label">
        <svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <div>
          <div class="fullday-title">Unavailable all day</div>
          <div class="fullday-sub">Blocks your entire working window (${fmt12(wh.start)} – ${fmt12(wh.end)})</div>
        </div>
      </div>
      <label class="toggle-wrap-modal">
        <input type="checkbox" id="fullday-chk" ${isFullDay ? 'checked' : ''} onchange="onFullDayChange()" />
        <span class="toggle-track-modal ${isFullDay ? 'on' : ''}" id="fullday-track"></span>
      </label>
    </div>
    <div class="fullday-error" id="fullday-error"></div>

    <!-- Custom range picker -->
    <div class="range-picker-wrap" id="range-picker-wrap" ${isFullDay ? 'style="opacity:.45;pointer-events:none"' : ''}>
      <div class="range-picker-head">
        <svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Mark a custom unavailable window
      </div>

      <!-- Visual timeline -->
      <div class="timeline-wrap">
        <div class="timeline-labels" id="timeline-labels"></div>
        <div class="timeline-track" id="timeline-track">
          <!-- job blocks rendered here -->
          <div class="timeline-filled" id="timeline-filled"></div>
          <div class="timeline-handle timeline-handle--from" id="handle-from" onmousedown="startDrag('from',event)" ontouchstart="startDrag('from',event)"></div>
          <div class="timeline-handle timeline-handle--to"   id="handle-to"   onmousedown="startDrag('to',event)"   ontouchstart="startDrag('to',event)"></div>
        </div>
        <div class="timeline-time-display">
          <span id="range-from-label">–</span>
          <span class="range-arrow">→</span>
          <span id="range-to-label">–</span>
        </div>
      </div>

      <!-- Time inputs -->
      <div class="time-range-inputs">
        <div class="tri-field">
          <label>From</label>
          <input type="time" id="range-from" class="range-time-input"
            min="${wh.start}" max="${wh.end}"
            value="${existing.length && !isFullDay ? existing[0].from : wh.start}"
            oninput="onTimeInputChange()" />
        </div>
        <div class="tri-divider">—</div>
        <div class="tri-field">
          <label>To</label>
          <input type="time" id="range-to" class="range-time-input"
            min="${wh.start}" max="${wh.end}"
            value="${existing.length && !isFullDay ? existing[0].to : wh.end}"
            oninput="onTimeInputChange()" />
        </div>
      </div>

      <div class="range-error" id="range-error"></div>

      <button class="btn-add-range" onclick="addUnavailRange()">
        <svg viewBox="0 0 24 24" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Unavailable Window
      </button>

      <!-- List of added windows -->
      <div id="unavail-list" class="unavail-list"></div>
    </div>

    <div class="slot-footer-row" style="margin-top:20px">
      <button class="btn-cancel" onclick="closeSlotModalBtn()">Cancel</button>
      <button class="btn-save" onclick="saveSchedule()">Save</button>
    </div>
  `;

  document.getElementById('slot-modal').classList.add('open');
  initTimeline();
  renderUnavailList(key);
}

// ── Timeline drag ────────────────────────────────────────────────────────────
let dragging = null;

function initTimeline() {
  const key = dateKey(currentYear, currentMonth, modalDay);
  const wh = getWorkHours();
  const wStart = toMin(wh.start);
  const wEnd = toMin(wh.end);
  const range = wEnd - wStart;
  const dayEvs = events[key] || [];

  // Build label markers (every 2h)
  const labelsEl = document.getElementById('timeline-labels');
  if (!labelsEl) return;
  labelsEl.innerHTML = '';
  for (let m = wStart; m <= wEnd; m += 120) {
    const pct = ((m - wStart) / range) * 100;
    const label = document.createElement('span');
    label.style.left = pct + '%';
    label.textContent = fmt12(fromMin(m));
    labelsEl.appendChild(label);
  }

  // Render job blocks on track
  const track = document.getElementById('timeline-track');
  track.querySelectorAll('.timeline-job').forEach(el => el.remove());
  dayEvs.forEach(ev => {
    const s = (toMin(ev.time) - wStart) / range * 100;
    const e = (toMin(ev.endTime) - wStart) / range * 100;
    const block = document.createElement('div');
    block.className = 'timeline-job';
    block.style.left = s + '%';
    block.style.width = (e - s) + '%';
    block.title = `${ev.service} (${fmt12(ev.time)}–${fmt12(ev.endTime)})`;
    track.appendChild(block);
  });

  updateTimelineHandles();
}

function updateTimelineHandles() {
  const fromEl = document.getElementById('range-from');
  const toEl = document.getElementById('range-to');
  if (!fromEl || !toEl) return;

  const wh = getWorkHours();
  const wStart = toMin(wh.start);
  const wEnd = toMin(wh.end);
  const range = wEnd - wStart;

  const fromMin_ = toMin(fromEl.value);
  const toMin_ = toMin(toEl.value);

  const fromPct = Math.max(0, Math.min(100, (fromMin_ - wStart) / range * 100));
  const toPct = Math.max(0, Math.min(100, (toMin_ - wStart) / range * 100));

  const hFrom = document.getElementById('handle-from');
  const hTo = document.getElementById('handle-to');
  const filled = document.getElementById('timeline-filled');
  if (!hFrom || !hTo || !filled) return;

  hFrom.style.left = fromPct + '%';
  hTo.style.left = toPct + '%';
  filled.style.left = fromPct + '%';
  filled.style.width = (toPct - fromPct) + '%';

  document.getElementById('range-from-label').textContent = fmt12(fromEl.value);
  document.getElementById('range-to-label').textContent = fmt12(toEl.value);
}

function startDrag(which, e) {
  e.preventDefault();
  dragging = which;
  const move = (ev) => onDragMove(ev);
  const up = () => { dragging = null; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', up);
}

function onDragMove(e) {
  if (!dragging) return;
  e.preventDefault();
  const track = document.getElementById('timeline-track');
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

  const wh = getWorkHours();
  const wStart = toMin(wh.start);
  const wEnd = toMin(wh.end);
  const range = wEnd - wStart;

  // Snap to 15-min intervals
  let minutes = Math.round((wStart + pct * range) / 15) * 15;
  minutes = Math.max(wStart, Math.min(wEnd, minutes));

  const fromEl = document.getElementById('range-from');
  const toEl = document.getElementById('range-to');
  if (!fromEl || !toEl) return;

  if (dragging === 'from') {
    if (minutes >= toMin(toEl.value)) return;
    fromEl.value = fromMin(minutes);
  } else {
    if (minutes <= toMin(fromEl.value)) return;
    toEl.value = fromMin(minutes);
  }
  updateTimelineHandles();
  validateRange();
}

function onTimeInputChange() {
  updateTimelineHandles();
  validateRange();
}

function validateRange() {
  const key = dateKey(currentYear, currentMonth, modalDay);
  const fromEl = document.getElementById('range-from');
  const toEl = document.getElementById('range-to');
  const errEl = document.getElementById('range-error');
  if (!fromEl || !toEl || !errEl) return false;

  const from = toMin(fromEl.value);
  const to = toMin(toEl.value);
  const wh = getWorkHours();
  const wStart = toMin(wh.start);
  const wEnd = toMin(wh.end);
  const dayEvs = events[key] || [];

  if (from >= to) {
    errEl.textContent = '⚠ "From" must be before "To".';
    return false;
  }
  if (from < wStart || to > wEnd) {
    errEl.textContent = `⚠ Must be within your working hours (${fmt12(wh.start)}–${fmt12(wh.end)}).`;
    return false;
  }
  // check overlap with jobs
  for (const ev of dayEvs) {
    const jStart = toMin(ev.time);
    const jEnd = toMin(ev.endTime);
    if (from < jEnd && to > jStart) {
      errEl.textContent = `⚠ Overlaps with "${ev.service}" (${fmt12(ev.time)}–${fmt12(ev.endTime)}).`;
      return false;
    }
  }
  errEl.textContent = '';
  return true;
}

function addUnavailRange() {
  if (!validateRange()) return;
  const key = dateKey(currentYear, currentMonth, modalDay);
  const fromEl = document.getElementById('range-from');
  const toEl = document.getElementById('range-to');
  if (!fromEl || !toEl) return;

  if (!unavailability[key]) unavailability[key] = [];

  // Merge / dedup
  const from = fromEl.value;
  const to = toEl.value;
  // Remove any existing range that this new one fully covers, then add
  unavailability[key] = unavailability[key].filter(u => !(toMin(u.from) >= toMin(from) && toMin(u.to) <= toMin(to)));
  unavailability[key].push({ from, to });
  unavailability[key].sort((a, b) => toMin(a.from) - toMin(b.from));
  syncUnavailability();
  renderUnavailList(key);
}

function removeUnavailRange(key, idx) {
  if (unavailability[key]) {
    unavailability[key].splice(idx, 1);
    if (!unavailability[key].length) delete unavailability[key];
  }
  syncUnavailability();
  renderUnavailList(key);
  // uncheck full-day if any slot removed
  const chk = document.getElementById('fullday-chk');
  if (chk) chk.checked = false;
  const track = document.getElementById('fullday-track');
  if (track) track.classList.remove('on');
  const wrap = document.getElementById('range-picker-wrap');
  if (wrap) { wrap.style.opacity = ''; wrap.style.pointerEvents = ''; }
}

function renderUnavailList(key) {
  const listEl = document.getElementById('unavail-list');
  if (!listEl) return;
  const slots = unavailability[key] || [];
  if (!slots.length) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = `<div class="unavail-list-head">Added windows:</div>` +
    slots.map((u, i) => `
      <div class="unavail-list-item">
        <svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${fmt12(u.from)} → ${fmt12(u.to)}</span>
        <button class="unavail-remove" onclick="removeUnavailRange('${key}',${i})" title="Remove">×</button>
      </div>`).join('');
}

function onFullDayChange() {
  const chk = document.getElementById('fullday-chk');
  const track = document.getElementById('fullday-track');
  const wrap = document.getElementById('range-picker-wrap');
  const errEl = document.getElementById('fullday-error');
  const key = dateKey(currentYear, currentMonth, modalDay);
  const dayEvs = events[key] || [];

  if (!chk || !track || !wrap || !errEl) return;

  // Check if there are any jobs on this day
  if (chk.checked && dayEvs.length > 0) {
    // There are jobs - show error and uncheck
    const jobsList = dayEvs.map(ev => `"${ev.service}" (${fmt12(ev.time)}–${fmt12(ev.endTime)})`).join(', ');
    errEl.textContent = `⚠ Cannot set full day unavailability. You have scheduled jobs: ${jobsList}`;
    chk.checked = false;
    track.classList.remove('on');
    wrap.style.opacity = '';
    wrap.style.pointerEvents = '';
    delete unavailability[key];
    syncUnavailability();
    renderUnavailList(key);
    return;
  }

  track.classList.toggle('on', chk.checked);
  errEl.textContent = '';

  if (chk.checked) {
    wrap.style.opacity = '.45';
    wrap.style.pointerEvents = 'none';
    // Set the full day range
    const wh = getWorkHours();
    unavailability[key] = [{ from: wh.start, to: wh.end }];
    syncUnavailability();
    renderUnavailList(key);
  } else {
    wrap.style.opacity = '';
    wrap.style.pointerEvents = '';
    delete unavailability[key];
    syncUnavailability();
    renderUnavailList(key);
  }
}

function closeSlotModalBtn() { document.getElementById('slot-modal').classList.remove('open'); }
function closeSlotModal(e) { if (e.target === document.getElementById('slot-modal')) closeSlotModalBtn(); }

function saveSchedule() {
  closeSlotModalBtn();
  renderCalendar();
}

function syncUnavailability() {
  const data = window.getData();
  if (!data) return;
  data.unavailability = unavailability;
  window.setData(data);
}

function openManageBlocks() { alert('Manage Blocks panel coming soon!'); }

window.initData().then(() => {
  const data = window.getData();
  events = {};
  data.jobs.forEach(j => {
    if (j.status === 'cancelled') return;
    if (!events[j.date]) events[j.date] = [];
    events[j.date].push({
      service: j.service,
      customer: j.customer,
      time: j.startTime,
      endTime: j.endTime,
      fullJob: j
    });
  });
  unavailability = data.unavailability || {};

  if (data.provider) {
    document.querySelectorAll('.user-chip span').forEach(el => el.textContent = data.provider.name || 'Provider');
    if (data.provider.pfp_url) {
      document.querySelectorAll('.user-avatar').forEach(el => {
        el.innerHTML = `<img src="${data.provider.pfp_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      });
    }
  }

  renderCalendar();
});
