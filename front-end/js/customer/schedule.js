function getCart() { try { return JSON.parse(localStorage.getItem('tu_cart') || '[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('tu_cart', JSON.stringify(c)); }
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'grid' : 'none'; });
}

const params = new URLSearchParams(window.location.search);
const serviceName = params.get('service') || 'Home Deep Cleaning';
const servicePrice = params.get('price') || '₹ 1200';
const serviceLocation = params.get('location') || '21/229, Indira Nagar, Lucknow';

document.getElementById('svc-name').textContent = serviceName;
document.getElementById('svc-price').textContent = servicePrice;
document.getElementById('svc-location').textContent = serviceLocation;

let currentMode = 'instant';

function getDateConstraints() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const fmt = d => d.toISOString().split('T')[0];
  return { min: fmt(today), max: fmt(maxDate) };
}

function setMode(mode) {
  currentMode = mode;
  const isInstant = mode === 'instant';
  document.getElementById('btn-instant').classList.toggle('active', isInstant);
  document.getElementById('btn-scheduled').classList.toggle('active', !isInstant);
  document.getElementById('scheduled-fields').style.display = isInstant ? 'none' : 'flex';
  document.getElementById('info-text').textContent = isInstant
    ? 'Your service will be assigned to an available provider immediately.'
    : 'Choose your preferred date and time slot (within 1 week from today).';
  const banner = document.getElementById('info-banner');
  banner.style.background = isInstant ? 'var(--green-light)' : 'var(--primary-light)';
  banner.style.borderColor = isInstant ? '#6ee7b7' : '#bfdbfe';
  banner.style.color = isInstant ? '#065f46' : '#1e3a8a';
  banner.querySelector('svg').style.stroke = isInstant ? '#059669' : 'var(--primary)';
  if (!isInstant) {
    const { min, max } = getDateConstraints();
    const dateInput = document.getElementById('sched-date');
    dateInput.min = min;
    dateInput.max = max;
    if (dateInput.value && (dateInput.value < min || dateInput.value > max)) dateInput.value = '';
  }
}

function addToCart() {
  if (currentMode === 'scheduled') {
    const dateVal = document.getElementById('sched-date').value;
    const { min, max } = getDateConstraints();
    if (!dateVal) { alert('Please select a date.'); return; }
    if (dateVal < min || dateVal > max) { alert('Please select a date within 1 week from today.'); return; }
  }
  const cart = getCart();
  const item = {
    id: Date.now(),
    service: serviceName,
    price: servicePrice,
    location: serviceLocation,
    mode: currentMode,
    date: currentMode === 'scheduled' ? (document.getElementById('sched-date').value || '') : 'ASAP',
    time: currentMode === 'scheduled' ? document.getElementById('sched-time').value : 'Immediate',
  };
  cart.push(item);
  saveCart(cart);
  updateCartBadge();

  const btn = document.getElementById('add-cart-btn');
  btn.classList.add('added');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Added to Cart!`;

  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart`;
  }, 2000);
}

updateCartBadge();
