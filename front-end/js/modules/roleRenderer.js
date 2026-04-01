/* =============================================================================
   TATKU UNITED — ROLE RENDERER MODULE
   front-end/js/modules/roleRenderer.js
   Depends on: js/modules/auth.js
   ============================================================================= */

window.RoleRenderer = (() => {

    /* ─── Nav link definitions per role ─── */
    const NAV_LINKS = {
        superuser: [
            { label: "Dashboard", href: "/front-end/html/super_user/super_user_dashboard.html", icon: "🏠" },
            { label: "User Management", href: "/front-end/html/super_user/user_management.html", icon: "👥" },
        ],
        collective_manager: [
            { label: "Dashboard", href: "/front-end/html/collective_manager/collective_dashboard.html", icon: "🏠" },
            { label: "Collective Management", href: "/front-end/html/collective_manager/collective_manage.html", icon: "🏢" },
        ],
        unit_manager: [
            { label: "Dashboard", href: "/front-end/html/unit_manager/unit_dashboard.html", icon: "🏠" },
            { label: "Provider Management", href: "/front-end/html/unit_manager/unit_providers.html", icon: "🔧" },
            { label: "Booking Management", href: "/front-end/html/unit_manager/unit_bookings.html", icon: "📋" },
        ],
        provider: [
            { label: "Dashboard", href: "/front-end/html/provider/provider_dashboard.html", icon: "🏠" },
            { label: "My Schedule", href: "/front-end/html/provider/provider_schedule.html", icon: "📅" },
            { label: "My Profile", href: "/front-end/html/provider/provider_profile.html", icon: "👤" },
        ],
        customer: [
            { label: "Dashboard", href: "/front-end/html/customer/customer_dashboard.html", icon: "🏠" },
            { label: "Browse Services", href: "/front-end/html/customer/customer_services.html", icon: "🔍" },
            { label: "My Bookings", href: "/front-end/html/customer/customer_bookings.html", icon: "📋" },
            { label: "My Profile", href: "/front-end/html/customer/customer_profile.html", icon: "👤" },
        ],
    };

    const ROLE_LABELS = {
        superuser: "Super User",
        collective_manager: "Collective Manager",
        unit_manager: "Unit Manager",
        provider: "Service Provider",
        customer: "Customer",
    };

    const ROLE_ACCENT_COLORS = {
        superuser: "#6c63ff",
        collective_manager: "#0ea5e9",
        unit_manager: "#f59e0b",
        provider: "#10b981",
        customer: "#ef4444",
    };

    /* ===========================================================================
       renderNav(session)
       Injects a full-height sidebar into <aside id="app-nav"> if present,
       otherwise prepends one to <body>.
       =========================================================================== */
    function renderNav(session) {
        if (!session) return;

        const links = NAV_LINKS[session.role] || [];
        const roleLabel = ROLE_LABELS[session.role] || session.role;
        const accent = ROLE_ACCENT_COLORS[session.role] || "#6c63ff";
        const avatar = session.pfp_url || `https://i.pravatar.cc/150?u=${session.id}`;
        const currentPath = window.location.pathname;

        const linksHtml = links.map(link => {
            const isActive = currentPath.endsWith(link.href.split("/").pop());
            return `
        <a href="${link.href}"
           class="nav-link${isActive ? " nav-link--active" : ""}"
           style="${isActive ? `border-left:3px solid ${accent};background:rgba(0,0,0,0.06);` : ""}">
          <span class="nav-link__icon">${link.icon}</span>
          <span class="nav-link__label">${link.label}</span>
        </a>`;
        }).join("");

        const navHtml = `
      <aside id="app-nav" style="
        width:240px;min-height:100vh;background:#1e293b;color:#f1f5f9;
        display:flex;flex-direction:column;font-family:inherit;flex-shrink:0;">

        <!-- Logo -->
        <div style="padding:1.5rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.08)">
          <span style="font-size:1.25rem;font-weight:700;color:#fff;letter-spacing:.5px">
            Tatku United
          </span>
        </div>

        <!-- User card -->
        <div style="padding:1.25rem;border-bottom:1px solid rgba(255,255,255,.08);
                    display:flex;align-items:center;gap:.75rem">
          <img src="${avatar}" alt="${session.name}"
               style="width:42px;height:42px;border-radius:50%;object-fit:cover;
                      border:2px solid ${accent};"
               onerror="this.src='https://i.pravatar.cc/150?u=fallback'">
          <div style="overflow:hidden">
            <div style="font-weight:600;font-size:.9rem;white-space:nowrap;
                        overflow:hidden;text-overflow:ellipsis">${session.name}</div>
            <div style="font-size:.75rem;color:#94a3b8;margin-top:2px;
                        padding:1px 6px;border-radius:4px;display:inline-block;
                        background:${accent}22;color:${accent}">
              ${roleLabel}
            </div>
          </div>
        </div>

        <!-- Nav links -->
        <nav style="flex:1;padding:.75rem 0">
          <style>
            .nav-link {
              display:flex;align-items:center;gap:.6rem;
              padding:.65rem 1.25rem;text-decoration:none;
              color:#cbd5e1;font-size:.9rem;transition:background .15s,color .15s;
              border-left:3px solid transparent;
            }
            .nav-link:hover { background:rgba(255,255,255,.07);color:#fff; }
            .nav-link--active { color:#fff; }
            .nav-link__icon { font-size:1rem;flex-shrink:0 }
          </style>
          ${linksHtml}
        </nav>

        <!-- Logout -->
        <div style="padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,.08)">
          <button onclick="Auth.logout()"
                  style="width:100%;padding:.6rem 1rem;background:#ef4444;color:#fff;
                         border:none;border-radius:.5rem;cursor:pointer;font-size:.875rem;
                         font-weight:600;display:flex;align-items:center;
                         justify-content:center;gap:.4rem">
            🚪 Logout
          </button>
        </div>
      </aside>`;

        /* Inject or replace */
        let target = document.getElementById("app-nav");
        if (target) {
            target.outerHTML = navHtml;
        } else {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = navHtml;
            document.body.prepend(wrapper.firstElementChild);
        }
    }

    /* ===========================================================================
       renderBreadcrumb(crumbs)
       crumbs: [{ label, href }, ..., { label }]   ← last item has no href
       Injects into <nav id="breadcrumb">
       =========================================================================== */
    function renderBreadcrumb(crumbs) {
        const nav = document.getElementById("breadcrumb");
        if (!nav || !Array.isArray(crumbs) || crumbs.length === 0) return;

        const items = crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            const separator = isLast ? "" : `<span style="margin:0 .4rem;color:#9ca3af">/</span>`;
            const content = isLast || !crumb.href
                ? `<span style="color:#374151;font-weight:500">${crumb.label}</span>`
                : `<a href="${crumb.href}"
              style="color:#0ea5e9;text-decoration:none;font-size:.875rem"
              onmouseover="this.style.textDecoration='underline'"
              onmouseout="this.style.textDecoration='none'">${crumb.label}</a>`;
            return content + separator;
        }).join("");

        nav.innerHTML = `
      <ol style="list-style:none;margin:0;padding:0;display:flex;
                 align-items:center;flex-wrap:wrap;font-size:.875rem">
        ${items}
      </ol>`;
    }

    /* ===========================================================================
       renderStatCard(containerId, { icon, label, value, colorClass })
       =========================================================================== */
    function renderStatCard(containerId, { icon, label, value, colorClass = "#0ea5e9" }) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const card = document.createElement("div");
        Object.assign(card.style, {
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: `4px solid ${colorClass}`,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flex: "1 1 180px",
            minWidth: "160px",
        });

        card.innerHTML = `
      <div style="font-size:2rem;line-height:1">${icon}</div>
      <div>
        <div style="font-size:1.5rem;font-weight:700;color:#111827;line-height:1.2">${value}</div>
        <div style="font-size:.8rem;color:#6b7280;margin-top:.2rem;text-transform:uppercase;
                    letter-spacing:.5px">${label}</div>
      </div>`;

        container.appendChild(card);
    }

    /* ===========================================================================
       setPageTitle(title)
       =========================================================================== */
    function setPageTitle(title) {
        document.title = title + " — Tatku United";
        const h1 = document.getElementById("page-title");
        if (h1) h1.textContent = title;
    }

    /* ─── Public API ─── */
    return {
        renderNav,
        renderBreadcrumb,
        renderStatCard,
        setPageTitle,
    };

})();