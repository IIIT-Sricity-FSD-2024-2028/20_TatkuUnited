/* =============================================
   SERVICE DISCOVERY PAGE — service_discovery.js
   ============================================= */

(function () {
  'use strict';

  /* ── Hamburger ─────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  /* ── Category filter ───────────────────── */
  const categoryPills = document.querySelectorAll('.category-pill');
  const serviceCards  = document.querySelectorAll('.service-card');
  const noResults     = document.getElementById('noResults');

  function filterCards(cat) {
    let visible = 0;
    serviceCards.forEach(function (card) {
      const cardCat = (card.dataset.cat || '').toLowerCase();
      const show = cat === 'all' || cardCat === cat;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (noResults) noResults.style.display = visible === 0 ? '' : 'none';
  }

  categoryPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      categoryPills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      filterCards((pill.dataset.cat || '').toLowerCase());
    });
  });

  /* ── Search ────────────────────────────── */
  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();

      // Reset category pills when searching
      if (query) {
        categoryPills.forEach(function (p) { p.classList.remove('active'); });
      } else {
        const allPill = document.querySelector('.category-pill[data-cat="all"]');
        if (allPill) allPill.classList.add('active');
      }

      let visible = 0;
      serviceCards.forEach(function (card) {
        const title = (card.querySelector('h3') || {}).textContent || '';
        const desc  = (card.querySelector('.card-desc') || {}).textContent || '';
        const cat   = card.dataset.cat || '';
        const match = !query ||
          title.toLowerCase().includes(query) ||
          desc.toLowerCase().includes(query)  ||
          cat.toLowerCase().includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      });

      if (noResults) noResults.style.display = visible === 0 ? '' : 'none';
    });
  }

  /* ── Book Now buttons ──────────────────── */
  document.querySelectorAll('.btn-book').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const card  = btn.closest('.service-card');
      const title = card ? (card.querySelector('h3') || {}).textContent : 'this service';
      const orig  = btn.textContent;
      btn.textContent = 'Booked!';
      btn.style.background = '#15803d';
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
      }, 1500);
    });
  });

  /* ── Scroll-reveal for why-cards ───────── */
  const whyCards = document.querySelectorAll('.why-card');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    whyCards.forEach(function (card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.4s ease ' + (i * 0.1) + 's, transform 0.4s ease ' + (i * 0.1) + 's';
      observer.observe(card);
    });
  }

})();
