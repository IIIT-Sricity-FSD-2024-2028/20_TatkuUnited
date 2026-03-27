/* =============================================
   CATEGORY PAGE — category_page.js
   ============================================= */

(function () {
  'use strict';

  /* ── Hamburger ─────────────────────────── */
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
  }

  /* ── Sub-service selector ──────────────── */
  var subCards = document.querySelectorAll('.sub-service-card');

  subCards.forEach(function (card) {
    card.addEventListener('click', function () {
      subCards.forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');

      // Scroll to corresponding section if it exists
      var service = card.dataset.service;
      var sectionMap = {
        cabinets: null,
        chimney:  null,
        complete: 'appliance-pkg',
        appliance: 'microwave'
      };
      var targetId = sectionMap[service] || service;
      var target   = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Book now buttons ──────────────────── */
  document.querySelectorAll('.btn-book-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var orig = btn.textContent;
      btn.textContent = 'Booked!';
      btn.style.background = '#15803d';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
      }, 1800);
    });
  });

  /* ── Scroll-reveal for explore items ───── */
  var exploreItems = document.querySelectorAll('.explore-item');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity  = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    exploreItems.forEach(function (item, i) {
      item.style.opacity   = '0';
      item.style.transform = 'translateY(18px)';
      item.style.transition = 'opacity 0.4s ease ' + (i * 0.08) + 's, transform 0.4s ease ' + (i * 0.08) + 's';
      observer.observe(item);
    });
  }

})();
