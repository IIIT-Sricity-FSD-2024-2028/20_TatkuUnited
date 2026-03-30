function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

let currentRating = 4;

function setRating(val) {
  currentRating = val;
  document.querySelectorAll('.star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
}
function updateCharCount() {
  document.getElementById('char-count').textContent = `${document.getElementById('review-text').value.length} / 500 characters`;
}
function previewPhotos(input) {
  const slots = ['slot-1', 'slot-2', 'slot-3'];
  Array.from(input.files).slice(0, 3).forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => { const s = document.getElementById(slots[i]); if (s) s.innerHTML = `<img src="${e.target.result}" alt="preview"/>`; };
    reader.readAsDataURL(file);
  });
}

const suggestions = [
  { name: 'Oven Deep Clean', bg: '#fef3c7', icon: `<svg viewBox="0 0 24 24" style="stroke:#d97706"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h.01M12 8h.01M17 8h.01"/></svg>` },
  { name: 'Fridge Sanitizing', bg: '#fef3c7', icon: `<svg viewBox="0 0 24 24" style="stroke:#f59e0b"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M10 6v2M10 14v4"/></svg>` },
  { name: 'Full Kitchen', bg: '#eff6ff', icon: `<svg viewBox="0 0 24 24" style="stroke:#3b82f6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>` },
];

function renderNeed() {
  document.getElementById('need-grid').innerHTML = suggestions.map(s => `
    <div class="need-card" onclick="window.location='schedule.html?service=${encodeURIComponent(s.name)}'">
      <div class="need-card-icon" style="background:${s.bg}">${s.icon}</div>
      <span class="need-card-name">${s.name}</span>
    </div>
  `).join('');
}
function renderSuccessSuggestions() {
  document.getElementById('success-suggestions').innerHTML = suggestions.map(s => `
    <div class="sugg-card" onclick="window.location='schedule.html?service=${encodeURIComponent(s.name)}'">
      <div class="sugg-icon" style="background:${s.bg}">${s.icon}</div>
      <span class="sugg-name">${s.name}</span>
    </div>
  `).join('');
}

function submitReview() {
  document.getElementById('success-stars').innerHTML =
    `<span style="color:var(--orange)">${'★'.repeat(currentRating)}</span><span style="color:#d1d5db">${'☆'.repeat(5 - currentRating)}</span>`;
  renderSuccessSuggestions();

  const main = document.getElementById('main-review');
  const footer = document.getElementById('review-footer');
  main.style.opacity = '0';
  main.style.transform = 'translateY(-12px)';
  footer.style.display = 'none';
  setTimeout(() => {
    main.style.display = 'none';
    document.getElementById('success-overlay').style.display = 'flex';
    window.scrollTo(0, 0);
  }, 300);
}

AppStore.ready.then(() => {
  const session = Auth.requireSession(['customer']);
  if (!session) return;

  renderNeed();
  updateCartBadge();
});
