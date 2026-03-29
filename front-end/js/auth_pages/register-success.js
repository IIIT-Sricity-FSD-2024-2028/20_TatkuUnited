'use strict';

(function () {
  /* The success page is mostly CSS-animated.
     This JS handles any dynamic behaviours. */

  /* Show a quick welcome message based on stored role (if available) */
  var role = sessionStorage.getItem('registeredRole') || '';
  if (role) {
    var roleLabels = {
      customer: 'Customer',
      service_provider: 'Service Provider',
      unit_manager: 'Unit Manager',
      collective_manager: 'Collective Manager',
      super_user: 'Super User'
    };
    var label = roleLabels[role] || role;
    var desc = document.querySelector('.success-desc');
    if (desc) {
      desc.textContent = 'Welcome aboard as a ' + label + '! Your registration is complete. You can now log in to explore services and get started.';
    }
  }

  /* "Explore Services" smooth scroll or link handling */
  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      /* Prevent hash navigation for demo links */
      if (this.classList.contains('btn-outline-dark')) {
        e.preventDefault();
        /* In production: window.location.href = '/services'; */
        console.log('Navigating to Services...');
      }
    });
  });
})();
