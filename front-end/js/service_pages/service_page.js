/* =============================================
   SERVICE PAGE — service_page.js
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
    });
  }

  /* ── Book now button ───────────────────── */
  function handleBook(btn) {
    var orig = btn.textContent;
    btn.textContent = 'Booked! ✓';
    btn.style.background = '#15803d';
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  }

  var btnBookNow = document.getElementById('btnBookNow');
  if (btnBookNow) {
    btnBookNow.addEventListener('click', function () { handleBook(btnBookNow); });
  }

  document.querySelectorAll('.sticky-bar .btn-book-now').forEach(function (btn) {
    btn.addEventListener('click', function () { handleBook(btn); });
  });

  /* ── FAQ accordion ─────────────────────── */
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(function (fi) {
        fi.classList.remove('open');
        var q = fi.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Review filter tabs ────────────────── */
  var filterTabs = document.querySelectorAll('.filter-tab');

  filterTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      filterTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  /* ── Star filters ──────────────────────── */
  var starFilters  = document.querySelectorAll('.star-filter');
  var reviewCards  = document.querySelectorAll('.review-card');

  starFilters.forEach(function (sf) {
    sf.addEventListener('click', function () {
      starFilters.forEach(function (s) { s.classList.remove('active'); });
      sf.classList.add('active');

      var stars = parseInt(sf.dataset.stars, 10);

      reviewCards.forEach(function (card) {
        var cardStars = parseInt(card.dataset.stars, 10);
        card.style.display = (stars === 0 || cardStars === stars) ? '' : 'none';
      });
    });
  });

  /* ── Sticky bar visibility ─────────────── */
  var stickyBar  = document.getElementById('stickyBar');
  var heroBtn    = document.getElementById('btnBookNow');

  if (stickyBar && heroBtn) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Show sticky bar when hero button is out of view
        if (window.innerWidth <= 900) {
          stickyBar.style.display = entry.isIntersecting ? 'none' : 'block';
        }
      });
    }, { threshold: 0 });

    observer.observe(heroBtn);
  }

  /* ── Rating bar animation ──────────────── */
  var ratingBars = document.querySelectorAll('.rb-fill');

  if ('IntersectionObserver' in window) {
    var barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.style.width; // trigger reflow
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    ratingBars.forEach(function (bar) {
      var targetWidth = bar.style.width;
      bar.style.width = '0';
      barObserver.observe(bar);
      setTimeout(function () { bar.style.width = targetWidth; }, 100);
    });
  }

  /* ── Scroll-reveal for steps ───────────── */
  var stepItems = document.querySelectorAll('.step-item');

  if ('IntersectionObserver' in window) {
    var stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
          stepObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    stepItems.forEach(function (item, i) {
      item.style.opacity   = '0';
      item.style.transform = 'translateX(-16px)';
      item.style.transition = 'opacity 0.4s ease ' + (i * 0.1) + 's, transform 0.4s ease ' + (i * 0.1) + 's';
      stepObserver.observe(item);
    });
  }

})();
