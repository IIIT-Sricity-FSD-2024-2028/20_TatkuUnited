// ── Work Hours (persisted in localStorage) ──────────────────────────────────
const DEFAULT_START = '08:00';
const DEFAULT_END   = '18:00';

function getWorkHours() {
  return {
    start: localStorage.getItem('workStart') || DEFAULT_START,
    end:   localStorage.getItem('workEnd')   || DEFAULT_END,
  };
}

function initWorkHours() {
  const { start, end } = getWorkHours();
  const startEl = document.getElementById('work-start');
  const endEl   = document.getElementById('work-end');
  if (startEl) startEl.value = start;
  if (endEl)   endEl.value   = end;
  updateWorkHoursPreview();
}

function updateWorkHoursPreview() {
  const startEl = document.getElementById('work-start');
  const endEl   = document.getElementById('work-end');
  const preview = document.getElementById('work-hours-preview');
  if (!startEl || !endEl || !preview) return;

  const start = startEl.value;
  const end   = endEl.value;

  if (start >= end) {
    preview.textContent = '⚠ End time must be after start time.';
    preview.style.color = 'var(--accent-red)';
    return;
  }

  const fmt = t => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const startMin = toMinutes(start);
  const endMin   = toMinutes(end);
  const totalMins = endMin - startMin;
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const dur  = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  preview.textContent = `Active window: ${fmt(start)} – ${fmt(end)} (${dur})`;
  preview.style.color = 'var(--accent-green)';
}

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function saveWorkHours() {
  const startEl = document.getElementById('work-start');
  const endEl   = document.getElementById('work-end');
  if (!startEl || !endEl) return;

  const start = startEl.value;
  const end   = endEl.value;

  if (start >= end) {
    showToast('⚠ End time must be after start time.', true);
    return;
  }

  localStorage.setItem('workStart', start);
  localStorage.setItem('workEnd',   end);
  updateWorkHoursPreview();
  showToast('Work hours saved!');
}

// ── Profile sections ─────────────────────────────────────────────────────────
function saveSection(section) {
  showToast(section === 'personal' ? 'Personal info saved!' : 'Professional details saved!');
}

// ── Resume & Certificates Upload ─────────────────────────────────────────────
const ALLOWED_RESUME = ['application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_CERTS  = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES      = 5 * 1024 * 1024; // 5 MB

// Tracks uploaded files per list so duplicates are rejected
const uploadedFiles  = { 'resume-list': [], 'certs-list': [] };

function handleDragOver(e, zoneId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.add('drag-over');
}

function handleDragLeave(zoneId) {
  document.getElementById(zoneId).classList.remove('drag-over');
}

function handleDrop(e, inputId) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  const zoneId = input.closest('.upload-zone').id;
  document.getElementById(zoneId).classList.remove('drag-over');

  const listId  = inputId === 'resume-input' ? 'resume-list' : 'certs-list';
  const multi   = inputId === 'certs-input';
  const allowed = multi ? ALLOWED_CERTS : ALLOWED_RESUME;

  const files = Array.from(e.dataTransfer.files);
  processFiles(files, listId, multi, allowed);
}

function handleFileSelect(input, listId, multi) {
  const allowed = multi ? ALLOWED_CERTS : ALLOWED_RESUME;
  const files   = Array.from(input.files);
  processFiles(files, listId, multi, allowed);
  input.value = ''; // reset so same file can be re-selected after removal
}

function processFiles(files, listId, multi, allowed) {
  if (!multi) {
    // For resume: replace existing file
    uploadedFiles[listId] = [];
    document.getElementById(listId).innerHTML = '';
  }

  let rejected = 0;
  for (const file of files) {
    if (!allowed.includes(file.type)) { rejected++; continue; }
    if (file.size > MAX_BYTES)        { rejected++; continue; }
    if (uploadedFiles[listId].some(f => f.name === file.name && f.size === file.size)) continue;

    uploadedFiles[listId].push(file);
    renderFileItem(file, listId);
  }

  if (rejected) showToast(`${rejected} file(s) skipped — wrong type or over 5 MB.`, true);
}

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon() {
  return `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}

function renderFileItem(file, listId) {
  const list = document.getElementById(listId);
  const item = document.createElement('div');
  item.className = 'upload-file-item';
  item.dataset.name = file.name;
  item.dataset.size = file.size;
  item.innerHTML = `
    <div class="upload-file-icon">${getFileIcon()}</div>
    <div class="upload-file-info">
      <div class="upload-file-name" title="${file.name}">${file.name}</div>
      <div class="upload-file-size">${formatBytes(file.size)}</div>
    </div>
    <div class="upload-file-status">
      <svg viewBox="0 0 24 24" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
      Uploaded
    </div>
    <button class="btn-remove-file" title="Remove" onclick="removeUploadedFile(this, '${listId}')">
      <svg viewBox="0 0 24 24" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  list.appendChild(item);
}

function removeUploadedFile(btn, listId) {
  const item = btn.closest('.upload-file-item');
  const name = item.dataset.name;
  const size = Number(item.dataset.size);
  uploadedFiles[listId] = uploadedFiles[listId].filter(f => !(f.name === name && f.size === size));
  item.style.animation = 'none';
  item.style.opacity   = '0';
  item.style.transform = 'translateY(-4px)';
  item.style.transition = 'opacity .18s, transform .18s';
  setTimeout(() => item.remove(), 180);
}


function requestRemoveSkill(btn, skillName) {
  const row = btn.closest('.skill-row');
  if (row.classList.contains('pending-remove')) return;

  // Mark as pending – show a badge, disable the button
  row.classList.add('pending-remove');
  btn.disabled = true;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Pending Approval
  `;

  // In the future: POST /api/skill-removal-requests { skill: skillName }
  showToast(`Removal request sent for "${skillName}" — awaiting manager approval.`);
}

function toggleAddSkill() {
  const panel  = document.getElementById('add-skill-panel');
  const toggle = document.getElementById('add-skill-toggle');
  const open   = panel.classList.toggle('open');
  toggle.classList.toggle('open', open);
}

function requestVerifySkill() {
  const select = document.getElementById('new-skill-select');
  const skill  = select.value;

  if (!skill) {
    showToast('Please choose a skill from the list first.', true);
    return;
  }

  const btn = document.getElementById('btn-request-verify');
  btn.disabled = true;
  btn.textContent = 'Request Sent ✓';

  // In the future: POST /api/skill-verification-requests { skill }
  showToast(`Verification request sent for "${skill}" — a manager will review it shortly.`);

  // Reset after a moment
  setTimeout(() => {
    select.value = '';
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Request Verification
    `;
  }, 3000);
}

function showPasswordModal() {
  document.getElementById('pwd-modal').classList.add('open');
}
function closePwdModalBtn() {
  document.getElementById('pwd-modal').classList.remove('open');
}
function closePwdModal(e) {
  if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn();
}

function toggle2FA(checkbox) {
  showToast(checkbox.checked ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
}

function confirmDeactivate() {
  if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
    showToast('Account deactivation request submitted.');
  }
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? 'var(--accent-red)' : '#0f172a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initWorkHours);
