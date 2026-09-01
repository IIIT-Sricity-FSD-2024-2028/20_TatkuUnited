// ── Region Manager Profile JS — API-backed ──

(async () => {
  const session = Auth.requireSession(['region_manager']);
  if (!session) return;

  setText('profile-name', session.name || 'Region Manager');
  setText('profile-email', session.email || 'manager@region.com');
  setText('profile-role', 'Region Manager');

  let regions = [];
  try {
    regions = await Api.get('/regions', { silent: true }) || [];
  } catch (_) {}

  const region = (regions || []).find(r => r.region_id === session.region_id) || regions[0] || { region_name: 'Chennai North' };
  setText('profile-region', region.region_name || 'Chennai North');
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
