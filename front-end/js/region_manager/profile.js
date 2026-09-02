// ── Region Manager Profile JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  let manager = session;
  try {
    manager = await Api.get('/region-managers/' + encodeURIComponent(session.id), { silent: true }) || session;
  } catch (_) {}

  setValue('full-name', manager.name);
  setValue('email', manager.email);
  setValue('phone', manager.phone);
  setValue('dob', manager.dob);
  setText('hero-name', manager.name || '');
  setText('hero-email', manager.email || '');
  setText('topbar-avatar', getInitials(manager.name));
  setText('profile-avatar', getInitials(manager.name));

  let regions = [];
  try {
    regions = await Api.get('/regions', { silent: true }) || [];
  } catch (_) {}

  const regionId = manager.region_id || session.region_id;
  const region = (regions || []).find(r => r.region_id === regionId);
  setValue('collective-name', region ? region.region_name : '');
  setValue('collective-id', region ? region.region_id : regionId || '');
  const regionSelect = document.getElementById('region');
  if (regionSelect) {
    regionSelect.innerHTML = '';
    (regions || []).forEach(item => {
      const option = document.createElement('option');
      option.value = item.region_id;
      option.textContent = item.region_name;
      option.selected = item.region_id === regionId;
      regionSelect.appendChild(option);
    });
  }
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0] ? parts[0].slice(0, 2) : 'RM').toUpperCase();
}
