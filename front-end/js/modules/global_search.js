/* ── Global Search JS ── */
// Hooks into the topbar search input to provide site-wide quick navigation.

(function() {
  function initGlobalSearch() {
    const searchWrap = document.querySelector('.topbar .search-wrap');
    if (!searchWrap) return;

    const searchInput = searchWrap.querySelector('.search-input');
    if (!searchInput) return;

    // 1. Create Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'search-results-dropdown';
    searchWrap.appendChild(dropdown);

    // 2. Click outside to close
    document.addEventListener('click', (e) => {
      if (!searchWrap.contains(e.target)) dropdown.classList.remove('open');
    });

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) {
        dropdown.classList.remove('open');
        return;
      }
      renderResults(q, dropdown);
    });

    searchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim().length >= 2) dropdown.classList.add('open');
    });
  }

  function renderResults(query, dropdown) {
    dropdown.innerHTML = '';
    dropdown.classList.add('open');

    // Fetch data from AppStore
    const allProviders = AppStore.getTable('service_providers') || [];
    const allUnits     = AppStore.getTable('units') || [];
    const allManagers  = AppStore.getTable('unit_managers') || [];

    // Filter
    const matchedProviders = allProviders.filter(p => 
      p.name.toLowerCase().includes(query) || p.service_provider_id.toLowerCase().includes(query)
    ).slice(0, 5);

    const matchedUnits = allUnits.filter(u => 
      u.unit_name.toLowerCase().includes(query) || (u.category || '').toLowerCase().includes(query)
    ).slice(0, 3);

    const matchedManagers = allManagers.filter(m => 
      m.name.toLowerCase().includes(query)
    ).slice(0, 3);

    if (!matchedProviders.length && !matchedUnits.length && !matchedManagers.length) {
      dropdown.innerHTML = '<div class="search-empty">No results found for "' + query + '"</div>';
      return;
    }

    // Render Units
    if (matchedUnits.length) {
      dropdown.appendChild(createHeader('Units'));
      matchedUnits.forEach(u => {
        dropdown.appendChild(createItem(`manage_units.html?id=${u.unit_id}`, u.unit_name, u.category || 'Unit', 'unit'));
      });
    }

    // Render Providers
    if (matchedProviders.length) {
      dropdown.appendChild(createHeader('Service Providers'));
      matchedProviders.forEach(p => {
        dropdown.appendChild(createItem(`provider_profile.html?id=${p.service_provider_id}`, p.name, p.service_provider_id, 'provider'));
      });
    }

    // Render Managers
    if (matchedManagers.length) {
      dropdown.appendChild(createHeader('Unit Managers'));
      matchedManagers.forEach(m => {
        dropdown.appendChild(createItem(`manage_units.html?manager_id=${m.name}`, m.name, 'Manager', 'manager'));
      });
    }
  }

  function createHeader(text) {
    const h = document.createElement('div');
    h.className = 'search-section-header';
    h.textContent = text;
    return h;
  }

  function createItem(href, title, sub, type) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'search-result-item';
    
    let iconSvg = '';
    if (type === 'unit') iconSvg = '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    if (type === 'provider') iconSvg = '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
    if (type === 'manager') iconSvg = '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    a.innerHTML = `
      <div class="search-result-icon">${iconSvg}</div>
      <div class="search-result-info">
        <div class="search-result-title">${title}</div>
        <div class="search-result-sub">${sub}</div>
      </div>
    `;
    return a;
  }

  // Start on AppStore ready
  if (window.AppStore) {
    AppStore.ready.then(initGlobalSearch);
  } else {
    document.addEventListener('DOMContentLoaded', initGlobalSearch);
  }
})();
